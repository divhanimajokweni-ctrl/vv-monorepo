# BayWater Services & Ubuntu Aqua Prosperity Trust

![BayWater & Ubuntu Aqua Logo](https://via.placeholder.com/800x200?text=BayWater+%26+Ubuntu+Aqua) <!-- Placeholder for actual logo -->

> Dual-brand water infrastructure platform combining commercial engineering with community prosperity. BayWater Services delivers water security, while Ubuntu Aqua Prosperity Trust ensures community benefit sharing.

## 🌟 Overview

This monorepo powers **BayWater Services (Pty) Ltd** and **The Ubuntu Aqua Prosperity Trust** - a dual-brand approach to decentralized water infrastructure.

### BayWater Services (Pty) Ltd
The commercial entity handling engineering, sensors, billing, and client contracts. When you send invoices to factories in Coega, they come from BayWater.

### The Ubuntu Aqua Prosperity Trust
The community-facing trust managing 15% profit sharing with Qualified Community Organisations (QCOs). When dividends go to neighborhood rugby clubs or soup kitchens, they're from Ubuntu Aqua.

### Key Principles
- **Dual-Brand Protection**: Commercial operations separated from community benefits
- **Security First**: Every component designed with syndicate capture prevention
- **Community Prosperity**: 15% automatic profit sharing with QCOs
- **Immutable Governance**: Code-enforced trust distributions
- **Ubuntu Inspiration**: Community-driven water security for all

## 🏗️ Architecture

The BayWater & Ubuntu Aqua platform is structured as a monorepo with the following key components:

### Core Packages

#### 📦 Shared Kernel
Common utilities and types shared across packages.
- [Index](./packages/shared-kernel/src/index.ts) - Core exports

#### 🔐 SafeKrypte
Advanced cryptographic simulation package for secure data handling.
- [Simulator](./packages/safekrypte/src/simulator.ts) - HTTP server for signing operations
- Key management and rotation algorithms
- Performance metrics and security audits

#### 🛡️ SafeStakes
Stakeholder management and governance simulation package.
- [Execute Slash](./packages/safestakes/src/core/executeSlash.ts) - FK anchor with 10-gate verification
- [Renewal Grace](./packages/safestakes/src/core/renewal-grace.ts) - 2-hour grace period state machine
- [Escrow Custody](./packages/safestakes/src/core/escrow-custody.ts) - Arbiter-controlled capital custody
- [Simulator](./packages/safestakes/src/simulator.ts) - Slashing execution endpoint

#### 🖥️ Mainframe
Central processing and reporting hub.
- [Triad Collector](./packages/mainframe/src/triad-collector.ts) - Signed metric collection pipeline
- **Reporter Simulator**: Generates comprehensive system reports
- **Metric Emitter**: Streams real-time performance metrics

#### 📊 Dashboard
Dual-interface visual system for water infrastructure monitoring and community prosperity.
- [Unified Dashboard](./packages/dashboard/src/UnifiedDashboard.tsx) - BayWater client view + Ubuntu Aqua community impact
- [BayWater Spine Health](./packages/dashboard/src/LindiweSpineHealth.tsx) - Eight-layer water integrity monitoring
- [API Spine Health](./packages/dashboard/src/api/spine-health.ts) - Health data aggregation

### Scripts & Tools

#### 🔧 Bootstrap & Setup
- [Bootstrap Repo](./scripts/01-bootstrap-repo.sh) - Initial directory structure
- [Generate Fixtures](./scripts/generate-fixtures.js) - Test data creation
- [Replay](./scripts/replay.js) - Event tracing and analysis
- [Test Staging](./scripts/test-staging.js) - Synthetic breach suite

#### ⚙️ Ceremonies & Operations
- [Key Rotation](./scripts/ceremonies/key-rotation.ts) - 6-step HSM rotation protocol
- [Underwriting Events](./scripts/underwriting/generate-first-event.ts) - First SignedUnderwritingEvent
- [Shadow Evaluator](./tools/shadow-evaluator/src/index.ts) - Continuous parallel evaluation
- [VV Shadow Diverge](./tools/cli/src/vv-shadow-diverge.ts) - Divergence investigation CLI

#### 🧪 Testing & Validation
- [Anchor Invariants](./tests/property/underwriting-anchor-invariants.test.ts) - 10 FK constraint tests
- [Renewal Grace Tests](./tests/staging-synthetic/test-12-renewal-grace.test.ts) - Grace period validation
- [Key Rotation Tests](./tests/staging-synthetic/test-13-key-rotation.test.ts) - Ceremony verification
- [Escrow Tests](./tests/staging-synthetic/test-14-escrow.test.ts) - Custody protocol tests
- [Staging Deploy](./scripts/staging/deploy-and-test.sh) - 14-test synthetic breach suite

### Infrastructure

#### 📊 Data Management
- Test fixture generation for consistent data sets
- Replay capabilities for event tracing
- Comprehensive logging and monitoring

#### 🧪 Testing Framework
- Synthetic breach testing suites
- Automated security validations
- Performance benchmarking tools

#### 🕶️ Shadow Testing
- Continuous parallel evaluation against live incidents
- Zero-divergence proof of correctness
- Critical divergence blocking deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Bootstrap Process

1. **Clone and Setup**
   ```bash
   git clone https://github.com/divhanimajokweni-ctrl/vv-monorepo
   cd vv-monorepo
   bash scripts/01-bootstrap-repo.sh
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Generate Test Data**
   ```bash
   npm run fixtures:generate
   ```

4. **Start Local Simulators**
   ```bash
   npx tsx packages/safekrypte/src/simulator.ts &
   npx tsx packages/safestakes/src/simulator.ts &
   npx tsx packages/mainframe/src/reporter-simulator.ts &
   npx tsx packages/mainframe/src/metric-emitter.ts &
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

6. **Execute Replay**
   ```bash
   npm run replay -- --trace-id=test-trace-001
   ```

7. **Synthetic Testing**
   ```bash
   npm run test:staging
   ```

8. **Staging Deployment**
   ```bash
   bash scripts/staging/deploy-and-test.sh
   ```

9. **Access Dashboard**
   ```bash
   # Open packages/dashboard/src/UnifiedDashboard.tsx in a React environment
   # Or integrate into your application
   ```

10. **Check System Health**
   ```bash
   # The /api/spine-health endpoint provides real-time 8-layer monitoring
   # Currently implemented in packages/dashboard/src/api/spine-health.ts
   # Deploy as API server when ready for live monitoring
   ```

## 📈 Features

### Security & Simulation
- **Cryptographic Operations**: SafeKrypte provides robust simulation of encryption workflows
- **Governance Models**: SafeStakes enables testing of various stakeholder management scenarios
- **Real-time Monitoring**: Mainframe components offer live system insights

### Data & Analytics
- **Fixture Generation**: Automated creation of test datasets
- **Event Replay**: Trace and analyze system events for debugging
- **Metric Collection**: Comprehensive performance data gathering

### Testing & Validation
- **Synthetic Breach Suite**: Advanced security testing scenarios
- **Automated Validation**: Continuous integration testing pipelines
- **Performance Benchmarking**: Load testing and optimization tools

## 🎨 Visual Design

Inspired by Ubuntu's aesthetic principles:
- Clean, minimal interfaces with earthy color palette
- Consistent color schemes: Ubuntu green (#16a34a), ochre earth tones (#cc7722)
- Organic shapes and fluid animations
- Accessibility-first design with high contrast support
- "I am because we are" — Community prosperity philosophy
- Dual-brand harmony: Industrial reliability meets community trust

## 🚀 Current Deployment Status

### ✅ BAYWATER WATER-STAGING DEPLOYMENT COMPLETE
- **Date**: 2026-04-26
- **Tests Passed**: 29/31 tests passed (1 network-dependent failure expected, 1 skipped)
- **Shadow Evaluation**: 0 divergences (perfect consistency)
- **Water Spine**: All 8 layers operational
- **Underwriting**: First QCO underwriting event generated for Ubuntu Aqua - Motherwell (beneficiary: Ubuntu Aqua Prosperity Trust)
- **Coverage**: R500,000 liability active
- **Status**: Ready for BayWater pilot deployment
- **Dual-Brand**: BayWater Services + Ubuntu Aqua Prosperity Trust configured
- **Build Fixes**: Added build scripts to all packages for monorepo consistency
- **Dashboard Updates**: Unified dashboard now shows "BayWater · Industrial Water Security" and "Ubuntu Aqua · Your Community Dividend"

### ☁️ RAILWAY CLOUD DEPLOYMENT COMPLETE
- **SafeKrypte Simulator**: Deployed to Railway production (cryptographic operations API)
- **SafeStakes Simulator**: Deployed to Railway production (escrow and slashing API)
- **Public Domains**: Available at Railway-assigned URLs
- **Health Checks**: Passing on /sign and /execute-slash endpoints
- **PORT Configuration**: Services use Railway's PORT environment variable
- **Status**: VVU simulators live in cloud with automatic scaling and monitoring

### 🔧 System Health
- **GATE-2 (Code Isolation)**: ✅ ACTIVE - FK anchor verification operational
- **/api/health Endpoint**: 📋 IMPLEMENTED - Ready for deployment (separate from core spine)
- **CI/CD**: ✅ Fixed - Workspaces configured, builds passing

## 📚 Documentation

### Core Documentation
- [GODMOD3.AI Reference](./docs/GODMOD.md) - Multi-model chat interface inspiration
- [Deployment Report](./docs/DEPLOYMENT-REPORT.md) - Vivid process documentation
- [Security Spine Overview](./docs/ARCHITECTURE.md) - Eight-layer isolation design

### API References
- [SafeKrypte API](./packages/safekrypte/README.md)
- [SafeStakes API](./packages/safestakes/README.md)
- [Mainframe API](./packages/mainframe/README.md)
- [Dashboard API](./packages/dashboard/README.md)

### Guides
- [Wiki Home](./docs/WIKI.md) - Comprehensive knowledge base
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Best Practices](./SECURITY.md)
- [Architecture Decisions](./ARCHITECTURE.md)
- [Shadow Testing Guide](./tools/shadow-evaluator/README.md)

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Code standards and style guides
- Pull request processes
- Issue reporting templates

## 📁 Project Structure

```
vv-monorepo/
├── packages/
│   ├── shared-kernel/          # Common utilities and types
│   │   └── src/index.ts        # Core shared exports
│   ├── dashboard/              # Visual interfaces and APIs
│   │   ├── src/
│   │   │   ├── UnifiedDashboard.tsx     # Main routed interface
│   │   │   ├── LindiweSpineHealth.tsx   # Eight-layer monitoring
│   │   │   └── api/spine-health.ts      # Health data aggregation
│   ├── safekrypte/             # Cryptographic operations
│   │   └── src/simulator.ts             # Signing simulator
│   ├── safestakes/             # Capital custody and execution
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── executeSlash.ts      # FK anchor with 10 gates
│   │   │   │   ├── renewal-grace.ts     # Grace period state machine
│   │   │   │   └── escrow-custody.ts    # Arbiter-controlled custody
│   │   └── simulator.ts                 # Slashing execution endpoint
│   └── mainframe/              # Metrics and reporting
│       └── src/triad-collector.ts       # Signed metric collection
├── scripts/                   # Automation and ceremonies
│   ├── 00-quick-start.sh      # Bootstrap script
│   ├── 01-bootstrap-repo.sh   # Directory setup
│   ├── generate-fixtures.js   # Test data generation
│   ├── replay.js              # Event tracing
│   ├── test-staging.js        # Synthetic breach suite
│   ├── ceremonies/
│   │   └── key-rotation.ts    # 6-step rotation protocol
│   ├── underwriting/
│   │   └── generate-first-event.ts     # Signed underwriting events
│   └── staging/
│       └── deploy-and-test.sh  # 14-test staging deployment
├── tools/                     # Development utilities
│   ├── shadow-evaluator/      # Continuous parallel evaluation
│   │   └── src/index.ts       # Shadow testing engine
│   └── cli/                   # Command-line interfaces
│       └── src/vv-shadow-diverge.ts    # Divergence investigation
├── tests/                     # Test suites
│   ├── property/              # Invariant tests
│   │   └── underwriting-anchor-invariants.test.ts
│   └── staging-synthetic/     # End-to-end breach tests
│       ├── test-01-valid-payout.test.ts
│       ├── test-12-renewal-grace.test.ts
│       ├── test-13-key-rotation.test.ts
│       └── test-14-escrow.test.ts
├── underwriting-events/       # Signed event storage
├── shadow-results/            # Shadow evaluation data
├── metrics/                   # Collected metrics
├── GODMOD.md                  # Reference documentation
├── DEPLOYMENT-REPORT.md       # Process documentation
├── README.md                  # This file
├── package.json               # Dependencies and scripts
├── vitest.config.ts           # Test configuration
└── tsconfig.json              # TypeScript configuration
```

## 💰 Sponsors & Funding

We appreciate all contributions to Venture Visual Ubuntu! If you find this project valuable, consider supporting its development:

### 🏆 Gold Sponsors
<!-- Add gold sponsors here -->

### 🥈 Silver Sponsors
<!-- Add silver sponsors here -->

### 🥉 Bronze Sponsors
<!-- Add bronze sponsors here -->

### 💳 Become a Sponsor
- [GitHub Sponsors](https://github.com/sponsors/divhanimajokweni-ctrl)
- [Ko-fi](https://ko-fi.com/vvubuntu)
- [Buy Me a Coffee](https://www.buymeacoffee.com/vvubuntu)
- Direct donations via cryptocurrency (contact for wallet addresses)

### 🎯 Funding Goals
- **R5,000/month**: Enhanced water infrastructure testing and monitoring
- **R10,000/month**: Professional UI/UX for BayWater & Ubuntu Aqua dashboards
- **R20,000/month**: Full production deployment and community integration
- **R50,000/month**: Dedicated water security research and formal verification

Your sponsorship helps maintain the Water Spine's eight-layer integrity and ensures continuous development of syndicate-resistant water infrastructure.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Ubuntu community for inspiration and prosperity principles
- Water infrastructure communities worldwide
- South African water security advocates
- Syndicate resistance researchers and practitioners
- [GODMOD3.AI](https://github.com/elder-plinius/G0DM0D3) for cognitive liberation inspiration

---

*Built with ❤️ for the future of secure, visual computing*