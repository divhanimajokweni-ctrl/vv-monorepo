# SafeGrid Brain API Integration Guide

## Overview

This guide provides comprehensive instructions for completing the integration of SafeGrid Brain API with Ubuntu Pools and SafeStakes. The integration enables a unified trust ecosystem where Ubuntu Score influences alert suppression, SafeStakes provides self-vouching, and SafeGrid enforces security boundaries.

## Architecture Context

- **Ubuntu Pools**: Next.js frontend with Drizzle ORM, Clerk authentication, PostgreSQL
- **SafeGrid**: Go-based Brain API for alert suppression and security monitoring
- **SafeStakes**: Staking mechanism that grants automatic vouching privileges
- **Shared Infrastructure**: AWS RDS (af-south-1), Redis/ElastiCache, AWS Secrets Manager

## Prerequisites

1. Go 1.21+ with modules
2. Access to shared AWS RDS instance in af-south-1
3. Redis/ElastiCache cluster configured
4. Clerk application with service accounts
5. Kustomize/ArgoCD setup for Kubernetes deployments

## 1. Database Schema Integration

### Task: Set up SafeGrid database schema in shared RDS

**Status**: TODO

**Objective**: Create SafeGrid-specific schema and tables in the shared PostgreSQL instance.

**Implementation**:

```sql
-- Create safegrid schema
CREATE SCHEMA IF NOT EXISTS safegrid;

-- Set search path for SafeGrid operations
SET search_path TO safegrid, public;

-- Suppression alerts table
CREATE TABLE suppression_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
    category VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    steward_vouch_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_suppression_alerts_user ON suppression_alerts(user_id);
CREATE INDEX idx_suppression_alerts_tier ON suppression_alerts(tier);
CREATE INDEX idx_suppression_alerts_created ON suppression_alerts(created_at);

-- Audit log for suppression decisions
CREATE TABLE suppression_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL,
    user_id UUID NOT NULL,
    decision VARCHAR(20) NOT NULL, -- 'suppressed', 'triggered', 'escalated'
    tier INTEGER,
    reason TEXT,
    steward_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppression_audit_user ON suppression_audit(user_id);
CREATE INDEX idx_suppression_audit_decision ON suppression_audit(decision);
```

**Verification**:
- Run migrations against RDS instance
- Confirm tables exist: `SELECT * FROM information_schema.tables WHERE table_schema = 'safegrid';`

## 2. Authentication & Authorization Setup

### Task: Implement Clerk JWT Validation

**Status**: TODO

**Objective**: Enable SafeGrid to validate Clerk JWTs and authenticate Steward operations.

**Dependencies**:
- Clerk Go SDK: `go get github.com/clerkinc/clerk-sdk-go`
- JWKS endpoint access

**Implementation**:

```go
package auth

import (
    "context"
    "crypto/rsa"
    "errors"
    "net/http"
    "time"

    "github.com/clerkinc/clerk-sdk-go/clerk"
    "github.com/golang-jwt/jwt/v5"
)

type ClerkAuthenticator struct {
    client *clerk.Client
    publicKey *rsa.PublicKey
}

func NewClerkAuthenticator(secretKey string) (*ClerkAuthenticator, error) {
    client, err := clerk.NewClient(secretKey)
    if err != nil {
        return nil, err
    }

    // Fetch JWKS for JWT validation
    jwks, err := client.JWKs()
    if err != nil {
        return nil, err
    }

    // Use first key (simplified - should handle key rotation)
    publicKey := jwks.Keys[0].Key.(*rsa.PublicKey)

    return &ClerkAuthenticator{
        client:    client,
        publicKey: publicKey,
    }, nil
}

func (c *ClerkAuthenticator) ValidateJWT(tokenString string) (*clerk.User, error) {
    token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return c.publicKey, nil
    })

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*jwt.RegisteredClaims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token")
    }

    // Get user from Clerk
    user, err := c.client.Users().Read(claims.Subject)
    if err != nil {
        return nil, err
    }

    return user, nil
}

func (c *ClerkAuthenticator) IsSteward(userID string) (bool, error) {
    // Check if user has Steward authority level
    // This requires integration with Ubuntu Trust Graph API
    // TODO: Implement TrustGraph client
    return false, nil
}
```

