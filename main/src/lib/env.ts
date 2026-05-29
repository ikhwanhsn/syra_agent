/**
 * Centralized public env access for the unified Syra app.
 * Maps legacy Vite `VITE_*` names to Next.js `NEXT_PUBLIC_*`.
 */

function read(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const env = {
  isDev: process.env.NODE_ENV === "development",

  syraApiUrl:
    read("NEXT_PUBLIC_SYRA_API_URL") ??
    read("NEXT_PUBLIC_API_URL") ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://api.syraa.fun"),

  solanaRpcUrl:
    read("NEXT_PUBLIC_SOLANA_RPC_URL") ?? "https://rpc.ankr.com/solana",

  privyAppId: read("NEXT_PUBLIC_PRIVY_APP_ID"),
  privyClientId: read("NEXT_PUBLIC_PRIVY_CLIENT_ID"),

  useProxy: read("NEXT_PUBLIC_USE_PROXY") === "true",
  nansenApiBaseUrl: read("NEXT_PUBLIC_NANSEN_API_BASE_URL"),
  purchVaultApiBaseUrl: read("NEXT_PUBLIC_PURCH_VAULT_API_BASE_URL"),

  solanaNetwork: read("NEXT_PUBLIC_SOLANA_NETWORK") ?? "mainnet-beta",
  stakingProgramId: read("NEXT_PUBLIC_STAKING_PROGRAM_ID"),
  stakingMint: read("NEXT_PUBLIC_STAKING_MINT"),
  rewardMint: read("NEXT_PUBLIC_REWARD_MINT"),
  rewardPerSecond: read("NEXT_PUBLIC_REWARD_PER_SECOND"),
  rewardDecimals: read("NEXT_PUBLIC_REWARD_DECIMALS"),
  stakingDecimals: read("NEXT_PUBLIC_STAKING_DECIMALS"),
  stakingTokenSymbol: read("NEXT_PUBLIC_STAKING_TOKEN_SYMBOL") ?? "SYRA",
  rewardTokenPriceUsd: read("NEXT_PUBLIC_REWARD_TOKEN_PRICE_USD"),
  stakingTokenPriceUsd: read("NEXT_PUBLIC_STAKING_TOKEN_PRICE_USD"),
  streamflowStakingMint: read("NEXT_PUBLIC_STREAMFLOW_STAKING_MINT"),
  adminDashboardWallet: read("NEXT_PUBLIC_ADMIN_DASHBOARD_WALLET"),
} as const;

export function getApiBaseUrl(): string {
  return env.syraApiUrl.replace(/\/$/, "");
}
