# VV Monorepo Wiki

Welcome to the Venture Visual Ubuntu (VVU) monorepo wiki! This comprehensive knowledge base covers everything from architecture to deployment.

As of Q1 2026, the system is fully operational with all core services deployed on Railway.

## 📖 Table of Contents

### Getting Started
- [Quick Start Guide](https://github.com/divhanimajokweni-ctrl/vv-monorepo#quick-start)
- [Prerequisites](https://github.com/divhanimajokweni-ctrl/vv-monorepo#prerequisites)
- [Bootstrap Process](https://github.com/divhanimajokweni-ctrl/vv-monorepo#bootstrap-process)

### Architecture & Design
- [Security Spine Overview](./ARCHITECTURE.md)
- [Eight-Layer Isolation](https://github.com/divhanimajokweni-ctrl/vv-monorepo#core-packages)
- [FK Anchor Deep Dive](./packages/safestakes/src/core/executeSlash.ts)
- [Shadow Testing Guide](./tools/shadow-evaluator/README.md)

### Core Components

#### SafeKrypte
- [Cryptographic Operations](./packages/safekrypte/README.md)
- [Simulator Setup](./packages/safekrypte/src/simulator.ts)
- [Key Rotation Ceremony](./scripts/ceremonies/key-rotation.ts)

#### SafeStakes
- [Execute Slash Engine](./packages/safestakes/src/core/executeSlash.ts)
- [Renewal Grace Protocol](./packages/safestakes/src/core/renewal-grace.ts)
- [Escrow Custody](./packages/safestakes/src/core/escrow-custody.ts)

#### Mainframe
Mainframe is the Triad Collector service, responsible for collecting three independent streams of water metrics: flow rate, pressure, and leak anomaly scores. Each metric is signed by a dedicated SafeKrypte key to ensure immutability and authenticity. The service is deployed on Railway and continuously collects metrics (flow and leak every 60 seconds, pressure every 5 minutes).
- [Triad Collector](./packages/mainframe/src/triad-collector.ts)
- [Metric Collection](./packages/mainframe/README.md)

#### Dashboard
- [Unified Interface](./packages/dashboard/src/UnifiedDashboard.tsx)
- [Lindiwe Spine Health](./packages/dashboard/src/LindiweSpineHealth.tsx)

### Development & Testing
- [Testing Framework](./tests/README.md)
- [Staging Deployment](./scripts/staging/deploy-and-test.sh)
- [CI/CD Pipeline](./.github/workflows/README.md)
- [Shadow Evaluation](./tools/shadow-evaluator/src/index.ts)

### Operations & Maintenance
- [Underwriting Events](./underwriting-events/)
- [Metrics Storage](./metrics/)
- [Shadow Results](./shadow-results/)
- [Deployment Reports](./DEPLOYMENT-REPORT.md)

### Reference & Inspiration
- [GODMOD3.AI](./GODMOD.md)
- [Ubuntu Philosophy](./UBUNTU.md)
- [Security Best Practices](./SECURITY.md)

## 🔧 Development Workflow

### Local Development
1. Clone the repository
2. Run bootstrap script
3. Install dependencies
4. Start simulators
5. Run tests
6. Access dashboard

### Contributing
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code Standards](./CODING-STANDARDS.md)
- [Pull Request Template](./PULL-REQUEST-TEMPLATE.md)

### Deployment
- [Production Checklist](./DEPLOYMENT-CHECKLIST.md)
- [Rollback Procedures](./ROLLBACK.md)
- [Monitoring Setup](./MONITORING.md)

## 📊 Metrics & Monitoring

### Key Metrics
- **Security Spine Health**: 8/8 layers operational
- **Test Coverage**: 95%+ branch coverage
- **Shadow Divergence**: 0 critical divergences
- **Deployment Success**: 100% automated

### Dashboards
- [Lindiwe Spine Health](packages/dashboard/src/LindiweSpineHealth.tsx)
- [Mainframe Triad](packages/mainframe/src/triad-collector.ts)
- [Shadow Evaluation](tools/shadow-evaluator/src/index.ts)

## 🆘 Troubleshooting

### Common Issues
- [Simulator Connection Errors](./TROUBLESHOOTING.md#simulators)
- [Test Failures](./TROUBLESHOOTING.md#tests)
- [Deployment Blocks](./TROUBLESHOOTING.md#deployment)

### Support
- [GitHub Issues](https://github.com/divhanimajokweni-ctrl/vv-monorepo/issues)
- [Discussions](https://github.com/divhanimajokweni-ctrl/vv-monorepo/discussions)
- [Security Advisories](https://github.com/divhanimajokweni-ctrl/vv-monorepo/security)

## 📚 External Resources

- [Ubuntu Design Philosophy](https://design.ubuntu.com/)
- [OpenRouter API](https://openrouter.ai/)
- [Vitest Testing Framework](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🏷️ Tags & Categories

**Topics**: security, typescript, monorepo, ubuntu, simulation, cryptography, testing
**Components**: dashboard, spine, shadow-testing, escrow, underwriting
**Status**: active, production-ready, security-first

---

*This wiki is maintained by the VVU community. Contributions welcome!* 📖✨