/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Disable Turbopack for Vercel compatibility
      enabled: false,
    },
  },
  // Ensure proper output for Vercel
  output: 'standalone',
  // Disable telemetry in production
  telemetry: false,
};

module.exports = nextConfig;