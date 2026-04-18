# API Structure Analysis

## RESTful API Design Principles

Ubuntu Pools implements a comprehensive REST API with GraphQL supplementation for complex queries, designed for high-throughput operations supporting 1M+ concurrent users.

## Core API Endpoints

### Authentication API (`/api/auth`)

#### POST `/api/auth/register`
Register new user account
```typescript
Request Body:
{
  email: string;
  password: string;
  profile?: Partial<MemberBackboneProfile>;
}

Response (201):
{
  user: User;
  token: string;
  refreshToken: string;
}

Error Responses:
400: Validation error
409: Email already exists
```

#### POST `/api/auth/login`
Authenticate user credentials
```typescript
Request Body:
{
  email: string;
  password: string;
}

Response (200):
{
  user: User;
  token: string;
  refreshToken: string;
}

Error Responses:
401: Invalid credentials
429: Rate limit exceeded
```

#### POST `/api/auth/refresh`
Refresh access token
```typescript
Request Body:
{
  refreshToken: string;
}

Response (200):
{
  token: string;
  refreshToken: string;
}
```

#### POST `/api/auth/logout`
Invalidate user session
```typescript
Headers:
Authorization: Bearer <token>

Response (200):
{
  message: "Logged out successfully"
}
```

### Games API (`/api/games`)

#### GET `/api/games`
List available games with metadata
```typescript
Query Parameters:
?category=finance&limit=10&offset=0

Response (200):
{
  games: Game[];
  total: number;
  hasMore: boolean;
}

Game Object:
{
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  maxPlayers: number;
  thumbnailUrl: string;
  isActive: boolean;
}
```

#### POST `/api/games/sessions`
Start new game session
```typescript
Request Body:
{
  gameType: GameType;
  gameMode: 'solo' | 'multiplayer';
  tournamentId?: string;
}

Response (201):
{
  sessionId: string;
  sessionToken: string;
  gameState: GameState;
  expiresAt: string;
}
```

#### GET `/api/games/sessions/:sessionId`
Get current session state
```typescript
Response (200):
{
  sessionId: string;
  gameType: GameType;
  gameState: GameState;
  startTime: string;
  lastActivity: string;
  isActive: boolean;
}
```

#### PUT `/api/games/sessions/:sessionId`
Update game session state
```typescript
Request Body:
{
  action: GameAction;
  clientTimestamp: string;
}

GameAction Object:
{
  type: string;
  payload: any;
  sequenceNumber: number;
}

Response (200):
{
  gameState: GameState;
  events: GameEvent[];
  serverTimestamp: string;
}
```

#### POST `/api/games/sessions/:sessionId/end`
End game session and calculate results
```typescript
Request Body:
{
  finalState: GameState;
  surrender?: boolean;
}

Response (200):
{
  results: GameResults;
  prestigeScore: number;
  achievements: Achievement[];
  telemetryProcessed: boolean;
}

GameResults Object:
{
  score: number;
  rank?: number;
  duration: number;
  completionPercentage: number;
  behavioralInsights: BehavioralSignals;
}
```

### Telemetry API (`/api/telemetry`)

#### POST `/api/telemetry/ingest`
Ingest game telemetry for Lindiwe AI processing
```typescript
Request Body:
{
  sessionId: string;
  events: TelemetryEvent[];
  clientVersion: string;
}

TelemetryEvent Object:
{
  eventType: string;
  eventData: any;
  timestamp: string;
  sequenceNumber: number;
}

Response (202):
{
  batchId: string;
  eventsProcessed: number;
  processingEstimated: number; // seconds
}
```

#### GET `/api/telemetry/insights/:userId`
Get behavioral insights for user
```typescript
Query Parameters:
?period=30d&includeRaw=false

Response (200):
{
  userId: string;
  period: string;
  insights: BehavioralInsights;
  trends: TrendData[];
  recommendations: Recommendation[];
}

BehavioralInsights Object:
{
  riskAppetite: number;
  cooperativeQuotient: number;
  stressResponse: number;
  leadershipIndex: number;
  knowledgeScore: number;
  stewardshipPotential: number;
}
```

### Sovereignty API (`/api/sovereignty`)

