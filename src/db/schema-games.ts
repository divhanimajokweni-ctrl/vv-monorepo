/**
 * Ubuntu Pools — Games Module Database Schema
 * Phase 15: Financial Intelligence Arcade
 *
 * DESIGN DECISION: Games NEVER modify the real Ubuntu Score directly.
 * Prestige Points live here, feeding upward as a bonus signal only.
 * Pool payout positions are constitutionally protected and unreferenceable here.
 */
import {
  pgTable, uuid, varchar, integer, smallint, text,
  timestamp, jsonb, boolean, index, pgEnum
} from 'drizzle-orm/pg-core';
 
// ── Enums ─────────────────────────────────────────────────────────────────────
 
export const gameIdEnum = pgEnum('game_id', [
  'ubuntu_monopoly',
  'pool_simulator',
  'credit_ladder',
  'the_commons',
  'market_maker',
]);
 
export const gameStatusEnum = pgEnum('game_status', [
  'waiting',
  'active',
  'paused',
  'completed',
  'abandoned',
]);
 
export const signalTypeEnum = pgEnum('signal_type', [
  'risk_appetite',
  'cooperative_quotient',
  'stress_response',
  'overextension',
  'leadership_index',
  'knowledge_score',
]);
 
// ── Tables ────────────────────────────────────────────────────────────────────
 
/**
 * Game Sessions — one row per play-through
 */
export const gameSessions = pgTable('game_sessions', {
  id:          uuid('id').defaultRandom().primaryKey(),
  memberId:    varchar('member_id', { length: 255 }).notNull(),
  gameId:      gameIdEnum('game_id').notNull(),
  status:      gameStatusEnum('status').default('waiting').notNull(),
  startedAt:   timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationMs:  integer('duration_ms'),
 
  /** Serialised game state snapshot — enables pause/resume */
  stateSnapshot: jsonb('state_snapshot'),
 
  /** Final score within the game (game-internal metric, not Prestige) */
  finalScore:  integer('final_score'),
 
  /** Prestige Points awarded at session end */
  prestigeAwarded: integer('prestige_awarded').default(0).notNull(),
 
  /** Was this a solo or multiplayer session? */
  isMultiplayer: boolean('is_multiplayer').default(false).notNull(),
 
  /** Village context — null for solo sessions */
  villageId:   varchar('village_id', { length: 255 }),
 
  metadata:    jsonb('metadata'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  memberIdx:  index('game_sessions_member_idx').on(t.memberId),
  gameIdx:    index('game_sessions_game_idx').on(t.gameId),
  statusIdx:  index('game_sessions_status_idx').on(t.status),
  villageIdx: index('game_sessions_village_idx').on(t.villageId),
}));
 
/**
 * Game Events — append-only log of every in-game action
 * Mirrors the platform's event sourcing architecture
 */
export const gameEvents = pgTable('game_events', {
  id:         uuid('id').defaultRandom().primaryKey(),
  sessionId:  uuid('session_id').notNull().references(() => gameSessions.id),
  memberId:   varchar('member_id', { length: 255 }).notNull(),
  sequence:   integer('sequence').notNull(),
  eventType:  varchar('event_type', { length: 100 }).notNull(),
  payload:    jsonb('payload').notNull(),
 
  /** SHA-256 of (sessionId + sequence + payload) for integrity */
  hash:       varchar('hash', { length: 64 }).notNull(),
 
  createdAt:  timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  sessionIdx:  index('game_events_session_idx').on(t.sessionId),
  memberIdx:   index('game_events_member_idx').on(t.memberId),
  seqIdx:      index('game_events_seq_idx').on(t.sessionId, t.sequence),
}));
 
/**
 * Prestige Scores — the game-native reputation metric
 * NEVER decremented by game losses. Only upward.
 */