**Integration**:
- Add to main.go: `auth := auth.NewClerkAuthenticator(os.Getenv("CLERK_SECRET_KEY"))`
- Use in middleware for request authentication

## 3. Trust Graph Integration

### Task: Implement TrustGraph Client

**Status**: TODO

**Objective**: Connect to Ubuntu Pools Trust Graph to retrieve Ubuntu Scores and Steward relationships.

**API Endpoints to Integrate**:
- `GET /api/trust/score/{userId}` - Get Ubuntu Score
- `GET /api/trust/stewards/{villageId}` - Get active Stewards
- `GET /api/trust/village/{userId}` - Get user's village

**Implementation**:

```go
package trust

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type TrustGraphClient struct {
    baseURL    string
    httpClient *http.Client
    apiKey     string // For service-to-service auth
}

type UbuntuScore struct {
    UserID   string  `json:"userId"`
    Score    int     `json:"score"`
    VillageID string `json:"villageId"`
    Level    string  `json:"level"` // "Novice", "Contributor", "Steward", "Guardian", "Archivist"
}

type Steward struct {
    UserID      string    `json:"userId"`
    VillageID   string    `json:"villageId"`
    LastVouch   time.Time `json:"lastVouch"`
    TrustLevel  int       `json:"trustLevel"`
}

func NewTrustGraphClient(baseURL, apiKey string) *TrustGraphClient {
    return &TrustGraphClient{
        baseURL: baseURL,
        httpClient: &http.Client{Timeout: 10 * time.Second},
        apiKey: apiKey,
    }
}

func (t *TrustGraphClient) GetScore(ctx context.Context, userID string) (int, error) {
    url := fmt.Sprintf("%s/api/trust/score/%s", t.baseURL, userID)

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return 0, err
    }
    req.Header.Set("Authorization", "Bearer "+t.apiKey)
    req.Header.Set("X-API-Version", "2026-03-27")

    resp, err := t.httpClient.Do(req)
    if err != nil {
        return 0, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return 0, fmt.Errorf("API returned status %d", resp.StatusCode)
    }

    var score UbuntuScore
    if err := json.NewDecoder(resp.Body).Decode(&score); err != nil {
        return 0, err
    }

    return score.Score, nil
}

func (t *TrustGraphClient) GetVillageID(ctx context.Context, userID string) (string, error) {
    // Similar implementation
    return "", nil
}

func (t *TrustGraphClient) GetActiveStewards(ctx context.Context, villageID string) ([]Steward, error) {
    // Similar implementation
    return nil, nil
}
```

## 4. Redis Cache Integration

### Task: Set up Redis client for suppression caching

**Status**: TODO

**Objective**: Use Redis for high-speed Tier 3 suppression lookups.

**Dependencies**:
- Redis Go client: `go get github.com/go-redis/redis/v8`

**Implementation**:

```go
package cache

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/go-redis/redis/v8"
)

type SuppressionCache struct {
    client *redis.Client
}

type VouchData struct {
    Type      string    `json:"type"` // "STEWARD" or "SELF_STAKE"
    StewardID string    `json:"stewardId,omitempty"`
    ExpiresAt time.Time `json:"expiresAt"`
}

func NewSuppressionCache(url string) (*SuppressionCache, error) {
    opt, err := redis.ParseURL(url)
    if err != nil {
        return nil, err
    }

    client := redis.NewClient(opt)
    return &SuppressionCache{client: client}, nil
}

func (s *SuppressionCache) GetVouchType(ctx context.Context, userID string) (string, error) {
    key := fmt.Sprintf("safegrid:suppression:t3:%s", userID)

    val, err := s.client.Get(ctx, key).Result()
    if err == redis.Nil {
        return "NONE", nil
    } else if err != nil {
        return "", err
    }

    return val, nil
}

func (s *SuppressionCache) SetStewardVouch(ctx context.Context, userID, stewardID string, duration time.Duration) error {
    key := fmt.Sprintf("safegrid:suppression:t3:%s", userID)

    data := VouchData{
        Type:      "STEWARD",
        StewardID: stewardID,
        ExpiresAt: time.Now().Add(duration),
    }

    jsonData, err := json.Marshal(data)
    if err != nil {
        return err
    }

    return s.client.Set(ctx, key, string(jsonData), duration).Err()
}

func (s *SuppressionCache) SetSelfStakeVouch(ctx context.Context, userID string, duration time.Duration) error {
    key := fmt.Sprintf("safegrid:suppression:t3:%s", userID)

    data := VouchData{
        Type:      "SELF_STAKE",
        ExpiresAt: time.Now().Add(duration),
    }

    jsonData, err := json.Marshal(data)
    if err != nil {
        return err
    }

    return s.client.Set(ctx, key, string(jsonData), duration).Err()
}
```

