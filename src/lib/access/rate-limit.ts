import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimits = {
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:login",
    analytics: true,
  }),

  transactions: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "ratelimit:transactions",
    analytics: true,
  }),

  proposals: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 d"),
    prefix: "ratelimit:proposals",
    analytics: true,
  }),

  votes: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    prefix: "ratelimit:votes",
    analytics: true,
  }),

  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    prefix: "ratelimit:api",
    analytics: true,
  }),

  websocket: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 m"),
    prefix: "ratelimit:websocket",
    analytics: true,
  }),
};

export interface RateLimitConfig {
  limit: number;
  window: string;
  action: string;
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  login: {
    limit: 10,
    window: "1 minute",
    action: "Login attempts",
  },
  transactions: {
    limit: 20,
    window: "1 minute",
    action: "Transaction submissions",
  },
  proposals: {
    limit: 5,
    window: "1 day",
    action: "Proposal creation",
  },
  votes: {
    limit: 100,
    window: "1 hour",
    action: "Governance votes",
  },
  api: {
    limit: 100,
    window: "1 minute",
    action: "API requests",
  },
  websocket: {
    limit: 50,
    window: "1 minute",
    action: "WebSocket connections",
  },
};

export function getRateLimitResponse(config: RateLimitConfig) {
  return {
    error: "Rate limit exceeded",
    message: `Too many requests for ${config.action}. Limit: ${config.limit} per ${config.window}`,
    retryAfter: config.window,
  };
}
