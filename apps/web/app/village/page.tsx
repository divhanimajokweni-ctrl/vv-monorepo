'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AppShell } from '@/components/shell/AppShell';
import { ThePulse, TribalImpactDashboard, CommonsVault, VillageCircle, CircularProtocol, PoolView, YieldCard, BufferStatusCard } from '@/components/village';
import { PoolHealthGauge } from '@/components/credit/PoolHealthGauge';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  bio: string;
}

interface Post {
  id: string;
  user: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: number;
  likes: number;
  comments: { id: string; user: User; content: string }[];
  isLiked: boolean;
}

const mockMembers = [
  {
    id: 'member-1',
    displayName: 'Sarah Kim',
    trustScore: 92,
    badges: [
      { id: 'b1', name: 'Knowledge Keeper', awardedBy: 'member-2', timestamp: Date.now() - 86400000 },
      { id: 'b2', name: 'Community Builder', awardedBy: 'member-3', timestamp: Date.now() - 172800000 },
    ],
    hasVoted: true,
    isOnChain: true,
  },
  {
    id: 'member-2',
    displayName: 'Marcus Chen',
    trustScore: 85,
    badges: [
      { id: 'b3', name: 'Truth Teller', awardedBy: 'member-1', timestamp: Date.now() - 259200000 },
    ],
    hasVoted: true,
    isOnChain: false,
  },
  {
    id: 'member-3',
    displayName: 'Jordan Lee',
    trustScore: 78,
    badges: [],
    hasVoted: false,
    isOnChain: false,
  },
];

const mockTribalImpact = {
  userId: 'user-001',
  displayName: 'Alex Chen',
  trustScore: 87,
  totalContributions: 156,
  communityImpact: 2840,
  shadowWorkRecognition: 12,
  contributionsHistory: [
    { type: 'knowledge' as const, amount: 50, timestamp: Date.now() - 86400000, description: 'Shared documentation on governance' },
    { type: 'support' as const, amount: 25, timestamp: Date.now() - 172800000, description: 'Onboarded new community member' },
    { type: 'curation' as const, amount: 15, timestamp: Date.now() - 259200000, description: 'Curated useful resources' },
  ],
};

const mockVillagePosts: Post[] = [
  {
    id: 'vpost-1',
    user: { id: '1', username: 'sarahk', displayName: 'Sarah Kim', avatarUrl: '', isVerified: true, bio: '' },
    content: 'Village council meeting tomorrow! We\'ll be discussing the new governance proposal. Everyone is welcome to join.',
    timestamp: Date.now() - 3600000,
    likes: 24,
    comments: [
      { id: 'c1', user: { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false, bio: '' }, content: 'I\'ll be there!' },
    ],
    isLiked: true,
  },
  {
    id: 'vpost-2',
    user: { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false, bio: '' },
    content: 'Just contributed R500 to the collective pool. Every little bit counts towards our shared goals! #Ubuntu #CollectiveProsperity',
    timestamp: Date.now() - 7200000,
    likes: 42,
    comments: [],
    isLiked: false,
  },
];

function Avatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const initial = user.displayName.charAt(0).toUpperCase();
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[color:var(--accent-sage)] to-[color:var(--accent-gold)] flex items-center justify-center text-white font-black flex-shrink-0 relative`}>
    {user.avatarUrl ? (
      <Image src={user.avatarUrl} alt={user.displayName} fill className="rounded-full object-cover" />
    ) : (
        <span className={size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'}>{initial}</span>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function VillagePostCard({ post }: { post: Post }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-[color:var(--surface-2)] rounded-xl"
    >
      <div className="flex gap-3">
        <Avatar user={post.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">{post.user.displayName}</span>
            {post.user.isVerified && (
              <svg className="w-3 h-3 text-[color:var(--accent-sage)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-xs text-[color:var(--muted)]">@{post.user.username}</span>
            <span className="text-xs text-[color:var(--muted)]">·</span>
            <span className="text-xs text-[color:var(--muted)]">{formatTime(post.timestamp)}</span>
          </div>
          <p className="mt-2 text-sm">{post.content}</p>
          <div className="mt-3 flex gap-6 text-xs text-[color:var(--muted)]">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comments.length}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type VillageViewType = 'feed' | 'pulse' | 'impact' | 'trust' | 'vault' | 'governance' | 'members';

export default function VillagePage() {
  const [activeView, setActiveView] = useState<VillageViewType>('feed');
  const [isCompounding, setIsCompounding] = useState(true);

  const views = useMemo(
    () => [
      { id: 'feed' as const, label: 'Feed', help: 'Latest posts from the village' },
      { id: 'members' as const, label: 'Members', help: 'Browse and connect with village members' },
      { id: 'pulse' as const, label: 'Pulse', help: 'Real-time global impact map' },
      { id: 'impact' as const, label: 'Impact', help: 'Your contributions integrated with the collective' },
      { id: 'trust' as const, label: 'Trust Circle', help: 'Peer-attested reputation — badges gifted by others' },
      { id: 'vault' as const, label: 'Pool Vault', help: 'Collective liquidity & safety net' },
      { id: 'governance' as const, label: 'Governance', help: 'Circular accountability protocol' },
    ],
    []
  );

  const renderContent = () => {
    switch (activeView) {
      case 'feed':
        return (
          <div className="space-y-4">
            <div className="up-card up-border-gradient p-4">
              <div className="flex gap-3">
                <Avatar user={{ id: '1', username: 'sarahk', displayName: 'Sarah Kim', avatarUrl: '', isVerified: true, bio: '' }} />
                <div className="flex-1">
                  <textarea
                    placeholder="What's happening in the village?"
                    className="w-full min-h-[80px] bg-transparent border-none text-sm placeholder:text-[color:var(--muted)] focus:outline-none resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button className="px-4 py-2 bg-[color:var(--accent-gold)] text-white text-xs font-black uppercase rounded-full">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {mockVillagePosts.map((post) => (
              <VillagePostCard key={post.id} post={post} />
            ))}
          </div>
        );
      case 'members':
        return (
          <div className="up-card up-border-gradient p-6">
            <p className="up-kicker">Village Members</p>
            <h2 className="mt-2 text-2xl font-black tracking-tighter">Connect with the Community</h2>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Browse members, follow friends, and grow your network within the Ubuntu collective.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockMembers.map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-[color:var(--surface-2)] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={{ id: member.id, username: member.id, displayName: member.displayName, avatarUrl: '', isVerified: member.isOnChain, bio: '' }} />
                    <div className="flex-1">
                      <span className="font-black text-sm">{member.displayName}</span>
                      <p className="text-xs text-[color:var(--muted)]">Trust: {member.trustScore}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {member.badges.slice(0, 2).map((badge) => (
                      <span key={badge.id} className="px-2 py-0.5 bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)] text-xs rounded-full">
                        {badge.name}
                      </span>
                    ))}
                  </div>
                  <button className="mt-3 w-full py-2 text-xs font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white transition-colors">
                    Follow
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'pulse':
        return <ThePulse />;
      case 'impact':
        return <TribalImpactDashboard {...mockTribalImpact} />;
      case 'trust':
        return (
          <div className="up-card up-border-gradient p-6">
            <p className="up-kicker">Trust Circle</p>
            <h2 className="mt-2 text-2xl font-black tracking-tighter">Reputation is gifted.</h2>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Badges are peer-attested. No self-awarding. Trust is social—like it should be.
            </p>
            <div className="mt-6">
              <VillageCircle onNavigate={(view) => setActiveView(view as VillageViewType)} />
            </div>
          </div>
        );
      case 'vault':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="up-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="up-kicker">Pool Health</p>
                    <h3 className="mt-1 text-xl font-black tracking-tighter">Collective Liquidity</h3>
                  </div>
                  {isCompounding && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1 bg-[color:var(--accent-gold)]/20 text-[color:var(--accent-gold)] text-xs font-black uppercase tracking-widest rounded-full"
                    >
                      Compounding
                    </motion.span>
                  )}
                </div>
                <div className="flex justify-center py-4">
                  <PoolHealthGauge score={87} size="lg" />
                </div>
                <p className="mt-4 text-center text-sm text-[color:var(--muted)]">
                  Your safety net is generating yield. The &quot;Holy Grail&quot; of social capital in action.
                </p>
              </div>
              <BufferStatusCard currentBuffer={7500} targetBuffer={10000} protectionLevel="medium" />
            </div>
            <YieldCard principal={7500} apy={4.5} daysActive={180} />
            <CommonsVault currentAmount={7500} maxAmount={10000} />
          </div>
        );
      case 'governance':
        return (
          <div className="up-card p-6">
            <p className="up-kicker">Protocol</p>
            <h3 className="mt-2 text-xl font-black tracking-tighter">Circular accountability.</h3>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Governance flows in loops: propose discuss consent record learn.
            </p>
            <div className="mt-6">
              <CircularProtocol members={mockMembers} currentUserId="user-001" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="up-card up-border-gradient p-6">
            <p className="up-kicker">Village</p>
            <h1 className="mt-2 text-3xl font-black tracking-tighter">
              The Social-Fintech Hub
            </h1>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Connect, coordinate, and compound together. This is where collective prosperity happens.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {views.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={
                  activeView === v.id
                    ? 'up-pill border-[color:var(--accent-gold)] text-[color:var(--text)]'
                    : 'up-pill opacity-85 hover:opacity-100'
                }
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mt-4 text-sm text-[color:var(--muted)]">
            {views.find((v) => v.id === activeView)?.help}
          </div>

          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8"
          >
            {renderContent()}
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="up-card p-6">
            <p className="up-kicker">Your Standing</p>
            <h3 className="mt-2 text-lg font-black tracking-tighter">Trust Score</h3>
            <div className="mt-4 flex justify-center">
              <PoolHealthGauge score={87} size="md" />
            </div>
          </div>
          
          <div className="up-card p-6">
            <p className="up-kicker">Quick Stats</p>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Contributions</span>
                <span className="font-black">156</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Community Impact</span>
                <span className="font-black">2,840</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--muted)]">Badges Earned</span>
                <span className="font-black">12</span>
              </div>
            </div>
          </div>

          <div className="up-card p-6">
            <p className="up-kicker">Upcoming Events</p>
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-[color:var(--surface-2)] rounded-xl">
                <p className="text-sm font-black">Village Council</p>
                <p className="text-xs text-[color:var(--muted)]">Tomorrow, 7pm UTC</p>
              </div>
              <div className="p-3 bg-[color:var(--surface-2)] rounded-xl">
                <p className="text-sm font-black">Trust Circle Meeting</p>
                <p className="text-xs text-[color:var(--muted)]">Friday, 6pm UTC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
