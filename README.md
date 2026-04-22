# VV Monorepo

A comprehensive full-stack monorepo implementing the VV Security Spine with Ubuntu Pools, SafeGrid, Loss Velocity Engine, and SafeKrypte HSM integration.

## Architecture

### Core Components

- **Security Spine**: Multi-layered security architecture
- **Ubuntu Pools API**: REST API for pool management and contributions
- **SafeGrid**: Deduplication and threat detection engine
- **Loss Velocity Engine**: Risk assessment and velocity analysis
- **SafeKrypte**: HSM client for secure key management
- **SafeGrid Relay (Go)**: High-performance relay processor

### Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Monorepo**: Turbo for build orchestration
- **Infrastructure**: Docker, Docker Compose
- **Go Services**: Native Go for performance-critical components

## Quick Start

### Prerequisites

- Node.js ≥ 20
- Docker & Docker Compose
- Go ≥ 1.23 (for SafeGrid Relay)

### Setup

1. **Clone and setup:**

   ```bash
   git clone <repository-url>
   cd vv-monorepo
   bash infra/scripts/setup.sh
   ```

2. **Verify GATE-1:**

   ```bash
   export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vv_dev
   bash infra/scripts/gate1.sh
   ```

3. **Start development:**

   ```bash
   npm run dev
   ```

4. **Health check:**
   ```bash
   npm run health
   ```

### Production Deployment

1. **Deploy to Vercel:**
   - Push to `main` branch
   - GitHub Actions will automatically deploy
   - Set environment variables in Vercel dashboard

2. **Verify GATE-2:**
   ```bash
   export HEALTH_URL=https://your-pools-api.vercel.app/api/health
   bash infra/scripts/gate2.sh
   ```

## API Documentation

### Ubuntu Pools API

Base URL: `http://localhost:3001/api`

#### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "username",
  "firstName": "First",
  "lastName": "Last"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Pools

```bash
# Get all pools
GET /api/pools

# Create pool
POST /api/pools
Authorization: Bearer <token>
{
  "name": "My Pool",
  "description": "Pool description"
}

# Join pool
POST /api/pools/{poolId}/join
Authorization: Bearer <token>
```

#### Contributions

```bash
# Get pool contributions
GET /api/contributions/pool/{poolId}
Authorization: Bearer <token>

# Create contribution
POST /api/contributions
Authorization: Bearer <token>
{
  "poolId": "pool-uuid",
  "amount": 100.50,
  "contributionType": "deposit"
}
```

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start all services
npm run build        # Build all packages
npm run lint         # Lint all code
npm run test         # Run all tests
npm run typecheck    # TypeScript type checking

# Database
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Drizzle Studio

# Health & Verification
npm run health       # Check API health
```

### Project Structure

```
vv-monorepo/
├── packages/
│   ├── shared-kernel/        # Core types, auth, database
│   ├── safe-krypte/          # HSM client
│   ├── loss-velocity-engine/ # Risk engine
│   └── safegrid/            # Dedup & threat engine
├── apps/
│   ├── ubuntu-pools-api/     # Main REST API
│   ├── lindiwe/             # Web dashboard (scaffolded)
│   └── ubuntu-pools-dashboard/ # Admin dashboard (scaffolded)
├── apps/safegrid-relay-go/   # Go relay service
├── infra/                   # Infrastructure & scripts
└── tests/                   # Integration & E2E tests
```

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting and CORS protection
- Helmet.js security headers
- Input validation and sanitization
- PostgreSQL with pgvector for advanced queries

## Contributing

1. Follow the established code patterns in `packages/shared-kernel`
2. Add tests for new functionality
3. Update documentation
4. Ensure all checks pass: `npm run lint && npm run test && npm run typecheck`

## License

Proprietary - VV LLC
