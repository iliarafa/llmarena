import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { V2_PACKS, allowedReturn, requireWallet } from "@/lib/v2";
import { v2error } from "@/lib/v2http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const body = z.object({ pack: z.union([z.literal(1), z.literal(5), z.literal(20)]), returnUrl: z.string() });

export async function POST(request: Request) {
  try {
    const w = await requireWallet(request);
    const parsed = body.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return Response.json({ error: "Pick 1, 5 or 20 tokens" }, { status: 400 });
    const back = allowedReturn(parsed.data.returnUrl);
    if (!back) return Response.json({ error: "Return URL not allowed" }, { status: 400 });
    const pack = V2_PACKS[parsed.data.pack];
    const sep = back.includes("?") ? "&" : "?";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: pack.amount, product_data: { name: pack.name, description: "1 token = one prompt compared across Grok, Claude, Gemini and GPT" } } }],
      success_url: `${back}${sep}paid={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
      metadata: { kind: "compare_v2", walletId: w.id, tokens: String(parsed.data.pack) },
    });
    return Response.json({ url: session.url });
  } catch (e) { return v2error(e); }
}
