-- Ubuntu Pools — Phase 12: CPME Migration
-- Collective Procurement & Market Engine
-- Run after 0002_village_os.sql

BEGIN;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE procurement_circle_status AS ENUM (
  'forming',
  'active',
  'negotiating',
  'contracting',
  'completed',
  'cancelled'
);

CREATE TYPE demand_status AS ENUM (
  'draft',
  'open',
  'aggregating',
  'locked',
  'fulfilled',
  'cancelled'
);

CREATE TYPE supply_status AS ENUM (
  'draft',
  'available',
  'reserved',
  'sold',
  'expired'
);

CREATE TYPE supplier_status AS ENUM (
  'pending',
  'verified',
  'suspended',
  'removed'
);

CREATE TYPE bid_status AS ENUM (
  'submitted',
  'shortlisted',
  'negotiating',
  'accepted',
  'rejected',
  'withdrawn'
);

CREATE TYPE contract_status AS ENUM (
  'draft',
  'pending_approval',
  'active',
  'fulfilling',
  'completed',
  'disputed',
  'terminated'
);

CREATE TYPE order_settlement_status AS ENUM (
  'pending',
  'paid',
  'shipped',
  'delivered',
  'confirmed',
  'disputed',
  'refunded'
);

-- =============================================================================
-- TABLE: village_entities (unified reference for villages across CPME)
-- =============================================================================

CREATE TABLE village_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'village',
  ubuntu_score INTEGER NOT NULL DEFAULT 500,
  location JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_village_entities_name ON village_entities(name);
CREATE INDEX idx_village_entities_type ON village_entities(type);
CREATE INDEX idx_village_entities_score ON village_entities(ubuntu_score);

-- =============================================================================
-- TABLE: procurement_circles (groups of villages forming buying collectives)
-- =============================================================================

CREATE TABLE procurement_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  creator_village_id UUID NOT NULL REFERENCES village_entities(id) ON DELETE CASCADE,
  member_village_ids JSONB DEFAULT '[]',
  min_villages INTEGER NOT NULL DEFAULT 1,
  max_villages INTEGER,
  total_demand BIGINT NOT NULL DEFAULT 0,
  target_price BIGINT,
  deadline TIMESTAMPTZ,
  status procurement_circle_status NOT NULL DEFAULT 'forming',
  coordination_fee_percent INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_procurement_circles_creator ON procurement_circles(creator_village_id);
CREATE INDEX idx_procurement_circles_category ON procurement_circles(category);
CREATE INDEX idx_procurement_circles_status ON procurement_circles(status);

-- =============================================================================
-- TABLE: village_demands (what villages want to buy collectively)
-- =============================================================================

