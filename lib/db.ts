import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { supabaseSslOverride } from "./database-url";

type Database = NodePgDatabase<typeof schema>;

let cached: Database | null = null;

/**
 * Lazy node-postgres + Drizzle client. Avoids throwing at import time so
 * `next build` can succeed without DATABASE_URL (required at runtime).
 *
 * Supabase dashboard URLs (`*.supabase.co` / pooler, `?sslmode=require`) use
 * libpq-style SSL: encrypted, certificate not verified. See database-url.ts.
 */
export function getDb(): Database {
  if (cached) return cached;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool(
    supabaseSslOverride(databaseUrl) ?? { connectionString: databaseUrl },
  );
  cached = drizzle(pool, { schema });
  return cached;
}

/** @deprecated Use getDb() — kept as a named alias for storage.ts */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
