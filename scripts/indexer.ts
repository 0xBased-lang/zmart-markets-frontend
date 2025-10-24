#!/usr/bin/env ts-node

/**
 * ZMART Blockchain Indexer
 *
 * Continuously syncs blockchain data (markets, proposals, bets, votes) to Supabase
 * Runs every 10 seconds to keep database up-to-date
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Service role for write access
const PROGRAM_IDS = {
  core: new PublicKey(process.env.NEXT_PUBLIC_CORE_PROGRAM_ID || '3q38JSeuMykM6vjh8g8cbpUqkBhB4SvQkQ9XedesXApu'),
  proposals: new PublicKey(process.env.NEXT_PUBLIC_PROPOSALS_PROGRAM_ID || 'Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7'),
};

// Verify environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials! Check your .env.local file.');
  process.exit(1);
}

// Initialize clients
const connection = new Connection(RPC_ENDPOINT, 'confirmed');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const provider = new AnchorProvider(connection, {} as any, AnchorProvider.defaultOptions());

// Global program references (initialized in main())
let coreProgram: Program<any>;
let proposalsProgram: Program<any>;

// Import IDLs (async wrapper needed for ES modules)
async function initializePrograms() {
  const { default: zmartCoreIdl } = await import('../lib/idl/zmart_core.json', { with: { type: 'json' } });
  const { default: zmartProposalsIdl } = await import('../lib/idl/zmart_proposals.json', { with: { type: 'json' } });

  coreProgram = new Program(zmartCoreIdl as any, provider);
  proposalsProgram = new Program(zmartProposalsIdl as any, provider);
}

// Statistics
let stats = {
  marketsIndexed: 0,
  betsIndexed: 0,
  proposalsIndexed: 0,
  votesIndexed: 0,
  errors: 0,
  lastRun: new Date(),
};

/**
 * Index all markets from blockchain
 */
async function indexMarkets() {
  try {
    console.log('📊 Indexing markets...');

    // Fetch all market accounts
    const accounts = await connection.getProgramAccounts(PROGRAM_IDS.core, {
      filters: [
        {
          dataSize: 1000, // Approximate size of Market account
        },
      ],
    });

    console.log(`  Found ${accounts.length} market accounts`);

    for (const { pubkey, account } of accounts) {
      try {
        // Try to decode as Market account
        const marketData = coreProgram.coder.accounts.decode('Market', account.data);

        // Prepare database record
        const dbMarket = {
          market_id: marketData.marketId.toString(),
          question: marketData.question,
          creator: marketData.creator.toString(),
          created_at: new Date(marketData.createdAt.toNumber() * 1000).toISOString(),
          end_time: new Date(marketData.endTime.toNumber() * 1000).toISOString(),
          status: getMarketStatus(marketData.status),
          outcome: getMarketOutcome(marketData.outcome),
          yes_pool: marketData.yesPool.toString(),
          no_pool: marketData.noPool.toString(),
          total_yes_bets: marketData.totalYesBets.toString(),
          total_no_bets: marketData.totalNoBets.toString(),
          fee_config_id: marketData.feeConfigId,
          creator_fees_claimed: marketData.creatorFeesClaimed,
          sync_block_time: new Date().toISOString(),
        };

        // Upsert to database
        const { error } = await supabase
          .from('markets')
          .upsert(dbMarket, { onConflict: 'market_id' });

        if (error) {
          console.error(`  ❌ Error upserting market ${dbMarket.market_id}:`, error.message);
          stats.errors++;
        } else {
          stats.marketsIndexed++;
        }
      } catch (decodeError) {
        // Not a Market account, skip
        continue;
      }
    }

    console.log(`  ✅ Indexed ${stats.marketsIndexed} markets`);
  } catch (error: any) {
    console.error('❌ Error indexing markets:', error.message);
    stats.errors++;
  }
}

/**
 * Index all proposals from blockchain
 */
async function indexProposals() {
  try {
    console.log('💡 Indexing proposals...');

    const accounts = await connection.getProgramAccounts(PROGRAM_IDS.proposals, {
      filters: [
        {
          dataSize: 500, // Approximate size of Proposal account
        },
      ],
    });

    console.log(`  Found ${accounts.length} proposal accounts`);

    for (const { pubkey, account } of accounts) {
      try {
        const proposalData = proposalsProgram.coder.accounts.decode('Proposal', account.data);

        const dbProposal = {
          proposal_id: proposalData.proposalId.toNumber(),
          proposer: proposalData.proposer.toString(),
          market_id: proposalData.marketId.toString(),
          question: proposalData.question,
          end_time: new Date(proposalData.endTime.toNumber() * 1000).toISOString(),
          fee_config_id: proposalData.feeConfigId,
          status: getProposalStatus(proposalData.status),
          votes_for: proposalData.votesFor.toNumber(),
          votes_against: proposalData.votesAgainst.toNumber(),
          created_at: new Date(proposalData.createdAt.toNumber() * 1000).toISOString(),
        };

        const { error } = await supabase
          .from('proposals')
          .upsert(dbProposal, { onConflict: 'proposal_id' });

        if (error) {
          console.error(`  ❌ Error upserting proposal ${dbProposal.proposal_id}:`, error.message);
          stats.errors++;
        } else {
          stats.proposalsIndexed++;
        }
      } catch (decodeError) {
        continue;
      }
    }

    console.log(`  ✅ Indexed ${stats.proposalsIndexed} proposals`);
  } catch (error: any) {
    console.error('❌ Error indexing proposals:', error.message);
    stats.errors++;
  }
}

