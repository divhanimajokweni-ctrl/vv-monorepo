// model_manager.go — handles Ollama model pull on first boot.
// Ensures the correct Gemma 4 variant is available before the relay starts.
package localinfer
import (
"context"
"encoding/json"
"fmt"
"net/http"
"strings"
)
// EnsureModel checks if the target model is pulled; if not, pulls it.
// Call this during relay startup before accepting camera connections.
func (c *OllamaClient) EnsureModel(ctx context.Context) error {
// Check if model already exists
resp, err := http.Get(c.endpoint + "/api/tags")
if err != nil {
return fmt.Errorf("cannot reach Ollama: %w", err)
}
defer resp.Body.Close()
var tags struct {
Models []struct{ Name string `json:"name"` } `json:"models"`
}
if err := json.NewDecoder(resp.Body).Decode(&tags); err != nil {
return fmt.Errorf("decode tags: %w", err)
}
for _, m := range tags.Models {
if strings.HasPrefix(m.Name, c.model) {
return nil // already present
}
}
// Pull the model (blocking — only happens once)
fmt.Printf("[localinfer] Pulling model %s — this may take a few minutes...\n", c.model)
pullBody := fmt.Sprintf(`{"model":"%s","stream":false}`, c.model)
pullResp, err := http.Post(
c.endpoint+"/api/pull",
"application/json",
strings.NewReader(pullBody),
)
if err != nil {
return fmt.Errorf("pull model: %w", err)
}
defer pullResp.Body.Close()
if pullResp.StatusCode != 200 {
return fmt.Errorf("model pull returned status %d", pullResp.StatusCode)
}
fmt.Printf("[localinfer] Model %s ready\n", c.model)
return nil
}