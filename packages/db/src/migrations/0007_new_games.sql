-- Ubuntu Pools — New Games Migration
-- Migration: 0007_new_games.sql

BEGIN;

-- Update game_id enum
ALTER TYPE game_id ADD VALUE 'lottery_scenario';
ALTER TYPE game_id ADD VALUE 'dice_strategy';
ALTER TYPE game_id ADD VALUE 'crop_finance';

-- Update signal_type enum
ALTER TYPE signal_type ADD VALUE 'risk_tolerance';
ALTER TYPE signal_type ADD VALUE 'impulse_index';
ALTER TYPE signal_type ADD VALUE 'decision_speed';
ALTER TYPE signal_type ADD VALUE 'planning_horizon';

COMMIT;