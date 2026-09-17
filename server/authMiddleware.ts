import type { RequestHandler } from "express";
import { storage } from "./storage";
import type { User, GuestToken } from "@shared/schema";

/**
 * Replit Auth has been removed. Authenticated accounts are not available.
 * Guest tokens are the primary (and only) identity path for now.
 */
export const isAuthenticated: RequestHandler = (_req, res) => {
  res.status(401).json({
    message: "Unauthorized",
    error: "Authenticated accounts are not available. Use a guest token.",
  });
};

// Extend Express Request type to include our auth info
declare global {
  namespace Express {
    interface Request {
      guestToken?: GuestToken;
      authenticatedUser?: User;
    }
  }
}

/**
 * Middleware that accepts both guest tokens (via Bearer token) and logged-in user sessions.
 * This allows the API to serve both anonymous guests and registered users.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    // Check for Bearer token (guest authentication)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      const guestToken = await storage.getGuestTokenByToken(token);
      if (guestToken) {
        req.guestToken = guestToken;
        // Update last used timestamp
        await storage.updateGuestTokenLastUsed(guestToken.id);
        return next();
      }
    }
    
    // Authenticated sessions (formerly Replit Auth) are not available.
    // Guest tokens are the only supported identity path.

    return res.status(401).json({ 
      error: "Unauthorized",
      message: "Please provide a valid guest token to access this resource." 
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Helper to get the credit balance for the current auth context (guest or user)
 */
export function getCreditBalance(req: Express.Request): string {
  if (req.guestToken) {
    return req.guestToken.creditBalance;
  }
  if (req.authenticatedUser) {
    return req.authenticatedUser.creditBalance;
  }
  return "0";
}

/**
 * Helper to get the ID for usage tracking (guest token ID or user ID)
 */
export function getAuthId(req: Express.Request): { userId?: string; guestTokenId?: string } {
  if (req.guestToken) {
    return { guestTokenId: req.guestToken.id };
  }
  if (req.authenticatedUser) {
    return { userId: req.authenticatedUser.id };
  }
  return {};
}

/**
 * Helper to update credit balance for the current auth context
 */
export async function updateCreditBalance(req: Express.Request, newBalance: string): Promise<void> {
  if (req.guestToken) {
    await storage.updateGuestTokenCredits(req.guestToken.id, newBalance);
    // Update the in-memory object to reflect the new balance
    req.guestToken.creditBalance = newBalance;
  } else if (req.authenticatedUser) {
    await storage.updateUserCredits(req.authenticatedUser.id, newBalance);
    // Update the in-memory object to reflect the new balance
    req.authenticatedUser.creditBalance = newBalance;
  }
}
