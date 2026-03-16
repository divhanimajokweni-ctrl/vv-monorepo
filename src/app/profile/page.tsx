'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AppShell } from '@/components/shell/AppShell';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  isVerified: boolean;
  bio: string;
  location: string;
  website: string;
  joinedDate: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
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
  isBookmarked: boolean;
}

const mockUser: User = {
  id: '1',
  username: 'sarahk',
  displayName: 'Sarah Kim',
  avatarUrl: '',
  coverUrl: '',
  isVerified: true,
  bio: 'Building collective prosperity through Ubuntu. Trust circle advocate & governance enthusiast.',
  location: 'Cape Town, South Africa',
  website: 'sarahkim.io',
  joinedDate: 'January 2025',
  followersCount: 1234,
  followingCount: 567,
  postsCount: 156,
  isFollowing: false,
  isOwnProfile: true,
};

const mockPosts: Post[] = [
  {
    id: 'post-1',
    user: mockUser,
    content: 'The governance proposal is now live! Everyone please review and share your thoughts. #UbuntuPools #Governance',
    timestamp: Date.now() - 3600000,
    likes: 42,
    comments: [
      { id: 'c1', user: { ...mockUser, id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false }, content: 'Looks great! I have a few suggestions.' },
    ],
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 'post-2',
    user: mockUser,
    content: 'Just earned my third badge! The trust circle truly works when we support each other. #TrustCircle #Ubuntu',
    mediaUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
    mediaType: 'image',
    timestamp: Date.now() - 7200000,
    likes: 89,
    comments: [],
    isLiked: false,
    isBookmarked: true,
  },
  {
    id: 'post-3',
    user: mockUser,
    content: 'Looking for collaborators on the new village council initiative. DM me if you\'re interested! Building together is what Ubuntu is all about.',
    timestamp: Date.now() - 14400000,
    likes: 23,
    comments: [],
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 'post-4',
    user: mockUser,
    content: 'The pool is looking healthy this month! R15,000 in collective savings. Let\'s keep growing together. #CollectiveProsperity',
    timestamp: Date.now() - 86400000,
    likes: 156,
    comments: [],
    isLiked: false,
    isBookmarked: false,
  },
];

const mockFollowers: User[] = [
  { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false, bio: '', coverUrl: '', location: '', website: '', joinedDate: '', followersCount: 0, followingCount: 0, postsCount: 0, isFollowing: true, isOwnProfile: false },
  { id: '3', username: 'jordanl', displayName: 'Jordan Lee', avatarUrl: '', isVerified: true, bio: '', coverUrl: '', location: '', website: '', joinedDate: '', followersCount: 0, followingCount: 0, postsCount: 0, isFollowing: true, isOwnProfile: false },
  { id: '4', username: 'alexc', displayName: 'Alex Chen', avatarUrl: '', isVerified: false, bio: '', coverUrl: '', location: '', website: '', joinedDate: '', followersCount: 0, followingCount: 0, postsCount: 0, isFollowing: false, isOwnProfile: false },
];

const mockFollowing: User[] = [
  { id: '5', username: 'emilyw', displayName: 'Emily Watson', avatarUrl: '', isVerified: true, bio: '', coverUrl: '', location: '', website: '', joinedDate: '', followersCount: 0, followingCount: 0, postsCount: 0, isFollowing: true, isOwnProfile: false },
  { id: '6', username: 'davidm', displayName: 'David Miller', avatarUrl: '', isVerified: false, bio: '', coverUrl: '', location: '', website: '', joinedDate: '', followersCount: 0, followingCount: 0, postsCount: 0, isFollowing: true, isOwnProfile: false },
  { id: '7', username: 'jessicap', displayName: 'Jessica Park', avatarUrl: '', isVerified: true, bio: '', coverUrl: '', location: '', website: '', joinedDate: '', followersCount: 0, followingCount: 0, postsCount: 0, isFollowing: false, isOwnProfile: false },
];

