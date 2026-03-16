'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ThemeMode = 'light' | 'dark';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = window.localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) return 'dark';
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  const navItems = useMemo(
    () => [
      { name: 'Feed', path: '/', icon: 'home' },
      { name: 'Messages', path: '/messages', icon: 'chat' },
      { name: 'Notifications', path: '/notifications', icon: 'bell' },
      { name: 'Search', path: '/search', icon: 'search' },
      { name: 'Village', path: '/village', icon: 'users' },
      { name: 'Profile', path: '/profile', icon: 'user' },
      { name: 'Ledger', path: '/ledger', icon: 'ledger' },
      { name: 'Privacy', path: '/privacy', icon: 'shield' },
      { name: 'Settings', path: '/settings', icon: 'settings' },
    ],
    []
  );

  const NavIcon = ({ icon, className }: { icon: string; className?: string }) => {
    switch (icon) {
      case 'home':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'chat':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'search':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'users':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'user':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'ledger':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'settings':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--surface)] text-[color:var(--text)] transition-colors duration-500">
      {/* Humanistic Top Ribbon */}
      <div className="h-3 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--accent-sage)] via-[color:var(--accent-gold)] to-[color:var(--accent-clay)] opacity-90" />
        <div className="absolute inset-0 opacity-40 dark:opacity-25 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.6),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.4),transparent_50%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface)/0.78] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl overflow-hidden relative shadow-lg shadow-black/5 bg-[color:var(--text)] dark:bg-[color:var(--surface)]">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_40%_30%,rgba(212,175,55,0.55),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(140,160,130,0.45),transparent_50%)]" />
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <span className="text-xl font-black text-[color:var(--surface)] dark:text-[color:var(--text)]">U</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter uppercase leading-none">Ubuntu Pools</span>
                <span className="text-[9px] font-black uppercase tracking-[0.35em] mt-1 text-[color:var(--accent-sage)]">
                  Collective Prosperity
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cx(
                      'flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all',
                      active
                        ? 'opacity-100 text-[color:var(--text)] border-b-2 border-[color:var(--accent-gold)] pb-1'
                        : 'opacity-45 text-[color:var(--muted)] hover:opacity-85'
                    )}
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="h-6 w-px bg-[color:var(--border)]" />

              <button
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                className="p-3 rounded-2xl border border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition-all"
                aria-label="Toggle theme"
              >
                {mounted && (theme === 'light' ? (
                  <svg className="w-5 h-5 text-[color:var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[color:var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 17.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                    />
                  </svg>
                ))}
              </button>

              <div className="flex flex-col items-end px-6 py-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)]">
                <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--muted)]">Vault Balance</p>
                <p className="text-sm font-black tabular-nums">R 2,300.00</p>
              </div>
            </nav>

            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                className="p-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)]"
                aria-label="Toggle theme"
              >
                {mounted && <span className="text-xs font-black">{theme === 'light' ? '☾' : '☀︎'}</span>}
              </button>

              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="p-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)]"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-8 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-xl font-black tracking-tighter"
              >
                <NavIcon icon={item.icon} className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <div className="relative w-full border-b border-[color:var(--border)] overflow-hidden">
        <div className="absolute inset-0 opacity-25 dark:opacity-20 bg-[radial-gradient(circle_at_10%_10%,rgba(212,175,55,0.25),transparent_55%),radial-gradient(circle_at_85%_40%,rgba(140,160,130,0.2),transparent_50%),radial-gradient(circle_at_40%_90%,rgba(192,123,91,0.18),transparent_55%)]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 relative">
          <p className="text-[11px] font-black uppercase tracking-[0.9em] text-[color:var(--muted)] opacity-70">I am because we are</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
            Community savings,
            <span className="text-[color:var(--accent-gold)]"> made human</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-sm md:text-base text-[color:var(--muted)] leading-relaxed">
            Ubuntu Pools is a collective coordination layer: trust-based governance, transparent decisions, and shared prosperity—without the cold, banky vibe.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[11px] font-black uppercase tracking-widest">
              Governance
            </div>
            <div className="px-4 py-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[11px] font-black uppercase tracking-widest">
              Ledger
            </div>
            <div className="px-4 py-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[11px] font-black uppercase tracking-widest">
              Collective Goals
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {children}
      </main>

      <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[color:var(--text)] dark:bg-[color:var(--surface-2)] flex items-center justify-center">
                <span className="text-sm font-black text-[color:var(--surface)] dark:text-[color:var(--text)]">U</span>
              </div>
              <span className="text-lg font-black tracking-tighter uppercase">Ubuntu Pools</span>
            </div>
            <p className="text-[11px] font-bold text-[color:var(--muted)] uppercase tracking-widest">Community savings redefined.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['Prospectus', 'Privacy', 'Terms', 'Support'].map((label) => (
              <span
                key={label}
                className="text-[9px] font-black uppercase tracking-widest text-[color:var(--muted)] border border-[color:var(--border)] px-3 py-1 rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
