'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface VillageCircleProps {
  onNavigate?: (view: string) => void;
}

const navItems = [
  { id: 'pulse', label: 'The Pulse', icon: '🌊', description: 'Real-time impact map' },
  { id: 'tribal', label: 'Tribal Impact', icon: '🔥', description: 'Your contributions' },
  { id: 'ledger', label: 'Immutable Ledger', icon: '⛓️', description: 'Event stream' },
  { id: 'reputation', label: 'Trust Circle', icon: '🤝', description: 'Reputation & trust' },
  { id: 'vault', label: 'Commons Vault', icon: '🏛️', description: 'Shared resources' },
  { id: 'dashboard', label: 'Platform Health', icon: '📊', description: 'Technical dashboard' },
];

export function VillageCircle({ onNavigate }: VillageCircleProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    onNavigate?.(itemId);
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-24 hover:w-72 bg-neutral-900/95 backdrop-blur-sm border-r border-neutral-800 transition-all duration-300 z-50 flex flex-col">
      <div className="p-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-earth via-harvest to-clay flex items-center justify-center">
          <span className="text-xl">🟢</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col items-center py-4 gap-2 overflow-hidden">
        {navItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              relative w-14 h-14 rounded-xl flex items-center justify-center
              transition-all duration-200 group
              ${activeItem === item.id 
                ? 'bg-earth/20 text-earth' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }
            `}
          >
            <span className="text-2xl">{item.icon}</span>
            
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ 
                opacity: hoveredItem === item.id || activeItem === item.id ? 1 : 0,
                width: hoveredItem === item.id || activeItem === item.id ? 'auto' : 0
              }}
              className="absolute left-full ml-2 whitespace-nowrap overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-neutral-400">{item.description}</div>
                </div>
              </div>
            </motion.div>
            
            {activeItem === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-earth rounded-r"
              />
            )}
          </motion.button>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-400">
          <span>UU</span>
        </div>
      </div>
    </div>
  );
}
