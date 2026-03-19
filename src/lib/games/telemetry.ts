/**
 * Ubuntu Pools Games — Lindiwe Telemetry Processor
 * Extracts behavioural signals from game sessions and routes them
 * to the Lindiwe backbone for credit model and governance role scoring.
 *
 * POPIA: All signals are derived, not raw. Members can erase via sovereignty layer.
 * Signals require explicit consent to flow into the Lindiwe credit model.
 */
import { db } from '@/db/client';
import { gameTelemetry } from '@/db/schema-games';
import type { GameId, GameState, BehaviouralSignal, SessionTelemetry, SignalType } from './types';
 
// ── Signal Extractors — one per game ──────────────────────────────────────────
 
type SignalExtractor = (state: GameState) => BehaviouralSignal[];
 
const extractors: Partial<Record<GameId, SignalExtractor>> = {
 
  ubuntu_monopoly: (state) => {
    const decisions  = state.decisions ?? [];
    const total      = decisions.length || 1;
    const syndicates = decisions.filter(d => d.type === 'form_syndicate').length;
    const hoarding   = decisions.filter(d => d.type === 'acquire_to_block').length;
    const sharing    = decisions.filter(d => d.type === 'fund_village').length;
 
    return [
      {
        type:       'cooperative_quotient',
        value:      Math.round(((syndicates + sharing) / total) * 100),
        confidence: Math.min(90, total * 5),
        gameId:     'ubuntu_monopoly',
        rationale:  `${syndicates} syndicate formations, ${sharing} village fund contributions out of ${total} decisions`,
      },
      {
        type:       'risk_appetite',
        value:      Math.round((hoarding / total) * 100),
        confidence: Math.min(80, total * 4),
        gameId:     'ubuntu_monopoly',
        rationale:  `${hoarding} blocking acquisitions indicating competitive vs cooperative orientation`,
      },
    ];
  },
 
  pool_simulator: (state) => {
    const decisions = state.decisions ?? [];
    const total     = decisions.length || 1;
    const extensions   = decisions.filter(d => d.type === 'grant_extension').length;
    const enforcements = decisions.filter(d => d.type === 'enforce_default').length;
    const draws        = decisions.filter(d => d.type === 'draw_buffer').length;
    const leadership   = decisions.filter(d => d.outcome === 'positive' && d.type.startsWith('mediate')).length;
 
    return [
      {
        type:       'stress_response',
        value:      Math.round((extensions / (extensions + enforcements + 1)) * 100),
        confidence: Math.min(95, total * 8),
        gameId:     'pool_simulator',
        rationale:  `${extensions} extensions vs ${enforcements} enforcements under pool stress`,
      },
      {
        type:       'leadership_index',
        value:      Math.round((leadership / total) * 100 + (draws < 3 ? 20 : 0)),
        confidence: Math.min(85, total * 7),
        gameId:     'pool_simulator',
        rationale:  `${leadership} successful mediations, ${draws} buffer draws (conservative = higher score)`,
      },
    ];
  },
 
  credit_ladder: (state) => {
    const decisions  = state.decisions ?? [];
    const overdrawn  = decisions.filter(d => d.type === 'take_loan' && d.outcome === 'negative').length;
    const paid_early = decisions.filter(d => d.type === 'early_repayment').length;
    const min_pays   = decisions.filter(d => d.type === 'minimum_payment').length;
 
    return [
      {
        type:       'overextension',
        value:      Math.round((overdrawn / (decisions.length || 1)) * 100),
        confidence: 85,
        gameId:     'credit_ladder',
        rationale:  `${overdrawn} overextension events in ${decisions.length} turns`,
      },
      {
        type:       'risk_appetite',
        value:      100 - Math.round((paid_early / (decisions.length || 1)) * 100),
        confidence: 80,
        gameId:     'credit_ladder',
        rationale:  `${paid_early} early repayments vs ${min_pays} minimum payments`,
      },
    ];
  },
 
  the_commons: (state) => {
    const decisions  = state.decisions ?? [];
    const restrained = decisions.filter(d => d.choice === 'take_less').length;
    const defected   = decisions.filter(d => d.choice === 'take_max').length;
    const total      = decisions.length || 1;
 
    return [
      {
        type:       'cooperative_quotient',
        value:      Math.round((restrained / total) * 100),
        confidence: Math.min(90, total * 9),
        gameId:     'the_commons',
        rationale:  `Restrained ${restrained} times, defected ${defected} times from commons`,
      },
    ];
  },
 
  market_maker: (state) => {
    const decisions    = state.decisions ?? [];
    const bulk         = decisions.filter(d => d.type === 'bulk_order').length;
    const overcommit   = decisions.filter(d => d.type === 'over_commit').length;
 
    return [
      {
        type:       'cooperative_quotient',
        value:      Math.round((bulk / (decisions.length || 1)) * 100),
        confidence: 75,
        gameId:     'market_maker',
        rationale:  `${bulk} bulk purchasing decisions vs individual orders`,
      },
      {
        type:       'overextension',
        value:      Math.round((overcommit / (decisions.length || 1)) * 100),
        confidence: 80,
        gameId:     'market_maker',
        rationale:  `${overcommit} over-commitment events detected`,
      },
    ];
  },
};
 
// ── Public API ────────────────────────────────────────────────────────────────
 
export async function extractSignals(
  memberId:  string,
  sessionId: string,
  gameId:    GameId,
  state:     GameState
): Promise<BehaviouralSignal[]> {
  const extractor = extractors[gameId];
  if (!extractor) return [];
 
  const signals = extractor(state);
 
  // Persist signals (consent defaults to false until member opts in)
  if (signals.length > 0) {
    await db.insert(gameTelemetry).values(
      signals.map(s => ({
        memberId,
        sessionId,
        signalType:   s.type,
        value:        s.value,
        confidence:   s.confidence,
        gameId:       s.gameId,
        consentGiven: false,
      }))
    );
  }
 
  return signals;
}
 
export async function buildFingerprint(memberId: string): Promise<Record<SignalType, number>> {
  const signals = await db.query.gameTelemetry.findMany({
    where: (t, { eq, and }) => and(eq(t.memberId, memberId), eq(t.consentGiven, true), eq(t.erased, false)),
  });
 
  const aggregated: Partial<Record<SignalType, number[]>> = {};
 
  for (const s of signals) {
    const key = s.signalType as SignalType;
    if (!aggregated[key]) aggregated[key] = [];
    aggregated[key]!.push(s.value);
  }
 
  const result = {} as Record<SignalType, number>;
  for (const [key, values] of Object.entries(aggregated)) {
    result[key as SignalType] = Math.round(
      values!.reduce((a, b) => a + b, 0) / values!.length
    );
  }
 
  return result;
}
