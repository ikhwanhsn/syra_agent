/** One-off recovery for legacy multiwallet farm wallets (MongoDB + encrypted keys). */

export const ANSEM_MINT = '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export const RECOVERY_SLIPPAGE_BPS = 300;
export const RECOVERY_MIN_TOKEN_SELL_RAW = 1000;
export const RECOVERY_SWEEP_FEE_BUFFER_LAMPORTS = 500_000;
export const RECOVERY_MIN_SOL_FOR_SELL_FEES = 100_000;
export const RECOVERY_SWAP_CONCURRENCY = 1;
export const RECOVERY_SWAP_STAGGER_MS = 1500;
export const RECOVERY_SWAP_MAX_RETRIES = 3;
