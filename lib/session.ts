import type { GuestToken, User } from "@shared/schema";
import { auth } from "@/auth";
import { storage, type CreditTarget } from "./storage";

/**
 * Identity helpers for API route handlers.
 *
 * Signed-in users come from the Auth.js session cookie (Google / GitHub).
 * Guest tokens (Authorization: Bearer <token>) still work when there is no
 * session. A session wins when both are present so compare, credits, and
 * Stripe follow the account after sign-in. Guest credit merge is a separate
 * call to /api/link-guest-account.
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
 * Resolve the Auth.js session cookie to a row in `users`.
 *
 * `auth()` reads the current request via `next/headers` (cookie only — it does
 * not treat the guest Bearer token as a session). The DB id is written onto
 * the JWT at sign-in. Returns null when nobody is signed in, or when Auth.js
 * is not configured, so guest Bearer auth keeps working.
 */
export async function getSessionUser(_request: Request): Promise<User | null> {
  let userId: string | undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch (error) {
    // Missing AUTH_SECRET and other Auth.js config errors must not take down
    // guest Bearer auth. Database errors from the lookup below still propagate.
    console.error("Failed to resolve Auth.js session:", error);
    return null;
  }
  if (!userId) return null;
  const user = await storage.getUser(userId);
  return user ?? null;
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function getIdentity(request: Request): Promise<AppIdentity> {
  const user = await getSessionUser(request);
  if (user) {
    return { user, guestToken: null };
  }

  const bearer = getBearerToken(request);
  if (bearer) {
    const guestToken = await storage.getGuestTokenByToken(bearer);
    // A linked token has already been merged into an account; don't revive it.
    if (guestToken && !guestToken.linkedAt) {
      await storage.updateGuestTokenLastUsed(guestToken.id);
      return { user: null, guestToken };
    }
  }

  return { user: null, guestToken: null };
}

export async function requireAuth(request: Request): Promise<AppIdentity> {
  const identity = await getIdentity(request);
  if (!identity.guestToken && !identity.user) {
    throw new HttpError(401, {
      error: "Unauthorized",
      message: "Sign in or provide a valid guest token to access this resource.",
    });
  }
  return identity;
}

export async function requireAdmin(request: Request): Promise<User> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new HttpError(401, {
      message: "Unauthorized",
      error: "Sign in required.",
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

/** The credit row compare, gifts, and refunds should update. Guest wins if both are set. */
export function creditTargetFromIdentity(identity: AppIdentity): CreditTarget | null {
  if (identity.guestToken) return { kind: "guest", id: identity.guestToken.id };
  if (identity.user) return { kind: "user", id: identity.user.id };
  return null;
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
