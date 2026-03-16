'use client';

import { motion } from 'framer-motion';

interface PrivacyBadgeProps {
  userId: string;
  peerBadges?: string[];
  showDecryption?: boolean;
}

export function PrivacyBadge({ userId, peerBadges = [], showDecryption = false }: PrivacyBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="privacy-badge">
        <span>🔒</span>
        <span className="font-mono">{userId.slice(0, 8)}...</span>
      </div>
      
      {peerBadges.length > 0 && (
        <div className="flex items-center gap-1">
          {peerBadges.slice(0, 2).map((badge, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="px-2 py-0.5 bg-harvest/20 text-harvest text-xs rounded-full"
              title={badge}
            >
              🏅
            </motion.span>
          ))}
        </div>
      )}
      
      {showDecryption && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-harvest hover:underline"
        >
          Dignity Decryption
        </motion.button>
      )}
    </div>
  );
}

interface ConsentCardProps {
  consentVersion: string;
  legalBasis: string;
  onConsent?: () => void;
}

export function ConsentCard({ consentVersion, legalBasis, onConsent }: ConsentCardProps) {
  return (
    <div className="consent-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400">Consent Version</span>
        <span className="compliance-badge">{consentVersion}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">Legal Basis</span>
        <span className="text-xs text-earth font-medium">{legalBasis}</span>
      </div>
      {onConsent && (
        <button
          onClick={onConsent}
          className="w-full mt-3 py-2 bg-earth/20 text-earth text-sm rounded hover:bg-earth/30 transition-colors"
        >
          Acknowledge & Continue
        </button>
      )}
    </div>
  );
}

interface ComplianceMetaProps {
  consentVersion: string;
  legalBasis: string;
  dataRetention?: string;
}

export function ComplianceMeta({ 
  consentVersion = 'v1.0.0', 
  legalBasis = 'Contractual Necessity',
  dataRetention = '7 years'
}: ComplianceMetaProps) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="compliance-badge">
        Consent: {consentVersion}
      </span>
      <span className="text-neutral-500">|</span>
      <span className="text-neutral-400">
        Basis: <span className="text-earth">{legalBasis}</span>
      </span>
      <span className="text-neutral-500">|</span>
      <span className="text-neutral-400">
        Retention: {dataRetention}
      </span>
    </div>
  );
}

export function PseudonymizedActor({ 
  actorId, 
  showFull = false 
}: { 
  actorId: string; 
  showFull?: boolean;
}) {
  return (
    <span className="font-mono text-sm text-neutral-400">
      {showFull ? actorId : actorId.slice(0, 8)}
    </span>
  );
}

export function RTBFRequest({ 
  status, 
  requestedAt 
}: { 
  status: 'pending' | 'processing' | 'completed';
  requestedAt: string;
}) {
  const statusColors = {
    pending: 'text-yellow-500',
    processing: 'text-blue-500',
    completed: 'text-earth',
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-clay">🗑️</span>
        <span className="text-sm text-white">Right to be Forgotten</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span className="text-xs text-neutral-500">
          Requested: {new Date(requestedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
