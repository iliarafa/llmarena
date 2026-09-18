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
  getAuthIds,
  getCreditBalance,
  jsonError,
  requireAuth,
  updateCreditBalance,
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
    const creditCost = baseCreditCost + caesarCost + maximusCost;

    const creditBalance = parseFloat(getCreditBalance(identity));
    if (creditBalance < creditCost) {
      return Response.json({
        error: "Insufficient credits",
        required: creditCost,
        available: creditBalance,
        message: "You need more credits to run this comparison. Please purchase credits to continue.",
      }, { status: 402 });
    }

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

    const actualCreditCost = baseCreditCost + actualCaesarCost + actualMaximusCost;
    const newBalance = (creditBalance - actualCreditCost).toFixed(2);
    await updateCreditBalance(identity, newBalance);

    // Privacy-first: only timestamp + credits, never prompt or model output
    await storage.logComparison({
      ...getAuthIds(identity),
      creditsCost: actualCreditCost.toString(),
    });

    return Response.json({
      responses,
      caesar,
      maximus,
      creditsUsed: actualCreditCost,
      creditsRemaining: newBalance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Comparison error:", error);
    return Response.json({ error: "Failed to generate comparisons" }, { status: 500 });
  }
}
