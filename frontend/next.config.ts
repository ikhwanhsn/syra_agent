import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SOLANA_RPC_URL_CONFIG: process.env.SOLANA_RPC_URL,
    SOLANA_PRIVATE_KEY_CONFIG: process.env.SOLANA_PRIVATE_KEY,
    FACILITATOR_URL_CONFIG: process.env.FACILITATOR_URL,
    TREASURY_ADDRESS_CONFIG: process.env.TREASURY_ADDRESS,
  },
};

export default nextConfig;
