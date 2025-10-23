"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getZmartProposalsProgram, getProposalPDA, getFeeConfigPDA } from "@/lib/program";
import { PROGRAM_IDS } from "@/lib/constants";

export default function CreateProposalPage() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    endDate: "",
    feeConfigId: "1",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!publicKey || !sendTransaction) {
      alert("Please connect your wallet");
      return;
    }

    if (!formData.question.trim()) {
      alert("Please enter a question");
      return;
    }

    if (!formData.endDate) {
      alert("Please select an end date");
      return;
    }

    const endTime = new Date(formData.endDate).getTime() / 1000;
    if (endTime <= Date.now() / 1000) {
      alert("End date must be in the future");
      return;
    }

    setCreating(true);
    try {
      const provider = new AnchorProvider(
        connection,
        window.solana as any,
        AnchorProvider.defaultOptions()
      );
      const program = getZmartProposalsProgram(provider);

      // Generate unique market ID
      const marketId = Keypair.generate().publicKey;

      // Get proposal counter to determine proposal ID
      const [proposalCounterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal_counter")],
        PROGRAM_IDS.proposals
      );

      // Fetch current count
      const proposalCounter = await connection.getAccountInfo(proposalCounterPDA);
      if (!proposalCounter) {
        alert("Proposal counter not initialized. Please contact admin.");
        setCreating(false);
        return;
      }

      // Decode count from account data (skip 8-byte discriminator)
      const countData = proposalCounter.data.slice(8, 16);
      const currentCount = new BN(countData, "le");
      const nextProposalId = currentCount.toNumber();

      // Get proposal PDA
      const [proposalPDA] = getProposalPDA(nextProposalId);

      // Get authority PDA
      const [authorityPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        PROGRAM_IDS.proposals
      );

      const tx = await program.methods
        .createProposal(
          marketId,
          formData.question,
          new BN(endTime),
          parseInt(formData.feeConfigId)
        )
        .accounts({
          proposal: proposalPDA,
          proposalCounter: proposalCounterPDA,
          authority: authorityPDA,
          proposer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      alert(`Proposal created successfully!\n\nProposal ID: ${nextProposalId}\nSignature: ${signature}`);

      // Redirect to proposals list
      router.push("/proposals");
    } catch (error: any) {
      console.error("Failed to create proposal:", error);

      let errorMessage = "Failed to create proposal";
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  }

  // Get min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

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
            <Link href="/markets" className="text-slate-400 hover:text-slate-300">
              Markets
            </Link>
            <Link href="/proposals" className="text-purple-400 font-semibold">
              Proposals
            </Link>
            <WalletMultiButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link
            href="/proposals"
            className="text-purple-400 hover:text-purple-300 mb-6 inline-block"
          >
            ← Back to Proposals
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2">Create Market Proposal</h2>
            <p className="text-slate-400">
              Submit a new prediction market for community voting
            </p>
          </div>

          {!publicKey ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-4">Connect your wallet to create a proposal</p>
              <WalletMultiButton />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Market Question <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                    rows={3}
                    maxLength={500}
                    required
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {formData.question.length}/500 characters
                  </div>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
                  <div className="text-sm text-blue-400 font-semibold mb-2">
                    ✨ Tips for Good Questions
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Be specific and unambiguous</li>
                    <li>• Make it objectively verifiable</li>
                    <li>• Include a clear timeframe</li>
                    <li>• Avoid subjective or opinion-based questions</li>
                  </ul>
                </div>
              </div>

              {/* End Date */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                <label className="block text-sm font-medium mb-2">
                  Market End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={minDate}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                />
                <div className="text-xs text-slate-500 mt-2">
                  When should betting close and the outcome be determined?
                </div>
              </div>

              {/* Fee Tier */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                <label className="block text-sm font-medium mb-2">
                  Fee Tier <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.feeConfigId}
                  onChange={(e) =>
                    setFormData({ ...formData, feeConfigId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="1">Tier 1 - Standard (1% platform fee)</option>
                  <option value="2">Tier 2 - Premium (0.5% platform fee)</option>
                  <option value="3">Tier 3 - Crowdfunding (2% to beneficiary)</option>
                  <option value="4">Tier 4 - Charity (3% to charity)</option>
                </select>
                <div className="text-xs text-slate-500 mt-2">
                  Different tiers have different fee structures. Most markets use Tier 1.
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                <div className="text-sm font-semibold mb-2">📋 What Happens Next?</div>
                <ol className="text-sm text-slate-400 space-y-2">
                  <li>1. Your proposal will be submitted to the blockchain</li>
                  <li>2. Community members can vote (upvote/downvote)</li>
                  <li>3. Auto-approval when net votes ≥ 50 OR (24h passed AND net votes &gt; 0)</li>
                  <li>4. Approved proposals can be executed to create the market</li>
                  <li>5. You'll earn creator fees from all bets on your market!</li>
                </ol>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Creating Proposal...
                  </span>
                ) : (
                  "✨ Submit Proposal"
                )}
              </button>

              {/* Disclaimer */}
              <div className="text-xs text-slate-500 text-center">
                By submitting, you agree that your proposal follows community guidelines
                and can be objectively verified when the end date arrives.
              </div>
            </form>
          )}
        </div>
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
