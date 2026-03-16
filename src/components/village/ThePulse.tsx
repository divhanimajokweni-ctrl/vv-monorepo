'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PulseEvent {
  id: string;
  type: 'transaction' | 'contribution' | 'help' | 'governance';
  actorId: string;
  timestamp: number;
  impact: number;
  description: string;
}

interface ThePulseProps {
  events?: PulseEvent[];
  autoGenerate?: boolean;
}

export function ThePulse({ events: initialEvents = [], autoGenerate = true }: ThePulseProps) {
  const [events, setEvents] = useState<PulseEvent[]>(initialEvents);
  const [waves, setWaves] = useState<Array<{ id: string; x: number; y: number; impact: number }>>([]);

  const eventPositions = useMemo(() => {
    return events.slice(0, 20).map((event, i) => ({
      ...event,
      cx: 20 + (i % 5) * 15 + (i * 7 % 5),
      cy: 20 + Math.floor(i / 5) * 15 + (i * 11 % 5),
    }));
  }, [events]);

  const addEvent = useCallback((event: PulseEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 50));
    
    const newWave = {
      id: event.id,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      impact: event.impact,
    };
    setWaves(prev => [...prev, newWave]);
    
    setTimeout(() => {
      setWaves(prev => prev.filter(w => w.id !== event.id));
    }, 3000);
  }, []);

  useEffect(() => {
    if (!autoGenerate) return;
    
    const types: PulseEvent['type'][] = ['transaction', 'contribution', 'help', 'governance'];
    const descriptions: Record<PulseEvent['type'], string[]> = {
      transaction: ['Pool deposit', 'Trust transfer', 'Vault unlock'],
      contribution: ['Documentation update', 'Bug report', 'Code review'],
      help: ['Mentored newcomer', 'Answered question', 'Resolved dispute'],
      governance: ['Voted on proposal', 'Proposed new rule', 'Verified member'],
    };
    
    const interval = setInterval(() => {
      const type = types[Math.floor(Math.random() * types.length)];
      addEvent({
        id: crypto.randomUUID(),
        type,
        actorId: `member-${Math.floor(Math.random() * 100)}`,
        timestamp: Date.now(),
        impact: Math.floor(Math.random() * 100),
        description: descriptions[type][Math.floor(Math.random() * descriptions[type].length)],
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [autoGenerate, addEvent]);

  return (
    <div className="relative w-full h-64 bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800">
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-neutral-700"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {eventPositions.map((event) => (
            <circle
              key={event.id}
              cx={event.cx}
              cy={event.cy}
              r={0.5 + (event.impact / 100) * 2}
              fill={
                event.type === 'transaction' ? '#606C38' :
                event.type === 'contribution' ? '#D4AF37' :
                event.type === 'help' ? '#9B4722' : '#8B5CF6'
              }
              className="opacity-70"
            />
          ))}
        </svg>
      </div>

      <AnimatePresence>
        {waves.map(wave => (
          <motion.div
            key={wave.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${wave.x}%`,
              top: `${wave.y}%`,
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -50%)',
              background: wave.impact > 70 
                ? 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, transparent 70%)'
                : wave.impact > 40
                ? 'radial-gradient(circle, rgba(96,108,56,0.6) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(155,71,34,0.6) 0%, transparent 70%)',
            }}
          />
        ))}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-earth animate-pulse" />
          <span className="text-xs text-neutral-400 font-medium">Live Impact Stream</span>
        </div>
        
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {events.slice(0, 5).map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-neutral-300">
                <span className="text-harvest font-medium">{event.description}</span>
              </span>
              <span className="text-neutral-500">
                {event.type === 'transaction' ? '💰' : 
                 event.type === 'contribution' ? '✨' : 
                 event.type === 'help' ? '🤝' : '🗳️'} {event.impact}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
