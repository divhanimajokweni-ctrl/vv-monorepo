// File: packages/dashboard/src/UnifiedDashboard.tsx
// Purpose: Unified Venture Vision Ubuntu dashboard with minimal layout
// Enhanced with visual UI/UX effects, animations, high-quality scrolling, and elite accessibility

import React, { useState, useEffect, useRef } from 'react';
import LindiweSpineHealth from './LindiweSpineHealth';

const UnifiedDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('spine-health');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: string) => {
    if (page === currentPage) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false);
      // Scroll to top smoothly
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent, page: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePageChange(page);
    }
  };

  useEffect(() => {
    // Focus management for accessibility
    const mainContent = mainRef.current;
    if (mainContent) {
      const focusableElements = mainContent.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [currentPage]);

  const renderPage = () => {
    const pageContent = (() => {
      switch (currentPage) {
        case 'spine-health':
          return <LindiweSpineHealth />;
        case 'applications':
          return <ApplicationsPage />;
        case 'infrastructure':
          return <InfrastructurePage />;
        case 'layers':
          return <LayersPage />;
        default:
          return <LindiweSpineHealth />;
      }
    })();

    return (
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateX(20px)' : 'translateX(0)',
          transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {pageContent}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0a0a0f',
        color: '#d0d0dc',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
      role="application"
      aria-label="Venture Vision Ubuntu Unified Dashboard"
    >
      {/* Sidebar Navigation */}
      <nav
        style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
          borderRight: '1px solid #2a2a35',
          padding: '1.5rem 1rem',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Animated background effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(22, 163, 74, 0.1) 0%, transparent 70%)',
            animation: 'pulse 4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        <header style={{ position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              color: '#e8e8f4',
              marginBottom: '1.5rem',
              fontSize: '1.4rem',
              fontWeight: 600,
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}
            id="dashboard-title"
          >
            🛡️ VVU Dashboard
          </h1>
        </header>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            position: 'relative',
            zIndex: 1,
          }}
          role="menubar"
          aria-labelledby="dashboard-title"
        >
          {[
            { key: 'spine-health', label: '🛡️ Spine Health', desc: 'Eight-layer security monitoring' },
            { key: 'applications', label: '📱 Applications', desc: 'Prospective app routing' },
            { key: 'infrastructure', label: '🏗️ Infrastructure', desc: 'System infrastructure overview' },
            { key: 'layers', label: '📚 Layers', desc: 'Security spine layers detail' },
          ].map(({ key, label, desc }) => (
            <li key={key} role="none">
              <button
                onClick={() => handlePageChange(key)}
                onKeyDown={(e) => handleKeyDown(e, key)}
                style={navButtonStyle(currentPage === key)}
                role="menuitem"
                aria-current={currentPage === key ? 'page' : undefined}
                aria-describedby={`${key}-desc`}
                tabIndex={0}
              >
                <span style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                  {label}
                </span>
                <span
                  id={`${key}-desc`}
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    opacity: 0.8,
                    fontWeight: 400,
                  }}
                >
                  {desc}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <main
        ref={mainRef}
        style={{
          flex: 1,
          overflow: 'auto',
          scrollBehavior: 'smooth',
          position: 'relative',
        }}
        role="main"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Loading indicator during transitions */}
        {isTransitioning && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              color: '#16a34a',
              fontSize: '1.2rem',
              animation: 'spin 1s linear infinite',
            }}
            aria-live="assertive"
          >
            🔄 Loading...
          </div>
        )}

        <div style={{ minHeight: '100%' }}>
          {renderPage()}
        </div>

        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          style={{
            position: 'absolute',
            top: '-40px',
            left: '6px',
            background: '#16a34a',
            color: '#0a0a0f',
            padding: '8px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.9rem',
            zIndex: 1000,
            transition: 'top 0.3s',
          }}
          onFocus={(e) => (e.target as HTMLElement).style.top = '6px'}
          onBlur={(e) => (e.target as HTMLElement).style.top = '-40px'}
        >
          Skip to main content
        </a>
      </main>

      {/* Global styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* High-quality scrolling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #0a0a0f;
        }

        ::-webkit-scrollbar-thumb {
          background: #2a2a35;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #3a3a45;
        }

        /* Focus indicators for accessibility */
        *:focus {
          outline: 2px solid #16a34a;
          outline-offset: 2px;
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          nav {
            border-right: 2px solid #ffffff;
          }
          button {
            border: 1px solid #ffffff;
          }
        }
      `}</style>
    </div>
  );
};

const navButtonStyle = (active: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '0.75rem 1rem',
  marginBottom: '0.5rem',
  background: active
    ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
    : 'transparent',
  color: active ? '#0a0a0f' : '#d0d0dc',
  border: active ? 'none' : '1px solid #2a2a35',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '0.9rem',
  fontWeight: active ? 600 : 400,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: active ? '0 4px 12px rgba(22, 163, 74, 0.3)' : 'none',
  transform: active ? 'translateY(-1px)' : 'none',
  position: 'relative',
  overflow: 'hidden',
});

// Enhanced placeholder pages with better styling and accessibility
const ApplicationsPage: React.FC = () => (
  <div
    style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out',
    }}
    id="main-content"
    tabIndex={-1}
  >
    <h2 style={{ color: '#e8e8f4', marginBottom: '1rem' }}>📱 Venture Vision Ubuntu Applications</h2>
    <p style={{ color: '#8b8b9a', marginBottom: '2rem', fontSize: '1.1rem' }}>
      Routing to prospective applications and services
    </p>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
    }}>
      {[
        { name: 'Lindiwe Dashboard', desc: 'Eight-layer spine health monitoring', icon: '🛡️' },
        { name: 'SafeKrypte Management', desc: 'Cryptographic key and signature services', icon: '🔐' },
        { name: 'SafeStakes Operations', desc: 'Capital custody and slashing execution', icon: '💰' },
        { name: 'Mainframe Monitoring', desc: 'Production metrics and incident tracking', icon: '📊' },
      ].map((app, index) => (
        <div
          key={app.name}
          style={{
            background: '#111118',
            border: '1px solid #2a2a35',
            borderRadius: '12px',
            padding: '1.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
          role="button"
          tabIndex={0}
          aria-label={`Navigate to ${app.name}`}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{app.icon}</div>
          <h3 style={{ color: '#e8e8f4', margin: '0 0 0.5rem 0' }}>{app.name}</h3>
          <p style={{ color: '#8b8b9a', margin: 0, fontSize: '0.9rem' }}>{app.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const InfrastructurePage: React.FC = () => (
  <div
    style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out',
    }}
    id="main-content"
    tabIndex={-1}
  >
    <h2 style={{ color: '#e8e8f4', marginBottom: '1rem' }}>🏗️ System Infrastructure</h2>
    <p style={{ color: '#8b8b9a', marginBottom: '2rem', fontSize: '1.1rem' }}>
      Overview of system infrastructure components
    </p>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    }}>
      {[
        { name: 'Database Status', status: '🟢 Healthy', desc: 'PostgreSQL primary cluster' },
        { name: 'API Endpoints', status: '🟢 Operational', desc: 'All services responding' },
        { name: 'Simulator Health', status: '🟢 Running', desc: 'SafeKrypte, SafeStakes, Mainframe' },
        { name: 'Deployment Pipeline', status: '🟢 Active', desc: 'CI/CD passing all gates' },
      ].map((item, index) => (
        <div
          key={item.name}
          style={{
            background: '#111118',
            border: '1px solid #2a2a35',
            borderRadius: '8px',
            padding: '1rem',
            animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
          }}
        >
          <h4 style={{ color: '#e8e8f4', margin: '0 0 0.5rem 0' }}>{item.name}</h4>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.status}</div>
          <p style={{ color: '#8b8b9a', margin: 0, fontSize: '0.8rem' }}>{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const LayersPage: React.FC = () => (
  <div
    style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      animation: 'fadeIn 0.5s ease-out',
    }}
    id="main-content"
    tabIndex={-1}
  >
    <h2 style={{ color: '#e8e8f4', marginBottom: '1rem' }}>📚 Security Spine Layers</h2>
    <p style={{ color: '#8b8b9a', marginBottom: '2rem', fontSize: '1.1rem' }}>
      Detailed view of the eight isolation layers
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[
        { layer: 1, name: 'Schema Isolation', proof: 'FK constraints on poolId, policyHash, underwriter' },
        { layer: 2, name: 'Code Isolation', proof: 'verifyUnderwritingAnchor() atomic 5-gate check' },
        { layer: 3, name: 'Test Isolation', proof: '10 invariant tests passing' },
        { layer: 4, name: 'Pipeline Isolation', proof: 'CI/CD fails on anchor test failure' },
        { layer: 5, name: 'Shadow Isolation', proof: 'Continuous parallel evaluation, 0 divergences' },
        { layer: 6, name: 'Renewal Isolation', proof: '2-hour grace window with retroactive coverage' },
        { layer: 7, name: 'Key Isolation', proof: '6-step dual-signature rotation ceremony' },
        { layer: 8, name: 'Custody Isolation', proof: 'SafeKrypte arbiter ≠ SafeStakes custodian' },
      ].map((layer, index) => (
        <div
          key={layer.layer}
          style={{
            background: '#111118',
            border: '1px solid #2a2a35',
            borderRadius: '8px',
            padding: '1.5rem',
            animation: `slideIn 0.4s ease-out ${index * 0.05}s both`,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0a0f',
              fontWeight: 'bold',
              marginRight: '1rem',
            }}>
              {layer.layer}
            </div>
            <div>
              <h3 style={{ color: '#e8e8f4', margin: 0 }}>{layer.name}</h3>
              <p style={{ color: '#8b8b9a', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                {layer.proof}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Placeholder pages
const ApplicationsPage: React.FC = () => (
  <div style={{ padding: '2rem' }}>
    <h2>📱 Venture Vision Ubuntu Applications</h2>
    <p>Routing to prospective applications...</p>
    <ul>
      <li>Lindiwe Dashboard</li>
      <li>SafeKrypte Management</li>
      <li>SafeStakes Operations</li>
      <li>Mainframe Monitoring</li>
    </ul>
  </div>
);

const InfrastructurePage: React.FC = () => (
  <div style={{ padding: '2rem' }}>
    <h2>🏗️ System Infrastructure</h2>
    <p>Overview of system infrastructure...</p>
    <ul>
      <li>Database Status</li>
      <li>API Endpoints</li>
      <li>Simulator Health</li>
      <li>Deployment Pipeline</li>
    </ul>
  </div>
);

const LayersPage: React.FC = () => (
  <div style={{ padding: '2rem' }}>
    <h2>📚 Security Spine Layers</h2>
    <p>Detailed view of the eight isolation layers...</p>
    <ol>
      <li>Schema Isolation</li>
      <li>Code Isolation</li>
      <li>Test Isolation</li>
      <li>Pipeline Isolation</li>
      <li>Shadow Isolation</li>
      <li>Renewal Isolation</li>
      <li>Key Isolation</li>
      <li>Custody Isolation</li>
    </ol>
  </div>
);

export default UnifiedDashboard;