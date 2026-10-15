import { z } from "zod";
import { V2_MAX_PROMPT_CHARS, addTokens, logUsage, requireWallet, spendToken } from "@/lib/v2";
import { V2_MODELS, runModel, type V2Result } from "@/lib/v2models";
import { v2error } from "@/lib/v2http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const body = z.object({ prompt: z.string().trim().min(1).max(V2_MAX_PROMPT_CHARS) });

/**
 * Spend 1 token, fan out to 4 models, stream NDJSON: one line per model as it
 * finishes, then a final {done} line. Refunds the token if every model fails.
 * Privacy: prompt and answers are never stored, only cost totals.
 */
export async function POST(request: Request) {
  try {
    const w = await requireWallet(request);
    const parsed = body.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ error: `Prompt must be 1 to ${V2_MAX_PROMPT_CHARS} characters` }, { status: 400 });
    const left = await spendToken(w.id);
    if (left === null) return Response.json({ error: "No tokens left", tokens: 0 }, { status: 402 });
    const prompt = parsed.data.prompt;
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        const send = (o: unknown) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
        send({ type: "start", tokens: left });
        const results: V2Result[] = [];
        await Promise.all(V2_MODELS.map(async (m) => {
          const r = await runModel(m.id, prompt);
          results.push(r);
          send({ type: "result", ...r, text: r.text });
        }));
        let tokens = left;
        if (results.every((r) => r.error)) tokens = await addTokens(w.id, 1);
        const cost = results.reduce((s, r) => s + (r.costUsd || 0), 0);
        await logUsage(w.id, cost, results.map(({ id, inTok, outTok, costUsd, ms, error }) => ({ id, inTok, outTok, costUsd, ms, error: !!error }))).catch(() => {});
        send({ type: "done", tokens, refunded: tokens > left, costUsd: cost });
        ctrl.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
  } catch (e) { return v2error(e); }
}
