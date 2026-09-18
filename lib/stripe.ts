import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
  }
  cached = new Stripe(secret, {
    apiVersion: "2025-10-29.clover",
  });
  return cached;
}

export const CREDIT_PACKS: Record<number, { amount: number; name: string }> = {
  25: { amount: 300, name: "Starter Pack - 25 Credits" },
  100: { amount: 1000, name: "Challenger Pack - 100 Credits" },
  300: { amount: 2500, name: "Pro Pack - 300 Credits" },
  1000: { amount: 5000, name: "Ultimate Pack - 1000 Credits" },
};

export const CREDIT_PACK_AMOUNTS = [25, 100, 300, 1000] as const;
export type CreditPackAmount = (typeof CREDIT_PACK_AMOUNTS)[number];
