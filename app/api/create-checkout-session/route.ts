import { z } from "zod";
import { getAuthIds, jsonError, requestOrigin, requireAuth } from "@/lib/session";
import { CREDIT_PACKS, CREDIT_PACK_AMOUNTS, getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const checkoutRequestSchema = z.object({
  credits: z.union([
    z.literal(25),
    z.literal(100),
    z.literal(300),
    z.literal(1000),
  ]),
});

export async function POST(request: Request) {
  try {
    const identity = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const requestData = {
      credits: typeof body.credits === "string" ? parseInt(body.credits, 10) : body.credits,
    };

    const parseResult = checkoutRequestSchema.safeParse(requestData);
    if (!parseResult.success) {
      return Response.json({
        error: "Invalid credit amount",
        message: "Please select a valid credit tier (25, 100, 300, or 1000)",
      }, { status: 400 });
    }

    const { credits } = parseResult.data;
    if (!(CREDIT_PACK_AMOUNTS as readonly number[]).includes(credits)) {
      return Response.json({
        error: "Invalid credit amount",
        message: "Please select a valid credit tier (25, 100, 300, or 1000)",
      }, { status: 400 });
    }

    const tier = CREDIT_PACKS[credits];
    const authId = getAuthIds(identity);
    const guestToken = identity.guestToken?.token;
    const origin = requestOrigin(request);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tier.name,
              description: `Add ${credits} credits to your account`,
            },
            unit_amount: tier.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/purchase?payment=cancelled`,
      metadata: {
        credits: credits.toString(),
        userId: authId.userId || "",
        guestToken: guestToken || "",
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Checkout session error:", error);
    return Response.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
