'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/shell/AppShell';

export default function SettingsPage() {
  const [forgetStatus, setForgetStatus] = useState<'idle' | 'forgetting' | 'forgotten'>('idle');

  const handleForgetMe = async () => {
    setForgetStatus('forgetting');
    
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
    }

    setTimeout(() => {
      setForgetStatus('forgotten');
      window.location.href = '/';
    }, 1500);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <div className="up-card up-border-gradient p-6">
          <p className="up-kicker">Settings</p>
          <h1 className="mt-2 text-3xl font-black tracking-tighter">
            Data Sovereignty
          </h1>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Your data belongs to you. Exercise control over your digital footprint.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="up-card p-6">
            <h3 className="text-lg font-semibold">Privacy Controls</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Manage how your data is used and stored across the platform.
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between p-3 bg-[color:var(--surface-2)] rounded-lg cursor-pointer">
                <span className="text-sm">Share data for matching</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-sage" />
              </label>
              <label className="flex items-center justify-between p-3 bg-[color:var(--surface-2)] rounded-lg cursor-pointer">
                <span className="text-sm">Allow community vouching</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-sage" />
              </label>
              <label className="flex items-center justify-between p-3 bg-[color:var(--surface-2)] rounded-lg cursor-pointer">
                <span className="text-sm">Show in leaderboard</span>
                <input type="checkbox" className="w-5 h-5 accent-sage" />
              </label>
            </div>
          </div>

          <div className="up-card p-6 border-red-500/30">
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              These actions are irreversible. Proceed with caution.
            </p>
            
            <div className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-300">Forget Me</h4>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    Clear all local data and sign out. This removes your session from this device.
                  </p>
                  <button
                    onClick={handleForgetMe}
                    disabled={forgetStatus !== 'idle'}
                    className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      forgetStatus === 'forgotten'
                        ? 'bg-green-500 text-white'
                        : forgetStatus === 'forgetting'
                        ? 'bg-red-500/50 text-white cursor-wait'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {forgetStatus === 'idle' && 'Clear My Data'}
                    {forgetStatus === 'forgetting' && 'Clearing...'}
                    {forgetStatus === 'forgotten' && 'Data Cleared'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
