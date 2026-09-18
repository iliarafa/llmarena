import { randomBytes } from "crypto";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const token = randomBytes(32).toString("hex");
    const guestToken = await storage.createGuestToken({
      token,
      creditBalance: "0",
    });

    return Response.json({
      token: guestToken.token,
      creditBalance: guestToken.creditBalance,
      message: "Guest token created. Save this token to access your credits.",
    });
  } catch (error) {
    console.error("Guest token creation error:", error);
    return Response.json({ error: "Failed to create guest token" }, { status: 500 });
  }
}
