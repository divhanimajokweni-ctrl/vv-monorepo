### Thread 1 — Score Mechanics: The Primitive That Controls Everything

The Ubuntu Score is not just a reputation number. It is a *power allocation mechanism*. Every gate — credit access, governance voice, moderation authority, emergency powers — is keyed to it. That means its integrity is existential: if the score can be gamed, the whole cooperative trust model collapses. Understanding where it's strong and where it's fragile is essential before Phase 15 adds a new input stream.

**Where the score is structurally sound:**

The five-component weighted model is reasonable for a first version. The 25% weight on Reciprocity Index is the right call — it's the most direct measure of whether a member is a net contributor or net extractor. Consistency Score at 20% prevents burst-and-vanish behaviour: you can't create an account, flood the system with activities in one week, then disappear. The 30-day window means sustained presence is required.

The Sybil defense architecture is genuinely sophisticated. Four independent detection layers (temporal, behavioural, social, device) mean an attacker has to simultaneously fake time-distributed activity, maintain believable behavioural patterns, have legitimate social introducers, and bind to a real device. Each layer is independently difficult; defeating all four simultaneously is very hard.

PageRank applied to the trust graph is the smartest design decision in the whole score engine. PageRank is specifically resistant to link-farming because it propagates *quality* of endorsements, not just *quantity*. An endorsement from a high-PageRank Archivist is worth substantially more than an endorsement from a new Novice. This directly mirrors how stokvels actually work — who vouches for you matters more than how many people vouch for you.

**Where the score has real risk:**

The Governance Participation component (20%) rewards *activity*, not *quality*. A member who votes on every single proposal — even incoherently — accumulates score. This needs a vote-quality signal layered on: do your votes align with outcomes that the village subsequently endorses? This is harder to compute but necessary at scale.

Community Endorsements (20%) with collusion risk is the most serious structural vulnerability. If a small group of existing members forms an endorsement ring — each endorsing the others rapidly after joining — they could bootstrap each other to Contributor level (score 20+) before any organic trust evidence exists. The trust graph's cluster detection is the primary countermeasure, but this needs to be explicitly tested in simulation before mainnet.

Reputation decay at 0.1% per week for inactivity is directionally correct but the implementation needs care. An Archivist-level member who takes a six-month leave of absence for legitimate reasons (illness, travel) would lose 2.4% of their score — a meaningful drop. There should be a *declared inactivity* mechanism that pauses decay for documented reasons, analogous to how stokvels handle life events.

**The Phase 15 addition — Prestige Score as bonus:**

The design decision to make Prestige Score *additive only* (never subtracts from Ubuntu Score) is the philosophically correct choice and the legally correct one. It means games cannot be used as a vector to attack a member's standing. The only thing being tested is: does this protect the score from a positive-inflation problem? If every member eventually accumulates maximum Prestige bonus, does the score's discriminating power collapse? You want the learning bonus to be meaningful but bounded — probably capped at contributing a maximum of 5–8 points to the Ubuntu Score over a member's lifetime, so it's a real signal but not score-inflating at scale.