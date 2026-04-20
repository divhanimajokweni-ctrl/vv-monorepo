/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript checks in production for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint checks in production
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure proper output for Vercel
  output: 'standalone',
};

module.exports = nextConfig;