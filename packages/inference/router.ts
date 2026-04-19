// Inference Router — routes tasks to local Gemma 4 or Anthropic cloud
// based on task complexity tier and data sensitivity policy.
export type InferenceTier = "local" | "cloud" | "auto";
export type TaskType =
| "alert_classify" // SafeGrid: local only (POPIA sensitive)
| "threat_score" // SafeGrid: local only
| "mix_suggest" // Ubuntu DJ: local preferred
| "bpm_analysis" // Ubuntu DJ: local only
| "ubuntu_score" // Ubuntu Pools: local only
| "nudge_message" // Ubuntu Pools: local preferred
| "complex_reasoning" // All platforms: cloud
| "regulatory_analysis" // All platforms: cloud
| "investor_narrative"; // All platforms: cloud
interface InferenceRequest {
task: TaskType;
prompt: string;
systemPrompt?: string;
tier?: InferenceTier;
sensitiveData?: boolean; // forces local if true
maxTokens?: number;
}
interface InferenceResponse {
text: string;
model: string;
tier: "local" | "cloud";
latencyMs: number;
}
// Tasks that MUST stay local regardless of tier preference
const ALWAYS_LOCAL: TaskType[] = [
"alert_classify",
"threat_score",
"ubuntu_score",
"bpm_analysis",
];
// Tasks that should prefer cloud (complex, low-frequency)
const PREFER_CLOUD: TaskType[] = [
"complex_reasoning",
"regulatory_analysis",
"investor_narrative",
];
export class InferenceRouter {
  private localEndpoint: string;
  private localModel: string;
  private cloudApiKey: string;
  private openRouterApiKey?: string;
  private localHealthy: boolean = false;
  constructor(config: {
    localEndpoint?: string; // e.g. "http://localhost:11434" (Ollama)
    localModel?: string; // e.g. "gemma4:27b" or "gemma4:4b" for edge
    cloudApiKey?: string;
    openRouterApiKey?: string;
  }) {
    this.localEndpoint = config.localEndpoint ?? "http://localhost:11434";
    this.localModel = config.localModel ?? "gemma3:4b"; // Ollama model name
    this.cloudApiKey = config.cloudApiKey!;
    this.openRouterApiKey = config.openRouterApiKey;
    this.checkLocalHealth();
  }
private async checkLocalHealth(): Promise<void> {
try {
const res = await fetch(`${this.localEndpoint}/api/tags`, {
signal: AbortSignal.timeout(2000),
});
this.localHealthy = res.ok;
} catch {
this.localHealthy = false;
console.warn("[InferenceRouter] Local model unavailable — falling back to cloud");
}
// Recheck every 30s
setTimeout(() => this.checkLocalHealth(), 30_000);
}
private shouldUseLocal(task: TaskType, sensitiveData: boolean): boolean {
if (sensitiveData) return true;
if (ALWAYS_LOCAL.includes(task)) return true;
if (PREFER_CLOUD.includes(task)) return false;
return this.localHealthy; // "auto" — use local if available
}
async infer(req: InferenceRequest): Promise<InferenceResponse> {
const useLocal = this.shouldUseLocal(
req.task,
req.sensitiveData ?? false
);
if (useLocal && this.localHealthy) {
return this.inferLocal(req);
}
return this.inferCloud(req);
}
// ── LOCAL: Ollama API ──────────────────────────────────────────
private async inferLocal(req: InferenceRequest): Promise<InferenceResponse> {
const t0 = Date.now();
const messages = [];
if (req.systemPrompt) {
messages.push({ role: "system", content: req.systemPrompt });
}
messages.push({ role: "user", content: req.prompt });
const res = await fetch(`${this.localEndpoint}/api/chat`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
model: this.localModel,
messages,
stream: false,
options: {
num_predict: req.maxTokens ?? 512,
temperature: 0.3, // lower temp for classification tasks
},
}),
});
if (!res.ok) {
// Fallback to cloud on local failure
console.warn("[InferenceRouter] Local inference failed — falling back to cloud");
return this.inferCloud(req);
}
const data = await res.json();
return {
text: data.message?.content ?? "",
model: this.localModel,
tier: "local",
latencyMs: Date.now() - t0,
};
}
// ── CLOUD: Anthropic API ───────────────────────────────────────
  private async inferCloud(req: InferenceRequest): Promise<InferenceResponse> {
  const t0 = Date.now();
  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-5-20251001",
    max_tokens: req.maxTokens ?? 1024,
    messages: [{ role: "user", content: req.prompt }],
  };
  if (req.systemPrompt) body.system = req.systemPrompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": this.cloudApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const text = data.content
    ?.filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("") ?? "";
  return {
    text,
    model: "claude-sonnet-4-5",
    tier: "cloud",
    latencyMs: Date.now() - t0,
  };
  }

  // ── OPENROUTER: Alternative cloud API ────────────────────────
  async inferOpenRouter(
    req: Omit<InferenceRequest, "tier">
  ): Promise<InferenceResponse> {
    const t0 = Date.now();
    const messages = [];
    if (req.systemPrompt) {
      messages.push({ role: "system", content: req.systemPrompt });
    }
    messages.push({ role: "user", content: req.prompt });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.openRouterApiKey}`,
        "HTTP-Referer": "https://ubuntu-pools.com",
        "X-OpenRouter-Title": "Ubuntu Pools",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.2",
        messages,
        max_tokens: req.maxTokens ?? 1024,
      }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return {
      text,
      model: data.model ?? "openai/gpt-5.2",
      tier: "cloud",
      latencyMs: Date.now() - t0,
    };
  }
}
// Singleton export for use across services
export function createRouter(env: NodeJS.ProcessEnv): InferenceRouter {
  return new InferenceRouter({
    localEndpoint: env.LOCAL_INFERENCE_ENDPOINT,
    localModel: env.LOCAL_MODEL_NAME,
    cloudApiKey: env.ANTHROPIC_API_KEY,
    openRouterApiKey: env.OPENROUTER_API_KEY,
  });
}