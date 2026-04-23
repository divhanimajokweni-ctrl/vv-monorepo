// File: packages/dashboard/src/UnifiedDashboard.tsx
// Purpose: Unified Venture Vision Ubuntu dashboard with minimal layout
// Routing to prospective applications and layers

import React, { useState } from 'react';
import LindiweSpineHealth from './LindiweSpineHealth';

const UnifiedDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('spine-health');

  const renderPage = () => {
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
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Navigation */}
      <nav style={{
        width: '200px',
        background: '#0a0a0f',
        borderRight: '1px solid #2a2a35',
        padding: '1rem',
      }}>
        <h3 style={{ color: '#e8e8f4', marginBottom: '1rem' }}>VVU Dashboard</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>
            <button
              onClick={() => setCurrentPage('spine-health')}
              style={navButtonStyle(currentPage === 'spine-health')}
            >
              🛡️ Spine Health
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('applications')}
              style={navButtonStyle(currentPage === 'applications')}
            >
              📱 Applications
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('infrastructure')}
              style={navButtonStyle(currentPage === 'infrastructure')}
            >
              🏗️ Infrastructure
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('layers')}
              style={navButtonStyle(currentPage === 'layers')}
            >
              📚 Layers
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
};

const navButtonStyle = (active: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '0.5rem 1rem',
  marginBottom: '0.5rem',
  background: active ? '#16a34a' : 'transparent',
  color: active ? '#0a0a0f' : '#d0d0dc',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '0.9rem',
});

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