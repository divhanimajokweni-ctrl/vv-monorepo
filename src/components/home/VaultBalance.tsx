'use client';

import { motion } from 'framer-motion';

interface VaultBalanceProps {
  balance?: string;
  currency?: string;
}

export function VaultBalance({ balance = '2,300.00', currency = 'R' }: VaultBalanceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="humanistic-card p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-earth to-earth-light flex items-center justify-center">
            <span className="text-lg">🏛️</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Commons Vault</h3>
            <p className="text-neutral-400 text-xs">Your collective prosperity</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-earth/20 text-earth-light text-xs font-medium">
          Active
        </div>
      </div>

      <div className="mb-4">
        <p className="text-neutral-400 text-xs mb-1">Available Balance</p>
        <p className="text-3xl font-bold text-white">
          {currency} <span className="text-harvest">{balance}</span>
        </p>
      </div>

      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '75%' }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full rounded-full bg-gradient-to-r from-earth via-harvest to-clay"
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-neutral-500">
        <span>75% of cycle target</span>
        <span>R 3,000.00</span>
      </div>
    </motion.div>
  );
}