CREATE TABLE village_demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES village_entities(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES procurement_circles(id) ON DELETE SET NULL,
  product TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  individual_price BIGINT NOT NULL,
  target_price BIGINT,
  urgency TEXT NOT NULL DEFAULT 'normal',
  delivery_location JSONB DEFAULT '{}',
  preferred_suppliers JSONB DEFAULT '[]',
  deadline TIMESTAMPTZ,
  status demand_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_village_demands_village ON village_demands(village_id);
CREATE INDEX idx_village_demands_circle ON village_demands(circle_id);
CREATE INDEX idx_village_demands_category ON village_demands(category);
CREATE INDEX idx_village_demands_status ON village_demands(status);

-- =============================================================================
-- TABLE: village_supplies (what villages want to sell collectively)
-- =============================================================================

CREATE TABLE village_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES village_entities(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  asking_price BIGINT NOT NULL,
  min_price BIGINT,
  quality TEXT NOT NULL DEFAULT 'standard',
  harvest_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  location JSONB DEFAULT '{}',
  preferred_buyers JSONB DEFAULT '[]',
  deadline TIMESTAMPTZ,
  status supply_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_village_supplies_village ON village_supplies(village_id);
CREATE INDEX idx_village_supplies_category ON village_supplies(category);
CREATE INDEX idx_village_supplies_status ON village_supplies(status);

-- =============================================================================
-- TABLE: suppliers (registered suppliers who can bid)
-- =============================================================================

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  business_type TEXT NOT NULL,
  registration_number TEXT,
  tax_id TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address JSONB DEFAULT '{}',
  categories JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  min_order_value BIGINT,
  max_order_capacity BIGINT,
  payment_terms TEXT NOT NULL DEFAULT 'net_30',
  delivery_regions JSONB DEFAULT '[]',
  trust_score INTEGER NOT NULL DEFAULT 500,
  successful_orders INTEGER NOT NULL DEFAULT 0,
  total_order_value BIGINT NOT NULL DEFAULT 0,
  status supplier_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_category ON suppliers USING GIN(categories);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_trust ON suppliers(trust_score);

-- =============================================================================
-- TABLE: bids (supplier responses to demands)
-- =============================================================================

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES village_demands(id) ON DELETE CASCADE,
  supply_id UUID REFERENCES village_supplies(id) ON DELETE SET NULL,
  circle_id UUID REFERENCES procurement_circles(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  unit_price BIGINT NOT NULL,
  total_price BIGINT NOT NULL,
  quantity_offered INTEGER NOT NULL,
  delivery_time INTEGER NOT NULL,
  delivery_terms TEXT,
  payment_terms TEXT,
  warranty TEXT,
  additional_notes TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  savings_from_retail INTEGER NOT NULL DEFAULT 0,
  status bid_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bids_demand ON bids(demand_id);
CREATE INDEX idx_bids_supply ON bids(supply_id);
CREATE INDEX idx_bids_circle ON bids(circle_id);
CREATE INDEX idx_bids_supplier ON bids(supplier_id);
CREATE INDEX idx_bids_status ON bids(status);

-- =============================================================================
-- TABLE: contracts (agreements between villages and suppliers)
-- =============================================================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  circle_id UUID REFERENCES procurement_circles(id) ON DELETE SET NULL,
  demand_id UUID REFERENCES village_demands(id) ON DELETE SET NULL,
  supply_id UUID REFERENCES village_supplies(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  winning_bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  member_village_ids JSONB DEFAULT '[]',
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  unit_price BIGINT NOT NULL,
  total_value BIGINT NOT NULL,
  coordination_fee_percent INTEGER NOT NULL DEFAULT 50,
  coordination_fee BIGINT NOT NULL DEFAULT 0,
  net_value BIGINT NOT NULL,
  delivery_terms TEXT NOT NULL,
  payment_terms TEXT NOT NULL,
  delivery_deadline TIMESTAMPTZ,
  approval_vote_id UUID,
  status contract_status NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_circle ON contracts(circle_id);
CREATE INDEX idx_contracts_supplier ON contracts(supplier_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- =============================================================================
-- TABLE: order_settlements (tracking delivery and payment)
-- =============================================================================

CREATE TABLE order_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  paid_by_village_id UUID NOT NULL REFERENCES village_entities(id) ON DELETE CASCADE,
  paid_to_supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status order_settlement_status NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  payment_confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_settlements_contract ON order_settlements(contract_id);
CREATE INDEX idx_order_settlements_village ON order_settlements(paid_by_village_id);
CREATE INDEX idx_order_settlements_status ON order_settlements(status);

-- =============================================================================
-- TABLE: cross_village_federations (federations of villages for bulk coordination)
-- =============================================================================

CREATE TABLE cross_village_federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  member_village_ids JSONB DEFAULT '[]',
  total_demand BIGINT NOT NULL DEFAULT 0,
  active_contracts INTEGER NOT NULL DEFAULT 0,
  total_trade_volume BIGINT NOT NULL DEFAULT 0,
  coordination_fee_percent INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cross_village_federations_name ON cross_village_federations(name);
CREATE INDEX idx_cross_village_federations_category ON cross_village_federations(category);

-- =============================================================================
-- TABLE: market_intelligence (aggregated demand/supply data for insights)
-- =============================================================================

CREATE TABLE market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  product TEXT NOT NULL,
  region TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_demand BIGINT NOT NULL DEFAULT 0,
  average_price BIGINT NOT NULL DEFAULT 0,
  price_range_low BIGINT,
  price_range_high BIGINT,
  participating_villages INTEGER NOT NULL DEFAULT 0,
  supplier_count INTEGER NOT NULL DEFAULT 0,
  negotiation_success_rate INTEGER NOT NULL DEFAULT 0,
  average_savings_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_market_intelligence_category ON market_intelligence(category);
CREATE INDEX idx_market_intelligence_product ON market_intelligence(product);
CREATE INDEX idx_market_intelligence_period ON market_intelligence(period_start, period_end);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to calculate coordination fee
CREATE OR REPLACE FUNCTION calculate_coordination_fee(
  p_total_value BIGINT,
  p_fee_percent INTEGER
) RETURNS BIGINT AS $$
BEGIN
  RETURN (p_total_value * p_fee_percent) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate supplier trust score adjustment
CREATE OR REPLACE FUNCTION adjust_supplier_trust(
  p_current_score INTEGER,
  p_successful BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
  IF p_successful THEN
    RETURN LEAST(1000, p_current_score + 10);
  ELSE
    RETURN GREATEST(100, p_current_score - 20);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate village aggregate demand
CREATE OR REPLACE FUNCTION calculate_circle_demand(p_circle_id UUID)
RETURNS TABLE(
  total_quantity BIGINT,
  estimated_value BIGINT,
  village_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(vd.quantity), 0)::BIGINT,
    COALESCE(SUM(vd.quantity * vd.individual_price), 0)::BIGINT,
    COUNT(DISTINCT vd.village_id)::INTEGER
  FROM village_demands vd
  WHERE vd.circle_id = p_circle_id
    AND vd.status IN ('open', 'locked', 'aggregating');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get supplier performance metrics
CREATE OR REPLACE FUNCTION get_supplier_metrics(p_supplier_id UUID)
RETURNS TABLE(
  total_orders BIGINT,
  success_rate DECIMAL(5,2),
  avg_order_value BIGINT,
  trust_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.successful_orders::BIGINT,
    CASE 
      WHEN s.total_order_value > 0 
      THEN (s.successful_orders::DECIMAL / NULLIF(s.total_order_value, 0)) * 100 
      ELSE 0 
    END,
    CASE 
      WHEN s.successful_orders > 0 
      THEN s.total_order_value / s.successful_orders 
      ELSE 0 
    END,
    s.trust_score
  FROM suppliers s
  WHERE s.id = p_supplier_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
