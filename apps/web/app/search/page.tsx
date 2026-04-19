'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AppShell } from '@/components/shell/AppShell';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  bio: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface Post {
  id: string;
  user: User;
  content: string;
  mediaUrl?: string;
  timestamp: number;
  likes: number;
  commentsCount: number;
}

const mockUsers: User[] = [
  { id: '1', username: 'sarahk', displayName: 'Sarah Kim', avatarUrl: '', isVerified: true, bio: 'Building collective prosperity', followersCount: 1234, followingCount: 567, isFollowing: false },
  { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false, bio: 'Governance enthusiast', followersCount: 892, followingCount: 432, isFollowing: true },
  { id: '3', username: 'jordanl', displayName: 'Jordan Lee', avatarUrl: '', isVerified: true, bio: 'Trust circle advocate', followersCount: 2103, followingCount: 789, isFollowing: false },
  { id: '4', username: 'alexc', displayName: 'Alex Chen', avatarUrl: '', isVerified: false, bio: 'Ubuntu believer', followersCount: 567, followingCount: 234, isFollowing: true },
  { id: '5', username: 'emilyw', displayName: 'Emily Watson', avatarUrl: '', isVerified: true, bio: 'Pool coordinator', followersCount: 3456, followingCount: 456, isFollowing: false },
  { id: '6', username: 'davidm', displayName: 'David Miller', avatarUrl: '', isVerified: false, bio: 'Community builder', followersCount: 789, followingCount: 321, isFollowing: false },
  { id: '7', username: 'jessicap', displayName: 'Jessica Park', avatarUrl: '', isVerified: true, bio: 'Impact measurer', followersCount: 1567, followingCount: 654, isFollowing: true },
  { id: '8', username: 'tomh', displayName: 'Tom Harris', avatarUrl: '', isVerified: false, bio: 'Village elder', followersCount: 4567, followingCount: 123, isFollowing: false },
];

