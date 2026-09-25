import { afterEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { POST } from "../app/api/stripe-webhook/route";
import { storage } from "../lib/storage";

const WEBHOOK_SECRET = "whsec_test_ci_secret";

function webhookRequest(body: string, signature?: string): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature) headers.set("stripe-signature", signature);
  return new Request("http://localhost/api/stripe-webhook", {
    method: "POST",
    headers,
    body,
  });
}

function signedCheckout(input: {
  eventId: string;
  credits: string;
  userId?: string;
  guestToken?: string;
}): { body: string; signature: string } {
  const body = JSON.stringify({
    id: input.eventId,
    object: "event",
    api_version: "2025-10-29.clover",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${input.eventId}`,
        object: "checkout.session",
        metadata: {
          credits: input.credits,
          ...(input.userId ? { userId: input.userId } : {}),
          ...(input.guestToken ? { guestToken: input.guestToken } : {}),
        },
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: WEBHOOK_SECRET,
  });
  return { body, signature };
}

async function balanceOf(userId: string): Promise<number> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("user missing");
  return parseFloat(user.creditBalance);
}

describe("stripe webhook", () => {
  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it("returns 500 and does not change a balance when the signing secret is missing", async () => {
    const user = await storage.createUser({
      email: `webhook-missing-${crypto.randomUUID()}@example.test`,
      creditBalance: "5.00",
    });
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await POST(webhookRequest("{not-json"));
      expect(response.status).toBe(500);
      expect(errorSpy).toHaveBeenCalledWith("STRIPE_WEBHOOK_SECRET not set; refusing webhook");
      expect(await balanceOf(user.id)).toBe(5);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("returns 400 when the secret is set but the signature header is missing", async () => {
    const response = await POST(webhookRequest("{}"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "No signature" });
  });

  it("credits a signed checkout once and ignores a replay", async () => {
    const user = await storage.createUser({
      email: `webhook-once-${crypto.randomUUID()}@example.test`,
      creditBalance: "0.00",
    });
    const signed = signedCheckout({
      eventId: `evt_test_${crypto.randomUUID()}`,
      credits: "25",
      userId: user.id,
    });

    const first = await POST(webhookRequest(signed.body, signed.signature));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ received: true });
    expect(await balanceOf(user.id)).toBe(25);

    const replay = await POST(webhookRequest(signed.body, signed.signature));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ received: true, status: "already_processed" });
    expect(await balanceOf(user.id)).toBe(25);
  });

  it("credits a guest token looked up by its value", async () => {
    const tokenValue = `guest_${crypto.randomUUID()}`;
    const guest = await storage.createGuestToken({
      token: tokenValue,
      creditBalance: "1.00",
    });
    const signed = signedCheckout({
      eventId: `evt_guest_${crypto.randomUUID()}`,
      credits: "100",
      guestToken: tokenValue,
    });

    const response = await POST(webhookRequest(signed.body, signed.signature));
    expect(response.status).toBe(200);
    const fresh = await storage.getGuestTokenByToken(tokenValue);
    expect(fresh?.id).toBe(guest.id);
    expect(parseFloat(fresh?.creditBalance ?? "0")).toBe(101);
  });
});
