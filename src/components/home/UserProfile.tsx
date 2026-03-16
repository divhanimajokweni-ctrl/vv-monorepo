'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface UserProfileProps {
  userName?: string;
  userId?: string;
  trustScore?: number;
}

export function UserProfile({ userName = 'Ubuntu Member', userId = 'member-001', trustScore = 72 }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-earth via-harvest to-clay flex items-center justify-center text-white font-medium">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-white text-sm font-medium">{userName}</p>
          <p className="text-neutral-400 text-xs">Score: {trustScore}</p>
        </div>
      </motion.button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-2 w-64 glass-card rounded-xl border border-neutral-700/50 p-4 z-50"
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-700">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-earth via-harvest to-clay flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{userName}</p>
                <p className="text-neutral-400 text-xs">{userId}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors text-left">
                <span className="text-lg">👤</span>
                <span className="text-neutral-300 text-sm">Profile Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors text-left">
                <span className="text-lg">🔔</span>
                <span className="text-neutral-300 text-sm">Notifications</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors text-left">
                <span className="text-lg">🔒</span>
                <span className="text-neutral-300 text-sm">Privacy Controls</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors text-left">
                <span className="text-lg">⚙️</span>
                <span className="text-neutral-300 text-sm">Preferences</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-700">
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-clay/20 transition-colors text-left">
                <span className="text-lg">🚪</span>
                <span className="text-clay-light text-sm">Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
