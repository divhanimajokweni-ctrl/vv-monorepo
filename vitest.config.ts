/**
 * Ubuntu Pools — Phase 1: Vitest Configuration
 *
 * Configures the test runner for unit tests (no DB required).
 * Integration tests (DB-dependent) are excluded by default.
 *
 * Test categories:
 *   - Unit tests: src/tests/*.test.ts (no DB, pure logic)
 *   - Integration tests: src/tests/*.integration.test.ts (requires PostgreSQL)
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Run unit tests only by default (no DB required)
    include: ["src/tests/**/*.test.ts"],
    exclude: ["src/tests/**/*.integration.test.ts"],

    // Environment: Node.js (not browser)
    environment: "node",

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/**/*.d.ts",
        "src/tests/**",
        "src/app/**",
        "src/db/**",
      ],
    },

    // Globals: use describe/it/expect without imports
    globals: false,

    // Timeout: 10s per test
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
