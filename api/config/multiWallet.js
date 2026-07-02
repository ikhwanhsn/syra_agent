/**
 * Multiwallet airdrop farming configuration.
 */

export const ANSEM_MINT = '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

/** SOL sent to each generated wallet before swap (covers swap + ATA rent + fees). */
export const DEFAULT_FUND_SOL = 0.015;
/** Target SOL swapped to $ANSEM per wallet (capped by wallet balance minus fee reserve). */
export const DEFAULT_SWAP_SOL = 0.007;

/** Lamports reserved for priority + base tx fees. */
export const MULTIWALLET_PRIORITY_FEE_BUFFER_LAMPORTS = 1_000_000;
/** Token-2022 / SPL associated token account rent (approx). */
export const MULTIWALLET_ATA_RENT_LAMPORTS = 2_100_000;
/** Extra headroom for Jupiter route hops / wrap overhead inside the same tx. */
export const MULTIWALLET_JUPITER_ROUTE_BUFFER_LAMPORTS = 600_000;
/** Wallets funded below this (lamports) use conservative reserves (legacy 0.01 SOL). */
export const MULTIWALLET_TIGHT_BUDGET_LAMPORTS = 12_000_000;
/** Minimum swap size (0.0005 SOL) — still counts as a micro buy. */
export const MULTIWALLET_MIN_SWAP_LAMPORTS = 500_000;

export const MULTIWALLET_TIER_LIMITS = Object.freeze({
  /** Default tier — no $SYRA (wallet or staked) required. */
  basic: 5,
  staker: 25,
  whale: 100,
});

/** Staked $SYRA thresholds (human-readable, 6 decimals). */
export const MULTIWALLET_STAKER_THRESHOLD = 1_000_000;
export const MULTIWALLET_WHALE_THRESHOLD = 10_000_000;

/** Max concurrent swap submissions per execute-buy request. */
export const MULTIWALLET_SWAP_CONCURRENCY = 1;
/** Delay between swap submissions to avoid Jupiter/RPC rate limits (ms). */
export const MULTIWALLET_SWAP_STAGGER_MS = 800;
/** Per-wallet buy retries on transient Jupiter/RPC failures. */
export const MULTIWALLET_SWAP_MAX_RETRIES = 3;

export const MULTIWALLET_SLIPPAGE_BPS = 300;