export const prestigeScores = pgTable('prestige_scores', {
  id:          uuid('id').defaultRandom().primaryKey(),
  memberId:    varchar('member_id', { length: 255 }).notNull().unique(),
  totalPoints: integer('total_points').default(0).notNull(),
  level:       smallint('level').default(1).notNull(),
 
  /** Per-game breakdown */
  byGame:      jsonb('by_game').default({}).notNull(),
 
  /** Contribution to Ubuntu Score bonus (0-5 range, capped) */
  ubuntuBonus: smallint('ubuntu_bonus').default(0).notNull(),
 
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (t) => ({
  memberIdx: index('prestige_scores_member_idx').on(t.memberId),
}));
 
/**
 * Prestige Ledger — immutable record of every award
 */
export const prestigeLedger = pgTable('prestige_ledger', {
  id:          uuid('id').defaultRandom().primaryKey(),
  memberId:    varchar('member_id', { length: 255 }).notNull(),
  sessionId:   uuid('session_id').references(() => gameSessions.id),
  points:      integer('points').notNull(),
  reason:      varchar('reason', { length: 255 }).notNull(),
  description: text('description'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  memberIdx: index('prestige_ledger_member_idx').on(t.memberId),
}));
 
/**
 * Behavioural Telemetry — Lindiwe intelligence signals
 * POPIA: members can request erasure; signals are derived, not raw
 */
export const gameTelemetry = pgTable('game_telemetry', {
  id:          uuid('id').defaultRandom().primaryKey(),
  memberId:    varchar('member_id', { length: 255 }).notNull(),
  sessionId:   uuid('session_id').notNull().references(() => gameSessions.id),
  signalType:  signalTypeEnum('signal_type').notNull(),
 
  /** Normalised 0.0–1.0 signal value */
  value:       integer('value').notNull(), // stored as 0–100 integer
 
  confidence:  smallint('confidence').notNull(), // 0–100
  gameId:      gameIdEnum('game_id').notNull(),
 
  /** Consent gate — member must opt in to telemetry sharing with Lindiwe */
  consentGiven: boolean('consent_given').default(false).notNull(),
 
  /** Sovereignty: can be soft-deleted (signal nulled, record kept for audit) */
  erased:      boolean('erased').default(false).notNull(),
 
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  memberIdx:  index('game_telemetry_member_idx').on(t.memberId),
  signalIdx:  index('game_telemetry_signal_idx').on(t.signalType),
  gameIdx:    index('game_telemetry_game_idx').on(t.gameId),
  // Performance optimization: composite indexes for common query patterns
  memberSessionTimestampIdx: index('game_telemetry_member_session_timestamp_idx').on(t.memberId, t.sessionId, t.createdAt.desc()),
  signalTypeTimestampIdx: index('game_telemetry_signal_timestamp_idx').on(t.signalType, t.createdAt.desc()),
  gameMemberIdx: index('game_telemetry_game_member_idx').on(t.gameId, t.memberId),
  confidenceIdx: index('game_telemetry_confidence_idx').on(t.confidence.desc()),
}));
 
/**
 * Village Tournaments — seasonal inter-village competitions
 */
export const villageTournaments = pgTable('village_tournaments', {
  id:          uuid('id').defaultRandom().primaryKey(),
  name:        varchar('name', { length: 255 }).notNull(),
  gameId:      gameIdEnum('game_id').notNull(),
  startDate:   timestamp('start_date').notNull(),
  endDate:     timestamp('end_date').notNull(),
  status:      varchar('status', { length: 50 }).default('upcoming').notNull(),
  participants: jsonb('participants').default([]).notNull(), // [{villageId, score}]
  winnerId:    varchar('winner_id', { length: 255 }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});
 
import type { GameState } from '@/lib/games/types';

export type GameSession = Omit<typeof gameSessions.$inferSelect, 'completedAt' | 'durationMs' | 'finalScore' | 'villageId' | 'metadata' | 'stateSnapshot'> & {
  completedAt: Date | undefined;
  durationMs: number | undefined;
  finalScore: number | undefined;
  villageId: string | undefined;
  metadata: unknown | undefined;
  stateSnapshot: GameState | undefined;
};
export type GameSessionInsert = typeof gameSessions.$inferInsert;
export type GameEvent        = typeof gameEvents.$inferSelect;
export type PrestigeScore    = typeof prestigeScores.$inferSelect;
export type GameTelemetry    = typeof gameTelemetry.$inferSelect;
