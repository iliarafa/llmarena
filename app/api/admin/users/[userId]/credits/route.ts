import { z } from "zod";
import { jsonError, requireAdmin } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const setCreditsSchema = z.object({
  credits: z.number().min(0),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin(request);
    const { userId } = await params;
    const parseResult = setCreditsSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return Response.json({
        error: "Invalid request data",
        details: parseResult.error.errors.map((e) => e.message).join(", "),
      }, { status: 400 });
    }

    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await storage.setUserCredits(userId, parseResult.data.credits);
    return Response.json({
      success: true,
      message: `Credits set to ${parseResult.data.credits}`,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Admin set credits error:", error);
    return Response.json({ error: "Failed to set credits" }, { status: 500 });
  }
}
