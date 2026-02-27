/**
 * Jupiter token helpers: resolve symbols/mints to token info for swap params.
 *
 * Token resolution is STATIC ONLY — no network calls to Jupiter's public token list.
 * Swap execution uses Corbits (jupiter.api.corbits.dev) via the swap-order route.
 * Add tokens to STATIC_TOKENS below to support "buy $SYMBOL $amount" in the agent.
 */
import { SYRA_TOKEN_MINT } from "./syraToken.js";

/** Supported tokens for agent "buy $TOKEN $amount". No fetch — avoids "fetch failed" errors. */
const STATIC_TOKENS = [
  {
    symbol: "SYRA",
    address: SYRA_TOKEN_MINT,
    decimals: 9,
    verified: true,
  },
  {
    symbol: "BONK",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    decimals: 5,
    verified: true,
  },
];

/**
 * Resolve a symbol or mint address to a known token (static list only).
 * @param {string} symbolOrMint
 * @returns {Promise<{ address: string; decimals: number; symbol: string; verified: boolean } | null>}
 */
export async function findVerifiedJupiterToken(symbolOrMint) {
  if (!symbolOrMint || typeof symbolOrMint !== "string") return null;
  const query = symbolOrMint.trim();

  const staticByMint = STATIC_TOKENS.find((t) => String(t.address) === query);
  if (staticByMint) {
    return {
      address: String(staticByMint.address),
      decimals: Number(staticByMint.decimals ?? 0),
      symbol: String(staticByMint.symbol ?? ""),
      verified: true,
    };
  }

  const upperSym = query.toUpperCase();
  const staticBySymbol = STATIC_TOKENS.find(
    (t) => String(t.symbol ?? "").toUpperCase() === upperSym
  );
  if (staticBySymbol) {
    return {
      address: String(staticBySymbol.address),
      decimals: Number(staticBySymbol.decimals ?? 0),
      symbol: String(staticBySymbol.symbol ?? upperSym),
      verified: true,
    };
  }

  return null;
}