const mockPosts: Post[] = [
  {
    id: 'post-1',
    user: mockUsers[1]!,
    content: 'The governance proposal is now live! Everyone please review and share your thoughts. #UbuntuPools #Governance',
    timestamp: Date.now() - 3600000,
    likes: 42,
    commentsCount: 15,
  },
  {
    id: 'post-2',
    user: mockUsers[2]!,
    content: 'Just earned my third badge! The trust circle truly works when we support each other. #TrustCircle #Ubuntu',
    mediaUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    timestamp: Date.now() - 7200000,
    likes: 89,
    commentsCount: 23,
  },
  {
    id: 'post-3',
    user: mockUsers[3]!,
    content: 'Looking for collaborators on the new village council initiative. DM me if you\'re interested!',
    timestamp: Date.now() - 14400000,
    likes: 23,
    commentsCount: 8,
  },
  {
    id: 'post-4',
    user: mockUsers[4]!,
    content: 'The pool is looking healthy this month! R15,000 in collective savings. Let\'s keep growing together. #CollectiveProsperity',
    timestamp: Date.now() - 86400000,
    likes: 156,
    commentsCount: 34,
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

function VerifiedBadge() {
  return (
    <svg className="w-4 h-4 text-[color:var(--accent-sage)]" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
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

function UserCard({ user, onToggleFollow }: { user: User; onToggleFollow: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 bg-[color:var(--surface-2)] rounded-xl"
    >
      <Avatar user={user} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-black truncate">{user.displayName}</span>
          {user.isVerified && <VerifiedBadge />}
        </div>
        <span className="text-sm text-[color:var(--muted)]">@{user.username}</span>
        <p className="mt-1 text-sm text-[color:var(--muted)] truncate">{user.bio}</p>
        <div className="mt-2 flex gap-4 text-xs text-[color:var(--muted)]">
          <span><span className="font-black text-[color:var(--text)]">{user.followersCount}</span> followers</span>
          <span><span className="font-black text-[color:var(--text)]">{user.followingCount}</span> following</span>
        </div>
      </div>
      <button
        onClick={() => onToggleFollow(user.id)}
        className={`px-4 py-2 text-xs font-black uppercase rounded-full transition-colors ${
          user.isFollowing
            ? 'border border-[color:var(--border)] text-[color:var(--muted)] hover:border-red-500 hover:text-red-500'
            : 'bg-[color:var(--accent-gold)] text-white hover:bg-[color:var(--accent-gold)]/80'
        }`}
      >
        {user.isFollowing ? 'Following' : 'Follow'}
      </button>
    </motion.div>
  );
}

function PostCard({ post }: { post: Post }) {
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
            {post.user.isVerified && <VerifiedBadge />}
            <span className="text-xs text-[color:var(--muted)]">@{post.user.username}</span>
            <span className="text-xs text-[color:var(--muted)]">·</span>
            <span className="text-xs text-[color:var(--muted)]">{formatTime(post.timestamp)}</span>
          </div>
          <p className="mt-2 text-sm">{post.content}</p>
          {post.mediaUrl && (
            <div className="mt-3 relative aspect-video rounded-lg overflow-hidden">
              <Image src={post.mediaUrl} alt="Post media" fill className="object-cover" />
            </div>
          )}
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
              {post.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [posts] = useState<Post[]>(mockPosts);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(query) || 
      u.displayName.toLowerCase().includes(query) ||
      u.bio.toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(p => 
      p.content.toLowerCase().includes(query) ||
      p.user.displayName.toLowerCase().includes(query)
    );
  }, [searchQuery, posts]);

  const handleToggleFollow = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isFollowing: !u.isFollowing,
          followersCount: u.isFollowing ? u.followersCount - 1 : u.followersCount + 1,
        };
      }
      return u;
    }));
  };

  const trendingTopics = ['#UbuntuPools', '#CollectiveProsperity', '#TrustCircle', '#Governance', '#VillageLife', '#PoolHealth'];
  const trendingPostCounts = [342, 267, 198, 145, 89, 56];

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="up-card up-border-gradient p-6">
            <p className="up-kicker">Search</p>
            <h1 className="mt-2 text-2xl font-black tracking-tighter">Find People & Posts</h1>
            
            <div className="mt-6 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users, posts, or topics..."
                className="w-full px-4 py-3 pl-12 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl text-sm focus:outline-none focus:border-[color:var(--accent-sage)]"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="mt-6 flex gap-2 border-b border-[color:var(--border)] pb-4">
              {(['all', 'users', 'posts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-black uppercase rounded-full transition-colors ${
                    activeTab === tab
                      ? 'bg-[color:var(--surface-2)]'
                      : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="mt-6 space-y-4">
              {activeTab === 'all' && (
                <>
                  {filteredUsers.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-black uppercase text-[color:var(--muted)] mb-3">People</h3>
                      <div className="space-y-3">
                        {filteredUsers.slice(0, 3).map(user => (
                          <UserCard key={user.id} user={user} onToggleFollow={handleToggleFollow} />
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredPosts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black uppercase text-[color:var(--muted)] mb-3">Posts</h3>
                      <div className="space-y-3">
                        {filteredPosts.slice(0, 3).map(post => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'users' && (
                <div className="space-y-3">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <UserCard key={user.id} user={user} onToggleFollow={handleToggleFollow} />
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-[color:var(--muted)]">No users found</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'posts' && (
                <div className="space-y-3">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-[color:var(--muted)]">No posts found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="up-card p-6">
            <p className="up-kicker">Trending</p>
            <div className="mt-4 space-y-3">
              {trendingTopics.map((tag, index) => (
                <div key={tag} className="flex items-center justify-between">
                  <span className="text-sm text-[color:var(--accent-sage)]">{tag}</span>
                  <span className="text-xs text-[color:var(--muted)]">{trendingPostCounts[index]} posts</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="up-card p-6">
            <p className="up-kicker">Suggestions</p>
            <div className="mt-4 space-y-3">
              {users.filter(u => !u.isFollowing).slice(0, 4).map(user => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black truncate block">{user.displayName}</span>
                    <span className="text-xs text-[color:var(--muted)]">@{user.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
