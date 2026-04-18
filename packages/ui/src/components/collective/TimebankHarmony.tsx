'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'given' | 'received';
  description: string;
  hours: number;
  timestamp: string;
}

interface TimebankHarmonyProps {
  entries: TimeEntry[];
  currentUserId: string;
  userBalance: number;
}

export function TimebankHarmony({ entries, currentUserId, userBalance }: TimebankHarmonyProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'my-time' | 'give-help'>('feed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Timebank Harmony</h2>
        <HarmonyBalance balance={userBalance} />
      </div>

      <div className="flex gap-2">
        {(['feed', 'my-time', 'give-help'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-green-600 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {tab === 'my-time' ? 'My Time' : tab === 'give-help' ? 'Give Help' : 'Feed'}
          </button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <TimebankFeed entries={entries} currentUserId={currentUserId} />
      )}

      {activeTab === 'my-time' && (
        <MyTimeView entries={entries.filter(e => e.userId === currentUserId)} />
      )}

      {activeTab === 'give-help' && (
        <GiveHelpForm />
      )}
    </div>
  );
}

function HarmonyBalance({ balance }: { balance: number }) {
  const isPositive = balance >= 0;
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
      isPositive ? 'bg-green-900/50' : 'bg-red-900/50'
    }`}>
      <span className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{balance.toFixed(1)}
      </span>
      <span className="text-xs text-neutral-400">hours</span>
    </div>
  );
}

function TimebankFeed({ entries, currentUserId }: { entries: TimeEntry[]; currentUserId: string }) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`p-4 rounded-xl ${
            entry.action === 'given' ? 'bg-green-900/20 border-l-4 border-green-500' : 'bg-blue-900/20 border-l-4 border-blue-500'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-medium">{entry.description}</p>
              <p className="text-sm text-neutral-400 mt-1">
                {entry.action === 'given' ? 'Helped' : 'Received help from'} {entry.userName}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${entry.action === 'given' ? 'text-green-400' : 'text-blue-400'}`}>
                {entry.action === 'given' ? '+' : '-'}{entry.hours}h
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MyTimeView({ entries }: { entries: TimeEntry[] }) {
  const totalGiven = entries.filter(e => e.action === 'given').reduce((sum, e) => sum + e.hours, 0);
  const totalReceived = entries.filter(e => e.action === 'received').reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{totalGiven.toFixed(1)}h</div>
          <div className="text-sm text-neutral-400">Given to others</div>
        </div>
        <div className="bg-blue-900/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{totalReceived.toFixed(1)}h</div>
          <div className="text-sm text-neutral-400">Received from others</div>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-xl p-4">
        <h4 className="text-sm font-medium text-neutral-400 mb-3">Recent Activity</h4>
        {entries.length === 0 ? (
          <p className="text-neutral-500 text-center py-4">No time logged yet</p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 5).map(entry => (
              <div key={entry.id} className="flex justify-between text-sm">
                <span className="text-neutral-300">{entry.description}</span>
                <span className={entry.action === 'given' ? 'text-green-400' : 'text-blue-400'}>
                  {entry.action === 'given' ? '+' : '-'}{entry.hours}h
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GiveHelpForm() {
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(1);

  return (
    <div className="bg-neutral-800 rounded-xl p-4 space-y-4">
      <h4 className="font-medium text-white">Log Time Helping Others</h4>
      
      <div>
        <label className="block text-sm text-neutral-400 mb-1">What did you help with?</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your contribution..."
          className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1">Hours spent</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHours(Math.max(0.5, hours - 0.5))}
            className="w-10 h-10 rounded-lg bg-neutral-700 text-white font-bold"
          >
            -
          </button>
          <span className="text-2xl font-bold text-white w-16 text-center">{hours}h</span>
          <button
            onClick={() => setHours(hours + 0.5)}
            className="w-10 h-10 rounded-lg bg-neutral-700 text-white font-bold"
          >
            +
          </button>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={!description.trim()}
        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-neutral-600 disabled:text-neutral-500 rounded-lg font-medium text-white"
      >
        Log Time
      </motion.button>

      <p className="text-xs text-neutral-500 text-center">
        Credits expire after 90 days to encourage circulation
      </p>
    </div>
  );
}
