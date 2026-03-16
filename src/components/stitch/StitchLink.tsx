'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface StitchLinkOnSuccess {
  publicToken: string;
  institution: {
    id: string;
    name: string;
  };
}

interface StitchLinkOptions {
  onSuccess: (result: StitchLinkOnSuccess) => void;
  onExit?: () => void;
  onEvent?: (eventName: string, metadata?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    Stitch?: {
      Link: {
        initialize: (config: {
          linkToken: string;
          onSuccess: (result: { publicToken: string; institution: { institution_id: string; name: string } }) => void;
          onExit: () => void;
          onEvent: (eventName: string) => void;
        }) => {
          open: () => void;
        };
      };
    };
  }
}

export function StitchLink({ onSuccess, onExit, onEvent }: StitchLinkOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkInstanceRef = useRef<{ open: () => void } | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://cdn.stitch.com/link/init.js';
    script.async = true;
    script.onload = () => {
      if (onEvent) onEvent('load');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onEvent]);

  const openLink = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stitch/create-link-token', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!window.Stitch?.Link) {
        throw new Error('Stitch Link SDK not loaded');
      }

      const link = window.Stitch.Link.initialize({
        linkToken: data.link_token,
        onSuccess: (result) => {
          onSuccess({
            publicToken: result.publicToken,
            institution: {
              id: result.institution.institution_id,
              name: result.institution.name,
            },
          });
          setLoading(false);
        },
        onExit: () => {
          if (onExit) onExit();
          setLoading(false);
        },
        onEvent: (eventName) => {
          if (onEvent) onEvent(eventName);
        },
      });

      linkInstanceRef.current = link;
      link.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open bank connection');
      setLoading(false);
    }
  }, [onSuccess, onExit, onEvent]);

  return (
    <div className="stitch-link-container">
      <button
        onClick={openLink}
        disabled={loading}
        className="stitch-connect-button"
        style={{
          backgroundColor: '#00D4AA',
          color: '#000',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <>
            <span className="spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid #000',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Connecting...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/>
            </svg>
            Connect Bank Account
          </>
        )}
      </button>
      
      {error && (
        <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </p>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function BankConnectionButton(props: StitchLinkOptions) {
  return <StitchLink {...props} />;
}
