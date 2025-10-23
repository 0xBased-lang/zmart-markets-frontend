import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { RPC_ENDPOINT, PROGRAM_IDS } from "./constants";
import zmartCoreIdl from "./idl/zmart_core.json";
import zmartProposalsIdl from "./idl/zmart_proposals.json";
import type { Market, UserBet, Proposal, BetSide } from "@/types/market";

/**
 * Solana Program Integration
 * Handles all interactions with zmart-core and zmart-proposals programs
 */

// Type assertions for IDLs
const ZMART_CORE_IDL = zmartCoreIdl as any;
const ZMART_PROPOSALS_IDL = zmartProposalsIdl as any;

/**
 * Get zmart-core program instance
 */
export function getZmartCoreProgram(provider: AnchorProvider) {
  return new Program(ZMART_CORE_IDL, PROGRAM_IDS.core, provider);
}

/**
 * Get zmart-proposals program instance
 */
export function getZmartProposalsProgram(provider: AnchorProvider) {
  return new Program(ZMART_PROPOSALS_IDL, PROGRAM_IDS.proposals, provider);
}

/**
 * PDA Seeds (must match Rust constants)
 */
export const SEEDS = {
  MARKET: Buffer.from("market"),
  USER_BET: Buffer.from("user_bet"),
  AUTHORITY: Buffer.from("authority"),
  FEE_CONFIG: Buffer.from("fee_config"),
  PROPOSAL: Buffer.from("proposal"),
  PROPOSAL_COUNTER: Buffer.from("proposal_counter"),
  PROPOSAL_VOTE: Buffer.from("proposal_vote"),
};

/**
 * Derive Market PDA
 */
export function getMarketPDA(marketId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.MARKET, marketId.toBuffer()],
    PROGRAM_IDS.core
  );
}

/**
 * Derive UserBet PDA
 */
export function getUserBetPDA(
  user: PublicKey,
  market: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.USER_BET, user.toBuffer(), market.toBuffer()],
    PROGRAM_IDS.core
  );
}

/**
 * Derive FeeConfig PDA
 */
export function getFeeConfigPDA(tier: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.FEE_CONFIG, Buffer.from([tier])],
    PROGRAM_IDS.core
  );
}

/**
 * Derive Proposal PDA
 */
export function getProposalPDA(proposalId: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.PROPOSAL, new BN(proposalId).toArrayLike(Buffer, "le", 8)],
    PROGRAM_IDS.proposals
  );
}

/**
 * Fetch all markets from chain
 */
export async function fetchAllMarkets(
  connection: Connection
): Promise<Market[]> {
  try {
    // Get all market accounts
    const accounts = await connection.getProgramAccounts(PROGRAM_IDS.core, {
      filters: [
        {
          // Filter by Market account discriminator
          memcmp: {
            offset: 0,
            bytes: SEEDS.MARKET.toString("base64"),
          },
        },
      ],
    });

    // Deserialize accounts
    const provider = new AnchorProvider(
      connection,
      {} as any,
      AnchorProvider.defaultOptions()
    );
    const program = getZmartCoreProgram(provider);

    const markets: Market[] = [];
    for (const { pubkey, account } of accounts) {
      try {
        const marketData = program.coder.accounts.decode(
          "Market",
          account.data
        );
        markets.push({
          marketId: marketData.marketId,
          question: marketData.question,
          creator: marketData.creator,
          createdAt: marketData.createdAt.toNumber(),
          endTime: marketData.endTime.toNumber(),
          status: marketData.status,
          outcome: marketData.outcome,
          yesPool: marketData.yesPool.toNumber(),
          noPool: marketData.noPool.toNumber(),
          totalYesBets: marketData.totalYesBets.toNumber(),
          totalNoBets: marketData.totalNoBets.toNumber(),
          feeConfigId: marketData.feeConfigId,
          creatorFeesClaimed: marketData.creatorFeesClaimed,
          bump: marketData.bump,
        });
      } catch (err) {
        console.warn("Failed to decode market:", pubkey.toString(), err);
      }
    }

    return markets;
  } catch (error) {
    console.error("Error fetching markets:", error);
    return [];
  }
}

/**
 * Fetch single market by ID
 */
export async function fetchMarket(
  connection: Connection,
  marketId: PublicKey
): Promise<Market | null> {
  try {
    const [marketPDA] = getMarketPDA(marketId);
    const provider = new AnchorProvider(
      connection,
      {} as any,
      AnchorProvider.defaultOptions()
    );
    const program = getZmartCoreProgram(provider);

    const account = await connection.getAccountInfo(marketPDA);
    if (!account) return null;

    const marketData = program.coder.accounts.decode("Market", account.data);
    return {
      marketId: marketData.marketId,
      question: marketData.question,
      creator: marketData.creator,
      createdAt: marketData.createdAt.toNumber(),
      endTime: marketData.endTime.toNumber(),
      status: marketData.status,
      outcome: marketData.outcome,
      yesPool: marketData.yesPool.toNumber(),
      noPool: marketData.noPool.toNumber(),
      totalYesBets: marketData.totalYesBets.toNumber(),
      totalNoBets: marketData.totalNoBets.toNumber(),
      feeConfigId: marketData.feeConfigId,
      creatorFeesClaimed: marketData.creatorFeesClaimed,
      bump: marketData.bump,
    };
  } catch (error) {
    console.error("Error fetching market:", error);
    return null;
  }
}

