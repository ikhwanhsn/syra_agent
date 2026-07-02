/**
 * Shared constants for Syra Dune Analytics queries.
 * SQL templates use {{PLACEHOLDER}} tokens substituted at publish time.
 */
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

/** @typedef {{ slug: string; file: string; name: string; description: string; section: string; chartType: string }} DuneQueryDefinition */

export const SYRA_MINT =
  process.env.SYRA_TOKEN_MINT?.trim() ||
  '8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump';

export const SYRA_DECIMALS = Number(process.env.SYRA_DECIMALS || '6');

/** Whole-token supply for FDV / concentration math. */
export const SYRA_TOTAL_SUPPLY = Number(process.env.SYRA_TOTAL_SUPPLY || '1000000000');

export const STREAMFLOW_PROGRAM_ID =
  process.env.STREAMFLOW_PROGRAM_ID?.trim() ||
  'strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m';

export const USDC_MINT =
  process.env.USDC_MINT?.trim() || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export const DUNE_DASHBOARD_TITLE = 'Syra Analytics';

export const DUNE_QUERY_PREFIX = 'Syra / ';

/**
 * Resolve treasury wallet from env (public key only — never log private keys).
 * @returns {string}
 */
export function resolveTreasuryWallet() {
  const explicit = process.env.SYRA_TREASURY_WALLET?.trim();
  if (explicit) return explicit;

  const agentKey = process.env.AGENT_PRIVATE_KEY?.trim();
  if (agentKey) {
    try {
      const secretKey = bs58.decode(agentKey);
      const keypair = Keypair.fromSecretKey(secretKey);
      return keypair.publicKey.toBase58();
    } catch {
      // fall through to placeholder
    }
  }

  return 'REPLACE_WITH_TREASURY_WALLET';
}

/**
 * @returns {Record<string, string>}
 */
export function getSqlSubstitutions() {
  return {
    SYRA_MINT,
    SYRA_DECIMALS: String(SYRA_DECIMALS),
    TOTAL_SUPPLY: String(SYRA_TOTAL_SUPPLY),
    STREAMFLOW_PROGRAM_ID,
    USDC_MINT,
    TREASURY_WALLET: resolveTreasuryWallet(),
  };
}

/**
 * @param {string} template
 * @param {Record<string, string>} subs
 */
export function applySqlSubstitutions(template, subs) {
  let sql = template;
  for (const [key, value] of Object.entries(subs)) {
    sql = sql.replaceAll(`{{${key}}}`, value);
  }
  return sql;
}

/** @type {DuneQueryDefinition[]} */
export const DUNE_QUERIES = [
  {
    slug: 'overview',
    file: 'overview.sql',
    name: 'Token Overview KPIs',
    description:
      'Live SYRA price, FDV, DEX volume (24h/7d/all-time), holder count, and top-10 concentration.',
    section: 'Overview',
    chartType: 'Counter (multi-metric table)',
  },
  {
    slug: 'trading-volume',
    file: 'trading-volume.sql',
    name: 'Daily Trading Volume',
    description: 'Daily SYRA DEX volume split into buys vs sells with trade counts.',
    section: 'Trading',
    chartType: 'Stacked bar chart (buy vs sell volume)',
  },
  {
    slug: 'unique-traders',
    file: 'unique-traders.sql',
    name: 'Daily Unique Traders',
    description: 'Distinct wallets trading SYRA per day.',
    section: 'Trading',
    chartType: 'Line chart',
  },
  {
    slug: 'price-vwap',
    file: 'price-vwap.sql',
    name: 'Daily VWAP Price',
    description: 'Volume-weighted average SYRA price (USD) per day from DEX trades.',
    section: 'Trading',
    chartType: 'Line chart',
  },
  {
    slug: 'venue-split',
    file: 'venue-split.sql',
    name: 'Volume by DEX Venue',
    description: 'Daily SYRA volume and trade count by DEX project (pump.fun, Raydium, etc.).',
    section: 'Trading',
    chartType: 'Stacked bar chart by project',
  },
  {
    slug: 'holders-over-time',
    file: 'holders-over-time.sql',
    name: 'Holders Over Time',
    description: 'Daily count of wallets holding a positive SYRA balance.',
    section: 'Holders',
    chartType: 'Area / line chart',
  },
  {
    slug: 'top-holders',
    file: 'top-holders.sql',
    name: 'Top 100 Holders',
    description: 'Largest SYRA balances with % of total supply.',
    section: 'Holders',
    chartType: 'Table',
  },
  {
    slug: 'staking-locked',
    file: 'staking-locked.sql',
    name: 'Streamflow Locks (Approximate)',
    description:
      'On-chain proxy for SYRA locked via Streamflow. Syra app registry remains source of truth for active locks.',
    section: 'Staking',
    chartType: 'Line chart (cumulative locked) + table',
  },
  {
    slug: 'buybacks',
    file: 'buybacks.sql',
    name: 'Treasury Buybacks',
    description:
      'SYRA purchased by the Syra treasury wallet (80% of x402 revenue buybacks via Jupiter).',
    section: 'Treasury',
    chartType: 'Table + line (cumulative SYRA bought)',
  },
];
