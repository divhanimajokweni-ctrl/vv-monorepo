'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'reputation' | 'payments' | 'security' | 'prosperity';
}

const faqItems: FAQItem[] = [
  {
    id: 'ubuntu-score',
    category: 'reputation',
    question: 'What is the Ubuntu Score?',
    answer: 'It is a bias-free reputation matrix. Unlike traditional credit scores that look at your debt, the Ubuntu Score measures your contribution velocity, community vouching, and altruism within the circle.',
  },
  {
    id: 'vouching',
    category: 'reputation',
    question: 'How does vouching work?',
    answer: 'High-score members can vouch for newcomers. This puts a portion of the vouchers social capital at stake, allowing the newcomer to bypass initial trust thresholds for stock advances or loans.',
  },
  {
    id: 'payjustnow',
    category: 'payments',
    question: 'How does PayJustNow (BNPL) work for contributions?',
    answer: 'If you are facing a temporary cash gap, you can choose PayJustNow. It pays your full pool commitment immediately, but you pay them back in 3 interest-free installments. This ensures you never miss a pool cycle and protect your Ubuntu Score.',
  },
  {
    id: 'payshap',
    category: 'payments',
    question: 'What is PayShap?',
    answer: 'PayShap is South Africa rapid payment service. It allows you to make instant payments using just a cell phone number (ShapID). These payments clear within seconds, removing the need for 48-hour wait times for bank verification.',
  },
  {
    id: 'bank-status',
    category: 'security',
    question: 'Is Ubuntu Pools a bank?',
    answer: 'No. We are a Digital Aggregator and non-custodial ledger. We do not hold your funds; we facilitate the governance and agreement logic between members, while funds move through registered FICA-compliant institutions.',
  },
  {
    id: 'fica',
    category: 'security',
    question: 'Why is FICA required?',
    answer: 'To protect the collective from illicit flows and comply with the South African Financial Intelligence Centre Act. It ensures every kinsman in your circle is verified and legitimate.',
  },
  {
    id: 'wealth-reserve',
    category: 'prosperity',
    question: 'What is the Family Wealth Reserve?',
    answer: 'A specialized pool tier that includes Succession Rules. It allows a parent to pass their Trust DNA and pool position to a child, ensuring generational wealth is not lost.',
  },
  {
    id: 'sme-circles',
    category: 'prosperity',
    question: 'How do SME Bulk-Buying circles work?',
    answer: 'Multiple small businesses (like Spaza shops) pool their buying power. Our AI-driven Proposal Architect then helps you negotiate directly with giants like Makro for wholesale discounts.',
  },
];

const categoryLabels: Record<string, string> = {
  reputation: 'Philosophy & Trust',
  payments: 'Payments & Liquidity',
  security: 'Security & Legal',
  prosperity: 'Prosperity Tiers',
};

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredItems = activeCategory === 'all'
    ? faqItems
    : faqItems.filter(item => item.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Frequently Asked Questions</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-terracotta/20 text-sunset">AI Assistant</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            activeCategory === 'all'
              ? 'bg-harvest text-neutral-900'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          All
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              activeCategory === key
                ? 'bg-harvest text-neutral-900'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
          >
            <details className="faq-item group">
              <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                <p className="text-white text-sm font-medium">{item.question}</p>
                <span className="text-neutral-400 transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p className="text-neutral-400 text-sm mt-3 pt-3 border-t border-neutral-700">
                {item.answer}
              </p>
            </details>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-terracotta/10 to-clay/10 border border-terracotta/20 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">Still have questions?</p>
          <p className="text-neutral-400 text-xs">Meet Lindiwe, our AI assistant</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-harvest text-neutral-900 text-sm font-medium hover:bg-harvest-light transition-colors">
          Chat with Lindiwe
        </button>
      </div>
    </motion.div>
  );
}
