import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateComparisons, generateCaesarVerdict, generateMaximus } from "./llm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireAuth, isAuthenticated, getCreditBalance, getAuthId, updateCreditBalance } from "./authMiddleware";
import Stripe from "stripe";
import {
  CONTENDER_MODEL_IDS,
  JUDGE_MODEL_IDS,
  MAXIMUS_MODEL_IDS,
  CREDIT_COST_BY_MODEL_COUNT,
  CAESAR_CREDIT_COST,
  MAXIMUS_CREDIT_COST,
} from "@shared/models";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
  }
  return new Stripe(secret, {
    apiVersion: "2025-10-29.clover",
  });
}

const compareRequestSchema = z.object({
  prompt: z.string().min(1),
  modelIds: z.array(z.enum(CONTENDER_MODEL_IDS)).min(1),
  caesarEnabled: z.boolean().optional(),
  caesarJudgeModel: z.enum(JUDGE_MODEL_IDS).optional(),
  maximusEnabled: z.boolean().optional(),
  maximusEngineModel: z.enum(MAXIMUS_MODEL_IDS).optional(),
});

const checkoutRequestSchema = z.object({
  credits: z.union([
    z.literal(25),
    z.literal(100),
    z.literal(300),
    z.literal(1000),
  ]),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth stub: Replit Auth is gone. Guests are the primary path.
  app.get("/api/auth/user", isAuthenticated);

  app.get("/api/login", (_req, res) => {
    res.status(410).json({
      error: "Gone",
      message: "Replit Auth has been removed. Create a guest token to use the app.",
    });
  });

  app.get("/api/callback", (_req, res) => {
    res.status(410).json({
      error: "Gone",
      message: "Replit Auth has been removed. Create a guest token to use the app.",
    });
  });

  app.get("/api/logout", (_req, res) => {
    res.status(410).json({
      error: "Gone",
      message: "Replit Auth has been removed. Clear your guest token in the browser to sign out.",
    });
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

  // Account linking required Replit Auth; that path is gone. Credits stay on the guest token.
  app.post("/api/link-guest-account", (_req, res) => {
    res.status(410).json({
      error: "Gone",
      message: "Account linking is unavailable. Replit Auth has been removed; guest tokens are the primary path.",
    });
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
      const { prompt, modelIds, caesarEnabled, caesarJudgeModel, maximusEnabled, maximusEngineModel } = compareRequestSchema.parse(req.body);
      
      // Calculate credit cost based on tiered pricing
      const modelCount = modelIds.length;
      const baseCreditCost = CREDIT_COST_BY_MODEL_COUNT[modelCount];
      
      if (!baseCreditCost) {
        return res.status(400).json({
          error: "Invalid model count",
          message: "Please select between 1 and 4 models.",
        });
      }
      
      // Add Caesar cost if enabled (+3 credits) and Maximus cost if enabled (+5 credits)
      const caesarCost = caesarEnabled ? CAESAR_CREDIT_COST : 0;
      const maximusCost = maximusEnabled ? MAXIMUS_CREDIT_COST : 0;
      const creditCost = baseCreditCost + caesarCost + maximusCost;
      
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
      
      // Count valid responses for optional features
      const validResponseCount = responses.filter(r => r.response && !r.error).length;
      
      // Calculate actual costs based on what we can actually generate
      let actualCaesarCost = 0;
      let actualMaximusCost = 0;
      
      // Generate Caesar verdict if enabled and we have at least 2 valid responses
      let caesar = undefined;
      if (caesarEnabled && caesarJudgeModel && validResponseCount >= 2) {
        caesar = await generateCaesarVerdict(prompt, responses, caesarJudgeModel);
        if (!caesar.error) {
          actualCaesarCost = CAESAR_CREDIT_COST;
        }
      }
      
      // Generate Maximus synthesis if enabled and we have at least 2 valid responses
      let maximus = undefined;
      if (maximusEnabled && maximusEngineModel && validResponseCount >= 2) {
        maximus = await generateMaximus(prompt, responses, maximusEngineModel);
        if (!maximus.error) {
          actualMaximusCost = MAXIMUS_CREDIT_COST;
        }
      }
      
      // Calculate actual credit cost (base + successful optional features)
      const actualCreditCost = baseCreditCost + actualCaesarCost + actualMaximusCost;
      
      // Deduct credits after successful comparison
      const newBalance = (creditBalance - actualCreditCost).toFixed(2);
      await updateCreditBalance(req, newBalance);
      
      // Log minimal usage for billing (no prompts or model details stored for privacy)
      await storage.logComparison({
        ...getAuthId(req),
        creditsCost: actualCreditCost.toString(),
      });
      
      res.json({
        responses,
        caesar,
        maximus,
        creditsUsed: actualCreditCost,
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
          message: "Please select a valid credit tier (25, 100, 300, or 1000)",
        });
      }
      
      const { credits } = parseResult.data;
      
      // Define credit tiers with pricing (amounts in cents)
      const creditTiers: Record<number, { amount: number; name: string }> = {
        25: { amount: 300, name: "Starter Pack - 25 Credits" },
        100: { amount: 1000, name: "Challenger Pack - 100 Credits" },
        300: { amount: 2500, name: "Pro Pack - 300 Credits" },
        1000: { amount: 5000, name: "Ultimate Pack - 1000 Credits" },
      };
      
      const tier = creditTiers[credits];
      
      // Get auth ID for metadata
      const authId = getAuthId(req);
      const guestToken = req.guestToken?.token;
      
      const stripe = getStripe();
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
        event = getStripe().webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
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
        if (![25, 100, 300, 1000].includes(creditsToAdd)) {
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

  // Admin: Get all users (with optional search)
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const search = req.query.search as string | undefined;
      const users = await storage.getAllUsers(search);
      res.json(users);
    } catch (error: any) {
      console.error("Admin get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin: Get all guest tokens (with optional search)
  app.get("/api/admin/guest-tokens", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const search = req.query.search as string | undefined;
      const tokens = await storage.getAllGuestTokens(search);
      res.json(tokens);
    } catch (error: any) {
      console.error("Admin get guest tokens error:", error);
      res.status(500).json({ error: "Failed to fetch guest tokens" });
    }
  });

  // Admin: Create a new user
  const createUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    initialCredits: z.number().int().min(0).optional(),
    isAdmin: z.boolean().optional(),
  });

  app.post("/api/admin/create-user", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const parseResult = createUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parseResult.error.errors.map(e => e.message).join(", ")
        });
      }
      
      const { email, firstName, lastName, initialCredits, isAdmin } = parseResult.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }
      
      // Create the user
      const newUser = await storage.createUser({
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        creditBalance: (initialCredits || 0).toString(),
        isAdmin: isAdmin || false,
      });
      
      res.json({ 
        success: true, 
        message: `User ${email} created successfully`,
        user: newUser
      });
    } catch (error: any) {
      console.error("Admin create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Admin: Update user
  const updateUserSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    isAdmin: z.boolean().optional(),
  });

  app.patch("/api/admin/users/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { userId } = req.params;
      const parseResult = updateUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parseResult.error.errors.map(e => e.message).join(", ")
        });
      }
      
      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // If changing email, check for duplicates
      if (parseResult.data.email && parseResult.data.email !== existingUser.email) {
        const emailExists = await storage.getUserByEmail(parseResult.data.email);
        if (emailExists) {
          return res.status(400).json({ error: "Email already in use by another user" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, parseResult.data);
      res.json({ 
        success: true, 
        message: "User updated successfully",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Admin update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin: Set exact credit balance for a user
  const setCreditsSchema = z.object({
    credits: z.number().min(0),
  });

  app.patch("/api/admin/users/:userId/credits", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { userId } = req.params;
      const parseResult = setCreditsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parseResult.error.errors.map(e => e.message).join(", ")
        });
      }
      
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.setUserCredits(userId, parseResult.data.credits);
      res.json({ 
        success: true, 
        message: `Credits set to ${parseResult.data.credits}`,
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Admin set credits error:", error);
      res.status(500).json({ error: "Failed to set credits" });
    }
  });

  // Admin: Delete a user
  app.delete("/api/admin/users/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === adminId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Check if user exists before deletion
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.deleteUser(userId);
      
      // Verify deletion was successful
      const verifyDeleted = await storage.getUser(userId);
      if (verifyDeleted) {
        return res.status(500).json({ error: "Failed to delete user" });
      }
      
      res.json({ 
        success: true, 
        message: `User ${existingUser.email || userId} deleted successfully`
      });
    } catch (error: any) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin: Gift credits to user or guest token
  const giftCreditsSchema = z.object({
    targetType: z.enum(["user", "guest"]),
    targetId: z.string().min(1),
    amount: z.number().int().positive(),
  });
  
  app.post("/api/admin/gift-credits", isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const admin = await storage.getUser(adminId);
      
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const parseResult = giftCreditsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parseResult.error.errors.map(e => e.message).join(", ")
        });
      }
      
      const { targetType, targetId, amount } = parseResult.data;
      
      if (targetType === "user") {
        const updated = await storage.addCreditsToUser(targetId, amount);
        res.json({ 
          success: true, 
          message: `Added ${amount} credits to user`,
          newBalance: updated.creditBalance 
        });
      } else {
        const updated = await storage.addCreditsToGuestToken(targetId, amount);
        res.json({ 
          success: true, 
          message: `Added ${amount} credits to guest token`,
          newBalance: updated.creditBalance 
        });
      }
    } catch (error: any) {
      console.error("Admin gift credits error:", error);
      res.status(500).json({ error: "Failed to gift credits" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
