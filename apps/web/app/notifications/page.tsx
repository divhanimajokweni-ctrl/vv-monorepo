'use client';

import { useState, useMemo } from 'react';
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

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'badge';
  user: User;
  content: string;
  timestamp: number;
  isRead: boolean;
  postId?: string;
}

const mockUsers: User[] = [
  { id: '1', username: 'sarahk', displayName: 'Sarah Kim', avatarUrl: '', isVerified: true },
  { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false },
  { id: '3', username: 'jordanl', displayName: 'Jordan Lee', avatarUrl: '', isVerified: true },
  { id: '4', username: 'alexc', displayName: 'Alex Chen', avatarUrl: '', isVerified: false },
  { id: '5', username: 'emilyw', displayName: 'Emily Watson', avatarUrl: '', isVerified: true },
];

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'like',
    user: mockUsers[1]!,
    content: 'liked your post about the new governance proposal',
    timestamp: Date.now() - 300000,
    isRead: false,
  },
  {
    id: 'n2',
    type: 'comment',
    user: mockUsers[2]!,
    content: 'commented on your post: "This is exactly what we need!"',
    timestamp: Date.now() - 1800000,
    isRead: false,
  },
  {
    id: 'n3',
    type: 'follow',
    user: mockUsers[3]!,
    content: 'started following you',
    timestamp: Date.now() - 3600000,
    isRead: false,
  },
  {
    id: 'n4',
    type: 'badge',
    user: mockUsers[4]!,
    content: 'awarded you the "Knowledge Keeper" badge',
    timestamp: Date.now() - 7200000,
    isRead: true,
  },
  {
    id: 'n5',
    type: 'mention',
    user: mockUsers[1]!,
    content: 'mentioned you in a post: "@sarahk thoughts on this?"',
    timestamp: Date.now() - 14400000,
    isRead: true,
    postId: 'post-123',
  },
  {
    id: 'n6',
    type: 'message',
    user: mockUsers[2]!,
    content: 'sent you a message',
    timestamp: Date.now() - 86400000,
    isRead: true,
  },
  {
    id: 'n7',
    type: 'like',
    user: mockUsers[3]!,
    content: 'liked your comment',
    timestamp: Date.now() - 172800000,
    isRead: true,
  },
  {
    id: 'n8',
    type: 'follow',
    user: mockUsers[4]!,
    content: 'started following you',
    timestamp: Date.now() - 259200000,
    isRead: true,
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
        <span className={size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'}>{initial}</span>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconClasses = 'w-5 h-5';
  
  switch (type) {
    case 'like':
      return (
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className={`${iconClasses} text-red-500`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      );
    case 'comment':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <svg className={`${iconClasses} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      );
    case 'follow':
      return (
        <div className="w-8 h-8 rounded-full bg-[color:var(--accent-sage)]/20 flex items-center justify-center">
          <svg className={`${iconClasses} text-[color:var(--accent-sage)]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      );
    case 'badge':
      return (
        <div className="w-8 h-8 rounded-full bg-[color:var(--accent-gold)]/20 flex items-center justify-center">
          <svg className={`${iconClasses} text-[color:var(--accent-gold)]`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      );
    case 'mention':
      return (
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
          <svg className={`${iconClasses} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>
      );
    case 'message':
      return (
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className={`${iconClasses} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="up-card up-border-gradient p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="up-kicker">Notifications</p>
                <h1 className="mt-2 text-2xl font-black tracking-tighter">Stay Updated</h1>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-black uppercase border border-[color:var(--accent-gold)] text-[color:var(--accent-gold)] rounded-full hover:bg-[color:var(--accent-gold)] hover:text-white transition-colors"
                >
                  Mark All Read
                </button>
              )}
            </div>
            
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-black uppercase rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-[color:var(--surface-2)]'
                    : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 text-sm font-black uppercase rounded-full transition-colors ${
                  filter === 'unread'
                    ? 'bg-[color:var(--surface-2)]'
                    : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
            
            <div className="space-y-2">
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                      notification.isRead
                        ? 'hover:bg-[color:var(--surface-2)]'
                        : 'bg-[color:var(--surface-2)]'
                    }`}
                  >
                    <div className="relative">
                      <Avatar user={notification.user} />
                      <div className="absolute -bottom-1 -right-1">
                        <NotificationIcon type={notification.type} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-black">{notification.user.displayName}</span>
                        {' '}
                        <span className="text-[color:var(--muted)]">{notification.content}</span>
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-[color:var(--accent-gold)] rounded-full" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredNotifications.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[color:var(--surface-2)] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[color:var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-[color:var(--muted)]">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="up-card p-6">
            <p className="up-kicker">Notification Settings</p>
            <div className="mt-4 space-y-4">
              {[
                { label: 'Likes', description: 'When someone likes your posts' },
                { label: 'Comments', description: 'When someone comments on your posts' },
                { label: 'Follows', description: 'When someone follows you' },
                { label: 'Mentions', description: 'When someone mentions you' },
                { label: 'Messages', description: 'When you receive a message' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm">{item.label}</p>
                    <p className="text-xs text-[color:var(--muted)]">{item.description}</p>
                  </div>
                  <button className="relative w-10 h-6 bg-[color:var(--surface-2)] rounded-full transition-colors">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-[color:var(--accent-gold)] rounded-full transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="up-card p-6">
            <p className="up-kicker">Stats</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-xl">
                <p className="text-2xl font-black">{unreadCount}</p>
                <p className="text-xs text-[color:var(--muted)]">Unread</p>
              </div>
              <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-xl">
                <p className="text-2xl font-black">{notifications.length}</p>
                <p className="text-xs text-[color:var(--muted)]">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
