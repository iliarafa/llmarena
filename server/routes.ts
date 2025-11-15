import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateComparisons } from "./llm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { setupAuth, isAuthenticated } from "./replitAuth";

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

  app.post("/api/compare", async (req, res) => {
    try {
      const { prompt, modelIds } = compareRequestSchema.parse(req.body);
      
      const responses = await generateComparisons(prompt, modelIds);
      
      res.json({ responses });
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
