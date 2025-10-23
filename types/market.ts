import { PublicKey } from "@solana/web3.js";

/**
 * Market Types - Matching Rust program structs
 */

// Market status enum (matches Rust)
export enum MarketStatus {
  Active = 0,
  Resolved = 1,
  Cancelled = 2,
}

// Market outcome enum (matches Rust)
export enum MarketOutcome {
  Pending = 0,
  Yes = 1,
  No = 2,
  Invalid = 3,
}

// Bet side enum (matches Rust)
export enum BetSide {
  Yes = 1,
  No = 2,
}

// Market account structure (matches Rust state::Market)
export interface Market {
  marketId: PublicKey;
  question: string;
  creator: PublicKey;
  createdAt: number; // i64 -> number (Unix timestamp)
  endTime: number; // i64 -> number (Unix timestamp)
  status: MarketStatus;
  outcome: MarketOutcome;
  yesPool: number; // u64 -> number (lamports)
  noPool: number; // u64 -> number (lamports)
  totalYesBets: number; // u64 -> number (lamports)
  totalNoBets: number; // u64 -> number (lamports)
  feeConfigId: number; // u8 -> number
  creatorFeesClaimed: boolean;
  bump: number; // u8 -> number
}

// User bet structure (matches Rust state::UserBet)
export interface UserBet {
  user: PublicKey;
  market: PublicKey;
  side: BetSide;
  amount: number; // u64 -> number (lamports)
  potentialPayout: number; // u64 -> number (lamports)
  timestamp: number; // i64 -> number (Unix timestamp)
  claimed: boolean;
  bump: number; // u8 -> number
}

// Fee config structure (matches Rust state::FeeConfig)
export interface FeeConfig {
  tier: number; // u8 -> number
  platformFeeBps: number; // u16 -> number (basis points)
  teamFeeBps: number; // u16 -> number
  burnFeeBps: number; // u16 -> number
  creatorFeeBps: number; // u16 -> number
  beneficiary: PublicKey | null;
  beneficiaryFeeBps: number; // u16 -> number
  bump: number; // u8 -> number
}

// Proposal structure (matches Rust proposals program)
export interface Proposal {
  proposalId: number; // u64 -> number
  proposer: PublicKey;
  marketId: PublicKey;
  question: string;
  endTime: number; // i64 -> number
  feeConfigId: number; // u8 -> number
  createdAt: number; // i64 -> number
  status: ProposalStatus;
  votesFor: number; // u64 -> number
  votesAgainst: number; // u64 -> number
  bump: number; // u8 -> number
}

// Proposal status (matches Rust)
export enum ProposalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Executed = 3,
}

// Proposal vote (matches Rust)
export interface ProposalVote {
  voter: PublicKey;
  proposal: PublicKey;
  voteType: VoteType;
  timestamp: number; // i64 -> number
  bump: number; // u8 -> number
}

// Vote type (matches Rust)
export enum VoteType {
  Upvote = 0,
  Downvote = 1,
}

/**
 * Frontend-specific types for enhanced UX
 */

// Market with computed fields for display
export interface MarketWithStats extends Market {
  totalVolume: number; // yesPool + noPool
  yesOdds: number; // Computed probability
  noOdds: number; // Computed probability
  timeRemaining: number; // Seconds until end
  isActive: boolean;
  isResolved: boolean;
}

// User's position in a market
export interface UserPosition {
  market: PublicKey;
  marketQuestion: string;
  totalBetAmount: number;
  yesBets: UserBet[];
  noBets: UserBet[];
  potentialWinnings: number;
  currentValue: number;
  hasWon: boolean;
  canClaim: boolean;
}

// Market stats for listing
export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  totalBettors: number;
}
