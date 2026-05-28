/**
 * CoinGecko Alpha (dashboard tab) — daily top gainers, pump research, predictions.
 */

/** Mongo snapshot id for latest daily brief. */
export const COINGECKO_ALPHA_DB_ID = "coingecko-alpha:daily";

/** How often the in-process scheduler re-runs the pipeline (default 24h). Set 0 to disable. */
export const COINGECKO_ALPHA_CRON_MS = Math.min(
  7 * 24 * 60 * 60 * 1000,
  Math.max(
    60_000,
    Number.parseInt(
      process.env.COINGECKO_ALPHA_CRON_MS || String(24 * 60 * 60 * 1000),
      10,
    ),
  ),
);

/** Top N gainers to research with news + X. */
export const COINGECKO_ALPHA_RESEARCH_TOP_N = Math.min(
  12,
  Math.max(
    3,
    Number.parseInt(process.env.COINGECKO_ALPHA_RESEARCH_TOP_N || "8", 10),
  ),
);

/** Days of prior snapshots kept in payload.history for LLM learning. */
export const COINGECKO_ALPHA_HISTORY_DAYS = Math.min(
  30,
  Math.max(
    5,
    Number.parseInt(process.env.COINGECKO_ALPHA_HISTORY_DAYS || "14", 10),
  ),
);

/** Minimum market cap (USD) to include a gainer in research. */
export const COINGECKO_ALPHA_MIN_MARKET_CAP_USD = Math.max(
  100_000,
  Number.parseInt(process.env.COINGECKO_ALPHA_MIN_MARKET_CAP_USD || "1000000", 10),
);
