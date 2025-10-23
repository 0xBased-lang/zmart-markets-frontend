"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, web3 } from "@coral-xyz/anchor";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getZmartProposalsProgram, getProposalPDA, getZmartCoreProgram, getMarketPDA, getFeeConfigPDA } from "@/lib/program";
import type { Proposal } from "@/types/market";
import { ProposalStatus, VoteType } from "@/types/market";
import { PROGRAM_IDS } from "@/lib/constants";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);

  const proposalId = parseInt(params.id as string);

  // Load proposal data
  useEffect(() => {
    loadProposalData();
  }, [proposalId, connection]);

  // Load user vote
  useEffect(() => {
    if (publicKey && proposal) {
      loadUserVote();
    }
  }, [publicKey, proposal]);

  async function loadProposalData() {
    setLoading(true);
    try {
      const [proposalPDA] = getProposalPDA(proposalId);
      const provider = new AnchorProvider(
        connection,
        {} as any,
        AnchorProvider.defaultOptions()
      );
      const program = getZmartProposalsProgram(provider);

      const account = await connection.getAccountInfo(proposalPDA);
      if (!account) {
        setProposal(null);
        setLoading(false);
        return;
      }

      const proposalData = program.coder.accounts.decode("Proposal", account.data);
      setProposal({
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
    } catch (error) {
      console.error("Failed to load proposal:", error);
      setProposal(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserVote() {
    if (!publicKey || !proposal) return;
    try {
      const [votePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal_vote"),
          publicKey.toBuffer(),
          Buffer.from(new Uint8Array(new BigInt64Array([BigInt(proposalId)]).buffer)),
        ],
        PROGRAM_IDS.proposals
      );

      const account = await connection.getAccountInfo(votePDA);
      if (account) {
        const provider = new AnchorProvider(
          connection,
          {} as any,
          AnchorProvider.defaultOptions()
        );
        const program = getZmartProposalsProgram(provider);
        const voteData = program.coder.accounts.decode("ProposalVote", account.data);
        setUserVote(voteData.voteType);
      } else {
        setUserVote(null);
      }
    } catch (error) {
      console.error("Failed to load user vote:", error);
      setUserVote(null);
    }
  }

  async function vote(voteType: VoteType) {
    if (!publicKey || !sendTransaction || !proposal) {
      alert("Please connect your wallet");
      return;
    }

    if (proposal.status !== ProposalStatus.Pending) {
      alert("Can only vote on pending proposals");
      return;
    }

    setVoting(true);
    try {
      const provider = new AnchorProvider(
        connection,
        window.solana as any,
        AnchorProvider.defaultOptions()
      );
      const program = getZmartProposalsProgram(provider);

      const [proposalPDA] = getProposalPDA(proposalId);
      const [votePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("proposal_vote"),
          publicKey.toBuffer(),
          Buffer.from(new Uint8Array(new BigInt64Array([BigInt(proposalId)]).buffer)),
        ],
        PROGRAM_IDS.proposals
      );

      const tx = await program.methods
        .voteProposal(voteType)
        .accounts({
          proposal: proposalPDA,
          proposalVote: votePDA,
          voter: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      alert(`Vote submitted successfully!\nSignature: ${signature}`);

      // Reload data
      await loadProposalData();
      await loadUserVote();
    } catch (error: any) {
      console.error("Failed to vote:", error);
      alert(`Failed to vote: ${error.message || error}`);
    } finally {
      setVoting(false);
    }
  }

  async function executeProposal() {
    if (!publicKey || !sendTransaction || !proposal) {
      alert("Please connect your wallet");
      return;
    }

    if (proposal.status !== ProposalStatus.Approved) {
      alert("Can only execute approved proposals");
      return;
    }

    setExecuting(true);
    try {
      const provider = new AnchorProvider(
        connection,
        window.solana as any,
        AnchorProvider.defaultOptions()
      );
      const proposalsProgram = getZmartProposalsProgram(provider);
      const coreProgram = getZmartCoreProgram(provider);

      const [proposalPDA] = getProposalPDA(proposalId);
      const [marketPDA] = getMarketPDA(proposal.marketId);
      const [feeConfigPDA] = getFeeConfigPDA(proposal.feeConfigId);

      const [authorityPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        PROGRAM_IDS.proposals
      );

      const tx = await proposalsProgram.methods
        .executeProposal()
        .accounts({
          proposal: proposalPDA,
          authority: authorityPDA,
          market: marketPDA,
          feeConfig: feeConfigPDA,
          creator: proposal.proposer,
          executor: publicKey,
          coreProgram: PROGRAM_IDS.core,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      alert(`Proposal executed successfully!\n\nMarket created!\nSignature: ${signature}`);

      // Redirect to new market
      router.push(`/markets/${proposal.marketId.toString()}`);
    } catch (error: any) {
      console.error("Failed to execute proposal:", error);
      alert(`Failed to execute: ${error.message || error}`);
    } finally {
      setExecuting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full" />
          <p className="mt-4 text-slate-400">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Proposal Not Found</h2>
          <Link href="/proposals" className="text-purple-400 hover:text-purple-300">
            ← Back to Proposals
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (proposal.status) {
      case ProposalStatus.Pending:
        return <span className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⏳ Pending</span>;
      case ProposalStatus.Approved:
        return <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">✅ Approved</span>;
      case ProposalStatus.Rejected:
        return <span className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">❌ Rejected</span>;
      case ProposalStatus.Executed:
        return <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">🚀 Executed</span>;
    }
  };

  const netVotes = proposal.votesFor - proposal.votesAgainst;
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const isPending = proposal.status === ProposalStatus.Pending;
  const isApproved = proposal.status === ProposalStatus.Approved;
  const canExecute = isApproved && proposal.status !== ProposalStatus.Executed;

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
        <Link href="/proposals" className="text-purple-400 hover:text-purple-300 mb-6 inline-block">
          ← Back to Proposals
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Proposal Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Details */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-slate-500 mb-2">Proposal #{proposalId}</div>
                  {getStatusBadge()}
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-6">{proposal.question}</h2>

              <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                <div>
                  <span className="text-slate-500">Proposer:</span>{" "}
                  {proposal.proposer.toString().slice(0, 8)}...{proposal.proposer.toString().slice(-6)}
                </div>
                <div>
                  <span className="text-slate-500">Created:</span>{" "}
                  {new Date(proposal.createdAt * 1000).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-slate-500">Market Ends:</span>{" "}
                  {new Date(proposal.endTime * 1000).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-slate-500">Fee Tier:</span> {proposal.feeConfigId}
                </div>
              </div>
            </div>

            {/* Vote Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="text-sm text-green-400 mb-2">Votes For</div>
                <div className="text-3xl font-bold text-green-400">{proposal.votesFor}</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <div className="text-sm text-red-400 mb-2">Votes Against</div>
                <div className="text-3xl font-bold text-red-400">{proposal.votesAgainst}</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                <div className="text-sm text-purple-400 mb-2">Net Votes</div>
                <div className={`text-3xl font-bold ${netVotes >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {netVotes >= 0 ? "+" : ""}{netVotes}
                </div>
              </div>
            </div>

            {/* User's Vote */}
            {userVote !== null && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                <h3 className="font-semibold mb-2">Your Vote</h3>
                <div className="text-lg">
                  {userVote === VoteType.Upvote ? "👍 Upvoted" : "👎 Downvoted"}
                </div>
              </div>
            )}

            {/* Execution Info */}
            {canExecute && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <h3 className="font-semibold text-green-400 mb-2">✅ Ready to Execute</h3>
                <p className="text-sm text-slate-400">
                  This proposal has been approved! Anyone can execute it to create the prediction market.
                </p>
              </div>
            )}
          </div>

          {/* Right: Voting Interface */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-6">Take Action</h3>

              {!publicKey ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">Connect wallet to vote</p>
                  <WalletMultiButton />
                </div>
              ) : isPending ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 mb-4">
                    Vote on this proposal. Auto-approves when net votes ≥ 50 OR (24h passed AND net &gt; 0)
                  </p>

                  <button
                    onClick={() => vote(VoteType.Upvote)}
                    disabled={voting}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-lg font-semibold"
                  >
                    {voting ? "Processing..." : "👍 Upvote (Support)"}
                  </button>

                  <button
                    onClick={() => vote(VoteType.Downvote)}
                    disabled={voting}
                    className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 rounded-lg font-semibold"
                  >
                    {voting ? "Processing..." : "👎 Downvote (Oppose)"}
                  </button>

                  {userVote !== null && (
                    <p className="text-xs text-slate-500 text-center">
                      You've already voted on this proposal
                    </p>
                  )}
                </div>
              ) : canExecute ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 mb-4">
                    This proposal is approved! Execute it to create the prediction market.
                  </p>

                  <button
                    onClick={executeProposal}
                    disabled={executing}
                    className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 rounded-lg font-semibold"
                  >
                    {executing ? "Executing..." : "🚀 Execute Proposal"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    {proposal.status === ProposalStatus.Rejected
                      ? "This proposal was rejected"
                      : "This proposal has been executed"}
                  </p>
                  {proposal.status === ProposalStatus.Executed && (
                    <Link
                      href={`/markets/${proposal.marketId.toString()}`}
                      className="inline-block mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
                    >
                      View Market
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
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
