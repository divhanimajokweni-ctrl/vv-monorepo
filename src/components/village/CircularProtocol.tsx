'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TrustMember {
  id: string;
  displayName: string;
  trustScore: number;
  badges: Array<{
    id: string;
    name: string;
    awardedBy: string;
    timestamp: number;
  }>;
  hasVoted: boolean;
  isOnChain?: boolean;
}

interface CircularProtocolProps {
  members: TrustMember[];
  currentUserId?: string;
  onGiftBadge?: (recipientId: string, badgeName: string) => void;
}

const badgeTypes = [
  { name: 'Knowledge Keeper', emoji: '📚', color: 'earth' },
  { name: 'Community Builder', emoji: '🏗️', color: 'harvest' },
  { name: 'Truth Teller', emoji: '🔍', color: 'clay' },
  { name: 'Shadow Worker', emoji: '🌙', color: 'purple' },
  { name: 'Peacekeeper', emoji: '🕊️', color: 'blue' },
];

export function CircularProtocol({ members, currentUserId, onGiftBadge }: CircularProtocolProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  const votedCount = members.filter(m => m.hasVoted).length;
  const totalCount = members.length;
  const angleStep = (2 * Math.PI) / totalCount;
  const radiusOuter = 120;
  const radiusInner = 70;

  const getMemberPosition = (index: number, hasVoted: boolean) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = hasVoted ? radiusInner : radiusOuter;
    return {
      x: 150 + radius * Math.cos(angle),
      y: 150 + radius * Math.sin(angle),
    };
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-harvest/20 flex items-center justify-center">
            <span className="text-xl">🤝</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Trust Circle</h3>
            <p className="text-xs text-neutral-400">Peer-attested reputation system</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold italic text-harvest">
            {votedCount} of {totalCount}
          </div>
          <div className="text-xs text-neutral-400">members participated</div>
        </div>
      </div>

      <div className="relative w-[300px] h-[300px] mx-auto mb-6">
        <svg className="w-full h-full" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="outerRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#606C38" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#606C38" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="innerRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          <circle cx="150" cy="150" r={radiusOuter} fill="none" stroke="url(#outerRing)" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="150" cy="150" r={radiusInner} fill="none" stroke="url(#innerRing)" strokeWidth="2" />
          
          <circle cx="150" cy="150" r="30" fill="#1a1a1a" stroke="#606C38" strokeWidth="2" />
          <text x="150" y="145" textAnchor="middle" fill="#606C38" fontSize="8" fontWeight="bold">
            VOTE
          </text>
          <text x="150" y="158" textAnchor="middle" fill="#D4AF37" fontSize="6">
            {((votedCount / totalCount) * 100).toFixed(0)}%
          </text>
        </svg>

        {members.map((member, index) => {
          const pos = getMemberPosition(index, member.hasVoted);
          const isSelected = selectedMember === member.id;
          const isHovered = hoveredMember === member.id;
          
          return (
            <motion.div
              key={member.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 50, 
                damping: 10,
                delay: index * 0.05 
              }}
              className="absolute cursor-pointer"
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => setSelectedMember(isSelected ? null : member.id)}
              onMouseEnter={() => setHoveredMember(member.id)}
              onMouseLeave={() => setHoveredMember(null)}
            >
              <motion.div
                animate={{
                  scale: isHovered || isSelected ? 1.2 : 1,
                }}
                className={`
                  member-avatar
                  ${member.hasVoted ? 'member-avatar-active' : 'member-avatar-inactive'}
                `}
                style={{
                  borderColor: member.hasVoted ? '#D4AF37' : '#606C38',
                }}
              >
                {member.displayName.slice(0, 2).toUpperCase()}
              </motion.div>
              
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-32 bg-neutral-800 rounded-lg p-2 text-center z-10"
                >
                  <div className="text-xs font-medium text-white">{member.displayName}</div>
                  <div className="text-xs text-harvest">Trust: {member.trustScore}</div>
                  <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {member.badges.slice(0, 3).map(badge => (
                      <span key={badge.id} className="text-xs">🏅</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-neutral-800/50 rounded-lg p-4"
          >
            {(() => {
              const member = members.find(m => m.id === selectedMember);
              if (!member) return null;
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">{member.displayName}</h4>
                    <span className="text-harvest font-bold">Trust: {member.trustScore}</span>
                  </div>
                  
                  {member.badges.length > 0 ? (
                    <div className="mb-3">
                      <div className="text-xs text-neutral-400 mb-2">Peer-Attested Badges</div>
                      <div className="flex flex-wrap gap-2">
                        {member.badges.map(badge => (
                          <span 
                            key={badge.id}
                            className="px-2 py-1 bg-harvest/20 text-harvest text-xs rounded-full"
                          >
                            🏅 {badge.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 mb-3">
                      No badges yet. Community members can gift badges!
                    </div>
                  )}
                  
                  {currentUserId && currentUserId !== selectedMember && (
                    <button
                      onClick={() => setShowBadgeModal(true)}
                      className="w-full py-2 bg-harvest/20 text-harvest text-sm rounded-lg hover:bg-harvest/30 transition-colors"
                    >
                      Gift a Badge
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBadgeModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowBadgeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-neutral-900 rounded-xl p-6 w-80"
              onClick={e => e.stopPropagation()}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Gift a Badge</h4>
              <div className="space-y-2">
                {badgeTypes.map(badge => (
                  <button
                    key={badge.name}
                    onClick={() => {
                      onGiftBadge?.(selectedMember, badge.name);
                      setShowBadgeModal(false);
                    }}
                    className="w-full p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-3"
                  >
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="text-sm text-white">{badge.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
