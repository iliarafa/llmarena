import { z } from "zod";
import { jsonError, requireAdmin } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  initialCredits: z.number().int().min(0).optional(),
  isAdmin: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const parseResult = createUserSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return Response.json({
        error: "Invalid request data",
        details: parseResult.error.errors.map((e) => e.message).join(", "),
      }, { status: 400 });
    }

    const { email, firstName, lastName, initialCredits, isAdmin } = parseResult.data;
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return Response.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const newUser = await storage.createUser({
      email,
      firstName: firstName || null,
      lastName: lastName || null,
      creditBalance: (initialCredits || 0).toString(),
      isAdmin: isAdmin || false,
    });

    return Response.json({
      success: true,
      message: `User ${email} created successfully`,
      user: newUser,
    });
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Admin create user error:", error);
    return Response.json({ error: "Failed to create user" }, { status: 500 });
  }
}
