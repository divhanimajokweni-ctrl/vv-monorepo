/**
 * Ubuntu Pools — Phase 1: Drizzle Kit Configuration
 *
 * Used by drizzle-kit for:
 *   - Generating migrations from schema changes
 *   - Running migrations against the database
 *   - Opening Drizzle Studio for DB inspection
 *
 * Security:
 *   - DATABASE_URL read from environment only.
 *   - No secrets committed to source.
 */

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[Ubuntu Pools] DATABASE_URL environment variable is required for drizzle-kit. " +
      "Set it in .env.local for development."
  );
}

export default defineConfig({
  // Schema file location
  schema: "./src/db/schema.ts",

  // Migrations output directory
  out: "./src/db/migrations",

  // PostgreSQL dialect
  dialect: "postgresql",

  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  // Verbose output for debugging
  verbose: true,

  // Strict mode: fail on destructive changes
  strict: true,
});
