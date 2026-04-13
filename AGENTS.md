# 🤖 Ubuntu Pools AI Agent Guidelines

## 🌍 Mission Statement
*"I am because we are"* — Building collective prosperity through trust-based governance, immutable ledger, and community-driven impact.

---

## 🎯 Contributor Onboarding & Meritocratic Recruitment

### The "Play-to-Contribute" Philosophy
Ubuntu Pools operates on **First Principles** thinking where contribution leads to trust, and trust leads to authority. Our recruitment pipeline uses the codebase as the interview — high-quality contributions earn recruitment consideration.

### 📋 How to Become a Contributor

#### **Step 1: Understand the Ubuntu Accord**
Before contributing, study our foundational principles:
- **Collective Prosperity**: Individual success serves community advancement
- **Trust Through Transparency**: All decisions are auditable and verifiable
- **Meritocratic Governance**: Authority earned through demonstrated competence
- **Data Sovereignty**: Users control their own information

#### **Step 2: Choose Your Contribution Path**
| Path | Difficulty | Impact | Time Commitment |
|------|------------|--------|-----------------|
| **🐛 Bug Fixes** | 🟢 Beginner | Medium | 2-4 hours |
| **✨ Feature Implementation** | 🟡 Intermediate | High | 8-16 hours |
| **🏗️ Architecture Improvements** | 🔴 Advanced | Very High | 16-40 hours |
| **📚 Documentation** | 🟢 Beginner | Medium | 4-8 hours |
| **🧪 Testing** | 🟡 Intermediate | High | 6-12 hours |

#### **Step 3: Select a Friction Point**
Check our [GitHub Issues](https://github.com/divhanimajokweni-ctrl/ubuntu-pools/issues) for active friction points:
- Look for issues tagged `good-first-issue` or `help-wanted`
- Focus on problems that align with your skills and interests
- Consider the broader Ubuntu impact of your solution

#### **Step 4: Implement with First Principles**
All contributions must demonstrate:
- **Systems Thinking**: How does this change affect the entire ecosystem?
- **Ethical UX**: Does this serve collective prosperity?
- **Security Consciousness**: Does this maintain data sovereignty?
- **Performance Awareness**: Does this scale with community growth?

#### **Step 5: Submit Your Contribution**
```bash
# Fork the repository
git clone https://github.com/divhanimajokweni-ctrl/ubuntu-pools.git
cd ubuntu-pools

# Create feature branch
git checkout -b feature/your-contribution-name

# Implement your changes
# ... write code that demonstrates First Principles thinking ...

# Run tests and ensure quality
bun test
bun typecheck
bun lint

# Commit with descriptive message
git commit -m "feat: implement [feature] following Ubuntu principles

- [Specific changes made]
- [How this serves collective prosperity]
- [Security/privacy considerations]
- [Performance impact]"

# Create Pull Request
# Your contribution will be evaluated for:
# 1. Code quality and First Principles alignment
# 2. Ubuntu philosophy adherence
# 3. Technical excellence
# 4. Community impact
```

### 🎖️ Recognition & Advancement

#### **Tier 1: Community Contributor**
- Requirements: 3+ approved PRs demonstrating Ubuntu principles
- Benefits: Recognition in contributor hall of fame, priority support
- Ubuntu Score Impact: +5 points for community contribution

#### **Tier 2: Trusted Contributor**
- Requirements: 10+ PRs with exceptional systems thinking
- Benefits: Direct access to core team, co-authorship opportunities
- Ubuntu Score Impact: +15 points, eligible for governance participation

#### **Tier 3: Core Team Recruitment**
- Requirements: Demonstrated leadership in multiple system areas
- Benefits: Formal employment consideration, equity participation
- Ubuntu Score Impact: +25 points, automatic Steward status

### 🏆 Evaluation Criteria

Pull Requests are evaluated on a 100-point scale:

| Category | Weight | Excellent (20pts) | Good (15pts) | Basic (10pts) | Poor (5pts) |
|----------|--------|-------------------|--------------|---------------|-------------|
| **Code Quality** | 25% | Exceptional architecture | Clean, well-tested | Functional but basic | Contains issues |
| **Ubuntu Alignment** | 25% | Serves collective prosperity | Community-focused | Neutral impact | Individual benefit only |
| **Systems Thinking** | 20% | Holistic ecosystem view | Considers dependencies | Component-focused | Narrow scope |
| **Security/Privacy** | 15% | Enhances sovereignty | Maintains security | No regression | Introduces risks |
| **Documentation** | 10% | Comprehensive docs | Adequate docs | Minimal docs | No docs |
| **Testing** | 5% | Full test coverage | Good coverage | Basic tests | No tests |

### 🤝 Contributor Covenant

By contributing to Ubuntu Pools, you agree to:
1. **Respect Data Sovereignty**: Never compromise user privacy or data rights
2. **Promote Collective Prosperity**: Ensure changes benefit the community
3. **Maintain Transparency**: All decisions must be auditable
4. **Uphold Trust**: Never introduce features that could undermine community confidence
5. **Share Knowledge**: Help other contributors understand your implementation

### 📞 Getting Help

- **Discord**: Join our community for real-time discussions
- **GitHub Discussions**: Post questions about implementation approaches
- **Mentorship**: Experienced contributors can request pairing sessions
- **Documentation**: Check our [development guide](./DEVELOPMENT_SETUP.md)

### 🌟 Success Stories

*"Started with a simple bug fix, now leading the behavioral intelligence team. The Ubuntu philosophy creates genuine opportunities for growth."* — Senior Developer

*"The meritocratic system rewards deep thinking over superficial coding. It's refreshing to work somewhere that values systems thinking as much as syntax."* — Systems Architect

---

## 🛠️ AI Agent Guidelines

### Core Principles
- **First Principles Thinking**: Break problems down to fundamental truths
- **Ubuntu Philosophy**: "I am because we are" — collective prosperity over individual gain
- **Security First**: Data sovereignty and privacy are non-negotiable
- **Transparency**: All decisions must be auditable and explainable

### Implementation Standards
- **Type Safety**: 100% TypeScript coverage, no `any` types
- **Testing**: Minimum 85% coverage, integration tests for critical paths
- **Performance**: Optimize for scale (10k+ concurrent users)
- **Security**: Zero-trust architecture, cryptographic verification

### Code Review Process
1. **Automated Checks**: TypeScript, ESLint, tests must pass
2. **Peer Review**: Minimum 2 approvals required
3. **Security Review**: All changes reviewed for data sovereignty impact
4. **Ubuntu Alignment**: Changes must serve collective prosperity

---

## 📚 Optional Feature Guides

When users request features beyond the base template, check for available recipes in `.kilocode/recipes/`.

### Available Recipes

| Recipe       | File                                | When to Use                                           |
| ------------ | ----------------------------------- | ----------------------------------------------------- |
| Add Database | `.kilocode/recipes/add-database.md` | When user needs data persistence (users, posts, etc.) |

### How to Use Recipes

1. Read the recipe file when the user requests the feature
2. Follow the step-by-step instructions
3. Update the memory bank after implementing the feature

## Memory Bank Maintenance

After completing the user's request, update the relevant memory bank files:

- `.kilocode/rules/memory-bank/context.md` - Current state and recent changes
- Other memory bank files as needed when architecture, tech stack, or project goals change
