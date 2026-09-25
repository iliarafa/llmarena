import { beforeAll } from "vitest";
import { sql } from "drizzle-orm";
import { isSupabaseDatabaseHost, postgresHostname } from "../lib/database-url";
import { getDb } from "../lib/db";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Tables mirrored from shared/schema.ts. Created here so `npm test` does not
 * run drizzle-kit, which loads .env.local and could point at Supabase.
 */
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar UNIQUE,
    first_name varchar,
    last_name varchar,
    profile_image_url varchar,
    credit_balance numeric(10, 2) NOT NULL DEFAULT 0,
    stripe_customer_id text,
    is_admin boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS guest_tokens (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    credit_balance numeric(10, 2) NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now(),
    last_used_at timestamp,
    linked_at timestamp,
    linked_to_user_id varchar REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS usage_history (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar REFERENCES users(id),
    guest_token_id varchar REFERENCES guest_tokens(id),
    timestamp timestamp NOT NULL DEFAULT now(),
    credits_cost numeric(10, 2) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS processed_webhook_events (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text NOT NULL UNIQUE,
    event_type text NOT NULL,
    processed_at timestamp NOT NULL DEFAULT now()
  )`,
];

function databaseName(databaseUrl: string): string | null {
  const match = databaseUrl.match(/^[a-z][a-z0-9+.-]*:\/\/[^/]*\/([^?#]*)/i);
  if (!match || !match[1]) return null;
  return decodeURIComponent(match[1]);
}

function assertSafeTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Point it at a local Postgres whose database name contains \"test\" (see README). Tests do not load .env files.",
    );
  }

  const host = postgresHostname(databaseUrl);
  if (host && isSupabaseDatabaseHost(host)) {
    throw new Error(
      `Refusing to run tests against Supabase host "${host}". Use a local Postgres, never production.`,
    );
  }

  const name = databaseName(databaseUrl);
  const local = !host || LOCAL_HOSTS.has(host);
  if (!local || !name || !/test/i.test(name)) {
    throw new Error(
      `Refusing to run tests against ${databaseUrl.replace(/:[^:@/]+@/, ":***@")}. Host must be local and the database name must contain "test".`,
    );
  }

  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
    throw new Error("Refusing to run tests with a live Stripe secret key (sk_live_).");
  }

  // Fixtures only. Signature checks never call Stripe, and this replaces any
  // secret that may have been present in the environment.
  process.env.STRIPE_SECRET_KEY = "sk_test_ci_not_a_real_key";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_ci_secret";
}

beforeAll(async () => {
  assertSafeTestDatabase();
  const db = getDb();
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(sql.raw(statement));
  }
});
