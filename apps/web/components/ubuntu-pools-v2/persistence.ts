import { useState, useEffect } from 'react';

interface UbuntuPoolsState {
  prestige: number;
  lindiweStats: { impulse: number; altruism: number };
  leaderboard: Array<{ name: string; wealth: number; prestige: number }>;
  gameHistory: Array<{ gameId: string; score: number; timestamp: number }>;
}

const STORAGE_KEY = 'ubuntu_pools_v2';

export function useLocalPersistence() {
  const saveState = (state: UbuntuPoolsState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...state,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  };

  const loadState = (): Partial<UbuntuPoolsState> | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if data is not too old (optional)
        const age = Date.now() - (parsed.timestamp || 0);
        if (age < 30 * 24 * 60 * 60 * 1000) { // 30 days
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
    return null;
  };

  return { saveState, loadState };
}

export function useSignalQueue() {
  const queueSignal = (signal: any) => {
    try {
      const queue = JSON.parse(localStorage.getItem('signal_queue') || '[]');
      queue.push({ ...signal, queuedAt: Date.now() });
      localStorage.setItem('signal_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to queue signal:', error);
    }
  };

  const getQueuedSignals = () => {
    try {
      return JSON.parse(localStorage.getItem('signal_queue') || '[]');
    } catch (error) {
      console.warn('Failed to get queued signals:', error);
      return [];
    }
  };

  const clearQueuedSignals = () => {
    try {
      localStorage.removeItem('signal_queue');
    } catch (error) {
      console.warn('Failed to clear queued signals:', error);
    }
  };

  return { queueSignal, getQueuedSignals, clearQueuedSignals };
}