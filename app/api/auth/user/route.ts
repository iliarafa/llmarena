import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Returns the signed-in user when Auth.js (or another session provider)
 * is wired into getSessionUser(). Guest-only today → 401.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return Response.json({
      message: "Unauthorized",
      error: "Authenticated accounts are not available. Use a guest token.",
    }, { status: 401 });
  }
  return Response.json(user);
}
