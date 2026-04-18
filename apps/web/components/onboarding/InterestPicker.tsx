'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InterestTag {
  id: string;
  label: string;
  icon: string;
  category: 'sector' | 'passion' | 'impact';
  searchTerms?: string[];
}

export const interestTags: InterestTag[] = [
  { id: 'agri', label: '#AgriTech', icon: '🌱', category: 'sector', searchTerms: ['agriculture south africa', 'farming tech'] },
  { id: 'solar', label: '#SolarEnergy', icon: '☀️', category: 'sector', searchTerms: ['solar energy south africa', 'renewable energy'] },
  { id: 'edu', label: '#Education', icon: '📚', category: 'impact', searchTerms: ['edtech south africa', 'education investment'] },
  { id: 'tech', label: '#SaaS', icon: '💻', category: 'sector', searchTerms: ['saas africa', 'software business'] },
  { id: 'art', label: '#CreativeEconomy', icon: '🎨', category: 'passion', searchTerms: ['creative economy south africa', 'artisan business'] },
  { id: 'health', label: '#HealthTech', icon: '🏥', category: 'sector', searchTerms: ['healthtech africa', 'medical innovation'] },
  { id: 'water', label: '#WaterSecurity', icon: '💧', category: 'impact', searchTerms: ['water security south africa', 'infrastructure'] },
  { id: 'housing', label: '#AffordableHousing', icon: '🏠', category: 'impact', searchTerms: ['affordable housing south africa', 'property development'] },
  { id: 'crypto', label: '#DeFi', icon: '🔗', category: 'sector', searchTerms: ['defi africa', 'blockchain finance'] },
  { id: 'tourism', label: '#EcoTourism', icon: '🌍', category: 'passion', searchTerms: ['ecotourism south africa', 'sustainable travel'] },
  { id: 'fishing', label: '#BlueEconomy', icon: '🎣', category: 'sector', searchTerms: ['blue economy south africa', 'fishing cooperatives'] },
  { id: 'mining', label: '#MiningTech', icon: '⛏️', category: 'sector', searchTerms: ['mining technology south africa', 'resource innovation'] },
];

interface InterestPickerProps {
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[], affinityScores: Record<string, number>) => void;
  maxSelections?: number;
}

export function InterestPicker({ 
  selectedIds = [], 
  onSelectionChange,
  maxSelections = 5 
}: InterestPickerProps) {
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const calculateAffinityScores = useCallback((ids: string[]): Record<string, number> => {
    const scores: Record<string, number> = {};
    const basePoints = 5;
    
    ids.forEach((id, index) => {
      scores[id] = basePoints + (ids.length - index) * 2;
    });
    
    return scores;
  }, []);

  const toggleTag = useCallback((id: string) => {
    setSelected(prev => {
      let next: string[];
      
      if (prev.includes(id)) {
        next = prev.filter(t => t !== id);
      } else if (prev.length < maxSelections) {
        next = [...prev, id];
      } else {
        return prev;
      }
      
      const scores = calculateAffinityScores(next);
      onSelectionChange?.(next, scores);
      
      return next;
    });
  }, [maxSelections, onSelectionChange, calculateAffinityScores]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const tag = interestTags[index];
      if (tag) toggleTag(tag.id);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, interestTags.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    }
  }, [toggleTag]);

  const selectedCount = selected.length;
  const remainingSlots = maxSelections - selectedCount;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.h2 
          className="text-2xl font-black tracking-tighter text-[color:var(--text)]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          What moves you?
        </motion.h2>
        <motion.p 
          className="mt-2 text-sm text-[color:var(--muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Select up to {maxSelections} interests to find your Village
        </motion.p>
        <motion.p 
          className="mt-1 text-xs text-[color:var(--accent-ubuntu)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {remainingSlots > 0 ? `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining` : 'Maximum selected'}
        </motion.p>
      </div>

      <div 
        className="flex flex-wrap gap-3 justify-center"
        role="group"
        aria-label="Interest selection"
      >
        <AnimatePresence mode="popLayout">
          {interestTags.map((tag, index) => {
            const isSelected = selected.includes(tag.id);
            const isFocused = focusedIndex === index;

            return (
              <motion.button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={!isSelected && remainingSlots === 0}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full border-2 
                  font-medium text-sm transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-ubuntu)] focus-visible:ring-offset-2
                  ${isSelected 
                    ? 'border-[color:var(--accent-ubuntu)] bg-[color:var(--accent-ubuntu)]/10 text-[color:var(--accent-ubuntu)]' 
                    : 'border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--accent-gold)] hover:text-[color:var(--text)]'
                  }
                  ${!isSelected && remainingSlots === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:cursor-not-allowed
                `}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isSelected ? 1.05 : 1,
                  opacity: 1 
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: isSelected ? 1.08 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                layout
                aria-pressed={isSelected}
                aria-label={`${tag.label}, ${tag.category}, ${isSelected ? 'selected' : 'not selected'}`}
                tabIndex={0}
              >
                <span className="text-base" aria-hidden="true">{tag.icon}</span>
                <span>{tag.label}</span>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-1"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {selected.length > 0 && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs text-[color:var(--muted)]">
            Your selections fuel the Village Pulse and improve Matchmaker recommendations
          </p>
        </motion.div>
      )}
    </div>
  );
}

export function useVillagePulse(interestIds: string[]): number {
  const basePoints = 5;
  return interestIds.length * basePoints;
}