/**
 * Update market statistics
 */
async function updateStats() {
  try {
    console.log('📈 Updating statistics...');

    // Get stats from database
    const { data: markets } = await supabase.from('markets').select('*');
    const { data: proposals } = await supabase.from('proposals').select('*');
    const { data: bets } = await supabase.from('user_bets').select('*');

    if (!markets || !proposals || !bets) return;

    const allTimeStats = {
      period: 'all_time',
      total_markets: markets.length,
      active_markets: markets.filter((m: any) => m.status === 'active').length,
      resolved_markets: markets.filter((m: any) => m.status === 'resolved').length,
      total_volume: markets.reduce((sum: bigint, m: any) => sum + BigInt(m.yes_pool || 0) + BigInt(m.no_pool || 0), BigInt(0)).toString(),
      total_bets: bets.length,
      unique_bettors: new Set(bets.map((b: any) => b.user_wallet)).size,
      total_proposals: proposals.length,
      pending_proposals: proposals.filter((p: any) => p.status === 'pending').length,
      approved_proposals: proposals.filter((p: any) => p.status === 'approved').length,
      computed_at: new Date().toISOString(),
    };

    await supabase
      .from('market_stats')
      .upsert(allTimeStats, { onConflict: 'period' });

    console.log(`  ✅ Stats updated`);
  } catch (error: any) {
    console.error('❌ Error updating stats:', error.message);
  }
}

/**
 * Helper: Convert market status enum to string
 */
function getMarketStatus(status: any): 'active' | 'resolved' | 'cancelled' {
  if (status.active !== undefined) return 'active';
  if (status.resolved !== undefined) return 'resolved';
  if (status.cancelled !== undefined) return 'cancelled';
  return 'active';
}

/**
 * Helper: Convert market outcome enum to string
 */
function getMarketOutcome(outcome: any): 'pending' | 'yes' | 'no' | 'invalid' {
  if (outcome.pending !== undefined) return 'pending';
  if (outcome.yes !== undefined) return 'yes';
  if (outcome.no !== undefined) return 'no';
  if (outcome.invalid !== undefined) return 'invalid';
  return 'pending';
}

/**
 * Helper: Convert proposal status enum to string
 */
function getProposalStatus(status: any): 'pending' | 'approved' | 'rejected' | 'executed' {
  if (status.pending !== undefined) return 'pending';
  if (status.approved !== undefined) return 'approved';
  if (status.rejected !== undefined) return 'rejected';
  if (status.executed !== undefined) return 'executed';
  return 'pending';
}

/**
 * Main indexing loop
 */
async function runIndexer() {
  console.log('🚀 ZMART Blockchain Indexer Starting...\n');
  console.log(`RPC Endpoint: ${RPC_ENDPOINT}`);
  console.log(`Core Program: ${PROGRAM_IDS.core.toString()}`);
  console.log(`Proposals Program: ${PROGRAM_IDS.proposals.toString()}\n`);

  // Initialize programs
  console.log('⚙️  Initializing programs...');
  await initializePrograms();
  console.log('✅ Programs initialized\n');

  // Initial sync
  await indexMarkets();
  await indexProposals();
  await updateStats();

  console.log('\n📊 Initial sync complete!\n');
  console.log('Stats:');
  console.log(`  Markets: ${stats.marketsIndexed}`);
  console.log(`  Proposals: ${stats.proposalsIndexed}`);
  console.log(`  Errors: ${stats.errors}\n`);

  // Check for --once flag
  if (process.argv.includes('--once')) {
    console.log('✅ Single run complete (--once flag detected). Exiting...\n');
    process.exit(0);
  }

  // Continuous sync every 10 seconds
  console.log('🔄 Starting continuous sync (every 10 seconds)...\n');

  setInterval(async () => {
    stats = {
      marketsIndexed: 0,
      betsIndexed: 0,
      proposalsIndexed: 0,
      votesIndexed: 0,
      errors: 0,
      lastRun: new Date(),
    };

    console.log(`[${stats.lastRun.toLocaleTimeString()}] Syncing...`);

    await indexMarkets();
    await indexProposals();
    await updateStats();

    console.log(`  Done (Markets: ${stats.marketsIndexed}, Proposals: ${stats.proposalsIndexed}, Errors: ${stats.errors})\n`);
  }, 10000); // 10 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down indexer gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down indexer gracefully...');
  process.exit(0);
});

// Run
runIndexer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
