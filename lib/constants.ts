import { PublicKey } from "@solana/web3.js";

// Solana Configuration
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || "devnet") as "devnet" | "testnet" | "mainnet-beta";

// Program IDs
export const PROGRAM_IDS = {
  proposals: new PublicKey(process.env.NEXT_PUBLIC_PROPOSALS_PROGRAM_ID!),
  core: new PublicKey(process.env.NEXT_PUBLIC_CORE_PROGRAM_ID!),
};

// Explorer URL
export const getExplorerUrl = (address: string, type: "address" | "tx" = "address") => {
  const baseUrl = "https://explorer.solana.com";
  return `${baseUrl}/${type}/${address}?cluster=${CLUSTER}`;
};
