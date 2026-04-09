// Replaces cloud-only threat scoring with local-first inference.
// Sensitive CCTV metadata never leaves the premise when local is active.
import { InferenceRouter } from "../inference-router";
import { db } from '@/db/client';
import { incidents, policies } from '@/db/schema';
export interface ThreatClassification {
threatLevel: "none" | "low" | "medium" | "high" | "critical";
confidence: number; // 0–1
category: string; // "person" | "vehicle" | "behavioral_anomaly" | etc.
suppressAlert: boolean; // feeds your existing sharded mutex suppression store
reasoning: string;
inferredLocally: boolean;
}
const CLASSIFY_SYSTEM = `
You are a security threat classifier for SafeGrid, deployed on a local edge device.
Analyse the event metadata and return ONLY valid JSON matching this schema:
{
"threatLevel": "none|low|medium|high|critical",
"confidence": 0.0-1.0,
"category": "person|vehicle|behavioral_anomaly|environmental|false_positive",
"suppressAlert": true|false,
"reasoning": "one sentence"
}
Do not include markdown fences. Return raw JSON only.
`.trim();
export class ThreatClassifier {
constructor(private router: InferenceRouter) {}
async classify(event: {
cameraId: string;
motionScore: number;
objectCount: number;
timeOfDay: number; // 0–23
zoneRiskScore: number; // from your policy engine
recentAlertCount: number; // from suppression store
metadata: Record<string, unknown>;
}): Promise<ThreatClassification> {
const prompt = `
Classify this security event:
- Camera zone risk score: ${event.zoneRiskScore}/100
- Motion intensity: ${event.motionScore}/100
- Objects detected: ${event.objectCount}
- Time: ${event.timeOfDay}:00
- Recent alerts this camera (last 10 min): ${event.recentAlertCount}
- Additional metadata: ${JSON.stringify(event.metadata)}
`.trim();
const result = await this.router.infer({
task: "alert_classify",
prompt,
systemPrompt: CLASSIFY_SYSTEM,
sensitiveData: true, // NEVER routes to cloud
maxTokens: 200,
tier: "local",
});
try {
const parsed = JSON.parse(result.text.replace(/```json|```/g, "").trim());
return { ...parsed, inferredLocally: result.tier === "local" };
} catch {
// Safe default on parse failure
return {
threatLevel: "low",
confidence: 0.5,
category: "unknown",
suppressAlert: false,
reasoning: "Parse error — defaulting to low",
inferredLocally: result.tier === "local",
};
}
}
}