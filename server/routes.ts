import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateComparisons } from "./llm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAuth, getCreditBalance, getAuthId, updateCreditBalance } from "./authMiddleware";

const compareRequestSchema = z.object({
  prompt: z.string().min(1),
  modelIds: z.array(z.enum(["gpt-4o", "claude-sonnet", "gemini-flash", "grok"])).min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);

  // Auth endpoint - get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create a new guest token
  app.post("/api/guest/create", async (req, res) => {
    try {
      // Generate a secure random token (32 bytes = 64 hex characters)
      const token = randomBytes(32).toString("hex");
      
      // Create guest token in database with 0 initial credits
      const guestToken = await storage.createGuestToken({
        token,
        creditBalance: "0",
      });
      
      res.json({
        token: guestToken.token,
        creditBalance: guestToken.creditBalance,
        message: "Guest token created. Save this token to access your credits.",
      });
    } catch (error: any) {
      console.error("Guest token creation error:", error);
      res.status(500).json({ error: "Failed to create guest token" });
    }
  });

  // Verify guest token endpoint
  app.post("/api/guest/verify", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ valid: false, error: "No token provided" });
      }

      const guestToken = await storage.getGuestTokenByToken(token);
      if (guestToken) {
        res.json({
          valid: true,
          creditBalance: guestToken.creditBalance,
        });
      } else {
        res.json({ valid: false, error: "Invalid token" });
      }
    } catch (error: any) {
      console.error("Token verification error:", error);
      res.status(500).json({ valid: false, error: "Verification failed" });
    }
  });

  // Protected comparison endpoint with credit checking
  app.post("/api/compare", requireAuth, async (req, res) => {
    try {
      const { prompt, modelIds } = compareRequestSchema.parse(req.body);
      
      // Check credit balance (placeholder cost: 1 credit per model)
      const creditBalance = parseFloat(getCreditBalance(req));
      const creditCost = modelIds.length; // 1 credit per model
      
      if (creditBalance < creditCost) {
        return res.status(402).json({
          error: "Insufficient credits",
          required: creditCost,
          available: creditBalance,
          message: "You need more credits to run this comparison. Please purchase credits to continue.",
        });
      }
      
      // Generate comparisons
      const responses = await generateComparisons(prompt, modelIds);
      
      // Deduct credits after successful comparison
      const newBalance = (creditBalance - creditCost).toFixed(2);
      await updateCreditBalance(req, newBalance);
      
      // Log usage
      await storage.logComparison({
        ...getAuthId(req),
        modelIds: modelIds as string[],
        creditsCost: creditCost.toString(),
        prompt,
      });
      
      res.json({
        responses,
        creditsUsed: creditCost,
        creditsRemaining: newBalance,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      
      console.error("Comparison error:", error);
      res.status(500).json({ error: "Failed to generate comparisons" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
