"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { useMarkets } from "@/hooks/useMarkets";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function MarketsPage() {
  const { publicKey } = useWallet();
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  // Fetch markets from Supabase (10x faster than blockchain!)
  const { markets, loading, error, refetch } = useMarkets({
    filter,
    autoRefresh: true, // Auto-refresh every 10 seconds
  });

  // Calculate stats
  const stats = {
    total: markets.length,
    active: markets.filter((m) => m.status === "active").length,
    totalVolume: markets.reduce((sum, m) => sum + Number(m.yes_pool) + Number(m.no_pool), 0),
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
            <h1 className="text-xl font-bold">ZMART</h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/markets"
              className="text-purple-400 font-semibold"
            >
              Markets
            </Link>
            <Link href="/proposals" className="text-slate-400 hover:text-slate-300">
              Proposals
            </Link>
            {publicKey && (
              <Link href="/profile" className="text-slate-400 hover:text-slate-300">
                Profile
              </Link>
            )}
            <WalletMultiButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Prediction Markets</h2>
          <p className="text-slate-400">
            Trade on outcomes you believe in. Real money, real predictions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-1">Total Markets</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-1">Active Markets</div>
            <div className="text-3xl font-bold text-green-500">
              {stats.active}
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-1">Total Volume</div>
            <div className="text-3xl font-bold">
              {(stats.totalVolume / LAMPORTS_PER_SOL).toFixed(2)} SOL
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg ${
              filter === "all"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg ${
              filter === "active"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-4 py-2 rounded-lg ${
              filter === "resolved"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Resolved
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "⏳" : "🔄"} Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
            <p className="text-red-400">⚠️ {error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* Markets List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-slate-400">Loading markets from database...</p>
            <p className="mt-2 text-xs text-slate-500">⚡ 10x faster than blockchain RPC</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Markets Found</h3>
            <p className="text-slate-400 mb-6">
              {filter === "all"
                ? "No markets have been created yet. Be the first to propose one!"
                : `No ${filter} markets found. Try changing the filter.`}
            </p>
            <Link
              href="/proposals"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              Propose a Market
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => (
              <MarketCard key={market.market_id} market={market} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>Powered by Solana • Devnet</p>
        </div>
      </footer>
    </div>
  );
}

// Market Card Component
function MarketCard({ market }: { market: any }) {
  const formatTime = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const seconds = Math.max(0, Math.floor((end - now) / 1000));

    if (seconds <= 0) return "Ended";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const statusBadge = () => {
    if (market.status === "resolved") {
      const outcomeText =
        market.outcome === "yes"
          ? "YES Won"
          : market.outcome === "no"
          ? "NO Won"
          : "INVALID";
      const colorClass =
        market.outcome === "invalid"
          ? "bg-orange-500/20 text-orange-400"
          : "bg-green-500/20 text-green-400";
      return <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>{outcomeText}</span>;
    }
    return (
      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
        {formatTime(market.end_time)}
      </span>
    );
  };

  const yesPool = Number(market.yes_pool) / LAMPORTS_PER_SOL;
  const noPool = Number(market.no_pool) / LAMPORTS_PER_SOL;
  const totalVolume = Number(market.total_volume) / LAMPORTS_PER_SOL;
  const yesOdds = market.yes_odds || 0;
  const noOdds = market.no_odds || 0;

  return (
    <Link
      href={`/markets/${market.market_id}`}
      className="block bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-purple-500/10"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold flex-1 mr-4">{market.question}</h3>
        {statusBadge()}
      </div>

      {/* Odds Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
          <div className="text-xs text-green-400 mb-1">YES</div>
          <div className="text-2xl font-bold text-green-400">
            {(yesOdds * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">{yesPool.toFixed(2)} SOL</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <div className="text-xs text-red-400 mb-1">NO</div>
          <div className="text-2xl font-bold text-red-400">
            {(noOdds * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">{noPool.toFixed(2)} SOL</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between text-sm text-slate-400">
        <div>Total Volume: {totalVolume.toFixed(2)} SOL</div>
      </div>
    </Link>
  );
}
