// config/integrations.ts
export const INTEGRATIONS = {
  github: {
    repo: process.env.GITHUB_REPO_URL,
    branch: 'main',
    webhook: '/api/github/sync'
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,  // Capture everything in alpha
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Tables: games, sessions, leaderboards, tournaments, lindiwe_signals
  },
  xpoz: {
    mcpUrl: process.env.XPOZ_MCP_URL,
    apiKey: process.env.XPOZ_API_KEY,
    // Used for: real-time game state sync, cross-platform leaderboards
  }
}