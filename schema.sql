-- ZMART Database Schema for Supabase
-- Version: 1.0
-- Purpose: Cache blockchain data for fast queries and analytics

-- Enable UUID extension (for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- MARKETS TABLE
-- Mirror of on-chain Market accounts
-- =============================================================================
CREATE TABLE IF NOT EXISTS markets (
  -- Primary key
  market_id TEXT PRIMARY KEY,

  -- Core market data (matches Rust struct)
  question TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'cancelled')),
  outcome TEXT NOT NULL CHECK (outcome IN ('pending', 'yes', 'no', 'invalid')),

  -- Pool data (stored as bigint for precision, convert to/from lamports)
  yes_pool BIGINT NOT NULL DEFAULT 0,
  no_pool BIGINT NOT NULL DEFAULT 0,
  total_yes_bets BIGINT NOT NULL DEFAULT 0,
  total_no_bets BIGINT NOT NULL DEFAULT 0,

  -- Metadata
  fee_config_id SMALLINT NOT NULL,
  creator_fees_claimed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Database metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  sync_block_time TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX idx_markets_end_time ON markets(end_time);
CREATE INDEX idx_markets_creator ON markets(creator);

-- Computed column for search
ALTER TABLE markets ADD COLUMN IF NOT EXISTS question_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', question)) STORED;
CREATE INDEX idx_markets_search ON markets USING GIN(question_search);

