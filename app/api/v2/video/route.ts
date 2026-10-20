import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { addTokens, requireWallet, spendToken } from "@/lib/v2";
import { v2error } from "@/lib/v2http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Seed (iliasr.nyc/seed) paid video clips: 1 Four Minds token per clip, after the free daily one.
 * start: spend 1 token, start a Grok Imagine Video job. If the job can't start, the token goes back.
 * poll:  check the job; if xAI reports it failed or expired, refund the token exactly once.
 * The job is recorded in v2_usage.detail ({kind:"seed_video", request_id, refunded}); no new tables.
 */
const XAI = "https://api.x.ai/v1";
const MODEL = "grok-imagine-video";
const PER_SECOND = 0.05; // USD at 480p
const MAX_SECONDS = 8;
const RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "3:2", "2:3"] as const;

const start = z.object({
  op: z.literal("start"),
  prompt: z.string().trim().min(1).max(2000),
  duration: z.number().int().min(3).max(15).optional(),
  aspect_ratio: z.enum(RATIOS).optional(),
});
const poll = z.object({ op: z.literal("poll"), request_id: z.string().regex(/^[A-Za-z0-9-]{8,80}$/) });

async function q<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res: any = await getDb().execute(query);
  return (res.rows ?? res) as T[];
}

async function xai(path: string, body?: unknown) {
  const r = await fetch(`${XAI}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.XAI_API_KEY}` },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(25_000),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error("xai"), { xaiStatus: r.status });
  return j;
}

export async function POST(request: Request) {
  try {
    const w = await requireWallet(request);
    const raw = await request.json().catch(() => ({}));

    if (raw?.op === "start") {
      const p = start.safeParse(raw);
      if (!p.success) return Response.json({ error: "That prompt can't be used." }, { status: 400 });
      if (!process.env.XAI_API_KEY) return Response.json({ error: "Video isn't set up yet." }, { status: 503 });
      const duration = Math.min(MAX_SECONDS, p.data.duration ?? 6);
      const aspect_ratio = p.data.aspect_ratio ?? "16:9";
      const left = await spendToken(w.id);
      if (left === null) return Response.json({ error: "No tokens left", tokens: 0 }, { status: 402 });
      let job: any;
      try {
        job = await xai("/videos/generations", { model: MODEL, prompt: p.data.prompt, duration, aspect_ratio, resolution: "480p" });
      } catch {
        job = null;
      }
      if (!job?.request_id) {
        const tokens = await addTokens(w.id, 1);
        return Response.json({ error: "The video didn't start, so your token was refunded.", tokens, refunded: true }, { status: 502 });
      }
      await q(sql`insert into v2_usage (wallet_id, cost_usd, detail) values (${w.id}, ${(duration * PER_SECOND).toFixed(5)}, ${JSON.stringify({ kind: "seed_video", request_id: job.request_id, duration, refunded: false })}::jsonb)`);
      return Response.json({ request_id: job.request_id, duration, aspect_ratio, tokens: left });
    }

    if (raw?.op === "poll") {
      const p = poll.safeParse(raw);
      if (!p.success) return Response.json({ error: "Nothing to check" }, { status: 400 });
      const [row] = await q<{ id: string }>(sql`select id from v2_usage where wallet_id = ${w.id} and detail->>'kind' = 'seed_video' and detail->>'request_id' = ${p.data.request_id}`);
      if (!row) return Response.json({ error: "Nothing to check" }, { status: 404 });
      let j: any;
      try { j = await xai(`/videos/${p.data.request_id}`); } catch { return Response.json({ status: "pending" }); }
      if (j.status === "done" && j.video?.url) return Response.json({ status: "done", video: j.video.url, duration: j.video.duration });
      if (j.status === "failed" || j.status === "expired") {
        const marked = await q(sql`update v2_usage set detail = detail || '{"refunded":true}'::jsonb, cost_usd = 0 where id = ${row.id} and coalesce((detail->>'refunded')::boolean, false) = false returning id`);
        const tokens = marked.length ? await addTokens(w.id, 1) : undefined;
        return Response.json({ status: "failed", refunded: true, tokens });
      }
      return Response.json({ status: "pending", progress: j.progress ?? null });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (e) { return v2error(e); }
}
