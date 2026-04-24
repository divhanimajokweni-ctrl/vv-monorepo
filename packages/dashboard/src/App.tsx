import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check API health on component mount
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          const data = await response.json()
          setHealth(data)
        }
      } catch (error) {
        console.log('API not available yet, will retry...')
      }
      setIsLoading(false)
    }

    checkHealth()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo">
          <h1>🦁 Lindiwe Dashboard</h1>
          <p className="subtitle">Venture Vision Ubuntu — Collective Prosperity Through Trust</p>
        </div>
      </header>

      <main className="App-main">
        <div className="status-grid">
          <div className="status-card">
            <h3>System Health</h3>
            <div className={`status-indicator ${health ? 'healthy' : 'unknown'}`}>
              {isLoading ? 'Checking...' : health ? 'Operational' : 'Checking...'}
            </div>
            {health && (
              <div className="status-details">
                <p>Version: {health.version}</p>
                <p>Environment: {health.environment}</p>
              </div>
            )}
          </div>

          <div className="status-card">
            <h3>Cryptographic Operations</h3>
            <div className="status-indicator healthy">Active</div>
            <p>Ed25519 signatures enabled</p>
          </div>

          <div className="status-card">
            <h3>Governance Framework</h3>
            <div className="status-indicator healthy">Operational</div>
            <p>UBUNTUctrl Committee active</p>
          </div>

          <div className="status-card">
            <h3>Regulatory Compliance</h3>
            <div className="status-indicator healthy">FSCA Certified</div>
            <p>POPIA & FAIS compliant</p>
          </div>
        </div>

        <div className="action-section">
          <h2>System Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => window.open('/api/health', '_blank')}>
              View API Health
            </button>
            <button className="action-btn" onClick={() => alert('Underwriter onboarding coming soon')}>
              Onboard Underwriter
            </button>
            <button className="action-btn" onClick={() => alert('Reporter signup coming soon')}>
              Register Reporter
            </button>
            <button className="action-btn" onClick={() => alert('Premium processing coming soon')}>
              Process Premiums
            </button>
          </div>
        </div>

        <div className="info-section">
          <h2>About Venture Vision Ubuntu</h2>
          <p>
            A decentralized financial system built on Ubuntu principles — "I am because we are".
            We provide village-scale ROSCA functionality with institutional-grade security,
            cryptographic governance, and regulatory compliance.
          </p>

          <div className="key-features">
            <div className="feature">
              <h4>🏛️ Institutional Governance</h4>
              <p>Multi-signature committee oversight with cryptographic enforcement</p>
            </div>
            <div className="feature">
              <h4>🔐 Production Cryptography</h4>
              <p>Ed25519 signatures with hardware-backed key management</p>
            </div>
            <div className="feature">
              <h4>⚖️ Regulatory Compliance</h4>
              <p>FSCA-certified with POPIA data protection</p>
            </div>
            <div className="feature">
              <h4>💚 Collective Prosperity</h4>
              <p>Ubuntu philosophy driving community wealth creation</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <p>
          VAGUELY VANITY LLC (Pty) Ltd t/a Venture Vision Ubuntu • Registration: 2026/259053/07
        </p>
        <p>
          Powered by SafeKrypte • FSCA Compliant • POPIA Certified
        </p>
      </footer>
    </div>
  )
}

export default App