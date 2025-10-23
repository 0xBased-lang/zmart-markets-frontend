import { PublicKey } from "@solana/web3.js";

// Solana Configuration
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || "devnet") as "devnet" | "testnet" | "mainnet-beta";

// Default Program IDs (Devnet)
const DEFAULT_PROPOSALS_ID = "Ayh1AKtiNKg9DgLgpxn9t9B2KSjfvfH3sbpDdXBp1zv7";
const DEFAULT_CORE_ID = "3q38JSeuMykM6vjh8g8cbpUqkBhB4SvQkQ9XedesXApu";

// Program IDs - lazy loaded to avoid SSR issues
export const PROGRAM_IDS = {
  get proposals(): PublicKey {
    return new PublicKey(
      process.env.NEXT_PUBLIC_PROPOSALS_PROGRAM_ID || DEFAULT_PROPOSALS_ID
    );
  },
  get core(): PublicKey {
    return new PublicKey(
      process.env.NEXT_PUBLIC_CORE_PROGRAM_ID || DEFAULT_CORE_ID
    );
  },
};

// Explorer URL
export const getExplorerUrl = (address: string, type: "address" | "tx" = "address") => {
  const baseUrl = "https://explorer.solana.com";
  return `${baseUrl}/${type}/${address}?cluster=${CLUSTER}`;
};
