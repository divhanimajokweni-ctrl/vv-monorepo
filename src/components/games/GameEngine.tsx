'use client';
 
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GAME_DEFINITIONS } from '@/lib/games/registry';
import type { GameId, GameState, GameSession } from '@/lib/games/types';
 
interface GameEngineProps { gameId: GameId; }
 
export function GameEngine({ gameId }: GameEngineProps) {
  const router   = useRouter();
  const def      = GAME_DEFINITIONS[gameId];
  const [session,   setSession]   = useState<GameSession | null>(null);
  const [state,     setState]     = useState<GameState | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
 
  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/games/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      const data = await r.json();
      setSession(data.session);
      setState(data.initialState);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [gameId]);
 
  const doAction = useCallback(async (actionType: string, payload: Record<string, unknown> = {}) => {
    if (!session) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/games/sessions/${session.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: actionType, payload }),
      });
      const data = await r.json();
      setState(data.newState);
      if (data.completed) setCompleted(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [session]);
 
  if (!def) return <div className="text-red-400 p-8">Unknown game: {gameId}</div>;
 
  return (
    <div className="min-h-screen bg-[#0D1F16] text-white px-6 py-10 font-serif max-w-3xl mx-auto">
 
      {/* Header */}
      <button onClick={() => router.push('/games')} className="text-[#8A9A8E] text-sm mb-6 hover:text-white transition-colors">
        ← Back to Arcade
      </button>
 
      <div className="flex items-center gap-4 mb-8">
        <span className="text-5xl">{def.icon}</span>
        <div>
          <h1 className="text-3xl font-bold text-[#C8962B]">{def.name}</h1>
          <p className="text-[#8A9A8E] italic">{def.tagline}</p>
        </div>
      </div>
 
      {error && <div className="bg-red-900/40 border border-red-500 rounded-lg p-4 mb-6 text-red-300">{error}</div>}
 
      {/* Start screen */}
      {!session && (
        <div className="rounded-xl border border-[#2E6B4A]/40 bg-[#1B3A2D]/60 p-8 text-center">
          <p className="text-[#8A9A8E] mb-6 max-w-lg mx-auto">{def.description}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {def.concepts.map(c => (
              <span key={c} className="text-xs bg-[#0D1F16] text-[#C8962B] px-3 py-1 rounded-full border border-[#C8962B]/30">{c}</span>
            ))}
          </div>
          <button
            onClick={startGame}
            disabled={loading}
            className="bg-[#C8962B] text-[#0D1F16] px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#FFD580] transition-colors disabled:opacity-50"
          >
            {loading ? 'Starting…' : `Start Game — ${def.estimatedMins} min`}
          </button>
        </div>
      )}
 
      {/* Active game */}
      {session && state && !completed && (
        <div className="space-y-6">
 
          {/* Progress */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#8A9A8E]">Round {state.round} of {state.maxRounds}</span>
            <span className="text-[#C8962B] font-bold">Score: {state.score}</span>
            <span className="text-[#8A9A8E] capitalize">{state.phase.replace(/_/g, ' ')}</span>
          </div>
          <div className="h-1 bg-[#1B3A2D] rounded-full">
            <div
              className="h-full bg-[#C8962B] rounded-full transition-all duration-500"
              style={{ width: `${(state.round / state.maxRounds) * 100}%` }}
            />
          </div>
 
          {/* Game state display */}
          <div className="rounded-xl border border-[#2E6B4A]/40 bg-[#1B3A2D]/60 p-6">
            <h3 className="text-[#C8962B] font-semibold mb-3">Current State</h3>
            <pre className="text-[#8A9A8E] text-xs overflow-auto max-h-40">
              {JSON.stringify(state.data, null, 2)}
            </pre>
          </div>
 
          {/* Action buttons (game-specific — expand per game) */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => doAction('end_turn', {})} disabled={loading}
              className="bg-[#2E6B4A] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#3A8A5E] transition-colors disabled:opacity-50">
              End Turn
            </button>
            <button onClick={() => doAction('form_syndicate', { propertyId: 'p1', partnerId: 'ai_1' })} disabled={loading}
              className="bg-[#1B3A2D] border border-[#C8962B]/40 text-[#C8962B] px-4 py-3 rounded-lg font-medium hover:bg-[#2E6B4A]/40 transition-colors disabled:opacity-50">
              Form Syndicate +
            </button>
          </div>
 
          {/* Decision log */}
          {state.decisions.length > 0 && (
            <div className="rounded-xl border border-[#2E6B4A]/20 p-4">
              <h4 className="text-[#8A9A8E] text-sm mb-3">Decision Log</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.decisions.slice().reverse().map((d, i) => (
                  <div key={i} className={`text-xs flex items-start gap-2 ${d.outcome === 'positive' ? 'text-green-400' : d.outcome === 'negative' ? 'text-red-400' : 'text-[#8A9A8E]'}`}>
                    <span className="mt-0.5">{d.outcome === 'positive' ? '✓' : d.outcome === 'negative' ? '✗' : '·'}</span>
                    <span>{d.reasoning || d.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* Completion */}
      {completed && state && (
        <div className="rounded-xl border border-[#C8962B]/40 bg-[#1B3A2D]/80 p-10 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-[#C8962B] mb-2">Game Complete!</h2>
          <p className="text-[#8A9A8E] mb-6">Final Score: <span className="text-white font-bold text-xl">{state.score}</span></p>
          <div className="bg-[#0D1F16] rounded-lg p-4 mb-6 text-left">
            <p className="text-[#8A9A8E] text-sm">Prestige Awarded</p>
            <p className="text-[#C8962B] text-2xl font-bold">+{session?.prestigeAwarded ?? '…'} pts</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={startGame} className="bg-[#C8962B] text-[#0D1F16] px-6 py-2 rounded-lg font-bold hover:bg-[#FFD580] transition-colors">
              Play Again
            </button>
            <button onClick={() => router.push('/games')} className="border border-[#2E6B4A] text-[#8A9A8E] px-6 py-2 rounded-lg font-medium hover:text-white transition-colors">
              Back to Arcade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
