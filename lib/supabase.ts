import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Create Supabase client (public, for frontend use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using wallet auth, not Supabase auth
  },
});

// Database types (matching our schema)
export interface DbMarket {
  market_id: string;
  question: string;
  creator: string;
  created_at: string; // ISO timestamp
  end_time: string; // ISO timestamp
  status: 'active' | 'resolved' | 'cancelled';
  outcome: 'pending' | 'yes' | 'no' | 'invalid';
  yes_pool: number; // bigint as number
  no_pool: number; // bigint as number
  total_yes_bets: number;
  total_no_bets: number;
  fee_config_id: number;
  creator_fees_claimed: boolean;
  last_updated: string;
  sync_block_time: string;
}

export interface DbUserBet {
  id: number;
  user_wallet: string;
  market_id: string;
  side: 'yes' | 'no';
  amount: number; // bigint as number
  potential_payout: number;
  tx_signature: string;
  block_time: string;
  claimed: boolean;
  created_at: string;
}

export interface DbProposal {
  proposal_id: number;
  proposer: string;
  market_id: string;
  question: string;
  end_time: string;
  fee_config_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  votes_for: number;
  votes_against: number;
  created_at: string;
  last_updated: string;
}

export interface DbProposalVote {
  id: number;
  voter: string;
  proposal_id: number;
  vote_type: 'upvote' | 'downvote';
  tx_signature: string;
  block_time: string;
  created_at: string;
}

export interface DbMarketStats {
  id: number;
  period: 'all_time' | '24h' | '7d' | '30d';
  computed_at: string;
  total_markets: number;
  active_markets: number;
  resolved_markets: number;
  total_volume: number;
  total_bets: number;
  unique_bettors: number;
  total_proposals: number;
  pending_proposals: number;
  approved_proposals: number;
}

// View types
export interface DbActiveMarket extends DbMarket {
  total_volume: number;
  yes_odds: number;
  no_odds: number;
}

export interface DbUserPosition {
  user_wallet: string;
  market_id: string;
  market_question: string;
  market_status: string;
  market_outcome: string;
  bet_count: number;
  total_bet_amount: number;
  total_potential_payout: number;
  total_claimed: number;
}

export interface DbProposalStats extends DbProposal {
  net_votes: number;
  total_votes: number;
}
