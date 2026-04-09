// BEFORE: cameraReader → fanInMultiplexer → authenticatedIngestClient
// AFTER: cameraReader → fanInMultiplexer → [LOCAL INFERENCE PRE-SCREEN]
// → (suppress OR) → authenticatedIngestClient
package relay
import (
"context"
"encoding/json"
"log/slog"
"safegrid-relay/localinfer"
// ... existing imports
)
// Add to RelayConfig struct:
type RelayConfig struct {
// ... existing fields ...
LocalInferEndpoint string // "http://localhost:11434" or "" to disable
LocalInferModel string // "gemma3:4b" for Jetson Orin Nano
PreScreenEnabled bool
}
// Add to Relay struct:
type Relay struct {
// ... existing fields ...
inferClient *localinfer.OllamaClient
preScreen bool
}
// Add to New() constructor:
func New(cfg RelayConfig) *Relay {
r := &Relay{
// ... existing init ...
preScreen: cfg.PreScreenEnabled,
}
if cfg.LocalInferEndpoint != "" {
r.inferClient = localinfer.New(cfg.LocalInferEndpoint, cfg.LocalInferModel)
}
return r
}
// Modify the event dispatch loop in runFanIn():
func (r *Relay) dispatchEvent(ctx context.Context, evt CameraEvent) error {
// ── NEW: local pre-screening ──────────────────────────────────
if r.preScreen && r.inferClient != nil {
evtJSON, _ := json.Marshal(evt)
result, err := r.inferClient.Classify(ctx, string(evtJSON))
if err != nil {
slog.Warn("local inference failed — forwarding unscreened",
"camera", evt.CameraID, "err", err)
} else {
var screen struct {
Threat string `json:"threat"`
Confidence float64 `json:"confidence"`
Suppress bool `json:"suppress"`
}
if jsonErr := json.Unmarshal([]byte(result), &screen); jsonErr == nil {
evt.LocalThreatLevel = screen.Threat
evt.LocalConfidence = screen.Confidence
if screen.Suppress {
slog.Debug("event suppressed by local inference",
"camera", evt.CameraID, "threat", screen.Threat)
return nil // drop here — never reaches Brain API
}
// Only forward high/critical upstream if pre-screen active
if r.preScreen && screen.Threat == "none" {
return nil
}
}
}
}
// ── EXISTING: circuit breaker + authenticated ingest ─────────
return r.ingestClient.Send(ctx, evt) // existing
}