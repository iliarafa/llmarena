import { jsonError, requireAdmin } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const users = await storage.getAllUsers(search);
    return Response.json(users);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Admin get users error:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
