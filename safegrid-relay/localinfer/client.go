// localinfer — thin client for Ollama running Gemma 4 on Jetson Orin Nano.
// Used by the relay node for on-device threat pre-screening before
// forwarding events to the Brain API.
package localinfer
import (
"bytes"
"context"
"encoding/json"
"fmt"
"net/http"
"time"
)
// OllamaClient calls the local Ollama inference server.
type OllamaClient struct {
endpoint string
model string
httpClient *http.Client
}
func New(endpoint, model string) *OllamaClient {
return &OllamaClient{
endpoint: endpoint,
model: model,
httpClient: &http.Client{
Timeout: 5 * time.Second, // must be fast — this is the hot path
},
}
}
type chatRequest struct {
Model string `json:"model"`
Messages []message `json:"messages"`
Stream bool `json:"stream"`
Options options `json:"options"`
}
type message struct {
Role string `json:"role"`
Content string `json:"content"`
}
type options struct {
NumPredict int `json:"num_predict"`
Temperature float64 `json:"temperature"`
}
type chatResponse struct {
Message struct {
Content string `json:"content"`
} `json:"message"`
}
// Classify runs local inference to pre-screen a camera event.
// Returns a compact JSON string: {"threat":"low","confidence":0.82,"suppress":false}
func (c *OllamaClient) Classify(ctx context.Context, eventJSON string) (string, error) {
req := chatRequest{
Model: c.model,
Messages: []message{
{
Role: "system",
Content: `You are a compact security classifier on an edge device.
Given JSON event data, respond ONLY with:
{"threat":"none|low|medium|high|critical","confidence":0.0-1.0,"suppress":true|false}
No other text.`,
},
{Role: "user", Content: eventJSON},
},
Stream: false,
Options: options{NumPredict: 60, Temperature: 0.1},
}
body, err := json.Marshal(req)
if err != nil {
return "", fmt.Errorf("marshal: %w", err)
}
httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
c.endpoint+"/api/chat", bytes.NewReader(body))
if err != nil {
return "", fmt.Errorf("build request: %w", err)
}
httpReq.Header.Set("Content-Type", "application/json")
resp, err := c.httpClient.Do(httpReq)
if err != nil {
return "", fmt.Errorf("inference request: %w", err)
}
defer resp.Body.Close()
var result chatResponse
if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
return "", fmt.Errorf("decode response: %w", err)
}
return result.Message.Content, nil
}
// HealthCheck returns true if the local model is loaded and responding.
func (c *OllamaClient) HealthCheck(ctx context.Context) bool {
req, err := http.NewRequestWithContext(ctx, http.MethodGet,
c.endpoint+"/api/tags", nil)
if err != nil {
return false
}
resp, err := c.httpClient.Do(req)
return err == nil && resp.StatusCode == 200
}