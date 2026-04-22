#!/bin/bash
set -e

echo "🚀 VV Monorepo Setup Script"
echo "=========================="

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js ≥ 20."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go ≥ 1.23."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js ≥ 20."
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}' | sed 's/go//' | cut -d'.' -f2)
if [ "$GO_VERSION" -lt 23 ]; then
    echo "❌ Go version is too old. Please upgrade to Go ≥ 1.23."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment file
echo "📄 Copying environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "ℹ️  .env already exists, skipping copy"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

# Build shared-kernel first (required for other packages)
echo "🔨 Building shared-kernel..."
npm run build --workspace=packages/shared-kernel
echo "✅ Shared-kernel built"

# Start infrastructure
echo "🐳 Starting infrastructure (Postgres + Redis)..."
docker-compose -f infra/docker-compose.yml up -d
echo "✅ Infrastructure started"

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Enable pgvector
echo "🔧 Enabling pgvector extension..."
docker exec vv-postgres psql -U postgres -d vv_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo "✅ pgvector enabled"

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:migrate
echo "✅ Database migrations completed"

# Seed pilot pool data
echo "🌱 Seeding pilot pool data..."
npm run db:seed
echo "✅ Pilot pool data seeded"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start all applications"
echo "2. Visit http://localhost:3001/api/health to check API health"
echo "3. Run 'npm run test' to execute integration tests"
echo ""
echo "For production deployment:"
echo "1. Set up Vercel project for ubuntu-pools-api"
echo "2. Configure environment variables in Vercel"
echo "3. Push to main branch to trigger deployment"