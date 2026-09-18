import { getAuthIds, jsonError, requireAuth } from "@/lib/session";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const identity = await requireAuth(request);
    const authId = getAuthIds(identity);

    let stats = {
      totalComparisons: 0,
      totalCreditsSpent: "0",
      recentActivity: [] as { timestamp: Date; creditsCost: string }[],
    };

    if (authId.userId) {
      const history = await storage.getUserUsageHistory(authId.userId, 10);
      const allHistory = await storage.getUserUsageHistory(authId.userId, 10000);
      stats.totalComparisons = allHistory.length;
      stats.totalCreditsSpent = allHistory.reduce((sum, h) => sum + parseFloat(h.creditsCost), 0).toFixed(2);
      stats.recentActivity = history.map((h) => ({
        timestamp: h.timestamp,
        creditsCost: h.creditsCost,
      }));
    } else if (authId.guestTokenId) {
      const history = await storage.getGuestUsageHistory(authId.guestTokenId, 10);
      const allHistory = await storage.getGuestUsageHistory(authId.guestTokenId, 10000);
      stats.totalComparisons = allHistory.length;
      stats.totalCreditsSpent = allHistory.reduce((sum, h) => sum + parseFloat(h.creditsCost), 0).toFixed(2);
      stats.recentActivity = history.map((h) => ({
        timestamp: h.timestamp,
        creditsCost: h.creditsCost,
      }));
    }

    return Response.json(stats);
  } catch (error) {
    if (error instanceof Error && "status" in error) return jsonError(error);
    console.error("Dashboard stats error:", error);
    return Response.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
