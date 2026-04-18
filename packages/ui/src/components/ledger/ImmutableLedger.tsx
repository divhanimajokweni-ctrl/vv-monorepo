'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LedgerEvent {
  id: string;
  eventType: string;
  actorId: string;
  entityId: string;
  entityType: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  sequenceNo: number;
  hash: string;
  prevHash: string | null;
  isReversal?: boolean;
  originalEventId?: string;
}

interface ImmutableLedgerProps {
  events: LedgerEvent[];
  onVerifyHash?: (event: LedgerEvent) => boolean;
}

export function ImmutableLedger({ events, onVerifyHash }: ImmutableLedgerProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showReversals, setShowReversals] = useState(true);

  const formatHash = (hash: string) => {
    if (hash.length > 16) {
      return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    }
    return hash;
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-earth/20 flex items-center justify-center">
            <span className="text-xl">⛓️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Immutable Ledger</h3>
            <p className="text-xs text-neutral-400">Append-only event stream</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {events.length} events
          </span>
          <div className="w-2 h-2 rounded-full bg-earth animate-pulse" />
        </div>
      </div>

      <div className="divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: index * 0.02 }}
              className={`p-4 hover:bg-neutral-800/30 transition-colors ${
                event.isReversal ? 'reversal-entry' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      event.eventType === 'DEBIT' ? 'bg-clay/20 text-clay' :
                      event.eventType === 'CREDIT' ? 'bg-earth/20 text-earth' :
                      event.eventType === 'REVERSAL' ? 'bg-harvest/20 text-harvest' :
                      'bg-neutral-700 text-neutral-300'
                    }`}>
                      {event.eventType}
                    </span>
                    
                    {event.isReversal && (
                      <span className="text-xs text-clay">
                        ↩ Reversal of {formatHash(event.originalEventId || '')}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-neutral-300 mb-1">
                    Actor: <span className="font-mono text-neutral-400">{formatHash(event.actorId)}</span>
                  </div>
                  
                  <div className="text-xs text-neutral-500">
                    {event.entityType}: {formatHash(event.entityId)}
                  </div>
                  
                  <div className="text-xs text-neutral-500 mt-1">
                    {new Date(event.occurredAt).toLocaleString()} • Seq #{event.sequenceNo}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    className="hash-chain-indicator"
                    title="View hash chain"
                  >
                    <span>⛓️</span>
                    <span className="text-neutral-400">{formatHash(event.hash)}</span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedEvent === event.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-neutral-700"
                  >
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-neutral-500 mb-1">Current Hash (SHA-256)</div>
                        <div className="font-mono text-earth break-all bg-neutral-800 p-2 rounded">
                          {event.hash}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 mb-1">Previous Hash</div>
                        <div className="font-mono text-neutral-400 break-all bg-neutral-800 p-2 rounded">
                          {event.prevHash || '(genesis)'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-neutral-500 mb-1 text-xs">Payload</div>
                      <pre className="text-xs font-mono text-neutral-300 bg-neutral-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                    
                    {onVerifyHash && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => onVerifyHash(event)}
                          className="px-3 py-1 bg-earth/20 text-earth text-xs rounded hover:bg-earth/30 transition-colors"
                        >
                          Verify Integrity
                        </button>
                        <span className="text-xs text-neutral-500">
                          Click to verify hash chain continuity
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
