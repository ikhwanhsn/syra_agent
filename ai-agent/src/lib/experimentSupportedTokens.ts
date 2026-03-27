/**
 * Binance spot token slugs supported by the trading experiment signal builder.
 * Keep in sync with `api/libs/binanceSignalAnalysis.js` TOKEN_TO_SYMBOL (canonical slug per pair).
 */
export interface ExperimentSupportedToken {
  slug: string;
  label: string;
  /** Extra substrings to match when filtering (lowercase aliases). */
  searchTerms: readonly string[];
}

export const EXPERIMENT_SUPPORTED_TOKENS: readonly ExperimentSupportedToken[] = [
  { slug: "bitcoin", label: "Bitcoin", searchTerms: ["bitcoin", "btc"] },
  { slug: "ethereum", label: "Ethereum", searchTerms: ["ethereum", "eth"] },
  { slug: "solana", label: "Solana", searchTerms: ["solana", "sol"] },
  { slug: "xrp", label: "XRP", searchTerms: ["xrp", "ripple"] },
  { slug: "dogecoin", label: "Dogecoin", searchTerms: ["dogecoin", "doge"] },
  { slug: "cardano", label: "Cardano", searchTerms: ["cardano", "ada"] },
  { slug: "bnb", label: "BNB", searchTerms: ["bnb", "binance", "binancecoin"] },
  { slug: "polygon", label: "Polygon", searchTerms: ["polygon", "matic"] },
  { slug: "avalanche", label: "Avalanche", searchTerms: ["avalanche", "avax"] },
  { slug: "chainlink", label: "Chainlink", searchTerms: ["chainlink", "link"] },
  { slug: "polkadot", label: "Polkadot", searchTerms: ["polkadot", "dot"] },
  { slug: "litecoin", label: "Litecoin", searchTerms: ["litecoin", "ltc"] },
];

/**
 * Returns tokens whose slug, label, or aliases match the query (case-insensitive).
 * Empty or whitespace query returns the full list.
 */
export function filterExperimentSupportedTokens(query: string): ExperimentSupportedToken[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...EXPERIMENT_SUPPORTED_TOKENS];
  return EXPERIMENT_SUPPORTED_TOKENS.filter((t) =>
    t.searchTerms.some((term) => term.includes(q) || q.includes(term)),
  );
}
