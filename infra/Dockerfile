# VV Monorepo Infrastructure Dockerfile
# This is a multi-stage build for the ubuntu-pools-api

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared-kernel first
RUN npm run build --workspace=packages/shared-kernel

# Build the API
RUN npm run build --workspace=apps/ubuntu-pools-api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 poolsapi

# Copy built application
COPY --from=builder /app/apps/ubuntu-pools-api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER poolsapi

EXPOSE 3001

ENV PORT 3001

CMD ["npm", "run", "start", "--workspace=apps/ubuntu-pools-api"]