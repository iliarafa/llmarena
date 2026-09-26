import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { generateCaesarVerdict, generateComparisons, generateMaximus } from "@/lib/llm";
import { storage } from "@/lib/storage";
import { POST as compare } from "../app/api/compare/route";
import { POST as webhook } from "../app/api/stripe-webhook/route";
import Stripe from "stripe";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/llm", () => ({
  generateComparisons: vi.fn(),
  generateCaesarVerdict: vi.fn(),
  generateMaximus: vi.fn(),
}));

const WEBHOOK_SECRET = "whsec_test_ci_secret";
const ONE_MODEL_COST = 3;
const FOUR_MODEL_COST = 10;

function asSession(userId: string) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as never);
}

function compareRequest(body: unknown): Request {
  return new Request("http://localhost/api/compare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function userBalance(userId: string): Promise<number> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("user missing");
  return parseFloat(user.creditBalance);
}

function answered(modelId: string) {
  return { modelId, response: `answer from ${modelId}` };
}

function failed(modelId: string) {
  return { modelId, error: "provider failed" };
}

describe("atomic credits and compare charging", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(generateComparisons).mockReset();
    vi.mocked(generateCaesarVerdict).mockReset();
    vi.mocked(generateMaximus).mockReset();
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it("lets exactly 2 of 5 concurrent compares succeed when the balance covers 2", async () => {
    const user = await storage.createUser({
      email: `race-${crypto.randomUUID()}@example.test`,
      creditBalance: (ONE_MODEL_COST * 2).toFixed(2),
    });
    asSession(user.id);
    vi.mocked(generateComparisons).mockResolvedValue([answered("gpt-4o")]);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        compare(compareRequest({ prompt: "race", modelIds: ["gpt-4o"] })),
      ),
    );

    const ok = responses.filter((response) => response.status === 200);
    const denied = responses.filter((response) => response.status === 402);
    expect(ok).toHaveLength(2);
    expect(denied).toHaveLength(3);

    for (const response of ok) {
      const body = await response.json();
      expect(body.creditsUsed).toBe(ONE_MODEL_COST);
    }
    for (const response of denied) {
      const body = await response.json();
      expect(body).toMatchObject({
        error: "Insufficient credits",
        required: ONE_MODEL_COST,
        message: "You need more credits to run this comparison. Please purchase credits to continue.",
      });
      expect(typeof body.available).toBe("number");
    }
    expect(await userBalance(user.id)).toBe(0);
  });

  it("keeps a webhook credit that arrives while a compare is in flight", async () => {
    const start = 10;
    const user = await storage.createUser({
      email: `inflight-${crypto.randomUUID()}@example.test`,
      creditBalance: start.toFixed(2),
    });
    asSession(user.id);

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let entered!: () => void;
    const enteredPromise = new Promise<void>((resolve) => {
      entered = resolve;
    });
    vi.mocked(generateComparisons).mockImplementation(async () => {
      entered();
      await gate;
      return [answered("gpt-4o")];
    });

    const pending = compare(compareRequest({ prompt: "inflight", modelIds: ["gpt-4o"] }));
    await enteredPromise;
    expect(await userBalance(user.id)).toBe(start - ONE_MODEL_COST);

    const eventId = `evt_inflight_${crypto.randomUUID()}`;
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_${eventId}`,
          object: "checkout.session",
          metadata: { credits: "25", userId: user.id },
        },
      },
    });
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
    });
    const credited = await webhook(new Request("http://localhost/api/stripe-webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    }));
    expect(credited.status).toBe(200);

    release();
    const finished = await pending;
    expect(finished.status).toBe(200);
    const body = await finished.json();
    expect(body.creditsUsed).toBe(ONE_MODEL_COST);
    expect(await userBalance(user.id)).toBe(start + 25 - ONE_MODEL_COST);
  });

  it("adds both concurrent gifts of 10", async () => {
    const user = await storage.createUser({
      email: `gift-user-${crypto.randomUUID()}@example.test`,
      creditBalance: "0.00",
    });
    const guest = await storage.createGuestToken({
      token: `gift_${crypto.randomUUID()}`,
      creditBalance: "0.00",
    });

    await Promise.all([
      storage.addCreditsToUser(user.id, 10),
      storage.addCreditsToUser(user.id, 10),
    ]);
    await Promise.all([
      storage.addCreditsToGuestToken(guest.id, 10),
      storage.addCreditsToGuestToken(guest.id, 10),
    ]);

    expect(await userBalance(user.id)).toBe(20);
    const freshGuest = await storage.getGuestTokenByToken(guest.token);
    expect(parseFloat(freshGuest?.creditBalance ?? "0")).toBe(20);
  });

  it("refunds the whole reservation when a call throws after the reserve", async () => {
    const start = 10;
    const user = await storage.createUser({
      email: `throw-${crypto.randomUUID()}@example.test`,
      creditBalance: start.toFixed(2),
    });
    asSession(user.id);
    vi.mocked(generateComparisons).mockImplementation(async () => {
      expect(await userBalance(user.id)).toBe(start - ONE_MODEL_COST);
      throw new Error("provider exploded");
    });

    const response = await compare(compareRequest({ prompt: "boom", modelIds: ["gpt-4o"] }));
    expect(response.status).toBe(500);
    expect(await userBalance(user.id)).toBe(start);
    expect(await storage.getUserUsageHistory(user.id)).toHaveLength(0);
  });

  it("charges the 3-model price when 4 are selected and 1 fails", async () => {
    const user = await storage.createUser({
      email: `partial-${crypto.randomUUID()}@example.test`,
      creditBalance: FOUR_MODEL_COST.toFixed(2),
    });
    asSession(user.id);
    vi.mocked(generateComparisons).mockResolvedValue([
      answered("gpt-4o"),
      answered("claude-sonnet"),
      answered("gemini-flash"),
      failed("grok"),
    ]);

    const response = await compare(compareRequest({
      prompt: "partial",
      modelIds: ["gpt-4o", "claude-sonnet", "gemini-flash", "grok"],
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.creditsUsed).toBe(7);
    expect(parseFloat(body.creditsRemaining)).toBe(3);
    expect(await userBalance(user.id)).toBe(3);
  });

  it("charges 0 and refunds the full reservation when every model fails", async () => {
    const start = FOUR_MODEL_COST;
    const user = await storage.createUser({
      email: `all-fail-${crypto.randomUUID()}@example.test`,
      creditBalance: start.toFixed(2),
    });
    asSession(user.id);
    vi.mocked(generateComparisons).mockImplementation(async () => {
      expect(await userBalance(user.id)).toBe(0);
      return [
        failed("gpt-4o"),
        failed("claude-sonnet"),
        failed("gemini-flash"),
        failed("grok"),
      ];
    });

    const response = await compare(compareRequest({
      prompt: "none",
      modelIds: ["gpt-4o", "claude-sonnet", "gemini-flash", "grok"],
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.creditsUsed).toBe(0);
    expect(parseFloat(body.creditsRemaining)).toBe(start);
    expect(await userBalance(user.id)).toBe(start);
    const history = await storage.getUserUsageHistory(user.id);
    expect(history).toHaveLength(1);
    expect(parseFloat(history[0].creditsCost)).toBe(0);
  });

  it("still charges Caesar and Maximus only when they succeed", async () => {
    const user = await storage.createUser({
      email: `judges-${crypto.randomUUID()}@example.test`,
      creditBalance: "20.00",
    });
    asSession(user.id);
    vi.mocked(generateComparisons).mockResolvedValue([
      answered("gpt-4o"),
      answered("claude-sonnet"),
    ]);
    vi.mocked(generateCaesarVerdict).mockResolvedValue({
      error: "judge failed",
      judgeModel: "gemini-flash",
      modelMapping: {},
    });
    vi.mocked(generateMaximus).mockResolvedValue({
      error: "synth failed",
      maximusModel: "gemini-flash",
    });

    const response = await compare(compareRequest({
      prompt: "judges",
      modelIds: ["gpt-4o", "claude-sonnet"],
      caesarEnabled: true,
      caesarJudgeModel: "gemini-flash",
      maximusEnabled: true,
      maximusEngineModel: "gemini-flash",
    }));
    expect(response.status).toBe(200);
    const body = await response.json();
    // 2 models = 5. Caesar 3 and Maximus 5 were reserved and refunded.
    expect(body.creditsUsed).toBe(5);
    expect(await userBalance(user.id)).toBe(15);
  });

  it("charges a guest token through the compare route", async () => {
    const guest = await storage.createGuestToken({
      token: `spend_${crypto.randomUUID()}`,
      creditBalance: "3.00",
    });
    vi.mocked(generateComparisons).mockResolvedValue([answered("gpt-4o")]);

    const response = await compare(new Request("http://localhost/api/compare", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${guest.token}`,
      },
      body: JSON.stringify({ prompt: "guest", modelIds: ["gpt-4o"] }),
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.creditsUsed).toBe(ONE_MODEL_COST);
    const fresh = await storage.getGuestTokenByToken(guest.token);
    expect(parseFloat(fresh?.creditBalance ?? "-1")).toBe(0);
  });

  it("does not let a linked guest token spend credits", async () => {
    const user = await storage.createUser({
      email: `linked-${crypto.randomUUID()}@example.test`,
      creditBalance: "0.00",
    });
    const guest = await storage.createGuestToken({
      token: `linked_${crypto.randomUUID()}`,
      creditBalance: "0.00",
    });
    await storage.markGuestTokenAsLinked(guest.id, user.id);
    await storage.addCredits({ kind: "guest", id: guest.id }, 10);

    const reserved = await storage.reserveCredits({ kind: "guest", id: guest.id }, 3);
    expect(reserved).toBeUndefined();
    const fresh = await storage.getGuestTokenByToken(guest.token);
    expect(parseFloat(fresh?.creditBalance ?? "0")).toBe(10);
  });
});
