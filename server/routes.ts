import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateComparisons } from "./llm";
import { z } from "zod";

const compareRequestSchema = z.object({
  prompt: z.string().min(1),
  modelIds: z.array(z.enum(["gpt-4o", "claude-sonnet", "gemini-flash", "grok"])).min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
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
