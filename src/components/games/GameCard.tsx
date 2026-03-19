'use client';
 
import { useRouter } from 'next/navigation';
import type { GameDefinition } from '@/lib/games/types';
 
const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     'bg-[#2E6B4A] text-[#A8F0C6]',
  intermediate: 'bg-[#7A5C1A] text-[#FFD580]',
  advanced:     'bg-[#6B1A1A] text-[#FFB3B3]',
};
 
export function GameCard({ game }: { game: GameDefinition }) {
  const router = useRouter();
 
  return (
    <div
      onClick={() => router.push(`/games/${game.id}`)}
      className="group cursor-pointer rounded-xl border border-[#2E6B4A]/40 bg-[#1B3A2D]/60
                 hover:border-[#C8962B]/60 hover:bg-[#1B3A2D]/90 transition-all duration-300
                 p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Accent glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
                      bg-gradient-to-br from-[#C8962B] to-transparent pointer-events-none" />
 
      {/* Icon + difficulty */}
      <div className="flex items-start justify-between">
        <span className="text-4xl">{game.icon}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${DIFFICULTY_COLOR[game.difficulty]}`}>
          {game.difficulty}
        </span>
      </div>
 
      {/* Name + tagline */}
      <div>
        <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
        <p className="text-[#C8962B] text-sm italic">{game.tagline}</p>
      </div>
 
      <p className="text-[#8A9A8E] text-sm leading-relaxed line-clamp-3">{game.description}</p>
 
      {/* Concepts */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {game.concepts.slice(0, 3).map(c => (
          <span key={c} className="text-xs bg-[#0D1F16] text-[#8A9A8E] px-2 py-0.5 rounded border border-[#2E6B4A]/30">
            {c}
          </span>
        ))}
      </div>
 
      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-[#2E6B4A]/30 text-xs text-[#8A9A8E]">
        <span>⏱ {game.estimatedMins} min</span>
        <span>👥 {game.minPlayers === game.maxPlayers ? `${game.minPlayers}p` : `${game.minPlayers}–${game.maxPlayers}p`}</span>
        <span className="text-[#C8962B] font-medium group-hover:underline">Play →</span>
      </div>
    </div>
  );
}
