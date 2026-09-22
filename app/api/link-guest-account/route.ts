import { getSessionUser, jsonError } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Move a browser guest token's credits and usage history onto the signed-in user.
 * The guest token is read from the JSON body so a leftover Bearer header cannot
 * hide the Auth.js session. Claiming is conditional on linkedAt being null.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return Response.json({ error: "Unauthorized", message: "Sign in required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const guestTokenValue = typeof body.guestToken === "string" ? body.guestToken.trim() : "";
    if (!guestTokenValue) {
      return Response.json({ error: "No guest token provided" }, { status: 400 });
    }

    const token = await storage.getGuestTokenByToken(guestTokenValue);
    if (!token) {
      return Response.json({ error: "Invalid guest token" }, { status: 400 });
    }

    if (token.linkedAt) {
      if (token.linkedToUserId === user.id) {
        return Response.json({
          success: true,
          alreadyLinked: true,
          creditsTransferred: 0,
          newBalance: Math.floor(parseFloat(user.creditBalance)),
        });
      }
      return Response.json({
        error: "Guest token already linked",
        message: "This guest token was already moved to another account.",
      }, { status: 409 });
    }

    const guestCredits = parseFloat(token.creditBalance);
    const claimed = await storage.claimGuestTokenForUser(token.id, user.id);
    if (!claimed) {
      return Response.json({
        error: "Guest token already linked",
        message: "This guest token was already moved to an account.",
      }, { status: 409 });
    }

    if (guestCredits > 0) {
      await storage.addCreditsToUser(user.id, guestCredits);
    }
    await storage.linkGuestHistoryToUser(token.id, user.id);

    const updated = await storage.getUser(user.id);
    const newBalance = updated ? parseFloat(updated.creditBalance) : parseFloat(user.creditBalance) + guestCredits;

    return Response.json({
      success: true,
      creditsTransferred: Math.floor(guestCredits),
      newBalance: Math.floor(newBalance),
      message: guestCredits > 0
        ? `Successfully linked account and transferred ${Math.floor(guestCredits)} credits`
        : "Guest token linked. No credits to transfer.",
    });
  } catch (error) {
    return jsonError(error);
  }
}
