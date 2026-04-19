type EnvSpec = {
  NODE_ENV: "development" | "test" | "production";
  DATABASE_URL?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  SENTRY_DSN?: string;
  OPENROUTER_API_KEY?: string;
};

export function getEnv(): EnvSpec {
  return {
    NODE_ENV: (process.env.NODE_ENV as EnvSpec["NODE_ENV"]) ?? "development",
    DATABASE_URL: process.env.DATABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
  };
}