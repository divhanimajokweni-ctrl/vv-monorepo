'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { AppShell } from '@/components/shell/AppShell';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  messages: Message[];
}

const mockUsers: User[] = [
  { id: '1', username: 'sarahk', displayName: 'Sarah Kim', avatarUrl: '', isVerified: true, isOnline: true },
  { id: '2', username: 'marcusc', displayName: 'Marcus Chen', avatarUrl: '', isVerified: false, isOnline: false },
  { id: '3', username: 'jordanl', displayName: 'Jordan Lee', avatarUrl: '', isVerified: true, isOnline: true },
  { id: '4', username: 'alexc', displayName: 'Alex Chen', avatarUrl: '', isVerified: false, isOnline: false },
  { id: '5', username: 'emilyw', displayName: 'Emily Watson', avatarUrl: '', isVerified: true, isOnline: true },
];

const currentUserId = '1';

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: mockUsers[1],
    lastMessage: 'The governance proposal looks great! Let me know when you want to discuss.',
    timestamp: Date.now() - 1800000,
    unreadCount: 2,
    messages: [
      { id: 'm1', senderId: '2', content: 'Hey! Did you see the new proposal?', timestamp: Date.now() - 3600000, isRead: true },
      { id: 'm2', senderId: '1', content: 'Yes! It looks very well thought out.', timestamp: Date.now() - 3000000, isRead: true },
      { id: 'm3', senderId: '2', content: 'The governance proposal looks great! Let me know when you want to discuss.', timestamp: Date.now() - 1800000, isRead: false },
    ],
  },
  {
    id: 'conv-2',
    user: mockUsers[2],
    lastMessage: 'Thanks for the badge! Really appreciate it.',
    timestamp: Date.now() - 7200000,
    unreadCount: 0,
    messages: [
      { id: 'm4', senderId: '3', content: 'Thanks for the badge! Really appreciate it.', timestamp: Date.now() - 7200000, isRead: true },
    ],
  },
  {
    id: 'conv-3',
    user: mockUsers[3],
    lastMessage: 'See you at the village council meeting tomorrow!',
    timestamp: Date.now() - 14400000,
    unreadCount: 1,
    messages: [
      { id: 'm5', senderId: '4', content: 'See you at the village council meeting tomorrow!', timestamp: Date.now() - 1440000, isRead: false },
    ],
  },
  {
    id: 'conv-4',
    user: mockUsers[4],
    lastMessage: 'The pool is looking healthy this month!',
    timestamp: Date.now() - 86400000,
    unreadCount: 0,
    messages: [
      { id: 'm6', senderId: '5', content: 'The pool is looking healthy this month!', timestamp: Date.now() - 86400000, isRead: true },
    ],
  },
];

function Avatar({ user, size = 'md', showOnline }: { user: User; size?: 'sm' | 'md' | 'lg'; showOnline?: boolean }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  
  const initial = user.displayName.charAt(0).toUpperCase();
  
  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[color:var(--accent-sage)] to-[color:var(--accent-gold)] flex items-center justify-center text-white font-black relative`}>
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt={user.displayName} fill className="rounded-full object-cover" />
        ) : (
          <span className={size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'}>{initial}</span>
        )}
      </div>
      {showOnline && user.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[color:var(--surface)] rounded-full" />
      )}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <svg className="w-3 h-3 text-[color:var(--accent-sage)]" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: currentUserId,
      content: newMessage,
      timestamp: Date.now(),
      isRead: true,
    };

    setConversations(conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessage: newMessage,
          timestamp: Date.now(),
        };
      }
      return conv;
    }));

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMsg],
    } : null);

    setNewMessage('');
    
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setConversations(conversations.map(c => {
      if (c.id === conv.id) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="up-card up-border-gradient p-6">
            <div className="flex items-center justify-between mb-6">
              <p className="up-kicker">Messages</p>
              {totalUnread > 0 && (
                <span className="px-2 py-1 bg-[color:var(--accent-gold)] text-white text-xs font-black rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <AnimatePresence>
                {conversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-[color:var(--surface-2)]'
                        : 'hover:bg-[color:var(--surface-2)]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Avatar user={conv.user} showOnline />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-sm truncate">{conv.user.displayName}</span>
                        {conv.user.isVerified && <VerifiedBadge />}
                      </div>
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-[color:var(--text)] font-black' : 'text-[color:var(--muted)]'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-[color:var(--muted)]">{formatTime(conv.timestamp)}</span>
                      {conv.unreadCount > 0 && (
                        <span className="mt-1 w-5 h-5 bg-[color:var(--accent-gold)] text-white text-xs font-black rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="up-card up-border-gradient min-h-[400px] h-[calc(100vh-16rem)] max-h-[700px] flex flex-col">
            {selectedConversation ? (
              <>
                <div className="flex items-center gap-4 p-4 border-b border-[color:var(--border)]">
                  <Avatar user={selectedConversation.user} showOnline />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-black">{selectedConversation.user.displayName}</span>
                      {selectedConversation.user.isVerified && <VerifiedBadge />}
                    </div>
                    <span className="text-xs text-[color:var(--muted)]">
                      {selectedConversation.user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <button className="ml-auto p-2 text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && <Avatar user={selectedConversation.user} size="sm" />}
                          <div className={`mt-1 px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-[color:var(--accent-gold)] text-white'
                              : 'bg-[color:var(--surface-2)]'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className={`mt-1 text-xs text-[color:var(--muted)] ${isOwn ? 'text-right' : ''}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-[color:var(--muted)]"
                    >
                      <Avatar user={selectedConversation.user} size="sm" />
                      <div className="flex gap-1 px-4 py-2 bg-[color:var(--surface-2)] rounded-2xl">
                        <span className="w-2 h-2 bg-[color:var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[color:var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[color:var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[color:var(--border)]">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="p-2 text-[color:var(--muted)] hover:text-[color:var(--accent-sage)] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-full text-sm focus:outline-none focus:border-[color:var(--accent-sage)]"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-3 bg-[color:var(--accent-sage)] text-white rounded-full hover:bg-[color:var(--accent-sage)]/80 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[color:var(--surface-2)] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[color:var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-[color:var(--muted)]">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="up-card p-6">
            <p className="up-kicker">New Message</p>
            <div className="mt-4 space-y-2">
              {mockUsers.filter(u => u.id !== currentUserId).map((user) => (
                <button
                  key={user.id}
                  className="w-full flex items-center gap-3 p-2 hover:bg-[color:var(--surface-2)] rounded-xl transition-colors"
                >
                  <Avatar user={user} showOnline />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-black text-sm">{user.displayName}</span>
                      {user.isVerified && <VerifiedBadge />}
                    </div>
                    <span className="text-xs text-[color:var(--muted)]">@{user.username}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