#### DELETE `/api/sovereignty/erase-games`
POPIA-compliant game data erasure
```typescript
Request Body:
{
  confirmation: string; // Must match "ERASE_ALL_GAME_DATA"
  reason?: string;
}

Response (200):
{
  erasedRecords: number;
  auditId: string;
  completedAt: string;
}

Error Responses:
400: Invalid confirmation
403: Insufficient permissions
```

#### GET `/api/sovereignty/audit-log`
Get data access audit trail
```typescript
Query Parameters:
?page=1&limit=50&startDate=2026-01-01&endDate=2026-12-31

Response (200):
{
  auditLog: AuditEntry[];
  total: number;
  hasMore: boolean;
}

AuditEntry Object:
{
  id: string;
  action: string;
  details: any;
  performedAt: string;
  ipAddress: string;
}
```

#### POST `/api/sovereignty/export-data`
Export user data for portability
```typescript
Request Body:
{
  includeGameData: boolean;
  includeTelemetry: boolean;
  format: 'json' | 'csv';
}

Response (202):
{
  exportId: string;
  status: 'processing';
  estimatedCompletion: string;
}
```

### Billing API (`/api/billing`)

#### POST `/api/billing/subscriptions`
Create or update subscription
```typescript
Request Body:
{
  tier: 'premium' | 'pro';
  interval: 'month' | 'year';
  paymentMethodId: string; // Stripe payment method
}

Response (200):
{
  subscriptionId: string;
  clientSecret: string; // For Stripe confirmation
  amount: number;
  currency: string;
}
```

#### GET `/api/billing/usage`
Get billing usage analytics
```typescript
Query Parameters:
?period=current_month

Response (200):
{
  period: string;
  subscription: SubscriptionInfo;
  usage: {
    gamesPlayed: number;
    tournamentsEntered: number;
    dataProcessed: number; // GB
  };
  costs: {
    subscription: number;
    overage: number;
    total: number;
  };
}
```

#### POST `/api/billing/webhooks`
Stripe webhook endpoint
```typescript
Headers:
Stripe-Signature: <signature>

Request Body: // Stripe webhook payload

Response (200):
{
  received: true;
}
```

### Tournaments API (`/api/tournaments`)

#### GET `/api/tournaments`
List active tournaments
```typescript
Query Parameters:
?status=active&gameType=ubuntu_monopoly&limit=10

Response (200):
{
  tournaments: Tournament[];
  total: number;
}

Tournament Object:
{
  id: string;
  name: string;
  gameTypes: GameType[];
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  participantCount: number;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
}
```

#### POST `/api/tournaments/:tournamentId/join`
Join tournament
```typescript
Response (200):
{
  participantId: string;
  joinedAt: string;
  entryFee: number;
}
```

#### GET `/api/tournaments/:tournamentId/leaderboard`
Get tournament leaderboard
```typescript
Response (200):
{
  leaderboard: LeaderboardEntry[];
  lastUpdated: string;
}

LeaderboardEntry Object:
{
  rank: number;
  userId: string;
  username: string;
  totalScore: number;
  gamesPlayed: number;
}
```

## API Security & Performance

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 15-minute expiry
- **Refresh Tokens**: 7-day expiry for seamless user experience
- **Role-Based Access**: Different permissions for free/premium users
- **API Keys**: For server-to-server communications

### Rate Limiting
```typescript
// Rate limit configuration
const rateLimits = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15min
  games: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
  telemetry: { windowMs: 60 * 1000, max: 500 }, // High volume for telemetry
  billing: { windowMs: 60 * 1000, max: 50 },
};
```

### Caching Strategy
- **Response Caching**: Redis for frequently accessed data (game metadata, leaderboards)
- **Database Query Caching**: Prepared statements and connection pooling
- **CDN Caching**: Static assets and API responses

### Error Handling
```typescript
Response Format:
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### Monitoring & Analytics
- **Request Logging**: All API calls logged with user context
- **Performance Metrics**: Response times, error rates, throughput
- **Business Metrics**: API usage patterns, feature adoption

This API structure supports the complex game interactions, real-time telemetry processing, and billing integrations required for scaling to 1M+ users while maintaining security and performance standards.</content>
<parameter name="filePath">ubuntu-pools-research-breakdown/structural-analysis/api-structure.md