## 5. Tier 3 Alert Suppression Engine

### Task: Implement core suppression logic

**Status**: TODO

**Objective**: Evaluate alerts against Ubuntu Score and social anchors for Tier 3 suppression.

**Implementation**:

```go
package suppression

import (
    "context"
    "log"
    "time"

    "github.com/go-redis/redis/v8"
)

type Alert struct {
    ID       string
    UserID   string
    Category string // e.g., "MinorAnomalousActivity"
    RiskLevel int   // 1-5 scale
    Metadata map[string]interface{}
}

type SuppressionEngine struct {
    TrustGraph *trust.TrustGraphClient
    Cache      *cache.SuppressionCache
    DB         *sql.DB // For audit logging
}

func NewSuppressionEngine(tg *trust.TrustGraphClient, cache *cache.SuppressionCache, db *sql.DB) *SuppressionEngine {
    return &SuppressionEngine{
        TrustGraph: tg,
        Cache:      cache,
        DB:         db,
    }
}

func (s *SuppressionEngine) EvaluateAlert(ctx context.Context, alert Alert) (bool, error) {
    // 1. Check Redis cache first (highest priority - Steward/Self-Vouch)
    vouchType, err := s.Cache.GetVouchType(ctx, alert.UserID)
    if err != nil {
        log.Printf("Cache error for user %s: %v", alert.UserID, err)
        // Continue with other checks
    }

    if vouchType != "NONE" {
        suppressed := s.evaluateVouchedAlert(alert, vouchType)
        if suppressed {
            s.logSuppression(ctx, alert, 3, "vouch", vouchType)
            return true, nil
        }
    }

    // 2. Fetch Ubuntu Score for Tier 3 logic
    score, err := s.TrustGraph.GetScore(ctx, alert.UserID)
    if err != nil {
        log.Printf("Failed to get score for user %s: %v", alert.UserID, err)
        return false, err
    }

    // 3. Tier 3 Logic: Suppress for Guardians/Archivists on minor anomalies
    if score >= 60 && alert.Category == "MinorAnomalousActivity" && alert.RiskLevel <= 2 {
        s.logSuppression(ctx, alert, 3, "ubuntu_score", fmt.Sprintf("score_%d", score))
        return true, nil
    }

    return false, nil
}

func (s *SuppressionEngine) evaluateVouchedAlert(alert Alert, vouchType string) bool {
    // Steward vouches suppress Level 1 anomalies
    // Self-stake vouches suppress Level 1-2 anomalies
    if vouchType == "STEWARD" && alert.RiskLevel <= 1 {
        return true
    }
    if vouchType == "SELF_STAKE" && alert.RiskLevel <= 2 {
        return true
    }
    return false
}

func (s *SuppressionEngine) logSuppression(ctx context.Context, alert Alert, tier int, reason, details string) {
    // Insert into suppression_audit table
    _, err := s.DB.ExecContext(ctx, `
        INSERT INTO suppression_audit (alert_id, user_id, decision, tier, reason)
        VALUES ($1, $2, 'suppressed', $3, $4)
    `, alert.ID, alert.UserID, tier, reason+"_"+details)

    if err != nil {
        log.Printf("Failed to log suppression: %v", err)
    }
}
```

## 6. Steward Vouch API Handler

### Task: Implement Steward Vouch endpoint

**Status**: TODO

