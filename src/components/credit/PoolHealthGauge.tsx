'use client';

import { motion } from 'framer-motion';

interface PoolHealthGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PoolHealthGauge({ score, size = 'md' }: PoolHealthGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 90) return '#10b981';
    if (s >= 85) return '#34d399';
    if (s >= 70) return '#fbbf24';
    if (s >= 50) return '#f97316';
    return '#ef4444';
  };

  const dimensions = {
    sm: { radius: 40, stroke: 6, font: 'text-lg' },
    md: { radius: 60, stroke: 8, font: 'text-2xl' },
    lg: { radius: 80, stroke: 10, font: 'text-4xl' },
  };

  const { radius, stroke, font } = dimensions[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  const getLabel = (s: number) => {
    if (s >= 85) return 'Thriving';
    if (s >= 70) return 'Stable';
    if (s >= 50) return 'Stressed';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2}>
        <circle
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={radius + stroke / 2}
          cy={radius + stroke / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform={`rotate(-90 ${radius + stroke / 2} ${radius + stroke / 2})`}
        />
      </svg>
      <div 
        className={`${font} font-black mt-2`}
        style={{ color }}
      >
        {score}%
      </div>
      <p className="text-xs text-slate-400">{getLabel(score)}</p>
    </div>
  );
}

interface HealthMetricBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

export function HealthMetricBar({ label, value, maxValue = 100 }: HealthMetricBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const getColor = (p: number) => {
    if (p >= 80) return 'bg-emerald-500';
    if (p >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor(percentage)}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
