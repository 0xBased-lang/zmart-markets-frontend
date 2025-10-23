"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL);
      });
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
            <h1 className="text-xl font-bold">ZMART</h1>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Decentralized Prediction Markets
            </h2>
            <p className="text-xl text-slate-400">
              Create, trade, and profit from predictions on Solana
            </p>
          </div>

          {/* Wallet Status */}
          {publicKey ? (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-8 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm text-slate-400">Connected</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Wallet Address</p>
                <p className="font-mono text-sm">{publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}</p>
              </div>
              {balance !== null && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Balance</p>
                  <p className="text-2xl font-bold">{balance.toFixed(4)} SOL</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-lg p-8 space-y-4">
              <p className="text-slate-400">Connect your wallet to get started</p>
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            </div>
          )}

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Link href="/markets" className="bg-slate-900/30 border border-slate-800 hover:border-purple-500 rounded-lg p-6 space-y-2 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <div className="text-3xl">📊</div>
              <h3 className="font-semibold">Browse Markets</h3>
              <p className="text-sm text-slate-400">Discover active prediction markets</p>
              <div className="text-xs text-green-400">✅ Live Now</div>
            </Link>
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6 space-y-2 opacity-60">
              <div className="text-3xl">💡</div>
              <h3 className="font-semibold">Create Proposals</h3>
              <p className="text-sm text-slate-400">Propose new markets to the community</p>
              <div className="text-xs text-purple-400">Coming Soon</div>
            </div>
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6 space-y-2 opacity-60">
              <div className="text-3xl">🗳️</div>
              <h3 className="font-semibold">Vote & Earn</h3>
              <p className="text-sm text-slate-400">Vote on proposals and win rewards</p>
              <div className="text-xs text-purple-400">Coming Soon</div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-12 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-sm text-purple-300">
              ✅ Smart contracts deployed to Solana Devnet
            </p>
            <p className="text-xs text-purple-400/70 mt-1">
              Frontend under active development
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-slate-500">
            <p>Powered by Solana • Devnet</p>
            <p className="mt-1 text-xs">
              <a
                href="https://explorer.solana.com/address/Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                View Contracts on Explorer
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
