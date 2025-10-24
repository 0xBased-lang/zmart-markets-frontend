"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMarket } from "@/hooks/useMarkets";
import {
  getZmartCoreProgram,
  getMarketPDA,
  getUserBetPDA,
  getFeeConfigPDA,
} from "@/lib/program";
import { BetSide } from "@/types/market";

export default function MarketDetailPage() {
  const params = useParams();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const marketId = params.id as string;

  // Fetch market from Supabase (10x faster than blockchain!)
  const { market, loading, error } = useMarket(marketId);

  const [betting, setBetting] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [betSide, setBetSide] = useState<"yes" | "no">("yes");
  const [potentialPayout, setPotentialPayout] = useState(0);

  // Calculate potential payout when bet amount changes
  useEffect(() => {
    if (betAmount && market) {
      const amount = parseFloat(betAmount);
      if (amount > 0) {
        const amountLamports = amount * LAMPORTS_PER_SOL;
        const yesPool = Number(market.yes_pool);
        const noPool = Number(market.no_pool);

        // Linear pool betting formula: payout = amount * (totalPool / sidePool)
        const totalPool = yesPool + noPool;
        const sidePool = betSide === "yes" ? yesPool : noPool;

        if (sidePool > 0) {
          const payout = (amountLamports * totalPool) / sidePool;
          setPotentialPayout(payout);
        }
      } else {
        setPotentialPayout(0);
      }
    } else {
      setPotentialPayout(0);
    }
  }, [betAmount, betSide, market]);

  async function placeBet() {
    if (!publicKey || !market || !sendTransaction) {
      alert("Please connect your wallet");
      return;
    }

    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid bet amount");
      return;
    }

    if (amount < 0.001) {
      alert("Minimum bet is 0.001 SOL");
      return;
    }

    setBetting(true);
    try {
      const provider = new AnchorProvider(
        connection,
        window.solana as any,
        AnchorProvider.defaultOptions()
      );
      const program = getZmartCoreProgram(provider);

      const amountLamports = new BN(amount * LAMPORTS_PER_SOL);
      const minPayout = new BN(potentialPayout * 0.95); // 5% slippage tolerance

      // Convert market_id string to PublicKey for blockchain transaction
      const marketIdPubkey = new PublicKey(market.market_id);
      const [marketPDA] = getMarketPDA(marketIdPubkey);
      const [userBetPDA] = getUserBetPDA(publicKey, marketIdPubkey);
      const [feeConfigPDA] = getFeeConfigPDA(market.fee_config_id);

      // Convert betSide to BetSide enum
      const side = betSide === "yes" ? BetSide.Yes : BetSide.No;

      const tx = await program.methods
        .placeBet(side, amountLamports, minPayout)
        .accounts({
          market: marketPDA,
          userBet: userBetPDA,
          feeConfig: feeConfigPDA,
          user: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      alert(`Bet placed successfully! Signature: ${signature.substring(0, 20)}...`);

      setBetAmount("");

      // Note: Indexer will update database in 10 seconds
    } catch (error: any) {
      console.error("Failed to place bet:", error);
      alert(`Failed to place bet: ${error.message || error}`);
    } finally {
      setBetting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
          <p className="mt-4 text-slate-400">Loading market from database...</p>
          <p className="mt-2 text-xs text-slate-500">⚡ 10x faster than blockchain</p>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error ? "Error Loading Market" : "Market Not Found"}
          </h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <Link
            href="/markets"
            className="text-purple-400 hover:text-purple-300"
          >
            ← Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  // Calculate odds and status from Supabase data
  const yesPool = Number(market.yes_pool);
  const noPool = Number(market.no_pool);
  const totalPool = yesPool + noPool;
  const yesOdds = totalPool > 0 ? yesPool / totalPool : 0.5;
  const noOdds = totalPool > 0 ? noPool / totalPool : 0.5;

  const endTime = new Date(market.end_time);
  const timeRemaining = Math.max(0, endTime.getTime() - Date.now());
  const isActive = market.status === "active" && timeRemaining > 0;
  const isResolved = market.status === "resolved";

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
            <Link href="/markets" className="text-purple-400 font-semibold">
              Markets
            </Link>
            <WalletMultiButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link
          href="/markets"
          className="text-purple-400 hover:text-purple-300 mb-6 inline-block"
        >
          ← Back to Markets
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Market Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">{market.question}</h2>

              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                <div>
                  Created:{" "}
                  {new Date(market.created_at).toLocaleDateString()}
                </div>
                <div>
                  Ends: {new Date(market.end_time).toLocaleDateString()}
                </div>
                <div>
                  Volume:{" "}
                  {(totalPool / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </div>
                <div className="text-purple-400">
                  ⚡ Loaded from database (<100ms)
                </div>
              </div>

              {/* Status Badge */}
              {isResolved && (
                <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-sm text-green-400">Market Resolved</div>
                  <div className="text-xl font-bold text-green-400 mt-1">
                    {market.outcome === "yes"
                      ? "YES Won"
                      : market.outcome === "no"
                      ? "NO Won"
                      : "INVALID (Refunds Available)"}
                  </div>
                </div>
              )}
            </div>

            {/* Odds Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="text-sm text-green-400 mb-2">YES</div>
                <div className="text-4xl font-bold text-green-400">
                  {(yesOdds * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Pool: {(yesPool / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {Number(market.total_yes_bets)} bets
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <div className="text-sm text-red-400 mb-2">NO</div>
                <div className="text-4xl font-bold text-red-400">
                  {(noOdds * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Pool: {(noPool / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {Number(market.total_no_bets)} bets
                </div>
              </div>
            </div>
          </div>

          {/* Right: Betting Interface */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-6">Place Bet</h3>

              {!publicKey ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">
                    Connect wallet to place bets
                  </p>
                  <WalletMultiButton />
                </div>
              ) : !isActive ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    {isResolved
                      ? "Market has been resolved"
                      : "Market has ended"}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Side Selection */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Choose Side
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setBetSide("yes")}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          betSide === "yes"
                            ? "bg-green-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setBetSide("no")}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          betSide === "no"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Bet Amount (SOL)
                    </label>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0.001"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[0.1, 0.5, 1, 5].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setBetAmount(amount.toString())}
                        className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded text-sm"
                      >
                        {amount} SOL
                      </button>
                    ))}
                  </div>

                  {/* Potential Payout */}
                  {potentialPayout > 0 && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="text-sm text-slate-400 mb-1">
                        Potential Payout
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(potentialPayout / LAMPORTS_PER_SOL).toFixed(4)} SOL
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {(
                          (potentialPayout /
                            (parseFloat(betAmount) * LAMPORTS_PER_SOL)) *
                          100
                        ).toFixed(1)}
                        % return
                      </div>
                    </div>
                  )}

                  {/* Place Bet Button */}
                  <button
                    onClick={placeBet}
                    disabled={betting || !betAmount || parseFloat(betAmount) < 0.001}
                    className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg"
                  >
                    {betting ? "Processing..." : "Place Bet"}
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    Min bet: 0.001 SOL • 5% slippage tolerance
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