/**
 * Fetch user's bet on a specific market
 */
export async function fetchUserBet(
  connection: Connection,
  user: PublicKey,
  market: PublicKey
): Promise<UserBet | null> {
  try {
    const [userBetPDA] = getUserBetPDA(user, market);
    const provider = new AnchorProvider(
      connection,
      {} as any,
      AnchorProvider.defaultOptions()
    );
    const program = getZmartCoreProgram(provider);

    const account = await connection.getAccountInfo(userBetPDA);
    if (!account) return null;

    const betData = program.coder.accounts.decode("UserBet", account.data);
    return {
      user: betData.user,
      market: betData.market,
      side: betData.side,
      amount: betData.amount.toNumber(),
      potentialPayout: betData.potentialPayout.toNumber(),
      timestamp: betData.timestamp.toNumber(),
      claimed: betData.claimed,
      bump: betData.bump,
    };
  } catch (error) {
    console.error("Error fetching user bet:", error);
    return null;
  }
}

/**
 * Fetch all user's bets across all markets
 */
export async function fetchUserBets(
  connection: Connection,
  user: PublicKey
): Promise<UserBet[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_IDS.core, {
      filters: [
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: user.toBase58(),
          },
        },
      ],
    });

    const provider = new AnchorProvider(
      connection,
      {} as any,
      AnchorProvider.defaultOptions()
    );
    const program = getZmartCoreProgram(provider);

    const bets: UserBet[] = [];
    for (const { account } of accounts) {
      try {
        const betData = program.coder.accounts.decode("UserBet", account.data);
        bets.push({
          user: betData.user,
          market: betData.market,
          side: betData.side,
          amount: betData.amount.toNumber(),
          potentialPayout: betData.potentialPayout.toNumber(),
          timestamp: betData.timestamp.toNumber(),
          claimed: betData.claimed,
          bump: betData.bump,
        });
      } catch (err) {
        // Not a UserBet account, skip
      }
    }

    return bets;
  } catch (error) {
    console.error("Error fetching user bets:", error);
    return [];
  }
}

/**
 * Fetch all proposals
 */
export async function fetchAllProposals(
  connection: Connection
): Promise<Proposal[]> {
  try {
    const accounts = await connection.getProgramAccounts(
      PROGRAM_IDS.proposals,
      {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: SEEDS.PROPOSAL.toString("base64"),
            },
          },
        ],
      }
    );

    const provider = new AnchorProvider(
      connection,
      {} as any,
      AnchorProvider.defaultOptions()
    );
    const program = getZmartProposalsProgram(provider);

    const proposals: Proposal[] = [];
    for (const { account } of accounts) {
      try {
        const proposalData = program.coder.accounts.decode(
          "Proposal",
          account.data
        );
        proposals.push({
          proposalId: proposalData.proposalId.toNumber(),
          proposer: proposalData.proposer,
          marketId: proposalData.marketId,
          question: proposalData.question,
          endTime: proposalData.endTime.toNumber(),
          feeConfigId: proposalData.feeConfigId,
          createdAt: proposalData.createdAt.toNumber(),
          status: proposalData.status,
          votesFor: proposalData.votesFor.toNumber(),
          votesAgainst: proposalData.votesAgainst.toNumber(),
          bump: proposalData.bump,
        });
      } catch (err) {
        console.warn("Failed to decode proposal:", err);
      }
    }

    return proposals;
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return [];
  }
}

/**
 * Calculate market odds
 */
export function calculateOdds(yesPool: number, noPool: number) {
  const total = yesPool + noPool;
  if (total === 0) {
    return { yesOdds: 0.5, noOdds: 0.5 };
  }

  const yesOdds = noPool / total;
  const noOdds = yesPool / total;

  return { yesOdds, noOdds };
}

/**
 * Calculate potential payout for a bet
 */
export function calculatePotentialPayout(
  betAmount: number,
  side: BetSide,
  yesPool: number,
  noPool: number
): number {
  const k = yesPool * noPool;

  if (side === 1) {
    // YES bet
    const newYesPool = yesPool + betAmount;
    const newNoPool = k / newYesPool;
    return noPool - newNoPool;
  } else {
    // NO bet
    const newNoPool = noPool + betAmount;
    const newYesPool = k / newNoPool;
    return yesPool - newYesPool;
  }
}
