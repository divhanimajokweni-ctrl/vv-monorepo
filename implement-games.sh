#!/usr/bin/env bash
set -e

echo "🎮 Scaffolding Ubuntu Pools Phase 15 — Games Integration"

create_file() {
  if [ ! -f "$1" ]; then
    mkdir -p "$(dirname "$1")"
    echo "$2" > "$1"
    echo "✅ Created $1"
  else
    echo "⚠️ Skipped $1 (already exists)"
  fi
}

# -------------------------------
# Database
# -------------------------------
create_file "src/db/schema-games.ts" \
"// Phase 15 Games Schema
// Prestige, sessions, telemetry
import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const gameSessions = pgTable('game_sessions', {
  id: text('id').primaryKey(),
  memberId: text('member_id').notNull(),
  gameId: text('game_id').notNull(),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
});

export const gameTelemetry = pgTable('game_telemetry', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  signal: jsonb('signal').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const prestigeScores = pgTable('prestige_scores', {
  memberId: text('member_id').primaryKey(),
  total: integer('total').default(0),
});
"

create_file "src/db/migrations/0006_games.sql" \
"-- Phase 15 Games Tables
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_telemetry (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  signal JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestige_scores (
  member_id TEXT PRIMARY KEY,
  total INTEGER DEFAULT 0
);"

# -------------------------------
# Types & Engine
# -------------------------------
create_file "src/lib/games/types.ts" \
"export type GameId =
  | 'ubuntu-monopoly'
  | 'pool-simulator'
  | 'credit-ladder'
  | 'the-commons'
  | 'market-maker';

export interface GameSignal {
  type: string;
  value: number;
}

export interface GameSession {
  sessionId: string;
  memberId: string;
  gameId: GameId;
}
"

create_file "src/lib/games/engine.ts" \
"// Core Game Engine — Phase 15
import { GameSession, GameSignal } from './types';

export class GameEngine {
  static startSession(session: GameSession) {
    return session;
  }

  static emitSignal(signal: GameSignal) {
    return signal;
  }
}
"

create_file "src/lib/games/scoring.ts" \
"// Prestige Score Calculation
export function calculatePrestige(delta: number) {
  if (delta < 0) return 0; // Prestige never decreases
  return delta;
}
"

create_file "src/lib/games/telemetry.ts" \
"// Lindiwe Signal Adapter
import { GameSignal } from './types';

export function mapGameSignalToLindiwe(signal: GameSignal) {
  return {
    behaviouralIndex: signal.type,
    score: signal.value,
  };
}
"

# -------------------------------
# Games
# -------------------------------
for game in ubuntu-monopoly pool-simulator credit-ladder the-commons market-maker; do
  create_file "src/lib/games/games/$game.ts" \
"// $game logic placeholder
export function play() {
  return { completed: true };
}"
done

# -------------------------------
# Service Layer
# -------------------------------
create_file "src/lib/services/game-service.ts" \
"import { GameEngine } from '@/lib/games/engine';

export class GameService {
  static start(data: any) {
    return GameEngine.startSession(data);
  }
}
"

# -------------------------------
# API Routes
# -------------------------------
create_file "src/app/api/games/route.ts" \
"import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'games online' });
}
"

create_file "src/app/api/games/telemetry/route.ts" \
"import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ received: true, body });
}
"

# -------------------------------
# UI
# -------------------------------
create_file "src/app/games/page.tsx" \
"export default function GamesPage() {
  return <h1>Ubuntu Games Dashboard</h1>;
}
"

create_file "src/components/games/GameCard.tsx" \
"export function GameCard({ title }: { title: string }) {
  return <div>{title}</div>;
}
"

# -------------------------------
# Tests
# -------------------------------
create_file "src/tests/games.test.ts" \
"import { describe, it, expect } from 'vitest';
import { calculatePrestige } from '@/lib/games/scoring';

describe('Prestige Scoring', () => {
  it('never decreases', () => {
    expect(calculatePrestige(-10)).toBe(0);
  });
});
"

echo "✅ Phase 15 scaffold complete"