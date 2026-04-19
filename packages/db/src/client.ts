/**
 * Ubuntu Pools — Phase 1: Database Client
 *
 * Provides a singleton Drizzle ORM client connected to PostgreSQL.
 *
 * Configuration:
 *   DATABASE_URL environment variable (required in production).
 *   Falls back to a local development URL if not set.
 *
 * Security:
 *   - No secrets committed to source.
 *   - Connection string read from environment only.
 *   - SSL enforced in production (NODE_ENV=production).
 *
 * Connection Pooling:
 *   - max: Maximum concurrent connections (10 for serverless, adjust for dedicated)
 *   - idle_timeout: Close idle connections after 20s
 *   - connect_timeout: Fail fast if connection takes > 10s
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import * as schemaCredit from "./schema-credit";
import * as schemaVillage from "./schema-village";
import * as schemaGames from "./schema-games";
import * as schemaSpine from "./schema-spine";

const isProduction = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;

let sql: postgres.Sql<{}> | undefined;

function getSqlClient() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "[Ubuntu Pools] DATABASE_URL environment variable is required. " +
          "Set it in .env.local for development or as a secret in production."
      );
    }

    const poolConfig = isVercel
      ? {
          max: 20,
          idle_timeout: 30,
          connect_timeout: 10,
        }
      : {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        };

    sql = postgres(connectionString, {
      ...poolConfig,
      ssl: isProduction ? "require" : false,
      onnotice: () => {},
    });
  }
  return sql;
}

function getDb() {
  return drizzle(getSqlClient(), {
    schema: { ...schema, ...schemaCredit, ...schemaVillage, ...schemaGames, ...schemaSpine },
    logger: process.env.NODE_ENV === "development",
  });
}

export const db = new Proxy(
  {} as ReturnType<typeof getDb> & {
    execute: (query: ReturnType<typeof sql>) => Promise<{ rows: Record<string, unknown>[] }>;
  },
  {
    get(_target, prop) {
      if (prop === 'execute') {
        const client = getSqlClient();
        return async (query: unknown) => {
          const result = await client.unsafe(query as string);
          return { rows: result as Record<string, unknown>[] };
        };
      }
      const database = getDb();
      const value = (database as any)[prop];
      if (typeof value === 'function') {
        return value.bind(database);
      }
      return value;
    },
  }
);

export const pgClient = {
  get client() {
    return getSqlClient();
  },
};

export type Database = ReturnType<typeof getDb>;

export function getPoolStats() {
  const client = getSqlClient();
  return {
    totalConnections: client.options.max,
    idleTimeout: client.options.idle_timeout,
    connectTimeout: client.options.connect_timeout,
  };
}