-- =============================================================================
-- USER_BETS TABLE
-- All bets placed by users
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_bets (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,

  -- Core bet data
  user_wallet TEXT NOT NULL,
  market_id TEXT NOT NULL REFERENCES markets(market_id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  amount BIGINT NOT NULL,
  potential_payout BIGINT NOT NULL,

  -- Transaction metadata
  tx_signature TEXT NOT NULL UNIQUE,
  block_time TIMESTAMPTZ NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Database metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_user_bets_wallet ON user_bets(user_wallet);
CREATE INDEX idx_user_bets_market ON user_bets(market_id);
CREATE INDEX idx_user_bets_tx ON user_bets(tx_signature);
CREATE INDEX idx_user_bets_block_time ON user_bets(block_time DESC);

-- =============================================================================
-- PROPOSALS TABLE
-- Market proposals awaiting community approval
-- =============================================================================
CREATE TABLE IF NOT EXISTS proposals (
  -- Primary key
  proposal_id BIGINT PRIMARY KEY,

  -- Core proposal data
  proposer TEXT NOT NULL,
  market_id TEXT NOT NULL,
  question TEXT NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  fee_config_id SMALLINT NOT NULL,

  -- Status and voting
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  votes_for BIGINT NOT NULL DEFAULT 0,
  votes_against BIGINT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL,

  -- Database metadata
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposals_proposer ON proposals(proposer);

-- Search index
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS question_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', question)) STORED;
CREATE INDEX idx_proposals_search ON proposals USING GIN(question_search);

-- =============================================================================
-- PROPOSAL_VOTES TABLE
-- Individual votes on proposals
-- =============================================================================
CREATE TABLE IF NOT EXISTS proposal_votes (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,

  -- Core vote data
  voter TEXT NOT NULL,
  proposal_id BIGINT NOT NULL REFERENCES proposals(proposal_id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),

  -- Transaction metadata
  tx_signature TEXT NOT NULL UNIQUE,
  block_time TIMESTAMPTZ NOT NULL,

  -- Database metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one vote per user per proposal
  UNIQUE(voter, proposal_id)
);

-- Indexes
CREATE INDEX idx_proposal_votes_voter ON proposal_votes(voter);
CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_block_time ON proposal_votes(block_time DESC);

-- =============================================================================
-- MARKET_STATS TABLE (Materialized View)
-- Pre-computed analytics for fast dashboards
-- =============================================================================
CREATE TABLE IF NOT EXISTS market_stats (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- Time period
  period TEXT NOT NULL CHECK (period IN ('all_time', '24h', '7d', '30d')),
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Global stats
  total_markets INTEGER NOT NULL DEFAULT 0,
  active_markets INTEGER NOT NULL DEFAULT 0,
  resolved_markets INTEGER NOT NULL DEFAULT 0,
  total_volume BIGINT NOT NULL DEFAULT 0,
  total_bets INTEGER NOT NULL DEFAULT 0,
  unique_bettors INTEGER NOT NULL DEFAULT 0,

  -- Proposal stats
  total_proposals INTEGER NOT NULL DEFAULT 0,
  pending_proposals INTEGER NOT NULL DEFAULT 0,
  approved_proposals INTEGER NOT NULL DEFAULT 0,

  -- Ensure one row per period
  UNIQUE(period)
);

-- Insert default rows
INSERT INTO market_stats (period, total_markets, active_markets, resolved_markets, total_volume, total_bets, unique_bettors, total_proposals, pending_proposals, approved_proposals)
VALUES
  ('all_time', 0, 0, 0, 0, 0, 0, 0, 0, 0),
  ('24h', 0, 0, 0, 0, 0, 0, 0, 0, 0),
  ('7d', 0, 0, 0, 0, 0, 0, 0, 0, 0),
  ('30d', 0, 0, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (period) DO NOTHING;

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- Automatic updates and computed values
-- =============================================================================

-- Update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to markets
CREATE TRIGGER markets_last_updated
  BEFORE UPDATE ON markets
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated();

-- Apply trigger to proposals
CREATE TRIGGER proposals_last_updated
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active markets with computed odds
CREATE OR REPLACE VIEW v_active_markets AS
SELECT
  m.*,
  (m.yes_pool + m.no_pool) as total_volume,
  CASE
    WHEN (m.yes_pool + m.no_pool) = 0 THEN 0.5
    ELSE m.no_pool::FLOAT / (m.yes_pool + m.no_pool)
  END as yes_odds,
  CASE
    WHEN (m.yes_pool + m.no_pool) = 0 THEN 0.5
    ELSE m.yes_pool::FLOAT / (m.yes_pool + m.no_pool)
  END as no_odds
FROM markets m
WHERE m.status = 'active'
ORDER BY m.created_at DESC;

-- User positions summary
CREATE OR REPLACE VIEW v_user_positions AS
SELECT
  ub.user_wallet,
  ub.market_id,
  m.question as market_question,
  m.status as market_status,
  m.outcome as market_outcome,
  COUNT(*) as bet_count,
  SUM(ub.amount) as total_bet_amount,
  SUM(ub.potential_payout) as total_potential_payout,
  SUM(CASE WHEN ub.claimed THEN ub.potential_payout ELSE 0 END) as total_claimed
FROM user_bets ub
JOIN markets m ON ub.market_id = m.market_id
GROUP BY ub.user_wallet, ub.market_id, m.question, m.status, m.outcome;

-- Proposal stats
CREATE OR REPLACE VIEW v_proposal_stats AS
SELECT
  p.*,
  (p.votes_for - p.votes_against) as net_votes,
  (p.votes_for + p.votes_against) as total_votes
FROM proposals p
ORDER BY p.created_at DESC;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable later for multi-tenancy or user-specific data
-- =============================================================================

-- For now, keep tables public (authenticated users can read all data)
-- Enable RLS when you add user authentication

-- ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- GRANTS
-- Allow anon/authenticated access
-- =============================================================================

-- Grant read access to all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant write access to service role only (for indexer)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ZMART Database Schema Created Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - markets (with search index)';
  RAISE NOTICE '  - user_bets';
  RAISE NOTICE '  - proposals (with search index)';
  RAISE NOTICE '  - proposal_votes';
  RAISE NOTICE '  - market_stats (analytics)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  - v_active_markets (markets with odds)';
  RAISE NOTICE '  - v_user_positions (user bet summaries)';
  RAISE NOTICE '  - v_proposal_stats (proposals with vote counts)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run the indexer to populate data!';
END $$;