function Avatar({ user, size = 'md', className = '' }: { user: User; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  
  const initial = user.displayName.charAt(0).toUpperCase();
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[color:var(--accent-sage)] to-[color:var(--accent-gold)] flex items-center justify-center text-white font-black flex-shrink-0 relative ${className}`}>
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.displayName} fill className="rounded-full object-cover" />
      ) : (
        <span className={size === 'xl' ? 'text-3xl' : size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm'}>{initial}</span>
      )}
    </div>
  );
}

function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <svg className={`${sizeClasses[size]} text-[color:var(--accent-sage)]`} fill="currentColor" viewBox="0 0 20 20">
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

function PostCard({ post, onLike, onBookmark }: { post: Post; onLike: (id: string) => void; onBookmark: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="up-card up-border-gradient p-6"
    >
      <div className="flex gap-4">
        <Avatar user={post.user} size="sm" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-black">{post.user.displayName}</span>
            {post.user.isVerified && <VerifiedBadge size="sm" />}
            <span className="text-[color:var(--muted)]">@{post.user.username}</span>
            <span className="text-[color:var(--muted)]">·</span>
            <span className="text-[color:var(--muted)] text-sm">{formatTime(post.timestamp)}</span>
          </div>
          
          <p className="mt-3 text-[color:var(--text)] whitespace-pre-wrap">{post.content}</p>
          
          {post.mediaUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-[color:var(--border)] relative aspect-video">
              <Image src={post.mediaUrl} alt="Post media" fill className="object-cover" />
            </div>
          )}
          
          <div className="mt-4 flex items-center gap-6">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 text-sm transition-colors ${
                post.isLiked ? 'text-red-500' : 'text-[color:var(--muted)] hover:text-red-500'
              }`}
            >
              <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes}</span>
            </button>
            
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--accent-sage)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.comments.length}</span>
            </button>
            
            <button
              onClick={() => onBookmark(post.id)}
              className={`ml-auto text-sm transition-colors ${
                post.isBookmarked ? 'text-[color:var(--accent-gold)]' : 'text-[color:var(--muted)] hover:text-[color:var(--accent-gold)]'
              }`}
            >
              <svg className="w-5 h-5" fill={post.isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
          
          <AnimatePresence>
            {showComments && post.comments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-[color:var(--border)] overflow-hidden"
              >
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 py-2">
                    <Avatar user={comment.user} size="sm" />
                    <div>
                      <span className="font-black text-sm">{comment.user.displayName}</span>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User>(mockUser);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'media' | 'followers' | 'following'>('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const handleToggleFollow = () => {
    setUser({
      ...user,
      isFollowing: !user.isFollowing,
      followersCount: user.isFollowing ? user.followersCount - 1 : user.followersCount + 1,
    });
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, isBookmarked: !post.isBookmarked };
      }
      return post;
    }));
  };

  const displayedPosts = activeTab === 'likes' 
    ? posts.filter(p => p.isLiked)
    : activeTab === 'media'
    ? posts.filter(p => p.mediaUrl)
    : posts;

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="up-card up-border-gradient overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[color:var(--accent-sage)] via-[color:var(--accent-gold)] to-[color:var(--accent-clay)]" />
            
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <div className="relative">
                  <div className="p-1 bg-[color:var(--surface)] rounded-full">
                    <Avatar user={user} size="xl" />
                  </div>
                  {user.isVerified && (
                    <div className="absolute bottom-2 right-2 p-1 bg-[color:var(--surface)] rounded-full">
                      <VerifiedBadge size="lg" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div>
                      <h1 className="text-2xl font-black tracking-tighter">{user.displayName}</h1>
                      <span className="text-[color:var(--muted)]">@{user.username}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {user.isOwnProfile ? (
                    <>
                      <button className="px-4 py-2 text-sm font-black uppercase border border-[color:var(--border)] rounded-full hover:bg-[color:var(--surface-2)] transition-colors">
                        Edit Profile
                      </button>
                      <button className="p-2 border border-[color:var(--border)] rounded-full hover:bg-[color:var(--surface-2)] transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleToggleFollow}
                        className={`px-6 py-2 text-sm font-black uppercase rounded-full transition-colors ${
                          user.isFollowing
                            ? 'border border-[color:var(--border)] hover:border-red-500 hover:text-red-500'
                            : 'bg-[color:var(--accent-gold)] text-white hover:bg-[color:var(--accent-gold)]/80'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button className="px-4 py-2 text-sm font-black uppercase border border-[color:var(--border)] rounded-full hover:bg-[color:var(--surface-2)] transition-colors">
                        Message
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <p className="mt-4 text-[color:var(--text)]">{user.bio}</p>
              
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <a href={`https://${user.website}`} className="flex items-center gap-1 hover:text-[color:var(--accent-sage)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {user.website}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Joined {user.joinedDate}
                </span>
              </div>
              
              <div className="mt-6 flex gap-6">
                <button 
                  onClick={() => setShowFollowers(true)}
                  className="hover:text-[color:var(--accent-sage)]"
                >
                  <span className="font-black">{user.followersCount}</span>
                  <span className="text-[color:var(--muted)] ml-1">Followers</span>
                </button>
                <button 
                  onClick={() => setShowFollowing(true)}
                  className="hover:text-[color:var(--accent-sage)]"
                >
                  <span className="font-black">{user.followingCount}</span>
                  <span className="text-[color:var(--muted)] ml-1">Following</span>
                </button>
                <div>
                  <span className="font-black">{user.postsCount}</span>
                  <span className="text-[color:var(--muted)] ml-1">Posts</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex gap-2 border-b border-[color:var(--border)] pb-4 overflow-x-auto">
              {(['posts', 'likes', 'media'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-black uppercase whitespace-nowrap rounded-full transition-colors ${
                    activeTab === tab
                      ? 'bg-[color:var(--surface-2)]'
                      : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="mt-6 space-y-6">
              {displayedPosts.length > 0 ? (
                displayedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                  />
                ))
              ) : (
                <div className="up-card p-12 text-center">
                  <p className="text-[color:var(--muted)]">No {activeTab} yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="up-card p-6">
            <p className="up-kicker">Badges</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { name: 'Knowledge Keeper', color: 'bg-blue-500' },
                { name: 'Community Builder', color: 'bg-green-500' },
                { name: 'Truth Teller', color: 'bg-purple-500' },
              ].map((badge) => (
                <div key={badge.name} className="text-center">
                  <div className={`w-12 h-12 ${badge.color} rounded-full mx-auto flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="up-card p-6">
            <p className="up-kicker">Photos & Videos</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {posts.filter(p => p.mediaUrl).slice(0, 6).map((post) => (
                <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-[color:var(--surface-2)] relative">
                  <Image src={post.mediaUrl!} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showFollowers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowFollowers(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md up-card up-border-gradient p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">Followers</h2>
                <button onClick={() => setShowFollowers(false)} className="text-[color:var(--muted)] hover:text-[color:var(--text)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {mockFollowers.map((follower) => (
                  <div key={follower.id} className="flex items-center gap-3 p-3 bg-[color:var(--surface-2)] rounded-xl">
                    <Avatar user={follower} size="md" />
                    <div className="flex-1">
                      <span className="font-black">{follower.displayName}</span>
                      {follower.isVerified && <VerifiedBadge size="sm" />}
                      <p className="text-sm text-[color:var(--muted)]">@{follower.username}</p>
                    </div>
                    <button className="px-3 py-1 text-xs font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white">
                      {follower.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showFollowing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowFollowing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md up-card up-border-gradient p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">Following</h2>
                <button onClick={() => setShowFollowing(false)} className="text-[color:var(--muted)] hover:text-[color:var(--text)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {mockFollowing.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-[color:var(--surface-2)] rounded-xl">
                    <Avatar user={user} size="md" />
                    <div className="flex-1">
                      <span className="font-black">{user.displayName}</span>
                      {user.isVerified && <VerifiedBadge size="sm" />}
                      <p className="text-sm text-[color:var(--muted)]">@{user.username}</p>
                    </div>
                    <button className="px-3 py-1 text-xs font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white">
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