**Objective**: Allow Stewards to vouch for members, enabling Tier 3 suppression.

**Implementation**:

```go
package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "time"

    "github.com/clerkinc/clerk-sdk-go/clerk"
)

type VouchRequest struct {
    MemberID  string `json:"member_id"`
    Reason    string `json:"reason,omitempty"`
    Duration  int    `json:"duration_minutes"` // Default 30
}

type VouchHandler struct {
    Auth       *auth.ClerkAuthenticator
    TrustGraph *trust.TrustGraphClient
    Cache      *cache.SuppressionCache
    EventBus   *events.EventBus // For emitting vouch events
}

func (h *VouchHandler) HandleStewardVouch(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // 1. Authenticate the Steward via Clerk
    sessClaims, err := clerk.SessionFromContext(ctx)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    stewardID := sessClaims.Subject

    // 2. Authorization: Verify Steward level
    isSteward, err := h.Auth.IsSteward(stewardID)
    if err != nil || !isSteward {
        http.Error(w, "Forbidden: Only Stewards can vouch", http.StatusForbidden)
        return
    }

    // 3. Parse request
    var req VouchRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    if req.Duration == 0 {
        req.Duration = 30 // Default
    }

    // 4. Validate member exists and is in same village
    villageID, err := h.TrustGraph.GetVillageID(ctx, stewardID)
    if err != nil {
        http.Error(w, "Failed to get steward village", http.StatusInternalServerError)
        return
    }

    memberVillageID, err := h.TrustGraph.GetVillageID(ctx, req.MemberID)
    if err != nil || villageID != memberVillageID {
        http.Error(w, "Member not in same village", http.StatusForbidden)
        return
    }

    // 5. Set vouch in Redis cache
    duration := time.Duration(req.Duration) * time.Minute
    err = h.Cache.SetStewardVouch(ctx, req.MemberID, stewardID, duration)
    if err != nil {
        http.Error(w, "Failed to set vouch", http.StatusInternalServerError)
        return
    }

    // 6. Emit event for Lindiwe AI and audit
    h.EventBus.Emit("STEWARD_VOUCH_CREATED", map[string]interface{}{
        "steward_id": stewardID,
        "member_id":  req.MemberID,
        "reason":     req.Reason,
        "expires_at": time.Now().Add(duration),
    })

    // 7. Response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status":    "success",
        "message":   "Vouch granted",
        "expires_at": time.Now().Add(duration),
    })
}
```

## 7. API Versioning & Routing

### Task: Set up API routes with versioning

**Status**: TODO

**Objective**: Create RESTful API endpoints with Header-based versioning.

**Implementation**:

