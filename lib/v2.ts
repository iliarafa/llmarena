/**
 * Compare v2: the paywalled "1 token = 1 comparison" product used by iliasr.nyc/compare.
 * Separate unit (`v2_wallets.tokens`) so existing llmarena credits and packs are untouched.
 */
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb } from "./db";
import { getBearerToken } from "./session";

export const V2_PACKS: Record<number, { amount: number; name: string }> = {
  1: { amount: 200, name: "Four Minds · 1 token" },
  5: { amount: 500, name: "Four Minds · 5 tokens" },
  20: { amount: 1500, name: "Four Minds · 20 tokens" },
};

export const V2_MAX_PROMPT_CHARS = 32_000; // ~8k tokens
export const V2_MAX_OUTPUT_TOKENS = 4096; // per model, reasoning included

export type Wallet = { id: string; token: string; user_id: string | null; tokens: number };

async function q<T>(query: ReturnType<typeof sql>): Promise<T[]> {
  const res: any = await getDb().execute(query);
  return (res.rows ?? res) as T[];
}

export async function createWallet(userId: string | null = null): Promise<Wallet> {
  const token = "w_" + randomBytes(24).toString("hex");
  const [w] = await q<Wallet>(sql`insert into v2_wallets (token, user_id) values (${token}, ${userId}) returning id, token, user_id, tokens`);
  return w;
}

export async function walletByToken(token: string): Promise<Wallet | null> {
  const [w] = await q<Wallet>(sql`select id, token, user_id, tokens from v2_wallets where token = ${token}`);
  return w ?? null;
}

export async function walletByUser(userId: string): Promise<Wallet | null> {
  const [w] = await q<Wallet>(sql`select id, token, user_id, tokens from v2_wallets where user_id = ${userId}`);
  return w ?? null;
}

export async function requireWallet(request: Request): Promise<Wallet> {
  const t = getBearerToken(request);
  const w = t ? await walletByToken(t) : null;
  if (!w) throw Object.assign(new Error("wallet"), { status: 401 });
  return w;
}

/** Atomically spend one token. Returns the new balance, or null if empty. */
export async function spendToken(walletId: string): Promise<number | null> {
  const [r] = await q<{ tokens: number }>(sql`update v2_wallets set tokens = tokens - 1, updated_at = now() where id = ${walletId} and tokens >= 1 returning tokens`);
  return r ? r.tokens : null;
}

export async function addTokens(walletId: string, n: number): Promise<number> {
  const [r] = await q<{ tokens: number }>(sql`update v2_wallets set tokens = tokens + ${n}, updated_at = now() where id = ${walletId} returning tokens`);
  return r.tokens;
}

/** Idempotent fulfilment keyed by Stripe Checkout Session id. */
export async function recordPurchase(sessionId: string, walletId: string, tokens: number, amount: number): Promise<boolean> {
  const rows = await q(sql`insert into v2_purchases (stripe_session_id, wallet_id, tokens, amount_cents) values (${sessionId}, ${walletId}, ${tokens}, ${amount}) on conflict do nothing returning stripe_session_id`);
  return rows.length > 0;
}

export async function logUsage(walletId: string, costUsd: number, detail: unknown) {
  await q(sql`insert into v2_usage (wallet_id, cost_usd, detail) values (${walletId}, ${costUsd.toFixed(5)}, ${JSON.stringify(detail)}::jsonb)`);
}

/** Merge a guest wallet into the user's wallet (or adopt it). Returns the user's wallet. */
export async function linkWallet(guestToken: string | null, userId: string): Promise<Wallet> {
  const mine = await walletByUser(userId);
  const guest = guestToken ? await walletByToken(guestToken) : null;
  if (!mine) {
    if (guest && !guest.user_id) {
      const [w] = await q<Wallet>(sql`update v2_wallets set user_id = ${userId}, updated_at = now() where id = ${guest.id} returning id, token, user_id, tokens`);
      return w;
    }
    return createWallet(userId);
  }
  if (guest && !guest.user_id && guest.id !== mine.id && guest.tokens > 0) {
    const [moved] = await q<{ tokens: number }>(sql`update v2_wallets set tokens = 0, updated_at = now() where id = ${guest.id} and user_id is null returning ${guest.tokens}::int as tokens`);
    if (moved) mine.tokens = await addTokens(mine.id, guest.tokens);
  }
  return mine;
}

const ALLOWED = (process.env.V2_ALLOWED_ORIGINS || "https://www.iliasr.nyc,https://iliasr.nyc").split(",").map((s) => s.trim());
export function allowedReturn(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (ALLOWED.includes(u.origin)) return u.toString();
    if (/^https:\/\/iliasr-[a-z0-9-]+-rafa1l\.vercel\.app$/.test(u.origin)) return u.toString();
    if (u.origin === "http://localhost:5000") return u.toString();
  } catch {}
  return null;
}

/**
 * Four Minds Stripe setup. Production with STRIPE_LIVE_SECRET_KEY set -> live
 * account and live price ids (STRIPE_LIVE_PRICE_1/_5/_20). Everything else
 * (previews, or production before the key exists) -> the existing test key
 * with inline price_data. Regular llmarena credit purchases never use this.
 */
import Stripe from "stripe";
import { getStripe } from "./stripe";
let liveClient: Stripe | null = null;
export function v2Stripe(): { stripe: Stripe; live: boolean; priceId: (n: number) => string | undefined } {
  const key = process.env.STRIPE_LIVE_SECRET_KEY;
  if (process.env.VERCEL_ENV === "production" && key) {
    liveClient ??= new Stripe(key, { apiVersion: "2025-10-29.clover" });
    return { stripe: liveClient, live: true, priceId: (n) => process.env[`STRIPE_LIVE_PRICE_${n}`] };
  }
  return { stripe: getStripe(), live: false, priceId: () => undefined };
}
