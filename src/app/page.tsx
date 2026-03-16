'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AppShell } from '@/components/shell/AppShell';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
}

interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: number;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface Post {
  id: string;
  user: User;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  timestamp: number;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isBookmarked: boolean;
}

const mockUsers: User[] = [
  { id: '1', username: 'sarahk', displayName: 'Sarah Kim', avatarUrl: '', isVerified: true },
  { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false },
  { id: '3', username: 'jordanl', displayName: 'Jordan Lee', avatarUrl: '', isVerified: true },
  { id: '4', username: 'alexc', displayName: 'Alex Chen', avatarUrl: '', isVerified: false },
  { id: '5', username: 'emilyw', displayName: 'Emily Watson', avatarUrl: '', isVerified: true },
];

const currentUser: User = mockUsers[0];

const mockPosts: Post[] = [
  {
    id: 'post-1',
    user: mockUsers[1],
    content: 'Just contributed to the community pool! The collective savings initiative is gaining momentum. Each one, teach one. 🏦✨',
    timestamp: Date.now() - 3600000,
    likes: 24,
    comments: [
      {
        id: 'c1',
        user: mockUsers[2],
        content: 'This is amazing! Count me in for the next round.',
        timestamp: Date.now() - 1800000,
        likes: 5,
        isLiked: false,
      },
      {
        id: 'c2',
        user: mockUsers[3],
        content: 'Ubuntu in action! "I am because we are"',
        timestamp: Date.now() - 900000,
        likes: 8,
        isLiked: true,
      },
    ],
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 'post-2',
    user: mockUsers[2],
    content: 'Looking for collaborators on the new governance proposal. We need more transparency in how we allocate community funds. Who\'s interested in joining the working group?',
    timestamp: Date.now() - 7200000,
    likes: 42,
    comments: [
      {
        id: 'c3',
        user: mockUsers[4],
        content: 'I\'d love to join! I have experience in financial transparency frameworks.',
        timestamp: Date.now() - 5400000,
        likes: 12,
        isLiked: false,
      },
    ],
    isLiked: false,
    isBookmarked: true,
  },
  {
    id: 'post-3',
    user: mockUsers[3],
    content: 'The trust circle meeting went beautifully today. We awarded 3 new badges to deserving community members. Reputation is truly gifted, not earned alone. 🌟',
    mediaUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
    mediaType: 'image',
    timestamp: Date.now() - 14400000,
    likes: 67,
    comments: [],
    isLiked: true,
    isBookmarked: false,
  },
  {
    id: 'post-4',
    user: mockUsers[4],
    content: 'Reminder: The village council meeting is tomorrow at 7pm UTC. We\'ll be discussing the new circular protocol for proposal voting. See you there! 📅',
    timestamp: Date.now() - 28800000,
    likes: 15,
    comments: [],
    isLiked: false,
    isBookmarked: false,
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
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[color:var(--accent-sage)] to-[color:var(--accent-gold)] flex items-center justify-center text-white font-black relative flex-shrink-0`}>
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.displayName} fill className="rounded-full object-cover" />
      ) : (
        <span className={size === 'lg' ? 'text-lg' : 'text-sm'}>{initial}</span>
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

function PostCard({ post, onLike, onComment, onBookmark }: { post: Post; onLike: (id: string) => void; onComment: (id: string) => void; onBookmark: (id: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = useMemo(() => {
    const diff = currentTime - post.timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }, [post.timestamp, currentTime]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onComment(post.id);
      setNewComment('');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="up-card up-border-gradient p-6"
    >
      <div className="flex gap-4">
        <Avatar user={post.user} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-black">{post.user.displayName}</span>
            {post.user.isVerified && <VerifiedBadge />}
            <span className="text-[color:var(--muted)]">@{post.user.username}</span>
            <span className="text-[color:var(--muted)]">·</span>
            <span className="text-[color:var(--muted)] text-sm">{timeAgo}</span>
          </div>
          
          <p className="mt-3 text-[color:var(--text)] whitespace-pre-wrap">{post.content}</p>
          
          {post.mediaUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-[color:var(--border)] relative aspect-video">
              {post.mediaType === 'image' ? (
                <Image src={post.mediaUrl} alt="Post media" fill className="object-cover" />
              ) : (
                <video src={post.mediaUrl} className="w-full" controls />
              )}
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
            
            <button className="text-sm text-[color:var(--muted)] hover:text-[color:var(--accent-sage)] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </div>
          
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-[color:var(--border)] overflow-hidden"
              >
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 py-3">
                    <Avatar user={comment.user} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{comment.user.displayName}</span>
                        <span className="text-[color:var(--muted)] text-xs">@{comment.user.username}</span>
                      </div>
                      <p className="mt-1 text-sm">{comment.content}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <button className="text-xs text-[color:var(--muted)] hover:text-red-500">
                          <span className={comment.isLiked ? 'text-red-500' : ''}>♥ {comment.likes}</span>
                        </button>
                        <button className="text-xs text-[color:var(--muted)]">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <form onSubmit={handleSubmitComment} className="mt-4 flex gap-3">
                  <Avatar user={currentUser} size="sm" />
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-full text-sm focus:outline-none focus:border-[color:var(--accent-sage)]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[color:var(--accent-sage)] text-white font-black text-xs uppercase rounded-full hover:bg-[color:var(--accent-sage)]/80 transition-colors"
                  >
                    Post
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
}

function CreatePost() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() || media) {
      console.log('Creating post:', { content, media });
      setContent('');
      setMedia(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="up-card up-border-gradient p-6">
      <div className="flex gap-4">
        <Avatar user={currentUser} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in the village?"
            className="w-full min-h-[100px] bg-transparent border-none text-lg placeholder:text-[color:var(--muted)] focus:outline-none resize-none"
          />
          {media && (
            <div className="mt-3 relative inline-block">
              <Image
                src={URL.createObjectURL(media)}
                alt="Preview"
                width={128}
                height={128}
                className="rounded-lg border border-[color:var(--border)]"
              />
              <button
                type="button"
                onClick={() => setMedia(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border)] pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 text-[color:var(--accent-sage)] hover:bg-[color:var(--accent-sage)]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-2 text-[color:var(--accent-sage)] hover:bg-[color:var(--accent-sage)]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                type="button"
                className="p-2 text-[color:var(--accent-sage)] hover:bg-[color:var(--accent-sage)]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              disabled={!content.trim() && !media}
              className="px-6 py-2 bg-[color:var(--accent-gold)] text-white font-black text-sm uppercase rounded-full hover:bg-[color:var(--accent-gold)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);

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

  const handleComment = (postId: string) => {
    console.log('Add comment to post:', postId);
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, isBookmarked: !post.isBookmarked };
      }
      return post;
    }));
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <CreatePost />
          
          <div className="flex gap-2 border-b border-[color:var(--border)] pb-4">
            <button className="px-4 py-2 bg-[color:var(--surface-2)] text-sm font-black uppercase rounded-full">
              For You
            </button>
            <button className="px-4 py-2 text-[color:var(--muted)] text-sm font-black uppercase hover:bg-[color:var(--surface-2)] rounded-full transition-colors">
              Following
            </button>
            <button className="px-4 py-2 text-[color:var(--muted)] text-sm font-black uppercase hover:bg-[color:var(--surface-2)] rounded-full transition-colors">
              Village
            </button>
          </div>
          
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onBookmark={handleBookmark}
            />
          ))}
        </div>
        
        <div className="space-y-6">
          <div className="up-card p-6">
            <p className="up-kicker">Your Profile</p>
            <div className="mt-4 flex items-center gap-4">
              <Avatar user={currentUser} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black">{currentUser.displayName}</span>
                  {currentUser.isVerified && <VerifiedBadge />}
                </div>
                <span className="text-[color:var(--muted)] text-sm">@{currentUser.username}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <span className="font-black">1,234</span>
                <span className="text-[color:var(--muted)] ml-1">Following</span>
              </div>
              <div>
                <span className="font-black">5,678</span>
                <span className="text-[color:var(--muted)] ml-1">Followers</span>
              </div>
            </div>
          </div>
          
          <div className="up-card p-6">
            <p className="up-kicker">Trending</p>
            <div className="mt-4 space-y-3">
              {(['#UbuntuPools', '#CollectiveProsperity', '#TrustCircle', '#Governance', '#VillageLife'] as const).map((tag, i) => (
                <div key={tag} className="flex justify-between text-sm">
                  <span className="text-[color:var(--accent-sage)]">{tag}</span>
                  <span className="text-[color:var(--muted)]">{[247, 189, 156, 98, 72][i]} posts</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="up-card p-6">
            <p className="up-kicker">Who to Follow</p>
            <div className="mt-4 space-y-3">
              {mockUsers.filter(u => u.id !== currentUser.id).slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="sm" />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black">{user.displayName}</span>
                        {user.isVerified && <VerifiedBadge />}
                      </div>
                      <span className="text-xs text-[color:var(--muted)]">@{user.username}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-xs font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