```go
package main

import (
    "net/http"
    "os"

    "github.com/gorilla/mux"
    "github.com/rs/cors"
)

func main() {
    // Initialize dependencies
    db := initDatabase()
    redis := initRedis()
    auth := initAuth()
    trustGraph := initTrustGraph()
    cache := cache.NewSuppressionCache(redis)
    suppressionEngine := suppression.NewSuppressionEngine(trustGraph, cache, db)

    // Handlers
    vouchHandler := handlers.NewVouchHandler(auth, trustGraph, cache, eventBus)
    alertHandler := handlers.NewAlertHandler(suppressionEngine)

    // Router with versioning middleware
    r := mux.NewRouter()

    // API v1 routes
    api := r.PathPrefix("/api/v1").Subrouter()
    api.Use(versioningMiddleware)

    // Steward vouching
    api.HandleFunc("/stewards/vouch", vouchHandler.HandleStewardVouch).Methods("POST")

    // Alert evaluation
    api.HandleFunc("/alerts/evaluate", alertHandler.HandleAlertEvaluation).Methods("POST")

    // Health check
    api.HandleFunc("/health", healthHandler).Methods("GET")

    // CORS
    c := cors.New(cors.Options{
        AllowedOrigins:   []string{"https://ubuntu-pools.vercel.app"},
        AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
        AllowedHeaders:   []string{"Authorization", "Content-Type", "X-API-Version"},
        AllowCredentials: true,
    })

    handler := c.Handler(r)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("SafeGrid Brain API starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, handler))
}

func versioningMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        version := r.Header.Get("X-API-Version")
        if version == "" {
            version = "2026-03-27" // Default
        }

        // Add version to context for handlers
        ctx := context.WithValue(r.Context(), "api_version", version)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

## 8. Testing & Validation

### Task: Implement comprehensive tests

**Status**: TODO

**Test Categories**:
- Unit tests for suppression logic
- Integration tests with TrustGraph API
- Redis cache tests
- Authentication tests
- End-to-end vouching flow

**Example Test**:

```go
func TestSuppressionEngine_EvaluateAlert(t *testing.T) {
    // Mock dependencies
    trustGraph := &mock.TrustGraphClient{}
    cache := &mock.SuppressionCache{}
    db := &mock.Database{}

    engine := suppression.NewSuppressionEngine(trustGraph, cache, db)

    // Test case: High Ubuntu Score suppresses minor anomaly
    trustGraph.On("GetScore", "user123").Return(80, nil)
    cache.On("GetVouchType", "user123").Return("NONE", nil)

    alert := suppression.Alert{
        ID:        "alert123",
        UserID:    "user123",
        Category:  "MinorAnomalousActivity",
        RiskLevel: 1,
    }

    suppressed, err := engine.EvaluateAlert(context.Background(), alert)

    assert.NoError(t, err)
    assert.True(t, suppressed)
}
```

## 9. Configuration & Environment

### Task: Set up environment configuration

**Status**: TODO

**Required Environment Variables**:
```bash
# Database
DATABASE_URL=postgres://user:pass@rds.af-south-1.amazonaws.com:5432/safegrid_brain?sslmode=require

# Redis
REDIS_URL=redis://safegrid-cache.af-south-1.cache.amazonaws.com:6379

# Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Trust Graph API
UBUNTU_POOLS_API_URL=https://ubuntu-pools.vercel.app
UBUNTU_POOLS_API_KEY=service_account_key

# AWS Secrets Manager
AWS_REGION=af-south-1
AWS_SECRET_ARN=arn:aws:secretsmanager:af-south-1:123456789:secret:safegrid-shared-creds

# Observability
SENTRY_DSN=https://...
```

## 10. Deployment & Monitoring

### Task: Set up Kubernetes deployment with ArgoCD

**Status**: TODO

**Kustomize Overlay Structure**:
```
kustomization.yaml
deployment.yaml
service.yaml
configmap.yaml
secret.yaml
```

**Key Configurations**:
- Horizontal Pod Autoscaling based on CPU/memory
- Readiness/liveness probes
- Resource limits
- Secret injection from AWS Secrets Manager
- Service mesh integration (Istio/Linkerd)

## 11. Monitoring & Observability

### Task: Implement comprehensive monitoring

**Status**: TODO

**Metrics to Track**:
- Suppression rate by tier
- Cache hit/miss ratios
- API latency percentiles
- Authentication failure rates
- Trust Graph API error rates

**Implementation**: Use Prometheus + Grafana, integrate with existing Ubuntu Pools observability stack.

## 12. Security & Compliance

### Task: Implement security measures

**Status**: TODO

**Requirements**:
- Rate limiting on API endpoints
- Input validation and sanitization
- Audit logging for all suppression decisions
- Encryption at rest for sensitive data
- Regular security scans and dependency updates

## Validation Checklist

- [ ] Database schema deployed and accessible
- [ ] Clerk JWT validation working
- [ ] Trust Graph API integration functional
- [ ] Redis cache operations successful
- [ ] Tier 3 suppression logic correct
- [ ] Steward vouching endpoint operational
- [ ] API versioning middleware active
- [ ] Unit and integration tests passing
- [ ] Kubernetes deployment ready
- [ ] Monitoring dashboards configured
- [ ] Security audit completed

## Next Steps

1. Implement the Go code following this guide
2. Deploy to staging environment
3. Conduct integration testing with Ubuntu Pools
4. Validate SafeStakes self-vouching flow
5. Monitor suppression effectiveness
6. Roll out to production

This integration creates a seamless trust ecosystem where reputation drives security decisions, enabling frictionless experiences for trusted community members.