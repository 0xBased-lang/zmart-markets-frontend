"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Link from "next/link";
import { motion } from "framer-motion";
import { ConspiracyCard } from "@/components/conspiracy-card";
import { ConspiracyButton } from "@/components/conspiracy-button";
import { GlitchText } from "@/components/glitch-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { ParticleText } from "@/components/particle-text";
// import { TerminalBoot } from "@/components/terminal-boot"; // Uncomment for boot sequence

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  // const [showBoot, setShowBoot] = useState(true); // Uncomment for boot sequence

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
      {/* 🌑 Terminal Boot Sequence (Uncomment to enable) */}
      {/* {showBoot && <TerminalBoot onComplete={() => setShowBoot(false)} />} */}

      {/* 🌑 Conspiracy Header */}
      <header className="border-b border-border-subtle bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden">
              <BorderBeam size={30} duration={8} colorFrom="#9333ea" colorTo="#06b6d4" />
              <div className="absolute inset-0 bg-gradient-to-br from-conspiracy-purple to-conspiracy-cyan" />
            </div>
            <h1 className="text-2xl font-bold font-display">
              <GlitchText intensity="low">ZMART</GlitchText>
            </h1>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      {/* 🌑 Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Title - ULTRA CONSPIRACY MODE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="text-5xl md:text-6xl font-bold font-display leading-tight">
              <ParticleText
                text="DECENTRALIZED"
                className="mb-4"
                particleCount={150}
                aggressiveness={0.7}
              />
              <ParticleText
                text="PREDICTION MARKETS"
                className="bg-gradient-to-r from-conspiracy-purple via-conspiracy-cyan to-conspiracy-purple bg-clip-text text-transparent"
                particleCount={200}
                aggressiveness={0.8}
              />
            </div>
            <p className="text-xl text-muted-foreground font-mono">
              CREATE • TRADE • PROFIT • <span className="text-conspiracy-cyan">ON SOLANA</span>
            </p>
          </motion.div>

          {/* Wallet Status Card */}
          {publicKey ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <ConspiracyCard animate glow borderBeam>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-3 h-3 bg-conspiracy-green rounded-full animate-pulse" />
                    <p className="text-sm text-conspiracy-green font-mono uppercase tracking-wider">
                      WALLET CONNECTED
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                        ADDRESS
                      </p>
                      <p className="font-mono text-sm text-conspiracy-cyan">
                        {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                      </p>
                    </div>
                    {balance !== null && (
                      <div className="space-y-2 pt-4 border-t border-border-subtle">
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                          BALANCE
                        </p>
                        <p className="text-3xl font-bold font-data text-glow-cyan tabular-nums">
                          {balance.toFixed(4)} SOL
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ConspiracyCard>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <ConspiracyCard animate borderBeam>
                <div className="p-8 space-y-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-conspiracy-purple/10 border border-conspiracy-purple/20 rounded-full flex items-center justify-center">
                    <div className="text-3xl">🔒</div>
                  </div>
                  <p className="text-muted-foreground font-mono">
                    CONNECT YOUR WALLET TO ACCESS MARKETS
                  </p>
                  <div className="flex justify-center">
                    <WalletMultiButton />
                  </div>
                </div>
              </ConspiracyCard>
            </motion.div>
          )}

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Link href="/markets">
                <ConspiracyCard animate glow borderBeam onClick={() => {}}>
                  <div className="p-6 space-y-4">
                    <div className="text-4xl">📊</div>
                    <h3 className="font-semibold font-display text-lg">BROWSE MARKETS</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      DISCOVER ACTIVE PREDICTION MARKETS
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-2 h-2 bg-conspiracy-green rounded-full animate-pulse" />
                      <span className="text-xs text-conspiracy-green font-mono uppercase tracking-wider">
                        LIVE NOW
                      </span>
                    </div>
                  </div>
                </ConspiracyCard>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Link href="/proposals">
                <ConspiracyCard animate glow borderBeam onClick={() => {}}>
                  <div className="p-6 space-y-4">
                    <div className="text-4xl">💡</div>
                    <h3 className="font-semibold font-display text-lg">PROPOSALS & VOTING</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      PROPOSE NEW MARKETS AND VOTE
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-2 h-2 bg-conspiracy-green rounded-full animate-pulse" />
                      <span className="text-xs text-conspiracy-green font-mono uppercase tracking-wider">
                        LIVE NOW
                      </span>
                    </div>
                  </div>
                </ConspiracyCard>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <ConspiracyCard animate>
                <div className="p-6 space-y-4 opacity-60">
                  <div className="text-4xl">📈</div>
                  <h3 className="font-semibold font-display text-lg">ANALYTICS & REWARDS</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    TRACK STATS AND EARN POINTS
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-2 h-2 bg-conspiracy-amber rounded-full animate-pulse" />
                    <span className="text-xs text-conspiracy-amber font-mono uppercase tracking-wider">
                      COMING SOON
                    </span>
                  </div>
                </div>
              </ConspiracyCard>
            </motion.div>
          </div>

          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-conspiracy-purple/20 via-conspiracy-cyan/20 to-conspiracy-purple/20 animate-pulse-glow" />
            <div className="relative p-6 border border-conspiracy-purple/30 rounded-lg conspiracy-grid">
              <div className="space-y-2 text-center">
                <p className="text-sm text-conspiracy-cyan font-mono">
                  ✅ SMART CONTRACTS DEPLOYED TO SOLANA DEVNET
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  PHASE 1 MVP • ACTIVE DEVELOPMENT
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 🌑 Footer */}
      <footer className="border-t border-border-subtle bg-surface/50 backdrop-blur-xl mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-conspiracy-green rounded-full animate-pulse" />
              <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
                POWERED BY SOLANA • DEVNET
              </p>
            </div>
            <p className="text-xs font-mono">
              <a
                href="https://explorer.solana.com/address/Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-conspiracy-purple hover:text-conspiracy-cyan transition-colors"
              >
                VIEW CONTRACTS ON EXPLORER →
              </a>
            </p>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground/50 font-mono">
                🌑 CONSPIRACY MODE: ACTIVATED
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
