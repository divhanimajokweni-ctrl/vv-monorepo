# Ubuntu Pools + SafeGrid Development Environment Setup

## Overview

<div align="center">

## 🚀 Enterprise-Grade Development Environment
*Multi-Factor Sybil Defense • Dynamic Governance • Behavioral Intelligence*

[![Phase 15 Complete](https://img.shields.io/badge/Phase_15-Complete-28a745?style=for-the-badge&logo=ubuntu&logoColor=white)](https://github.com/divhanimajokweni-ctrl/ubuntu-pools)
[![Security](https://img.shields.io/badge/Security-Enterprise-FF6B6B?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/divhanimajokweni-ctrl/ubuntu-pools)

</div>

This guide provides comprehensive instructions for setting up a local development environment to run Ubuntu Pools (Next.js frontend) and SafeGrid (Go backend) simultaneously. This enables full integration testing and development of the trust ecosystem where Ubuntu Score influences SafeGrid alert suppression.

**🆕 New Features Available:**
- **Financial Intelligence Arcade**: 5 educational games with behavioral signals
- **Lindiwe AI Integration**: Game telemetry feeds credit risk models
- **Prestige Scoring**: Non-transferable reputation from financial wisdom
- **Multi-Factor Sybil Defense**: Test 4-layer verification systems
- **Dynamic Governance Quorum**: Experiment with scaling governance models
- **Behavioral Intelligence**: Debug Lindiwe AI signal processing
- **Emergency Protocols**: Test Archivist freeze mechanisms
- **Advanced Caching**: Redis warming and invalidation testing

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Database Configuration](#database-configuration)
4. [Redis Setup](#redis-setup)
5. [Authentication Setup](#authentication-setup)
6. [Ubuntu Pools Setup](#ubuntu-pools-setup)
7. [SafeGrid Setup](#safegrid-setup)
8. [Running Both Services](#running-both-services)
9. [Integration Testing](#integration-testing)
10. [Development Workflow](#development-workflow)
11. [Troubleshooting](#troubleshooting)
12. [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Software

- **Go 1.21+**: `https://golang.org/dl/`
- **Bun 1.x**: `curl -fsSL https://bun.sh/install | bash`
- **PostgreSQL 15+**: `brew install postgresql` (macOS) or `sudo apt install postgresql` (Ubuntu)
- **Redis 7+**: `brew install redis` (macOS) or `sudo apt install redis-server` (Ubuntu)
- **Git**: `brew install git` (macOS) or `sudo apt install git` (Ubuntu)
- **Docker Desktop**: `https://www.docker.com/products/docker-desktop` (optional, for containerized development)

### Required Accounts

- **GitHub Account**: Access to both repositories
- **Clerk Account**: For authentication (`https://clerk.com`)
- **AWS Account**: For Secrets Manager and RDS (optional for local development)

### System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 10GB free space
- **Network**: Stable internet connection for package downloads

### Environment Variables Template

Create a `.env.local` file in each repository root:

```bash
# Ubuntu Pools (.env.local)
DATABASE_URL=postgresql://ubuntu_dev:password@localhost:5432/ubuntu_pools_dev
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# SafeGrid (.env)
DATABASE_URL=postgresql://safegrid_dev:password@localhost:5432/safegrid_dev
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_test_...
UBUNTU_POOLS_API_URL=http://localhost:3000
UBUNTU_POOLS_API_KEY=dev_service_key
PORT=8080
```

## Repository Setup

### 1. Create Development Directory

```bash
mkdir ~/ubuntu-ecosystem-dev
cd ~/ubuntu-ecosystem-dev
```

### 2. Clone Both Repositories

```bash
# Clone Ubuntu Pools (frontend)
git clone https://github.com/your-org/ubuntu-pools.git ubuntu-pools
cd ubuntu-pools

# Set up git remotes (if needed)
git remote add upstream https://github.com/your-org/ubuntu-pools.git
git checkout main
git pull origin main

cd ..

# Clone SafeGrid (backend)
git clone https://github.com/your-org/safegrid-brain-api.git safegrid
cd safegrid

# Set up git remotes (if needed)
git remote add upstream https://github.com/your-org/safegrid-brain-api.git
git checkout main
git pull origin main

cd ..
```

### 3. Verify Repository Structure

```bash
tree -L 2 ubuntu-ecosystem-dev/
```

Expected output:
```
ubuntu-ecosystem-dev/
├── safegrid/
│   ├── go.mod
│   ├── main.go
│   ├── pkg/
│   └── cmd/
└── ubuntu-pools/
    ├── src/
    ├── package.json
    ├── next.config.ts
    └── bun.lock
```

## Database Configuration

### Option 1: Local PostgreSQL (Recommended for Development)

#### Install and Start PostgreSQL

**macOS:**
```bash
brew services start postgresql
createdb ubuntu_pools_dev
createdb safegrid_dev
```

**Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo -u postgres createdb ubuntu_pools_dev
sudo -u postgres createdb safegrid_dev
```

#### Create Database Users

```bash
# Connect to PostgreSQL
psql postgres

# Create users and grant permissions
CREATE USER ubuntu_dev WITH PASSWORD 'password';
CREATE USER safegrid_dev WITH PASSWORD 'password';

GRANT ALL PRIVILEGES ON DATABASE ubuntu_pools_dev TO ubuntu_dev;
GRANT ALL PRIVILEGES ON DATABASE safegrid_dev TO safegrid_dev;

ALTER USER ubuntu_dev CREATEDB;
ALTER USER safegrid_dev CREATEDB;

\q
```

#### Run Ubuntu Pools Migrations

```bash
cd ubuntu-pools

# Install dependencies
bun install

# Generate and run migrations
bunx drizzle-kit generate
bunx drizzle-kit push

# Seed initial data (if available)
bun run db:seed
```

#### Run SafeGrid Migrations

```bash
cd ../safegrid

# Apply SafeGrid schema from integration guide
psql -d safegrid_dev -f sql/migrations/0001_safegrid_schema.sql

# Verify schema
psql -d safegrid_dev -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'safegrid';"
```

### Option 2: Docker Compose (Alternative)

Create `docker-compose.yml` in the root development directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Create `init-db.sql`:

```sql
-- Create databases
CREATE DATABASE ubuntu_pools_dev;
CREATE DATABASE safegrid_dev;

-- Create users
CREATE USER ubuntu_dev WITH PASSWORD 'password';
CREATE USER safegrid_dev WITH PASSWORD 'password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ubuntu_pools_dev TO ubuntu_dev;
GRANT ALL PRIVILEGES ON DATABASE safegrid_dev TO safegrid_dev;
```

Start services:
```bash
docker-compose up -d
```

## Redis Setup

### Local Redis Installation

**macOS:**
```bash
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo systemctl start redis-server
```

### Verify Redis Connection

```bash
redis-cli ping
# Should respond: PONG
```

### Redis Configuration (Optional)

Create `redis.conf` for development:

```conf
# Basic development config
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 300
daemonize no
loglevel notice
databases 16
save 900 1
save 300 10
save 60 10000
```

## Authentication Setup

### Clerk Configuration

1. **Create Clerk Application**
   - Go to https://clerk.com
   - Create new application: "Ubuntu Ecosystem Dev"
   - Choose "Sign in + Sign up" mode

2. **Configure Sign-in/Sign-up URLs**
   - Home URL: `http://localhost:3000`
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in URL: `http://localhost:3000`
   - After sign-up URL: `http://localhost:3000`

3. **Get API Keys**
   - Copy `CLERK_SECRET_KEY` (sk_test_...)
   - Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_test_...)

4. **Configure JWT Templates (Optional)**
   - Add custom claims for Ubuntu Score integration

### Service Account Setup

For SafeGrid API-to-API communication:

```bash
# Generate a service account key (simple approach for dev)
openssl rand -base64 32
# Output: something like: 8V7wJ8HqP2nQX5rKvY4mNzLxT3gF9pD1sW6cB2aE4=
```

## Ubuntu Pools Setup

### 1. Install Dependencies

```bash
cd ubuntu-pools
bun install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Database Setup

```bash
# Run migrations
bunx drizzle-kit push

# Generate types
bunx drizzle-kit generate

# (Optional) Seed data
bun run db:seed
```

### 4. Build and Verify

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Build
bun run build
```

### 5. Start Development Server

```bash
bun run dev
```

Expected output:
```
▲ Next.js 16.x.x
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 2.3s
```

## SafeGrid Setup

### 1. Install Go Dependencies

```bash
cd ../safegrid

# Initialize Go module (if not already done)
go mod init github.com/your-org/safegrid-brain-api

# Install dependencies
go mod tidy

# Verify dependencies
go list -m all
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Database Migration

```bash
# Apply SafeGrid schema (from integration guide)
psql -d safegrid_dev -f sql/migrations/0001_safegrid_schema.sql

# Verify tables
psql -d safegrid_dev -c "SELECT * FROM information_schema.tables WHERE table_schema = 'safegrid';"
```

### 4. Build and Test

```bash
# Run tests
go test ./...

# Build binary
go build -o bin/safegrid ./cmd/server

# Verify build
./bin/safegrid --help
```

### 5. Start SafeGrid Server

```bash
# Development mode with hot reload (if using air)
air

# Or direct run
go run cmd/server/main.go
```

Expected output:
```
2026/03/31 23:08:53 SafeGrid Brain API starting on port 8080
```

## Running Both Services

### Method 1: Terminal Tabs/Windows

#### Terminal 1: Ubuntu Pools
```bash
cd ubuntu-pools
bun run dev
```

#### Terminal 2: SafeGrid
```bash
cd safegrid
go run cmd/server/main.go
```

### Method 2: tmux Session (Recommended)

```bash
# Install tmux if needed
brew install tmux  # macOS
sudo apt install tmux  # Ubuntu

# Create new tmux session
tmux new -s ubuntu-dev

# Split window vertically
Ctrl-b %

# In left pane: Ubuntu Pools
cd ubuntu-pools
bun run dev

# In right pane: SafeGrid
cd ../safegrid
go run cmd/server/main.go

# Detach: Ctrl-b d
# Reattach: tmux attach -t ubuntu-dev
```

### Method 3: Docker Compose (Advanced)

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  ubuntu-pools:
    build:
      context: ./ubuntu-pools
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./ubuntu-pools:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgresql://ubuntu_dev:password@postgres:5432/ubuntu_pools_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  safegrid:
    build:
      context: ./safegrid
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - ./safegrid:/app
    environment:
      - DATABASE_URL=postgresql://safegrid_dev:password@postgres:5432/safegrid_dev
      - REDIS_URL=redis://redis:6379
      - UBUNTU_POOLS_API_URL=http://ubuntu-pools:3000
    depends_on:
      - postgres
      - redis
      - ubuntu-pools

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Method 4: VS Code Multi-Terminal

Use VS Code's integrated terminal with multiple terminals:

1. Open Ubuntu Pools in VS Code
2. Terminal → New Terminal (Ubuntu Pools)
3. Terminal → New Terminal (SafeGrid)
4. Run respective dev commands

## Integration Testing

### 1. Health Checks

#### Ubuntu Pools Health
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","database":"connected","redis":"connected"}
```

#### SafeGrid Health
```bash
curl http://localhost:8080/api/v1/health
# Expected: {"status":"healthy","database":"connected","redis":"connected"}
```

### 2. End-to-End Integration Test

#### Create Test User and Stake
```bash
# 1. Create user via Ubuntu Pools UI
# 2. Create SafeStake
curl -X POST http://localhost:3000/api/safestakes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 75}'  # 75% of Ubuntu Score for self-vouch

# 3. Verify Redis cache
redis-cli GET "safegrid:suppression:t3:USER_ID"
# Expected: "\"SELF_STAKE_VOUCH\""
```

#### Test Alert Suppression
```bash
# 1. Send test alert to SafeGrid
curl -X POST http://localhost:8080/api/v1/alerts/evaluate \
  -H "Content-Type: application/json" \
  -H "X-API-Version: 2026-03-27" \
  -d '{
    "id": "test-alert-123",
    "userId": "USER_ID",
    "category": "MinorAnomalousActivity",
    "riskLevel": 1,
    "metadata": {"source": "test"}
  }'

# Expected: {"suppressed": true, "reason": "vouch_SELF_STAKE_VOUCH"}
```

#### Test Steward Vouching
```bash
# 1. Create Steward user
# 2. Grant Steward authority in database
# 3. Create vouch
curl -X POST http://localhost:8080/api/v1/stewards/vouch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STEWARD_JWT_TOKEN" \
  -d '{
    "member_id": "MEMBER_USER_ID",
    "reason": "Trusted community member",
    "duration_minutes": 30
  }'

# 4. Verify vouch in Redis
redis-cli GET "safegrid:suppression:t3:MEMBER_USER_ID"
```

### 3. Automated Integration Tests

Create `integration_test.go` in SafeGrid:

```go
package integration

import (
    "context"
    "net/http"
    "testing"
    "time"
)

func TestFullIntegration(t *testing.T) {
    // Test Ubuntu Pools API connectivity
    resp, err := http.Get("http://localhost:3000/api/health")
    if err != nil || resp.StatusCode != 200 {
        t.Fatalf("Ubuntu Pools not accessible: %v", err)
    }

    // Test SafeGrid suppression with vouched user
    // ... implementation
}

func TestSelfStakeVouch(t *testing.T) {
    // Create stake via Ubuntu Pools API
    // Verify Redis cache is set
    // Test alert suppression
    // ... implementation
}
```

Run integration tests:
```bash
cd safegrid
go test -tags=integration ./...
```

## Development Workflow

### 1. Daily Development Cycle

```bash
# Start both services
tmux new-session -d -s dev
tmux split-window -h
tmux select-pane -t 0
tmux send-keys 'cd ubuntu-pools && bun run dev' C-m
tmux select-pane -t 1
tmux send-keys 'cd safegrid && go run cmd/server/main.go' C-m
tmux attach-session -t dev
```

### 2. Making Changes

#### Frontend Changes (Ubuntu Pools)
```bash
cd ubuntu-pools

# Make changes to React components
vim src/components/SafeStakesForm.tsx

# Type check
bun run typecheck

# Test changes
# Browser: http://localhost:3000
```

#### Backend Changes (SafeGrid)
```bash
cd safegrid

# Make changes to Go handlers
vim pkg/handlers/vouch.go

# Run tests
go test ./pkg/handlers/...

# Hot reload with air (if configured)
```

### 3. Database Schema Changes

#### Ubuntu Pools Schema
```bash
cd ubuntu-pools

# Modify schema
vim src/db/schema.ts

# Generate migration
bunx drizzle-kit generate

# Apply migration
bunx drizzle-kit push

# Regenerate types
bunx drizzle-kit generate
```

#### SafeGrid Schema
```bash
cd safegrid

# Modify SQL migration
vim sql/migrations/0002_new_feature.sql

# Apply migration
psql -d safegrid_dev -f sql/migrations/0002_new_feature.sql
```

### 4. Cross-Service Communication

#### Testing API Calls
```bash
# Ubuntu Pools calling SafeGrid
curl -X POST http://localhost:8080/api/v1/alerts/evaluate \
  -H "X-API-Version: 2026-03-27" \
  -d '{"userId":"test","category":"test"}'

# SafeGrid calling Ubuntu Pools
curl http://localhost:3000/api/trust/score/test-user-id \
  -H "Authorization: Bearer dev_service_key"
```

### 5. Logging and Debugging

#### Ubuntu Pools Logs
```bash
cd ubuntu-pools
bun run dev  # Logs appear in terminal
```

#### SafeGrid Logs
```bash
cd safegrid
go run cmd/server/main.go  # Structured JSON logs
```

#### Database Queries
```bash
# Ubuntu Pools DB
psql ubuntu_pools_dev
SELECT * FROM stakes LIMIT 5;

# SafeGrid DB
psql safegrid_dev
SELECT * FROM safegrid.suppression_alerts LIMIT 5;
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8080
lsof -i :5432
lsof -i :6379

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U ubuntu_dev -d ubuntu_pools_dev

# Check PostgreSQL logs
tail -f /usr/local/var/log/postgresql.log  # macOS
tail -f /var/log/postgresql/postgresql-15-main.log  # Ubuntu
```

#### 3. Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
tail -f /usr/local/var/log/redis.log  # macOS
tail -f /var/log/redis/redis-server.log  # Ubuntu
```

#### 4. Authentication Issues
```bash
# Verify Clerk keys
curl -H "Authorization: Bearer YOUR_JWT" \
     https://api.clerk.com/v1/users

# Check JWT token
# Use https://jwt.io to decode and verify
```

#### 5. CORS Issues
```bash
# Add to Ubuntu Pools next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'http://localhost:8080' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,X-API-Version' },
      ],
    },
  ];
}
```

#### 6. Hot Reload Not Working

**Ubuntu Pools:**
```bash
# Clear Next.js cache
rm -rf .next
bun run dev
```

**SafeGrid:**
```bash
# Install air for hot reload
go install github.com/cosmtrek/air@latest

# Create .air.toml
[build]
  cmd = "go build -o ./tmp/main ."
  bin = "./tmp/main"
  full_bin = "./tmp/main"
  include_ext = ["go", "tpl", "tmpl", "html"]
  kill_delay = "100ms"

# Run with air
air
```

### Performance Issues

#### Memory Usage
```bash
# Monitor memory usage
htop  # or Activity Monitor on macOS

# Check Go garbage collection
GODEBUG=gctrace=1 go run cmd/server/main.go
```

#### Database Performance
```bash
# Check slow queries
psql ubuntu_pools_dev -c "SELECT * FROM pg_stat_activity;"

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM stakes WHERE user_id = 'test-id';
```

### Network Issues

#### DNS Resolution
```bash
# Test connectivity
ping localhost
curl http://localhost:3000
curl http://localhost:8080
```

#### Firewall Issues
```bash
# Check firewall status
sudo ufw status  # Ubuntu
sudo pfctl -s info  # macOS with pf
```

## Advanced Configuration

### 1. VS Code Setup

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Ubuntu Pools",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/ubuntu-pools/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/ubuntu-pools",
      "console": "integratedTerminal"
    },
    {
      "name": "SafeGrid",
      "type": "go",
      "request": "launch",
      "mode": "debug",
      "program": "${workspaceFolder}/safegrid/cmd/server/main.go",
      "cwd": "${workspaceFolder}/safegrid",
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. IDE Integration

#### GoLand/IntelliJ IDEA
- Import SafeGrid as Go module
- Configure run configurations for both services
- Enable Go plugin for debugging

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-nextjs",
    "golang.Go",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-postgresql"
  ]
}
```

### 3. Environment Management

#### direnv Setup
```bash
# Install direnv
brew install direnv  # macOS
sudo apt install direnv  # Ubuntu

# Add to ~/.bashrc or ~/.zshrc
eval "$(direnv hook bash)"  # or zsh

# Create .envrc in ubuntu-ecosystem-dev
echo 'export DATABASE_URL=postgresql://ubuntu_dev:password@localhost:5432/ubuntu_pools_dev' > .envrc
echo 'export REDIS_URL=redis://localhost:6379' >> .envrc

# Allow .envrc
direnv allow
```

### 4. Testing Infrastructure

#### Test Database Setup
```bash
# Create test databases
createdb ubuntu_pools_test
createdb safegrid_test

# Run tests with test DB
DATABASE_URL=postgresql://ubuntu_dev:password@localhost:5432/ubuntu_pools_test bun test
DATABASE_URL=postgresql://safegrid_dev:password@localhost:5432/safegrid_test go test ./...
```

### 5. CI/CD Pipeline

Create GitHub Actions workflow for both repos:

```yaml
# .github/workflows/integration-test.yml
name: Integration Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine

    steps:
    - uses: actions/checkout@v3

    - name: Setup Ubuntu Pools
      run: |
        cd ubuntu-pools
        bun install
        bun run typecheck
        bun run lint

    - name: Setup SafeGrid
      run: |
        cd safegrid
        go mod tidy
        go test ./...

    - name: Run Integration Tests
      run: |
        # Start services in background
        cd ubuntu-pools && bun run dev &
        cd safegrid && go run cmd/server/main.go &
        sleep 10
        # Run integration tests
        go test -tags=integration ./...
```

## 🧪 Testing Advanced Features

### Games Engine Testing

```bash
# Start a game session
curl -X POST http://localhost:3000/api/games/session \
  -H "Content-Type: application/json" \
  -d '{"gameId":"ubuntu_monopoly","memberId":"test-user"}'

# Submit behavioral signals
curl -X POST http://localhost:3000/api/games/telemetry \
  -H "Content-Type: application/json" \
  -d '{"memberId":"test-user","sessionId":"session-123","gameId":"ubuntu_monopoly","signals":[{"type":"risk_appetite","value":75}]}'

# Get prestige score
curl http://localhost:3000/api/games/prestige/test-user

# Erase game history (POPIA compliance)
curl -X POST http://localhost:3000/api/sovereignty/erase-games \
  -H "Content-Type: application/json" \
  -d '{"memberId":"test-user"}'
```

### Multi-Factor Sybil Defense Testing

```bash
# Test temporal verification (30-day requirement)
curl -X POST http://localhost:3000/api/games/telemetry \
  -H "Content-Type: application/json" \
  -d '{"memberId":"test-user","sessionId":"session-123","gameId":"ubuntu_monopoly","newMember":true}'

# Test behavioral verification
curl -X POST http://localhost:3000/api/games/telemetry \
  -H "Content-Type: application/json" \
  -d '{"memberId":"experienced-user","sessionId":"session-456","gameId":"ubuntu_monopoly","consistentPlay":true}'

# Test social verification
curl -X POST http://localhost:3000/api/games/telemetry \
  -H "Content-Type: application/json" \
  -d '{"memberId":"village-member","sessionId":"session-789","gameId":"ubuntu_monopoly","hasEndorsements":true}'
```

### Dynamic Governance Testing

```bash
# Test small village quorum (30%)
curl -X POST http://localhost:5000/api/governance/propose \
  -H "Content-Type: application/json" \
  -d '{"villageId":"small-village","proposal":"test","actorId":"guardian-1"}'

# Test large village quorum (60%)
curl -X POST http://localhost:5000/api/governance/propose \
  -H "Content-Type: application/json" \
  -d '{"villageId":"large-village","proposal":"test","actorId":"guardian-1"}'
```

### Emergency Protocol Testing

```bash
# Test Archivist freeze (requires Archivist status)
curl -X POST http://localhost:5000/api/governance/emergency-freeze \
  -H "Content-Type: application/json" \
  -d '{"archivistId":"archivist-1","reason":"Test emergency","duration":3600000}'

# Test community reset
curl -X POST http://localhost:5000/api/governance/community-reset \
  -H "Content-Type: application/json" \
  -d '{"villageId":"test-village","proposalId":"controversial-123","coolingPeriod":172800000}'
```

### Cache Performance Testing

```bash
# Test cache warming
curl http://localhost:5000/api/cache/warm-behavioral-scores

# Test invalidation hooks
curl -X POST http://localhost:5000/api/events/trigger \
  -H "Content-Type: application/json" \
  -d '{"type":"promotion.created","entityId":"user-123"}'

# Monitor cache stats
curl http://localhost:5000/api/cache/stats
```

### WebSocket Optimization Testing

```bash
# Test connection pooling limits
# Open multiple browser tabs to localhost:5000 and monitor connection count
curl http://localhost:5000/api/websocket/health

# Test message batching (send rapid promotion notifications)
curl -X POST http://localhost:5000/api/games/session-complete \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"batch-test-1","memberId":"user-1","achievements":["novice_promotion"]}'
```

## Quick Start Commands

```bash
# One-time setup
git clone https://github.com/your-org/ubuntu-pools.git ubuntu-pools
git clone https://github.com/your-org/safegrid-brain-api.git safegrid
cd ubuntu-pools && bun install
cd ../safegrid && go mod tidy

# Database setup
createdb ubuntu_pools_dev && createdb safegrid_dev
psql -c "CREATE USER ubuntu_dev WITH PASSWORD 'password';"
psql -c "CREATE USER safegrid_dev WITH PASSWORD 'password';"
# Run migrations...

# Daily development
tmux new-session -d -s dev
tmux split-window -h
tmux select-pane -t 0
tmux send-keys 'cd ubuntu-pools && bun run dev' C-m
tmux select-pane -t 1
tmux send-keys 'cd safegrid && go run cmd/server/main.go' C-m
tmux attach-session -t dev
```

This setup enables seamless development and testing of the integrated Ubuntu Pools and SafeGrid ecosystem, ensuring the trust-based security model functions correctly across both services.