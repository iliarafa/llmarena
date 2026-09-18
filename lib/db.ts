import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | null = null;

/**
 * Lazy Neon + Drizzle client. Avoids throwing at import time so `next build`
 * can succeed without DATABASE_URL (required at runtime).
 */
export function getDb(): Database {
  if (cached) return cached;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(databaseUrl);
  cached = drizzle(sql, { schema });
  return cached;
}

/** @deprecated Use getDb() — kept as a named alias for storage.ts */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
