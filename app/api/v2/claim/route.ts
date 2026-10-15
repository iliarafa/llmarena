import { V2_PACKS, addTokens, recordPurchase, requireWallet, v2Stripe } from "@/lib/v2";
import { v2error } from "@/lib/v2http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Fulfil a paid Checkout Session. Verified server-side against Stripe and
 * idempotent on the session id, so refreshes and retries never double-credit.
 */
export async function POST(request: Request) {
  try {
    const w = await requireWallet(request);
    const { sessionId } = await request.json().catch(() => ({}));
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return Response.json({ error: "Bad session" }, { status: 400 });
    const s = await v2Stripe().stripe.checkout.sessions.retrieve(sessionId);
    const md = s.metadata || {};
    const n = parseInt(md.tokens || "0", 10);
    if (md.kind !== "compare_v2" || md.walletId !== w.id || !V2_PACKS[n]) return Response.json({ error: "Session does not belong to this wallet" }, { status: 403 });
    if (s.payment_status !== "paid") return Response.json({ error: "Not paid yet", tokens: w.tokens }, { status: 402 });
    const fresh = await recordPurchase(s.id, w.id, n, s.amount_total ?? V2_PACKS[n].amount);
    const tokens = fresh ? await addTokens(w.id, n) : w.tokens;
    return Response.json({ tokens, added: fresh ? n : 0 });
  } catch (e) { return v2error(e); }
}
