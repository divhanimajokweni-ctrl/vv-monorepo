'use client';

import { motion } from 'framer-motion';

interface TrustNode {
  id: string;
  name: string;
  trustScore: number;
  x: number;
  y: number;
}

interface TrustConnection {
  from: string;
  to: string;
  strength: number;
}

interface TrustConstellationProps {
  nodes: TrustNode[];
  connections: TrustConnection[];
  currentUserId?: string;
}

export function TrustConstellation({ nodes, connections, currentUserId }: TrustConstellationProps) {
  return (
    <div className="relative w-full h-[600px] bg-neutral-900 rounded-xl overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.2} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;

          return (
            <motion.line
              key={`${conn.from}-${conn.to}`}
              x1={`${fromNode.x}%`}
              y1={`${fromNode.y}%`}
              x2={`${toNode.x}%`}
              y2={`${toNode.y}%`}
              stroke="#10B981"
              strokeWidth={conn.strength / 10}
              strokeOpacity={0.3 + (conn.strength / 100)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 + (conn.strength / 100) }}
              transition={{ duration: 1, delay: i * 0.1 }}
            />
          );
        })}
      </svg>

      {nodes.map((node, i) => (
        <TrustNodeComponent
          key={node.id}
          node={node}
          index={i}
          isCurrentUser={node.id === currentUserId}
        />
      ))}

      <div className="absolute bottom-4 left-4 bg-neutral-800/80 backdrop-blur-sm rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-2">Trust Legend</h4>
        <div className="space-y-1 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>High Trust (75+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium Trust (50-74)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Low Trust (0-49)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustNodeComponent({ node, index, isCurrentUser }: { node: TrustNode; index: number; isCurrentUser: boolean }) {
  const getColor = (score: number) => {
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getSize = (score: number) => {
    return 20 + (score / 100) * 30;
  };

  return (
    <motion.div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.2 }}
    >
      <div
        className={`rounded-full flex items-center justify-center shadow-lg ${
          isCurrentUser ? 'ring-2 ring-white' : ''
        }`}
        style={{
          width: getSize(node.trustScore),
          height: getSize(node.trustScore),
          backgroundColor: getColor(node.trustScore),
          boxShadow: `0 0 ${node.trustScore / 5}px ${getColor(node.trustScore)}`,
        }}
      >
        <span className="text-xs font-bold text-white">
          {node.name.charAt(0).toUpperCase()}
        </span>
      </div>
      
      <motion.div
        className="absolute top-full mt1/2 transform-2 left- -translate-x-1/2 whitespace-nowrap bg-neutral-800 px-2 py-1 rounded text-xs text-white"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        {node.name} (Score: {node.trustScore})
      </motion.div>
    </motion.div>
  );
}
