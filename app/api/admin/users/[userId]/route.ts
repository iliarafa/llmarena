import { z } from "zod";
import { jsonError, requireAdmin } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  isAdmin: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    const { userId } = await params;
    const parseResult = updateUserSchema.safeParse(await request.json());
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

    if (parseResult.data.email && parseResult.data.email !== existingUser.email) {
      const emailExists = await storage.getUserByEmail(parseResult.data.email);
      if (emailExists) {
        return Response.json({ error: "Email already in use by another user" }, { status: 400 });
      }
    }

    const updatedUser = await storage.updateUser(userId, parseResult.data);
    void admin;
    return Response.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Admin update user error:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    const { userId } = await params;

    if (userId === admin.id) {
      return Response.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await storage.deleteUser(userId);
    const verifyDeleted = await storage.getUser(userId);
    if (verifyDeleted) {
      return Response.json({ error: "Failed to delete user" }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: `User ${existingUser.email || userId} deleted successfully`,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Admin delete user error:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
