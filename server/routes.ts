import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateComparisons, generateCaesarVerdict } from "./llm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAuth, getCreditBalance, getAuthId, updateCreditBalance } from "./authMiddleware";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

const compareRequestSchema = z.object({
  prompt: z.string().min(1),
  modelIds: z.array(z.enum(["gpt-4o", "claude-sonnet", "gemini-flash", "grok"])).min(1),
  caesarEnabled: z.boolean().optional(),
  caesarJudgeModel: z.enum(["claude-3-5-sonnet", "gpt-4o", "gemini-flash", "grok"]).optional(),
});

const checkoutRequestSchema = z.object({
  credits: z.union([
    z.literal(20),
    z.literal(100),
    z.literal(500),
    z.literal(1000),
  ]),
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

  // Link guest token to authenticated user account (transfer credits)
  app.post("/api/link-guest-account", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { guestToken } = req.body;
      
      if (!guestToken) {
        return res.status(400).json({ error: "Guest token is required" });
      }
      
      // Verify guest token exists
      const token = await storage.getGuestTokenByToken(guestToken);
      if (!token) {
        return res.status(404).json({ error: "Invalid guest token" });
      }
      
      // Prevent re-linking tokens that have already been linked
      if (token.linkedAt || token.linkedToUserId) {
        return res.status(400).json({ 
          error: "Token already linked",
          message: "This guest token has already been linked to an account." 
        });
      }
      
      // Prevent linking tokens with zero balance
      if (parseFloat(token.creditBalance) === 0) {
        return res.status(400).json({ 
          error: "No credits to transfer",
          message: "This guest token has no credits to transfer." 
        });
      }
      
      // Get or create user
      const user = await storage.getUser(userId) || await storage.upsertUser({
        id: userId,
        email: (req.user as any).claims.email,
        firstName: (req.user as any).claims.firstName,
        lastName: (req.user as any).claims.lastName,
        profileImageUrl: (req.user as any).claims.profileImageUrl,
        creditBalance: "0",
      });
      
      // Calculate new balance by adding guest credits to user credits
      const guestCredits = parseFloat(token.creditBalance);
      const userCredits = parseFloat(user.creditBalance);
      const newBalance = (guestCredits + userCredits).toFixed(2);
      
      // Update user's credit balance
      await storage.updateUserCredits(userId, newBalance);
      
      // Transfer usage history from guest to user
      await storage.linkGuestHistoryToUser(token.id, userId);
      
      // Mark token as linked and zero balance (atomic operation)
      await storage.markGuestTokenAsLinked(token.id, userId);
      
      // Return updated balance (credits as integers for display)
      res.json({
        success: true,
        creditsTransferred: Math.floor(guestCredits),
        newBalance: Math.floor(parseFloat(newBalance)),
        message: `Successfully linked account and transferred ${Math.floor(guestCredits)} credits`,
      });
    } catch (error: any) {
      console.error("Account linking error:", error);
      res.status(500).json({ error: "Failed to link accounts" });
    }
  });

  // Get dashboard stats (privacy-first: only counts and totals, no prompts/responses)
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const authId = getAuthId(req);
      
      let stats = {
        totalComparisons: 0,
        totalCreditsSpent: "0",
        recentActivity: [] as any[]
      };
      
      if (authId.userId) {
        const history = await storage.getUserUsageHistory(authId.userId, 10);
        const allHistory = await storage.getUserUsageHistory(authId.userId, 10000);
        
        stats.totalComparisons = allHistory.length;
        stats.totalCreditsSpent = allHistory.reduce((sum, h) => sum + parseFloat(h.creditsCost), 0).toFixed(2);
        stats.recentActivity = history.map(h => ({
          timestamp: h.timestamp,
          creditsCost: h.creditsCost
        }));
      } else if (authId.guestTokenId) {
        const history = await storage.getGuestUsageHistory(authId.guestTokenId, 10);
        const allHistory = await storage.getGuestUsageHistory(authId.guestTokenId, 10000);
        
        stats.totalComparisons = allHistory.length;
        stats.totalCreditsSpent = allHistory.reduce((sum, h) => sum + parseFloat(h.creditsCost), 0).toFixed(2);
        stats.recentActivity = history.map(h => ({
          timestamp: h.timestamp,
          creditsCost: h.creditsCost
        }));
      }
      
      res.json(stats);
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Protected comparison endpoint with credit checking
  app.post("/api/compare", requireAuth, async (req, res) => {
    try {
      const { prompt, modelIds, caesarEnabled, caesarJudgeModel } = compareRequestSchema.parse(req.body);
      
      // Calculate credit cost based on tiered pricing
      const modelCount = modelIds.length;
      const creditCostMap: Record<number, number> = {
        1: 3,
        2: 5,
        3: 7,
        4: 10,
      };
      const baseCreditCost = creditCostMap[modelCount];
      
      if (!baseCreditCost) {
        return res.status(400).json({
          error: "Invalid model count",
          message: "Please select between 1 and 4 models.",
        });
      }
      
      // Add Caesar cost if enabled (+3 credits)
      const caesarCost = caesarEnabled ? 3 : 0;
      const creditCost = baseCreditCost + caesarCost;
      
      // Check credit balance
      const creditBalance = parseFloat(getCreditBalance(req));
      
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
      
      // Generate Caesar verdict if enabled
      let caesar = undefined;
      if (caesarEnabled && caesarJudgeModel) {
        caesar = await generateCaesarVerdict(prompt, responses, caesarJudgeModel);
      }
      
      // Deduct credits after successful comparison
      const newBalance = (creditBalance - creditCost).toFixed(2);
      await updateCreditBalance(req, newBalance);
      
      // Log minimal usage for billing (no prompts or model details stored for privacy)
      await storage.logComparison({
        ...getAuthId(req),
        creditsCost: creditCost.toString(),
      });
      
      res.json({
        responses,
        caesar,
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

  // Stripe: Create checkout session for credit purchase
  app.post("/api/create-checkout-session", requireAuth, async (req, res) => {
    try {
      // Validate request body strictly - only allow valid credit tiers
      // Convert to number first in case it comes as a string
      const requestData = {
        credits: typeof req.body.credits === 'string' ? parseInt(req.body.credits) : req.body.credits,
      };
      
      const parseResult = checkoutRequestSchema.safeParse(requestData);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid credit amount",
          message: "Please select a valid credit tier (20, 100, 500, or 1000)",
        });
      }
      
      const { credits } = parseResult.data;
      
      // Define credit tiers with pricing
      const creditTiers: Record<number, { amount: number; name: string }> = {
        20: { amount: 250, name: "Starter Pack - 20 Credits" },
        100: { amount: 1000, name: "Popular Pack - 100 Credits" },
        500: { amount: 4000, name: "Pro Pack - 500 Credits" },
        1000: { amount: 7000, name: "Ultimate Pack - 1000 Credits" },
      };
      
      const tier = creditTiers[credits];
      
      // Get auth ID for metadata
      const authId = getAuthId(req);
      const guestToken = req.guestToken?.token;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: tier.name,
                description: `Add ${credits} credits to your account`,
              },
              unit_amount: tier.amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin || 'http://localhost:5000'}/?payment=success`,
        cancel_url: `${req.headers.origin || 'http://localhost:5000'}/purchase?payment=cancelled`,
        metadata: {
          credits: credits.toString(),
          userId: authId.userId || "",
          guestToken: guestToken || "",
        },
      });
      
      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });
  
  // Stripe: Webhook handler for payment events
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).json({ error: "No signature" });
    }
    
    let event: Stripe.Event;
    
    try {
      // Verify webhook signature (using raw body)
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
      } else {
        // For development without webhook secret
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    
    // Handle the event
    try {
      // Check if this event has already been processed (idempotency)
      const alreadyProcessed = await storage.isWebhookEventProcessed(event.id);
      if (alreadyProcessed) {
        console.log(`Event ${event.id} already processed, skipping`);
        return res.json({ received: true, status: "already_processed" });
      }
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { credits, userId, guestToken } = session.metadata || {};
        
        if (!credits) {
          console.error("No credits in session metadata");
          return res.status(400).json({ error: "Missing credits metadata" });
        }
        
        const creditsToAdd = parseInt(credits);
        
        // Validate credits amount is a valid tier
        if (![20, 100, 500, 1000].includes(creditsToAdd)) {
          console.error(`Invalid credits amount in metadata: ${creditsToAdd}`);
          return res.status(400).json({ error: "Invalid credits amount" });
        }
        
        // Add credits to user or guest token atomically
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            const currentBalance = parseFloat(user.creditBalance);
            const newBalance = (currentBalance + creditsToAdd).toFixed(2);
            await storage.updateUserCredits(userId, newBalance);
            console.log(`✅ Added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
          } else {
            console.error(`User ${userId} not found`);
          }
        } else if (guestToken) {
          const token = await storage.getGuestTokenByToken(guestToken);
          if (token) {
            const currentBalance = parseFloat(token.creditBalance);
            const newBalance = (currentBalance + creditsToAdd).toFixed(2);
            await storage.updateGuestTokenCredits(token.id, newBalance);
            console.log(`✅ Added ${creditsToAdd} credits to guest token. New balance: ${newBalance}`);
          } else {
            console.error(`Guest token not found`);
          }
        } else {
          console.error("Neither userId nor guestToken provided in metadata");
        }
        
        // Mark event as processed
        await storage.markWebhookEventAsProcessed({
          eventId: event.id,
          eventType: event.type,
        });
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook handler error:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
