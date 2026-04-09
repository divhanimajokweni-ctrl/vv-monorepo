'use client';

import { useState } from 'react';

export default function LandingPage() {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [phone,   setPhone]   = useState('');
  const [consent, setConsent] = useState(false);
  const [status,  setStatus]  = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit() {
    if (!name || !email || !consent) return;
    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist/join', {
        method:  'POST',
        headers: {
          'Content-Type':    'application/json',
          'x-popia-consent': 'granted',
        },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(`You're confirmed, ${name}. Check your inbox.`);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <main style={{
      minHeight:      '100vh',
      background:     '#0D1B2A',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
      fontFamily:     'Georgia, serif',
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>

        <p style={{ color: '#B8962E', letterSpacing: '0.15em', fontSize: 11, marginBottom: 8 }}>
          VAGUELY VANITY LLC
        </p>
        <h1 style={{ color: '#fff', fontSize: 38, fontWeight: 400, margin: '0 0 8px' }}>
          Ubuntu Pools
        </h1>
        <p style={{ color: '#B8962E', fontSize: 14, fontStyle: 'italic', marginBottom: 32 }}>
          &ldquo;Umuntu ngumuntu ngabantu&rdquo;
        </p>
        <p style={{ color: '#ccc', lineHeight: 1.7, marginBottom: 40, fontSize: 15 }}>
          Community savings built on Ubuntu philosophy.
          Stake from R500. Earn together. Governed by the group, not a bank.
        </p>

        {status === 'success' ? (
          <div style={{
            background: '#0a2a18', border: '1px solid #B8962E',
            borderRadius: 10, padding: '24px', color: '#B8962E',
          }}>
            <p style={{ margin: 0, fontSize: 16 }}>{message}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text" placeholder="Your name"
              value={name} onChange={e => setName(e.target.value)}
              style={input}
            />
            <input
              type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              style={input}
            />
            <input
              type="tel" placeholder="Phone (optional)"
              value={phone} onChange={e => setPhone(e.target.value)}
              style={input}
            />
            <label style={{ display:'flex', gap:10, color:'#aaa', fontSize:12,
              textAlign:'left', cursor:'pointer', lineHeight:1.5 }}>
              <input type="checkbox" checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              I consent to Ubuntu Pools processing my information under POPIA to
              manage my waitlist registration and send updates.
            </label>
            <button
              onClick={handleSubmit}
              disabled={!name || !email || !consent || status === 'loading'}
              style={btn(!name || !email || !consent || status === 'loading')}
            >
              {status === 'loading' ? 'Confirming...' : 'Confirm my spot'}
            </button>
            {status === 'error' && (
              <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>{message}</p>
            )}
          </div>
        )}

        <p style={{ color: '#555', fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
          Gqeberha, Eastern Cape, South Africa<br/>
          Pro Installations Pty Ltd — Vaguely Vanity LLC
        </p>
      </div>
    </main>
  );
}

const input: React.CSSProperties = {
  background:   '#1a2d42',
  border:       '1px solid #2a3d52',
  borderRadius: 8,
  padding:      '12px 16px',
  color:        '#fff',
  fontSize:     15,
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
};

const btn = (disabled: boolean): React.CSSProperties => ({
  background:    disabled ? '#2a3d52' : '#B8962E',
  color:         disabled ? '#666'    : '#0D1B2A',
  border:        'none',
  borderRadius:  8,
  padding:       '14px',
  fontSize:      15,
  fontWeight:    600,
  cursor:        disabled ? 'not-allowed' : 'pointer',
  transition:    'all 0.2s',
  letterSpacing: '0.05em',
  fontFamily:    'Georgia, serif',
});
