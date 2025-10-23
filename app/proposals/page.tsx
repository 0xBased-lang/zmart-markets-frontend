"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { fetchAllProposals } from "@/lib/program";
import type { Proposal } from "@/types/market";
import { ProposalStatus } from "@/types/market";

export default function ProposalsPage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Fetch proposals from blockchain
  useEffect(() => {
    loadProposals();
  }, [connection]);

  async function loadProposals() {
    setLoading(true);
    try {
      const fetchedProposals = await fetchAllProposals(connection);

      // Sort by newest first
      fetchedProposals.sort((a, b) => b.createdAt - a.createdAt);

      setProposals(fetchedProposals);
    } catch (error) {
      console.error("Failed to load proposals:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter proposals
  const filteredProposals = proposals.filter((proposal) => {
    if (filter === "pending") return proposal.status === ProposalStatus.Pending;
    if (filter === "approved") return proposal.status === ProposalStatus.Approved;
    if (filter === "rejected") return proposal.status === ProposalStatus.Rejected;
    return true;
  });

  // Calculate stats
  const stats = {
    total: proposals.length,
    pending: proposals.filter((p) => p.status === ProposalStatus.Pending).length,
    approved: proposals.filter((p) => p.status === ProposalStatus.Approved).length,
    rejected: proposals.filter((p) => p.status === ProposalStatus.Rejected).length,
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
            <Link href="/markets" className="text-slate-400 hover:text-slate-300">
              Markets
            </Link>
            <Link href="/proposals" className="text-purple-400 font-semibold">
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
          <h2 className="text-4xl font-bold mb-2">Market Proposals</h2>
          <p className="text-slate-400">
            Propose new prediction markets and vote on community submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link
            href="/proposals/create"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-center"
          >
            ✨ Create Proposal
          </Link>

          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg flex-1 sm:flex-initial ${
                filter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg flex-1 sm:flex-initial ${
                filter === "pending"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-lg flex-1 sm:flex-initial ${
                filter === "approved"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-lg flex-1 sm:flex-initial ${
                filter === "rejected"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Rejected
            </button>
          </div>

          <button
            onClick={loadProposals}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            <p className="mt-4 text-slate-400">Loading proposals from blockchain...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💡</div>
            <h3 className="text-xl font-semibold mb-2">No Proposals Found</h3>
            <p className="text-slate-400 mb-6">
              {filter === "all"
                ? "Be the first to propose a prediction market!"
                : `No ${filter} proposals found.`}
            </p>
            <Link
              href="/proposals/create"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              Create First Proposal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.proposalId} proposal={proposal} />
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

// Proposal Card Component
function ProposalCard({ proposal }: { proposal: Proposal }) {
  const getStatusBadge = () => {
    switch (proposal.status) {
      case ProposalStatus.Pending:
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            ⏳ Pending
          </span>
        );
      case ProposalStatus.Approved:
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            ✅ Approved
          </span>
        );
      case ProposalStatus.Rejected:
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
            ❌ Rejected
          </span>
        );
      case ProposalStatus.Executed:
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
            🚀 Executed
          </span>
        );
      default:
        return null;
    }
  };

  const netVotes = proposal.votesFor - proposal.votesAgainst;
  const totalVotes = proposal.votesFor + proposal.votesAgainst;

  return (
    <Link
      href={`/proposals/${proposal.proposalId}`}
      className="block bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-purple-500/10"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-slate-500">#{proposal.proposalId}</span>
            {getStatusBadge()}
          </div>
          <h3 className="text-lg font-semibold">{proposal.question}</h3>
        </div>
      </div>

      {/* Vote Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
          <div className="text-xs text-green-400 mb-1">For</div>
          <div className="text-xl font-bold text-green-400">{proposal.votesFor}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <div className="text-xs text-red-400 mb-1">Against</div>
          <div className="text-xl font-bold text-red-400">{proposal.votesAgainst}</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3">
          <div className="text-xs text-purple-400 mb-1">Net</div>
          <div className={`text-xl font-bold ${netVotes >= 0 ? "text-green-400" : "text-red-400"}`}>
            {netVotes >= 0 ? "+" : ""}{netVotes}
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-400">
        <div>
          Proposer: {proposal.proposer.toString().slice(0, 8)}...{proposal.proposer.toString().slice(-6)}
        </div>
        <div>•</div>
        <div>
          Created: {new Date(proposal.createdAt * 1000).toLocaleDateString()}
        </div>
        <div>•</div>
        <div>
          Ends: {new Date(proposal.endTime * 1000).toLocaleDateString()}
        </div>
        <div>•</div>
        <div>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </div>
      </div>
    </Link>
  );
}
