import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { databaseUrlForPg } from "./lib/database-url";

// Next.js reads .env.local. dotenv does not override variables already set,
// so load the higher-priority file first.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Use the Supabase Postgres connection string (the pooler URL with ?sslmode=require is fine).",
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrlForPg(process.env.DATABASE_URL),
  },
});
