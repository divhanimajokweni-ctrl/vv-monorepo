// Ubuntu Score Engine — real-time, local-first reputation scoring.
// Runs Gemma 4 locally for every score update event.
// No user behavioral data ever leaves the platform.
import { InferenceRouter } from "../inference-router";
import { db } from '@ubuntu/db/client';
import { ubuntuScores, stokvels, members, contributions } from '@ubuntu/db/schema';
import { eq, desc, gte, and } from "drizzle-orm";
export interface UbuntuScoreFactors {
consistencyScore: number; // 0-100: on-time contribution rate
communityScore: number; // 0-100: participation, peer interactions
growthScore: number; // 0-100: savings growth trajectory
safeStakeScore: number; // 0-100: responsible wagering behavior
trustScore: number; // 0-100: repayment / commitment history
}
export interface UbuntuScoreResult {
composite: number; // 0-100
factors: UbuntuScoreFactors;
trend: "rising" | "stable" | "declining";
nudge: string; // personalized encouragement message
nextMilestone: string; // what to aim for next
inferredLocally: boolean;
}
const SCORE_SYSTEM = `
You are the Ubuntu Score engine for Ubuntu Pools, a community savings platform
rooted in African Ubuntu philosophy. Your role is to score member financial
wellness and generate encouraging, culturally resonant nudges.
Return ONLY valid JSON matching this exact schema:
{
"composite": 0-100,
"trend": "rising|stable|declining",
"nudge": "encouraging 1-sentence message using Ubuntu principles",
"nextMilestone": "specific actionable next step",
"factors": {
"consistencyScore": 0-100,
"communityScore": 0-100,
"growthScore": 0-100,
"safeStakeScore": 0-100,
"trustScore": 0-100
}
}
No markdown. Raw JSON only.`.trim();
export class UbuntuScoreEngine {
constructor(private router: InferenceRouter) {}
async computeScore(memberId: string): Promise<UbuntuScoreResult> {
// Gather raw signals from DB
const signals = await this.gatherSignals(memberId);
const prompt = `
Compute Ubuntu Score for this member:
SAVINGS BEHAVIOR:
- Contributions on time (last 90 days): ${signals.onTimeRate}%
- Total saved this quarter: R${signals.savedThisQuarter}
- Missed contributions: ${signals.missedCount}
- Average contribution: R${signals.avgContribution}
COMMUNITY:
- Stokvel group participation rate: ${signals.participationRate}%
- Peer recommendations received: ${signals.peerRecs}
- Community messages sent: ${signals.msgsSent}
GROWTH:
- Savings growth vs last quarter: ${signals.growthPct}%
- Consecutive months saving: ${signals.streak}
SAFESTAKE (Responsible Wagering):
- Redirected gambling losses to savings: R${signals.redirectedToSavings}
- Loss velocity flags triggered: ${signals.lossVelocityFlags}
TRUST:
- Months as active member: ${signals.membershipMonths}
- Loan repayment rate (if applicable): ${signals.repaymentRate ?? "N/A"}%
`.trim();
const result = await this.router.infer({
task: "ubuntu_score",
prompt,
systemPrompt: SCORE_SYSTEM,
sensitiveData: true, // NEVER leaves platform
maxTokens: 350,
});
try {
const parsed = JSON.parse(result.text.replace(/```json|```/g, "").trim());
        // Persist to DB
        await db.insert(ubuntuScores).values({
          userId: memberId,
          score: parsed.composite,
          tier: 1, // TODO: calculate tier
          lastEvent: parsed.trend,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: [ubuntuScores.userId],
          set: {
            score: parsed.composite,
            tier: 1, // TODO: calculate tier
            lastEvent: parsed.trend,
            updatedAt: new Date(),
          },
        });
return { ...parsed, inferredLocally: result.tier === "local" };
} catch {
return this.fallbackScore(signals);
}
}
private async gatherSignals(memberId: string) {
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentContribs = await db.select()
    .from(contributions)
    .where(and(eq(contributions.userId, memberId), gte(contributions.createdAt, ninetyDaysAgo)))
    .orderBy(desc(contributions.createdAt));
  const onTime = recentContribs.filter(c => c.confirmedAt !== null).length;
  const total = recentContribs.length || 1;
  const missed = recentContribs.filter(c => c.status === "missed").length;
  const saved = recentContribs.reduce((s, c) => s + Number(c.amount), 0);
const avg = saved / total;
return {
onTimeRate: Math.round((onTime / total) * 100),
savedThisQuarter: Math.round(saved),
missedCount: missed,
avgContribution: Math.round(avg),
participationRate: 75, // TODO: join stokvel_events table
peerRecs: 0,
msgsSent: 0,
growthPct: 0, // TODO: quarter-over-quarter
streak: 0, // TODO: consecutive months
redirectedToSavings: 0, // TODO: join safestake_redirections
lossVelocityFlags: 0, // TODO: join safestake_velocity_events
membershipMonths: 0, // TODO: compute from join date
repaymentRate: null,
};
}
private fallbackScore(signals: ReturnType<typeof this.gatherSignals> extends Promise<infer
T> ? T : never): UbuntuScoreResult {
const base = Math.min(100, Math.round(signals.onTimeRate * 0.6 + 40));
return {
composite: base,
trend: "stable",
nudge: "Every contribution brings the community forward. Keep going.",
nextMilestone: "Complete your next 3 contributions on time.",
factors: {
consistencyScore: signals.onTimeRate,
communityScore: 70,
growthScore: 50,
safeStakeScore: 80,
trustScore: 60,
},
inferredLocally: false,
};
}
}