import type { GuestToken, User } from "@shared/schema";
import { storage } from "./storage";

/**
 * Identity helpers for API route handlers.
 *
 * Guest tokens (Authorization: Bearer <token>) are the only live identity
 * path in this PR. Signed-in users are resolved through getSessionUser()
 * so Auth.js (or another provider) can be added later without rewriting
 * compare, credits, Stripe, or admin gates.
 */
export type AppIdentity = {
  user: User | null;
  guestToken: GuestToken | null;
};

export class HttpError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(typeof body.message === "string" ? body.message : "Request failed");
    this.status = status;
    this.body = body;
  }
}

/**
 * Future Auth.js hook. Return the signed-in user from the session, or null.
 * Guest-only for this rewrite — do not invent a second login path here.
 */
export async function getSessionUser(_request: Request): Promise<User | null> {
  return null;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function getIdentity(request: Request): Promise<AppIdentity> {
  const bearer = getBearerToken(request);
  if (bearer) {
    const guestToken = await storage.getGuestTokenByToken(bearer);
    if (guestToken) {
      await storage.updateGuestTokenLastUsed(guestToken.id);
      return { user: null, guestToken };
    }
  }

  const user = await getSessionUser(request);
  return { user, guestToken: null };
}

export async function requireAuth(request: Request): Promise<AppIdentity> {
  const identity = await getIdentity(request);
  if (!identity.guestToken && !identity.user) {
    throw new HttpError(401, {
      error: "Unauthorized",
      message: "Please provide a valid guest token to access this resource.",
    });
  }
  return identity;
}

export async function requireAdmin(request: Request): Promise<User> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new HttpError(401, {
      message: "Unauthorized",
      error: "Authenticated accounts are not available. Use a guest token.",
    });
  }
  if (!user.isAdmin) {
    throw new HttpError(403, { error: "Admin access required" });
  }
  return user;
}

export function getCreditBalance(identity: AppIdentity): string {
  if (identity.guestToken) return identity.guestToken.creditBalance;
  if (identity.user) return identity.user.creditBalance;
  return "0";
}

export function getAuthIds(identity: AppIdentity): { userId?: string; guestTokenId?: string } {
  if (identity.guestToken) return { guestTokenId: identity.guestToken.id };
  if (identity.user) return { userId: identity.user.id };
  return {};
}

export async function updateCreditBalance(identity: AppIdentity, newBalance: string): Promise<void> {
  if (identity.guestToken) {
    await storage.updateGuestTokenCredits(identity.guestToken.id, newBalance);
    identity.guestToken.creditBalance = newBalance;
  } else if (identity.user) {
    await storage.updateUserCredits(identity.user.id, newBalance);
    identity.user.creditBalance = newBalance;
  }
}

export function jsonError(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(error.body, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Internal Server Error" }, { status: 500 });
}

export function requestOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
