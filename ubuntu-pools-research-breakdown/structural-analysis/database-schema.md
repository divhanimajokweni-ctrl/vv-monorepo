# Database Schema Analysis

## PostgreSQL Schema Design

Ubuntu Pools uses a normalized PostgreSQL schema with JSONB fields for flexible game state storage and behavioral telemetry. The schema supports 1M+ users with optimized indexing and partitioning strategies.

## Core Tables

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  profile JSONB NOT NULL DEFAULT '{}', -- MemberBackboneProfile
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_profile_gin ON users USING GIN(profile);
```

### Game Sessions Table
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type game_type_enum NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  final_score INTEGER,
  achievements_unlocked JSONB DEFAULT '[]',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX idx_game_sessions_start_time ON game_sessions(start_time);
CREATE INDEX idx_game_sessions_is_completed ON game_sessions(is_completed);
CREATE INDEX idx_game_sessions_session_data_gin ON game_sessions USING GIN(session_data);

-- Partitioning by month for performance
CREATE TABLE game_sessions_y2026m01 PARTITION OF game_sessions
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- Additional partitions for scaling
```

### Game Telemetry Table
```sql
CREATE TABLE game_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_game_telemetry_session_id ON game_telemetry(session_id);
CREATE INDEX idx_game_telemetry_event_type ON game_telemetry(event_type);
CREATE INDEX idx_game_telemetry_timestamp ON game_telemetry(timestamp);
CREATE INDEX idx_game_telemetry_processed ON game_telemetry(processed);
CREATE INDEX idx_game_telemetry_event_data_gin ON game_telemetry USING GIN(event_data);

-- Partial index for unprocessed events
CREATE INDEX idx_game_telemetry_unprocessed ON game_telemetry(timestamp)
  WHERE processed = FALSE;
```

### Prestige Scores Table
```sql
CREATE TABLE prestige_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type game_type_enum NOT NULL,
  total_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  achievements JSONB DEFAULT '[]',
  statistics JSONB DEFAULT '{}',
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, game_type)
);

-- Indexes
CREATE INDEX idx_prestige_scores_user_id ON prestige_scores(user_id);
CREATE INDEX idx_prestige_scores_game_type ON prestige_scores(game_type);
CREATE INDEX idx_prestige_scores_total_score ON prestige_scores(total_score DESC);
CREATE INDEX idx_prestige_scores_level ON prestige_scores(level);
```

### Tournaments Table
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game_types game_type_enum[] NOT NULL,
  status tournament_status_enum DEFAULT 'upcoming',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  entry_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(15,2) DEFAULT 0,
  rules JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_game_types ON tournaments USING GIN(game_types);
```

### Tournament Participants Table
```sql
CREATE TABLE tournament_participants (
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  final_rank INTEGER,
  total_score INTEGER DEFAULT 0,
  prizes_won DECIMAL(10,2) DEFAULT 0,
  PRIMARY KEY (tournament_id, user_id)
);

-- Indexes
CREATE INDEX idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX idx_tournament_participants_final_rank ON tournament_participants(final_rank);
```

## Enumerated Types

### Game Types Enum
```sql
CREATE TYPE game_type_enum AS ENUM (
  'ubuntu_monopoly',
  'pool_simulator',
  'credit_ladder',
  'the_commons',
  'market_maker',
  'lottery_scenario',
  'dice_strategy',
  'crop_finance'
);
```

### Tournament Status Enum
```sql
CREATE TYPE tournament_status_enum AS ENUM (
  'upcoming',
  'active',
  'completed',
  'cancelled'
);
```

### Signal Types Enum
```sql
CREATE TYPE signal_type_enum AS ENUM (
  'risk_appetite',
  'cooperative_quotient',
  'stress_response',
  'leadership_index',
  'overextension',
  'knowledge_score',
  'stewardship_potential'
);
```

## Behavioral Profile Tables

### Member Backbone Profile
```sql
CREATE TABLE member_backbone_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  ubuntu_score DECIMAL(5,2) DEFAULT 0, -- Core financial standing (0-100)
  behavioral_signals JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  update_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_member_backbone_profiles_ubuntu_score ON member_backbone_profiles(ubuntu_score);
CREATE INDEX idx_member_backbone_profiles_last_updated ON member_backbone_profiles(last_updated);
CREATE INDEX idx_member_backbone_profiles_signals_gin ON member_backbone_profiles USING GIN(behavioral_signals);
```

### Sovereignty Audit Log
```sql
CREATE TABLE sovereignty_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'erase_games', 'export_data', etc.
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sovereignty_audit_log_user_id ON sovereignty_audit_log(user_id);
CREATE INDEX idx_sovereignty_audit_log_action ON sovereignty_audit_log(action);
CREATE INDEX idx_sovereignty_audit_log_performed_at ON sovereignty_audit_log(performed_at);
```

## Billing Tables

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL, -- 'month', 'year'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

## Performance Optimization

### Indexing Strategy
- **Composite Indexes**: Multi-column indexes for common query patterns
- **GIN Indexes**: For JSONB fields enabling efficient complex queries
- **Partial Indexes**: For frequently filtered subsets (unprocessed telemetry)
- **BRIN Indexes**: For timestamp-based partitioning

### Partitioning Strategy
```sql
-- Monthly partitioning for high-volume tables
CREATE TABLE game_sessions_y2026m02 PARTITION OF game_sessions
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Automatic partition creation trigger
CREATE OR REPLACE FUNCTION create_partition_if_not_exists()
RETURNS TRIGGER AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
BEGIN
  start_date := date_trunc('month', NEW.start_time);
  partition_name := 'game_sessions_y' || extract(year from start_date) || 'm' || lpad(extract(month from start_date)::text, 2, '0');
  
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
    EXECUTE format('CREATE TABLE %I PARTITION OF game_sessions FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, start_date + interval '1 month');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_sessions_partition_trigger
  BEFORE INSERT ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION create_partition_if_not_exists();
```

### Query Optimization
- **Materialized Views**: For complex analytics queries
- **Connection Pooling**: PgBouncer configuration for high concurrency
- **Query Caching**: Redis integration for frequently accessed data

This schema design supports the projected 1M+ users with ACID compliance, efficient querying, and regulatory compliance through audit trails and data sovereignty features.</content>
<parameter name="filePath">ubuntu-pools-research-breakdown/structural-analysis/database-schema.md