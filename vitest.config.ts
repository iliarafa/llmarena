import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Empty on purpose: do not load the repo .env / .env.local (those can hold
  // production Supabase and Stripe secrets). Tests read DATABASE_URL from the
  // process environment only.
  envDir: path.join(root, "tests/env"),
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": root,
      "@shared": path.join(root, "shared"),
    },
  },
});
