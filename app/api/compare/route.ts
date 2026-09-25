import { z } from "zod";
import {
  CONTENDER_MODEL_IDS,
  JUDGE_MODEL_IDS,
  MAXIMUS_MODEL_IDS,
  CREDIT_COST_BY_MODEL_COUNT,
  CAESAR_CREDIT_COST,
  MAXIMUS_CREDIT_COST,
} from "@shared/models";
import { generateComparisons, generateCaesarVerdict, generateMaximus } from "@/lib/llm";
import {
  creditTargetFromIdentity,
  getAuthIds,
  jsonError,
  requireAuth,
  type AppIdentity,
} from "@/lib/session";
import { storage } from "@/lib/storage";

/**
 * Compare fans out to up to 4 providers, then optionally Caesar + Maximus.
 * Vercel Pro Fluid Compute default max is 300s. Set the project Function
 * Max Duration to 300s (see README). Hobby is too short for a full 4-model
 * compare with judge + synthesizer.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const compareRequestSchema = z.object({
  prompt: z.string().min(1),
  modelIds: z.array(z.enum(CONTENDER_MODEL_IDS)).min(1),
  caesarEnabled: z.boolean().optional(),
  caesarJudgeModel: z.enum(JUDGE_MODEL_IDS).optional(),
  maximusEnabled: z.boolean().optional(),
  maximusEngineModel: z.enum(MAXIMUS_MODEL_IDS).optional(),
});

const INSUFFICIENT_CREDITS_MESSAGE =
  "You need more credits to run this comparison. Please purchase credits to continue.";

export async function POST(request: Request) {
  try {
    const identity = await requireAuth(request);
    const body = await request.json();
    const { prompt, modelIds, caesarEnabled, caesarJudgeModel, maximusEnabled, maximusEngineModel } =
      compareRequestSchema.parse(body);

    const modelCount = modelIds.length;
    const baseCreditCost = CREDIT_COST_BY_MODEL_COUNT[modelCount];

    if (!baseCreditCost) {
      return Response.json({
        error: "Invalid model count",
        message: "Please select between 1 and 4 models.",
      }, { status: 400 });
    }

    const caesarCost = caesarEnabled ? CAESAR_CREDIT_COST : 0;
    const maximusCost = maximusEnabled ? MAXIMUS_CREDIT_COST : 0;
    const maxCost = baseCreditCost + caesarCost + maximusCost;

    const target = creditTargetFromIdentity(identity);
    if (!target) {
      return Response.json({
        error: "Unauthorized",
        message: "Sign in or provide a valid guest token to access this resource.",
      }, { status: 401 });
    }

    const reserved = await storage.reserveCredits(target, maxCost);
    if (reserved === undefined) {
      return Response.json({
        error: "Insufficient credits",
        required: maxCost,
        available: await currentBalance(identity),
        message: INSUFFICIENT_CREDITS_MESSAGE,
      }, { status: 402 });
    }

    let creditsRemaining = reserved;
    // Set only after the unused-credit refund has committed. A throw before
    // that (including a thrown refund) returns the whole reservation.
    let settled = false;

    try {
      const responses = await generateComparisons(prompt, modelIds);
      const validResponseCount = responses.filter((r) => r.response && !r.error).length;

      let actualCaesarCost = 0;
      let actualMaximusCost = 0;

      let caesar = undefined;
      if (caesarEnabled && caesarJudgeModel && validResponseCount >= 2) {
        caesar = await generateCaesarVerdict(prompt, responses, caesarJudgeModel);
        if (!caesar.error) {
          actualCaesarCost = CAESAR_CREDIT_COST;
        }
      }

      let maximus = undefined;
      if (maximusEnabled && maximusEngineModel && validResponseCount >= 2) {
        maximus = await generateMaximus(prompt, responses, maximusEngineModel);
        if (!maximus.error) {
          actualMaximusCost = MAXIMUS_CREDIT_COST;
        }
      }

      const actualBase = CREDIT_COST_BY_MODEL_COUNT[validResponseCount] ?? 0;
      const actualCost = actualBase + actualCaesarCost + actualMaximusCost;
      const refund = maxCost - actualCost;
      if (refund > 0) {
        const afterRefund = await storage.addCredits(target, refund);
        if (afterRefund === undefined) {
          throw new Error("Failed to refund unused credits");
        }
        creditsRemaining = afterRefund;
      }
      settled = true;

      // Privacy-first: only timestamp + credits, never prompt or model output
      await storage.logComparison({
        ...getAuthIds(identity),
        creditsCost: actualCost.toString(),
      });

      return Response.json({
        responses,
        caesar,
        maximus,
        creditsUsed: actualCost,
        creditsRemaining,
      });
    } finally {
      if (!settled) {
        const restored = await storage.addCredits(target, maxCost);
        if (restored === undefined) {
          console.error("Failed to refund reserved credits; credit target disappeared");
        }
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Comparison error:", error);
    return Response.json({ error: "Failed to generate comparisons" }, { status: 500 });
  }
}

async function currentBalance(identity: AppIdentity): Promise<number> {
  if (identity.user) {
    const fresh = await storage.getUser(identity.user.id);
    return fresh ? parseFloat(fresh.creditBalance) : 0;
  }
  if (identity.guestToken) {
    const fresh = await storage.getGuestTokenByToken(identity.guestToken.token);
    return fresh ? parseFloat(fresh.creditBalance) : 0;
  }
  return 0;
}
