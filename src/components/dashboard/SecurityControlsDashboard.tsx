'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ControlSummary {
  total: number;
  implemented: number;
  partial: number;
  missing: number;
  byCategory: Record<string, { implemented: number; partial: number; missing: number }>;
  byPriority: Record<string, number>;
  maturityScore: number;
}

interface SecurityControl {
  id: string;
  controlId: string;
  category: string;
  title: string;
  description: string;
  systemComponent: string;
  status: 'implemented' | 'partial' | 'missing' | 'not_applicable';
  priority: 'critical' | 'high' | 'medium' | 'low';
  owner?: string;
  riskLevel?: string;
  gapDescription?: string;
  recommendation?: string;
}

const categoryLabels: Record<string, string> = {
  INFRASTRUCTURE: 'Infrastructure',
  ORGANIZATIONAL: 'Organizational',
  PRODUCT: 'Product',
  INTERNAL_PROCEDURES: 'Internal Procedures',
  DATA_PRIVACY: 'Data & Privacy',
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  implemented: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Implemented' },
  partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Partial' },
  missing: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Missing' },
  not_applicable: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'N/A' },
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export function SecurityControlsDashboard() {
  const [summary, setSummary] = useState<ControlSummary | null>(null);
  const [controls, setControls] = useState<SecurityControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, controlsRes] = await Promise.all([
          fetch('/api/security/controls/summary'),
          fetch('/api/security/controls'),
        ]);
        
        const summaryData = await summaryRes.json();
        const controlsData = await controlsRes.json();
        
        setSummary(summaryData);
        setControls(controlsData.controls || []);
      } catch (error) {
        console.error('Failed to fetch security controls:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const filteredControls = controls.filter(c => {
    if (selectedCategory && c.category !== selectedCategory) return false;
    if (selectedStatus && c.status !== selectedStatus) return false;
    return true;
  });

  const categories = Object.keys(summary?.byCategory || {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Control Inventory</h2>
          <p className="text-neutral-400">Track security controls, evidence, and compliance status</p>
        </div>
        
        <div className="text-right">
          <div className="text-4xl font-bold text-amber-500">{summary?.maturityScore || 0}%</div>
          <div className="text-sm text-neutral-400">Maturity Score</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
          <div className="text-2xl font-bold text-white">{summary?.total || 0}</div>
          <div className="text-sm text-neutral-400">Total Controls</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
          <div className="text-2xl font-bold text-green-400">{summary?.implemented || 0}</div>
          <div className="text-sm text-green-400/80">Implemented</div>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-400">{summary?.partial || 0}</div>
          <div className="text-sm text-yellow-400/80">Partial</div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
          <div className="text-2xl font-bold text-red-400">{summary?.missing || 0}</div>
          <div className="text-sm text-red-400/80">Missing</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {categories.map((cat) => {
          const data = summary?.byCategory[cat] || { implemented: 0, partial: 0, missing: 0 };
          const total = data.implemented + data.partial + data.missing;
          const pct = total > 0 ? Math.round((data.implemented / total) * 100) : 0;
          
          return (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 border-amber-500'
                  : 'bg-neutral-800/30 border-neutral-700 hover:border-neutral-600'
              }`}
            >
              <div className="text-xs text-neutral-400 mb-1">{categoryLabels[cat]}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-white">{pct}%</span>
                <span className="text-xs text-neutral-500">impl</span>
              </div>
              <div className="mt-2 h-1 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {Object.entries(statusColors).map(([status, { bg, text, label }]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedStatus === status
                ? 'bg-amber-500 text-white'
                : `${bg} ${text} hover:opacity80`
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredControls.map((control) => (
          <motion.div
            key={control.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-800/50 rounded-lg border border-neutral-700 p-4 hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[control.priority]}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-amber-500">{control.controlId}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[control.status].bg} ${statusColors[control.status].text}`}>
                      {statusColors[control.status].label}
                    </span>
                  </div>
                  <h3 className="font-medium text-white mt-1">{control.title}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{control.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span>{categoryLabels[control.category]}</span>
                    <span>{control.systemComponent}</span>
                    {control.owner && <span>Owner: {control.owner}</span>}
                  </div>
                </div>
              </div>
              
              {control.recommendation && control.status !== 'implemented' && (
                <div className="max-w-xs text-right">
                  <p className="text-xs text-neutral-400">{control.recommendation}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredControls.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No controls match the selected filters
        </div>
      )}
    </div>
  );
}
