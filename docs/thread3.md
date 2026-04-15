### Thread 3 — POPIA Architecture: What's Right and What's Incomplete

The POPIA compliance design is genuinely thoughtful in several places. The core principle — derived signals only, not raw events — is the right approach under POPIA's Section 18 (purpose specification) and Section 13 (minimisation). Storing a "risk appetite index of 72" is far more defensible than storing "member chose Option A on turn 7 of Ubuntu Monopoly," which is raw personal data.

**What's architecturally sound:**

The SovereigntyProxy enabling game history erasure without corrupting the immutable ledger is a sophisticated solution. The approach is presumably: game events are stored with a pseudonymous identifier, the mapping between real identity and pseudonym is held separately, and erasure means destroying the mapping — making the event orphaned and unattributable, while the ledger integrity (Merkle proofs, hash chain) is preserved. This is the cryptographic shredding approach and it's POPIA-compliant.

AWS Cape Town region for data residency is correct. POPIA doesn't explicitly mandate data localisation but the spirit of Section 72 (transfers to third parties) is served by keeping data within a jurisdiction that has adequate protection.

**What the document doesn't tell you — the Merkle tree question:**

`merkle.ts` and `posting-engine.ts` are named but their external verifiability is never documented. A Merkle tree ledger is only as valuable as its proof verification mechanism. The questions that need answering:

1. What is the root hash anchored to? If it's only stored in your own PostgreSQL database, the immutability guarantee is internal, not external. You can tamper with the database and recompute the root. For strong integrity, roots should be periodically published to an external witness — even something as simple as a public timestamp service or a public blockchain anchor.

2. How can a member verify that their specific event is in the ledger? The economic passport (`passport.ts`) likely carries some of this, but the verification UX isn't documented.

3. What happens to proof validity when a member invokes the cryptographic shredding / erasure right? If their events are still technically in the Merkle tree (just with an orphaned pseudonym), do proofs still verify? Does the proof reveal the orphaned pseudonym?

These aren't blockers for Phase 15 but they matter for the financial services regulatory conversation — particularly if Ubuntu Pools eventually interfaces with the FSCA.

**The hardcoded admin password:**

`ubuntu2025` is in the README in at least two places. This needs to be rotated immediately and replaced with an environment variable (`ADMIN_DASHBOARD_PASSWORD`) before this README is ever public. It's a minor but real security hygiene failure.