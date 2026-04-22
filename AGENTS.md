# Ubuntu Pools — AI Agent Guidelines

This file defines the guidelines and context for AI coding assistants working on the Ubuntu Pools platform.

## CORE PRINCIPLES FOR ALL AGENTS

1. **First Principles Focus**: Build for village-scale ROSCA operations with minimal complexity.

2. **Direct Database Operations**: Use Drizzle ORM for simple, direct database interactions.

3. **Clerk Authentication**: All user operations must integrate with Clerk auth.

4. **Payment Processing**: Use Dodo Payments for all financial transactions.

5. **Ubuntu Design System**: Maintain the sage green, ochre, and organic shape aesthetic.

6. **TypeScript First**: All code must be fully typed with TypeScript.

7. **Import Aliases**: Use `@/` prefix for all internal imports (maps to `./src/*`).

8. **Minimal Architecture**: Single Next.js app with 5 database tables - avoid over-engineering.

## ARCHITECTURE OVERVIEW

### Database Schema (5 Tables)
- `users` - Clerk user data
- `villages` - ROSCA groups
- `members` - User-village relationships
- `contributions` - Payment records
- `payouts` - Disbursement tracking

### Core Technologies
- **Frontend**: Next.js 16 with App Router
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk
- **Payments**: Dodo Payments
- **Styling**: Tailwind CSS with custom Ubuntu design system
- **Deployment**: Vercel

### Development Commands
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run typecheck` - Run TypeScript checking
- `bunx drizzle-kit push` - Update database schema