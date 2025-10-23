#!/usr/bin/env node

/**
 * Test Supabase Connection
 *
 * Verifies that Supabase is configured correctly and tables exist
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function testSupabase() {
  console.log(`${colors.cyan}🧪 Testing Supabase Connection...${colors.reset}\n`);

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(`${colors.red}❌ Missing environment variables!${colors.reset}`);
    console.log(`\nPlease add to .env.local:`);
    console.log(`NEXT_PUBLIC_SUPABASE_URL=your-project-url`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓${colors.reset} Environment variables found`);
  console.log(`  URL: ${supabaseUrl}`);
  console.log(`  Key: ${supabaseKey.substring(0, 20)}...\n`);

  // Create client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection by querying tables
  const tables = ['markets', 'user_bets', 'proposals', 'proposal_votes', 'market_stats'];
  let allSuccess = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`${colors.red}❌${colors.reset} Table '${table}': ${error.message}`);
        allSuccess = false;
      } else {
        console.log(`${colors.green}✓${colors.reset} Table '${table}' exists (${data.length} rows)`);
      }
    } catch (err) {
      console.log(`${colors.red}❌${colors.reset} Table '${table}': ${err.message}`);
      allSuccess = false;
    }
  }

  // Test views
  console.log(`\n${colors.cyan}Testing Views...${colors.reset}`);
  const views = ['v_active_markets', 'v_user_positions', 'v_proposal_stats'];

  for (const view of views) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`${colors.yellow}⚠${colors.reset} View '${view}': ${error.message}`);
      } else {
        console.log(`${colors.green}✓${colors.reset} View '${view}' exists`);
      }
    } catch (err) {
      console.log(`${colors.yellow}⚠${colors.reset} View '${view}': ${err.message}`);
    }
  }

  // Final result
  console.log();
  if (allSuccess) {
    console.log(`${colors.green}✅ Supabase setup complete and working!${colors.reset}\n`);
    console.log(`Next step: Run the indexer to populate data`);
    console.log(`  npm run indexer\n`);
  } else {
    console.log(`${colors.red}❌ Some tables are missing or inaccessible${colors.reset}\n`);
    console.log(`Please run the schema.sql in Supabase SQL Editor\n`);
    process.exit(1);
  }
}

testSupabase().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
