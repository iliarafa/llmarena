import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Returns the signed-in users-table row (credits, isAdmin, profile).
 * Guests get 401 and continue with a Bearer token instead.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return Response.json({
      message: "Unauthorized",
      error: "Sign in required.",
    }, { status: 401 });
  }
  return Response.json(user);
}
