import { z } from "zod";
import { jsonError, requireAdmin } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const giftCreditsSchema = z.object({
  targetType: z.enum(["user", "guest"]),
  targetId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const parseResult = giftCreditsSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return Response.json({
        error: "Invalid request data",
        details: parseResult.error.errors.map((e) => e.message).join(", "),
      }, { status: 400 });
    }

    const { targetType, targetId, amount } = parseResult.data;
    if (targetType === "user") {
      const updated = await storage.addCreditsToUser(targetId, amount);
      return Response.json({
        success: true,
        message: `Added ${amount} credits to user`,
        newBalance: updated.creditBalance,
      });
    }

    const updated = await storage.addCreditsToGuestToken(targetId, amount);
    return Response.json({
      success: true,
      message: `Added ${amount} credits to guest token`,
      newBalance: updated.creditBalance,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Admin gift credits error:", error);
    return Response.json({ error: "Failed to gift credits" }, { status: 500 });
  }
}
