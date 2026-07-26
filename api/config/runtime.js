/**
 * Non-secret runtime config — NODE_ENV is the only process.env branch.
 * Public URLs, ports, site links, and product IDs live here (not in .env).
 */

/** @returns {boolean} */
export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** @returns {boolean} */
export function isDevelopment() {
  return !isProduction();
}

const PROD_PUBLIC_API_URL = "https://api.syraa.fun";
const LOCAL_PUBLIC_API_URL = "http://localhost:3000";

/**
 * Canonical public API origin (discovery, OpenAPI, x402 manifests).
 * @returns {string}
 */
export function getPublicApiUrl() {
  return (isProduction() ? PROD_PUBLIC_API_URL : LOCAL_PUBLIC_API_URL).replace(
    /\/+$/,
    "",
  );
}

/** Alias used across x402 / gateway code. */
export function getBaseUrl() {
  return getPublicApiUrl();
}

/**
 * HTTP listen port.
 * @returns {number}
 */
export function getPort() {
  return isProduction() ? 3000 : 3000;
}

/**
 * Mongo database name.
 * @returns {string}
 */
export function getDbName() {
  return "syra";
}

/**
 * Trust first proxy (Nginx / Cloudflare) for req.ip / rate limits.
 * @returns {boolean}
 */
export function getTrustProxy() {
  return isProduction();
}

/**
 * Extra CORS origins beyond the built-in allowlist.
 * @returns {string[]}
 */
export function getCorsExtraOrigins() {
  return isProduction()
    ? []
    : [];
}

/** S3 Labs marketing / KOL site. */
export function getS3LabsSiteUrl() {
  return isProduction() ? "https://s3labs.xyz" : "http://localhost:8080";
}

/** S3 Labs API origin (usually same host as Syra API). */
export function getS3LabsApiUrl() {
  return getPublicApiUrl();
}

export function getS3LabsTelegramChatId() {
  return "-1003743529231";
}

export function isS3LabsTelegramPollingEnabled() {
  return false;
}

export function getIpfsGateway() {
  return "https://ipfs.io";
}

export function getIpfsGatewayTimeoutMs() {
  return 10_000;
}

export function getPrivyAppId() {
  return "cmkyouq4a00kwi20c4rbsl1ce";
}

export function getCloudflareAccountId() {
  return "2b903ecbc27a658493b2e981a18a2d99";
}

export function getSquidIntegratorId() {
  return "ikhwanul-husna-2fb2950c-46c5-4e3a-a7ca-ca306541fd2a";
}

export function getSentinelAgentId() {
  return "team_SZswn0zYq32mxHkW59cj2";
}

export function getSaidApiBaseUrl() {
  return "https://api.saidprotocol.com";
}

export function getSaidAgentWallet() {
  return "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";
}

export function getSyraTokenMint() {
  return "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
}

export function getSyraPubkey() {
  return "9VsuZxfkEtE3gbqkuVuimQg8gRy6cX2oZnXJUNw1tGCm";
}

export function getSyraAdminWallets() {
  return [
    "Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4",
    "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
  ];
}

export function getAdminDashboardWallet() {
  return "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD";
}

export function getKolPoolWalletAddress() {
  return "GGj37PSMDUUgkac5HkMx36Sk38zbHDMtXFLn6MR2HXnv";
}

export function getKolS3LabsFeeWallet() {
  return "854tpY9AnaMYDpviWeo4eWXzoUmvLrYwkU16F2MtzHz8";
}

export function getSyraCustodyMode() {
  return "privy";
}

export function getSyraTreasuryCustody() {
  return "privy";
}

export function getSyraTreasuryPrivyWalletId() {
  return "rhuj6bv8cykygnpvxxo9ty2d";
}

export function getSyraTreasuryMaxAutoUsd() {
  return 1000;
}

export function getSyraDevBotChatId() {
  return "963912641";
}

export function getSyraCollectionMeta() {
  return {
    imageUri: "https://syraa.fun/images/logo.jpg",
    externalUrl: "https://syraa.fun",
    xUrl: "https://x.com/syra_agent",
    pointer: "c1:bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm",
  };
}

/** Trading experiment cron intervals (ms). */
export function getTradingExperimentCronMs() {
  return {
    signalMs: 3_600_000,
    validateMs: 10_000,
  };
}

/** MCP bridge non-secret knobs. */
export function getMcpBridgeConfig() {
  return {
    enabled: true,
    rateLimitPerMin: 120,
  };
}

/**
 * Snapshot used by boot logs / diagnostics.
 */
export function getRuntimeSnapshot() {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: isProduction(),
    publicApiUrl: getPublicApiUrl(),
    port: getPort(),
    dbName: getDbName(),
    trustProxy: getTrustProxy(),
    s3labsSiteUrl: getS3LabsSiteUrl(),
  };
}
