'use client';
 
import type { PrestigeScore } from '@/lib/games/types';
 
const PRESTIGE_PER_LEVEL = 100;
 
export function PrestigeTracker({ prestige }: { prestige: PrestigeScore }) {
  const progress = prestige.total % PRESTIGE_PER_LEVEL;
  const pct      = Math.round((progress / PRESTIGE_PER_LEVEL) * 100);
 
  return (
    <div className="rounded-xl border border-[#C8962B]/30 bg-[#1B3A2D]/50 p-5 flex flex-col md:flex-row gap-6 items-center">
 
      {/* Level badge */}
      <div className="flex-shrink-0 w-20 h-20 rounded-full border-4 border-[#C8962B]
                      flex items-center justify-center bg-[#0D1F16]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#C8962B]">{prestige.level}</div>
          <div className="text-[10px] text-[#8A9A8E] uppercase tracking-wide">Level</div>
        </div>
      </div>
 
      {/* Progress */}
      <div className="flex-1 w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">Prestige Score</span>
          <span className="text-[#C8962B] font-bold text-lg">{prestige.total} pts</span>
        </div>
        <div className="h-3 bg-[#0D1F16] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C8962B] to-[#FFD580] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#8A9A8E] mt-1">
          <span>{progress} / {PRESTIGE_PER_LEVEL} to Level {prestige.level + 1}</span>
          <span>Ubuntu Bonus: +{prestige.ubuntuBonus} to Score</span>
        </div>
      </div>
    </div>
  );
}
