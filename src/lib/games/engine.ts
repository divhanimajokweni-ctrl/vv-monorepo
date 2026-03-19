/**
 * Ubuntu Pools Games Engine — Core
 * Manages session lifecycle, event emission, and state transitions.
 * All game events are first-class Ubuntu platform events: hashed, signed, immutable.
 */
import crypto from 'crypto';
import { db } from '@/db/client';
import { gameSessions, gameEvents, type GameSession } from '@/db/schema-games';
import { eq, and } from 'drizzle-orm';
import { createEventEmitter } from '@/lib/events/emitter';

let eventEmitter: ReturnType<typeof createEventEmitter> | null = null;
function getEventEmitter() {
  if (!eventEmitter) eventEmitter = createEventEmitter(db);
  return eventEmitter;
}

import type {
  GameId, GameState, GameDecision, GameEventRecord, StartSessionResponse
} from './types';
import { extractSignals } from './telemetry';
import { awardPrestige } from './scoring';
import { GAME_DEFINITIONS } from './registry';
 
// ── Session Lifecycle ──────────────────────────────────────────────────────────
 
export async function startSession(
  memberId: string,
  gameId: GameId,
  options: { villageId?: string; isMultiplayer?: boolean } = {}
): Promise<StartSessionResponse> {
  const definition = GAME_DEFINITIONS[gameId];
  if (!definition) throw new Error(`Unknown game: ${gameId}`);
 
  const initialState = buildInitialState(gameId);
 
  const [session] = await db.insert(gameSessions).values({
    memberId,
    gameId,
    status: 'active',
    stateSnapshot: initialState,
    isMultiplayer: options.isMultiplayer ?? false,
    villageId: options.villageId,
  }).returning();
 
   // Emit platform-level event
   await getEventEmitter().emit({
     eventType: 'games.session_started',
     actorId: session.memberId,
     entityId: session.id,
     entityType: 'game_session',
     payload: { sessionId: session.id, memberId, gameId, villageId: options.villageId, source: 'games_engine' },
     occurredAt: new Date().toISOString(),
   });
 
  return { session: session as unknown as GameSession, initialState };
}
 
export async function submitAction(
  sessionId: string,
  memberId: string,
  action: { type: string; payload: Record<string, unknown> }
): Promise<{ newState: GameState; completed: boolean }> {
  const session = await db.query.gameSessions.findFirst({
    where: and(eq(gameSessions.id, sessionId), eq(gameSessions.memberId, memberId)),
  });
 
  if (!session)        throw new Error('Session not found');
  if (session.status !== 'active') throw new Error(`Session is ${session.status}`);
 
  const currentState = session.stateSnapshot as GameState;
 
  // Get the game-specific processor
  const { processAction } = await import(`./games/${session.gameId}`);
  const { newState, decision } = await processAction(currentState, action);
 
  // Append event to game log
  const sequence   = (currentState.events?.length ?? 0) + 1;
  const eventPayload = { action, decision, roundAfter: newState.round };
  const hash       = hashGameEvent(sessionId, sequence, eventPayload);
 
  await db.insert(gameEvents).values({
    sessionId,
    memberId,
    sequence,
    eventType: action.type,
    payload:   eventPayload,
    hash,
  });
 
  const completed = newState.round >= newState.maxRounds || newState.phase === 'ended';
 
  if (completed) {
    await completeSession(session.id, memberId, session.gameId as GameId, newState);
  } else {
    await db.update(gameSessions)
      .set({ stateSnapshot: newState, updatedAt: new Date() })
      .where(eq(gameSessions.id, sessionId));
  }
 
  return { newState, completed };
}
 
async function completeSession(
  sessionId: string,
  memberId: string,
  gameId: GameId,
  finalState: GameState
): Promise<void> {
  const startTime  = Date.now();
  const signals    = await extractSignals(memberId, sessionId, gameId, finalState);
  const { total }  = await awardPrestige(memberId, sessionId, gameId, finalState, signals);
 
  await db.update(gameSessions).set({
    status: 'completed',
    completedAt: new Date(),
    durationMs:  Date.now() - startTime,
    finalScore:  finalState.score,
    prestigeAwarded: total,
    stateSnapshot: finalState,
    updatedAt: new Date(),
  }).where(eq(gameSessions.id, sessionId));
 
   await getEventEmitter().emit({
     eventType: 'games.session_completed',
     actorId: memberId,
     entityId: sessionId,
     entityType: 'game_session',
     payload: { sessionId, memberId, gameId, finalScore: finalState.score, prestigeAwarded: total, signalCount: signals.length, source: 'games_engine' },
     occurredAt: new Date().toISOString(),
   });
}
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function hashGameEvent(
  sessionId: string,
  sequence: number,
  payload: unknown
): string {
  const data = JSON.stringify({ sessionId, sequence, payload });
  return crypto.createHash('sha256').update(data).digest('hex');
}
 
function buildInitialState(gameId: GameId): GameState {
  const bases: Record<GameId, Partial<GameState>> = {
    ubuntu_monopoly:  { maxRounds: 20, phase: 'property_phase', data: { properties: [], villagefund: 0, syndicates: [] } },
    pool_simulator:   { maxRounds: 12, phase: 'setup',          data: { members: [], buffer: 0, health: 100 } },
    credit_ladder:    { maxRounds: 15, phase: 'deal',           data: { hand: [], creditScore: 500, debt: 0 } },
    the_commons:      { maxRounds: 10, phase: 'harvest',        data: { commons: 100, players: [], agreements: [] } },
    market_maker:     { maxRounds: 8,  phase: 'demand_gather',  data: { demand: [], suppliers: [], budget: 10000 } },
  };
 
  return {
    round:     1,
    score:     0,
    decisions: [],
    events:    [],
    ...bases[gameId],
  } as GameState;
}
