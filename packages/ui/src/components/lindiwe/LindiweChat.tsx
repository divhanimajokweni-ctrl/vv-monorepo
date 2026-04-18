'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLindiwe } from './LindiweContext';

interface Message {
  id: string;
  role: 'lindiwe' | 'user';
  content: string;
  timestamp: Date;
  actions?: { label: string; actionType: string }[];
}

export function LindiweChat() {
  const { greeting, analysis, generateNudge, evolve, isActive, toggleActive } = useLindiwe();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!isActive) return [];
    const initialMessage: Message = {
      id: '1',
      role: 'lindiwe',
      content: greeting,
      timestamp: new Date(),
      actions: analysis?.recommendedActions?.slice(0, 2).map(action => ({
        label: action.type.replace(/_/g, ' '),
        actionType: action.type,
      })),
    };
    return [initialMessage];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback((actionType: string) => {
    const nudge = generateNudge();
    const response: Message = {
      id: Date.now().toString(),
      role: 'lindiwe',
      content: nudge,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, response]);
    
    if (analysis?.learningToken) {
      evolve(analysis.learningToken, true, actionType);
    }
  }, [generateNudge, analysis, evolve]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "Our Ubuntu Accord teaches that a single thread cannot hold a tapestry alone. Your question touches on the very heart of our collective strength.",
        "I see your concern reflected in the Village Pulse. Let me guide you toward what your Trust Circle has found helpful.",
        "The collective wisdom of our 24 members shows that patience and participation yield the sweetest fruit.",
      ];
      
      const lindiweResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'lindiwe',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, lindiweResponse]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isActive) {
    return (
      <button
        onClick={toggleActive}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[color:var(--accent-gold)] shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Activate Lindiwe"
      >
        <span className="text-2xl">💬</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-6 right-6 w-80 md:w-96 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      <div className="bg-gradient-to-r from-[color:var(--accent-sage)] to-[color:var(--accent-gold)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-xl">👑</span>
          </div>
          <div>
            <h3 className="font-black text-white text-sm">Lindiwe AI</h3>
            <p className="text-xs text-white/70">Financial Matriarch</p>
          </div>
        </div>
        <button
          onClick={toggleActive}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Minimize chat"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'lindiwe'
                  ? 'bg-[color:var(--surface)] border border-[color:var(--border)]'
                  : 'bg-[color:var(--accent-ubuntu)] text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleAction(action.actionType)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-[color:var(--accent-gold)] text-white hover:opacity-90 transition-opacity"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[color:var(--muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[color:var(--muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[color:var(--muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[color:var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Lindiwe..."
            className="flex-1 px-4 py-2 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] text-sm focus:outline-none focus:border-[color:var(--accent-gold)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[color:var(--accent-gold)] text-white flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
