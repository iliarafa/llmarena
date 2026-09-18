import type Stripe from "stripe";
import { storage } from "@/lib/storage";
import { CREDIT_PACK_AMOUNTS, getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe webhook. Uses request.text() (raw body) — required for
 * constructEvent signature verification in the App Router.
 */
export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return Response.json({ error: "No signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", message);
    return Response.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    const alreadyProcessed = await storage.isWebhookEventProcessed(event.id);
    if (alreadyProcessed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return Response.json({ received: true, status: "already_processed" });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { credits, userId, guestToken } = session.metadata || {};

      if (!credits) {
        console.error("No credits in session metadata");
        return Response.json({ error: "Missing credits metadata" }, { status: 400 });
      }

      const creditsToAdd = parseInt(credits, 10);
      if (!(CREDIT_PACK_AMOUNTS as readonly number[]).includes(creditsToAdd)) {
        console.error(`Invalid credits amount in metadata: ${creditsToAdd}`);
        return Response.json({ error: "Invalid credits amount" }, { status: 400 });
      }

      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          const currentBalance = parseFloat(user.creditBalance);
          const newBalance = (currentBalance + creditsToAdd).toFixed(2);
          await storage.updateUserCredits(userId, newBalance);
          console.log(`Added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
        } else {
          console.error(`User ${userId} not found`);
        }
      } else if (guestToken) {
        const token = await storage.getGuestTokenByToken(guestToken);
        if (token) {
          const currentBalance = parseFloat(token.creditBalance);
          const newBalance = (currentBalance + creditsToAdd).toFixed(2);
          await storage.updateGuestTokenCredits(token.id, newBalance);
          console.log(`Added ${creditsToAdd} credits to guest token. New balance: ${newBalance}`);
        } else {
          console.error("Guest token not found");
        }
      } else {
        console.error("Neither userId nor guestToken provided in metadata");
      }

      await storage.markWebhookEventAsProcessed({
        eventId: event.id,
        eventType: event.type,
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
