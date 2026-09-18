import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return Response.json({ valid: false, error: "No token provided" }, { status: 400 });
    }

    const guestToken = await storage.getGuestTokenByToken(token);
    if (guestToken) {
      return Response.json({
        valid: true,
        creditBalance: guestToken.creditBalance,
      });
    }
    return Response.json({ valid: false, error: "Invalid token" });
  } catch (error) {
    console.error("Token verification error:", error);
    return Response.json({ valid: false, error: "Verification failed" }, { status: 500 });
  }
}
