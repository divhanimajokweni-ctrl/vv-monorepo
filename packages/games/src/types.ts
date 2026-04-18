/**
 * Ubuntu Pools Games Module — Type Definitions
 */
 
export type GameId =
  | 'ubuntu_monopoly'
  | 'pool_simulator'
  | 'credit_ladder'
  | 'the_commons'
  | 'market_maker'
  | 'lottery_scenario'
  | 'dice_strategy'
  | 'crop_finance';
 
export type GameStatus = 'waiting' | 'active' | 'paused' | 'completed' | 'abandoned';
 
export type SignalType =
  | 'risk_appetite'
  | 'cooperative_quotient'
  | 'stress_response'
  | 'overextension'
  | 'leadership_index'
  | 'knowledge_score'
  | 'risk_tolerance'
  | 'impulse_index'
  | 'decision_speed'
  | 'planning_horizon';
 
// ── Game Metadata ─────────────────────────────────────────────────────────────
 
export interface GameDefinition {
  id:           GameId;
  name:         string;
  tagline:      string;
  description:  string;
  concepts:     string[];
  signals:      SignalType[];
  minPlayers:   number;
  maxPlayers:   number;
  estimatedMins: number;
  difficulty:   'beginner' | 'intermediate' | 'advanced';
  icon:         string;
  color:        string;
}
 
// ── Session ───────────────────────────────────────────────────────────────────
 
export interface GameSession {
  id:             string;
  memberId:       string;
  gameId:         GameId;
  status:         GameStatus;
  startedAt:      Date;
  completedAt?:   Date;
  durationMs?:    number;
  stateSnapshot?: GameState;
  finalScore?:    number;
  prestigeAwarded: number;
  isMultiplayer:  boolean;
  villageId?:     string;
  metadata?:      unknown;
  createdAt:      Date;
  updatedAt:      Date;
}
 
// ── Game State (generic, each game extends this) ──────────────────────────────
 
export interface GameState {
  round:        number;
  maxRounds:    number;
  score:        number;
  phase:        string;
  data:         Record<string, unknown>;
  decisions:    GameDecision[];
  events:       GameEventRecord[];
}
 
export interface GameDecision {
  round:      number;
  type:       string;
  choice:     string;
  outcome:    'positive' | 'negative' | 'neutral';
  reasoning?: string;
  timestamp:  number;
}
 
export interface GameEventRecord {
  sequence:  number;
  type:      string;
  payload:   Record<string, unknown>;
  hash:      string;
  timestamp: number;
}
 
// ── Telemetry ─────────────────────────────────────────────────────────────────
 
export interface BehaviouralSignal {
  type:       SignalType;
  value:      number;   // 0–100
  confidence: number;   // 0–100
  gameId:     GameId;
  rationale:  string;
}
 
export interface SessionTelemetry {
  sessionId: string;
  memberId:  string;
  gameId:    GameId;
  signals:   BehaviouralSignal[];
  summary:   string;
}
 
// ── Prestige ──────────────────────────────────────────────────────────────────
 
export interface PrestigeAward {
  points:      number;
  reason:      string;
  description: string;
}
 
export interface PrestigeScore {
  memberId:    string;
  total:       number;
  level:       number;
  byGame:      Partial<Record<GameId, number>>;
  ubuntuBonus: number;
}
 
// ── Lindiwe AI Integration ────────────────────────────────────────────────────

/**
 * Game Telemetry Payload — emitted by game engine to Lindiwe
 */
export interface GameTelemetryPayload {
  sessionId: string;
  memberId: string;
  gameId: GameId;
  signals: BehaviouralSignal[];
  consentGiven: boolean;
  timestamp: Date;
  rawEvents: GameEventRecord[];
}

/**
 * Lindiwe Signal — processed output from telemetry processor
 */
export interface LindiweSignal {
  memberId: string;
  source: 'game_telemetry' | 'contribution_history' | 'governance_activity';
  riskTier: 'conservative' | 'moderate' | 'growth';
  riskComponents: {
    riskAppetiteIndex: number;       // 0–100, from game telemetry
    overextensionScore: number;      // 0–100, from Market Maker + Credit Ladder
    stressResponsePattern: number;   // 0–100, from Pool Simulator
    contributionConsistency: number; // 0–100, from ledger history
  };
  creditRecommendation: {
    maxCreditLimit: number;          // ZAR, minor units
    recommendedProduct: 'buffer_loan' | 'microcredit' | 'growth_credit';
    confidence: number;              // 0–1, model certainty
    earlyWarningFlag: boolean;       // pre-default signal
  };
  sovereigntyMetadata: {
    consentVersion: string;
    derivedFrom: 'game_signals';     // never 'raw_game_events'
    erasable: boolean;
  };
  explainability: string;            // Human-readable explanation for POPIA compliance
  generatedAt: Date;
}

/**
 * Credit Signal — final output to credit service
 */
export interface CreditSignal extends LindiweSignal {
  // Inherits all from LindiweSignal, adds any credit-service specific fields if needed
}

// ── API Responses ─────────────────────────────────────────────────────────────
 
export interface StartSessionResponse {
  session: GameSession;
  initialState: GameState;
}
 
export interface SubmitActionResponse {
  session: GameSession;
  newState: GameState;
  signals: BehaviouralSignal[];
  awards:  PrestigeAward[];
}
 
export interface LeaderboardEntry {
  rank:        number;
  memberId:    string;
  displayName: string;
  prestige:    number;
  level:       number;
  gamesPlayed: number;
  villageId?:  string;
}
