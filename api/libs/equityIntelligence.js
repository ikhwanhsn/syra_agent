/**
 * Tokenized Equity Intelligence — generalized module for SPCX + xStocks catalog.
 * Surfaces Nasdaq vs on-chain premium/discount, liquidity context, and risk notes.
 *
 * x402 revenue from /spcx and /equity routes flows to $SYRA buybacks automatically
 * via settlePaymentAndSetResponse → buybackSYRAFromRevenue (production).
 */

import {
  resolveEquityToken,
  listEquitySymbols,
  SPCX_VENUES,
  SPCX_IPO_REFERENCE_PRICE_USD,
  SPCX_NASDAQ_TICKER,
} from "../config/equityTokens.js";
import {
  fetchNasdaqPrice,
  fetchOnchainTokenPrice,
  computeSpread,
} from "./equityPriceFetchers.js";
import { fetchXStocksAsset } from "./xstocksAssetRegistry.js";

/** @typedef {'observe' | 'spread_alert' | 'liquidity_caution' | 'unavailable'} AgentBias */

/**
 * @typedef {'live' | 'halted' | 'no_dex_liquidity' | 'pending_mint' | 'impersonator_warning'} VenueStatus
 */

/**
 * @typedef {Object} VenueQuote
 * @property {string} symbol
 * @property {string} venue
 * @property {string} mint
 * @property {VenueStatus} status
 * @property {string} statusNote
 * @property {number | null} priceUsd
 * @property {string | null} priceSource
 * @property {number | null} spreadPct
 * @property {number | null} spreadUsd
 * @property {'premium' | 'discount' | 'parity' | null} spreadLabel
 * @property {number | null} liquidityUsd
 * @property {number | null} volume24h
 * @property {number | null} priceChange24h
 * @property {string} [description]
 * @property {string} [isin]
 * @property {boolean} [tradingHalted]
 * @property {string} [accessNote]
 */

/**
 * @typedef {Object} EquityIntelligenceReport
 * @property {string} symbol
 * @property {string} nasdaqTicker
 * @property {number | null} nasdaqPriceUsd
 * @property {string | null} nasdaqSource
 * @property {VenueQuote[]} venues
 * @property {AgentBias} agentBias
 * @property {string} agentTake
 * @property {string[]} riskNotes
 * @property {string[]} opportunities
 * @property {string} computedAt
 * @property {string} disclaimer
 */

const DISCLAIMER =
  "Probabilistic intelligence only — not investment advice. Spreads can reflect liquidity, venue access, and timing. Verify mint addresses and venue eligibility before trading.";

/**
 * @param {import('../config/equityTokens.js').EquityTokenEntry} entry
 * @param {number | null} nasdaqPrice
 * @param {import('./xstocksAssetRegistry.js').XStocksAsset | null} [xstocksMeta]
 * @returns {Promise<VenueQuote>}
 */
async function buildVenueQuote(entry, nasdaqPrice, xstocksMeta = null) {
  const mint =
    entry.venue === "xstocks" && xstocksMeta?.solanaMint
      ? xstocksMeta.solanaMint
      : entry.mint;

  if (!mint || mint.length < 32) {
    return {
      symbol: entry.symbol,
      venue: entry.venue,
      mint: "",
      status: "pending_mint",
      statusNote: "Mint not yet published on-chain — access via issuer platform (Backpack, Kraken, Bitget subscription).",
      priceUsd: null,
      priceSource: null,
      spreadPct: null,
      spreadUsd: null,
      spreadLabel: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      description: entry.description,
      accessNote:
        entry.venue === "backpack"
          ? "Backpack Securities + SunriseDeFi — redeemable into Nasdaq shares via ACATS."
          : entry.venue === "ondo"
            ? "Ondo Global Markets (SPCXon) — mint/redeem via supported wallets."
            : undefined,
    };
  }

  if (entry.venue === "xstocks" && xstocksMeta?.isTradingHalted) {
    return {
      symbol: entry.symbol,
      venue: entry.venue,
      mint,
      status: "halted",
      statusNote:
        "Official xStocks (Backed) marks SPCXx trading as halted during IPO window — no public DEX spread yet.",
      priceUsd: null,
      priceSource: "xstocks_registry",
      spreadPct: null,
      spreadUsd: null,
      spreadLabel: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      description: entry.description,
      isin: xstocksMeta.isin,
      tradingHalted: true,
      accessNote: "Subscribe/trade via Kraken, Bybit, or Bitget Wallet xStocks — not open DEX pools.",
    };
  }

  const onchain = await fetchOnchainTokenPrice(mint, { referencePriceUsd: nasdaqPrice ?? undefined });

  if (onchain?.source === "dexscreener_rejected") {
    const rejected = onchain.meta?.rejectedPriceUsd;
    return {
      symbol: entry.symbol,
      venue: entry.venue,
      mint,
      status: "impersonator_warning",
      statusNote: `Scam/impersonator pools detected (~$${Number(rejected).toFixed(4)}) — not the official 1:1 backed token. Use issuer mint only.`,
      priceUsd: null,
      priceSource: onchain.source,
      spreadPct: null,
      spreadUsd: null,
      spreadLabel: null,
      liquidityUsd: onchain.liquidityUsd ?? null,
      volume24h: null,
      priceChange24h: null,
      description: entry.description,
      isin: xstocksMeta?.isin,
      tradingHalted: xstocksMeta?.isTradingHalted,
      accessNote: "Verify mint on xstocks.fi / Backed registry before any swap.",
    };
  }

  const priceUsd = onchain?.priceUsd ?? null;

  if (priceUsd == null) {
    return {
      symbol: entry.symbol,
      venue: entry.venue,
      mint,
      status: "no_dex_liquidity",
      statusNote: "Official mint has no verified DEX liquidity near Nasdaq price yet — normal on IPO day.",
      priceUsd: null,
      priceSource: onchain?.source ?? null,
      spreadPct: null,
      spreadUsd: null,
      spreadLabel: null,
      liquidityUsd: null,
      volume24h: null,
      priceChange24h: null,
      description: entry.description,
      isin: xstocksMeta?.isin,
      tradingHalted: xstocksMeta?.isTradingHalted,
      accessNote: entry.venue === "xstocks" ? "Official Solana mint from Backed xStocks registry." : undefined,
    };
  }

  let spreadPct = null;
  let spreadUsd = null;
  let spreadLabel = null;
  if (nasdaqPrice != null) {
    const spread = computeSpread(nasdaqPrice, priceUsd);
    spreadPct = spread.spreadPct;
    spreadUsd = spread.spreadUsd;
    spreadLabel = spread.label;
  }

  return {
    symbol: entry.symbol,
    venue: entry.venue,
    mint,
    status: "live",
    statusNote: "Verified on-chain liquidity near Nasdaq reference.",
    priceUsd,
    priceSource: onchain?.source ?? null,
    spreadPct,
    spreadUsd,
    spreadLabel,
    liquidityUsd: onchain?.liquidityUsd ?? null,
    volume24h: onchain?.volume24h ?? null,
    priceChange24h: onchain?.priceChange24h ?? null,
    description: entry.description,
    isin: xstocksMeta?.isin,
    tradingHalted: xstocksMeta?.isTradingHalted ?? false,
  };
}

/**
 * @param {VenueQuote[]} venues
 * @param {number | null} nasdaqPrice
 */
function deriveAgentContext(venues, nasdaqPrice) {
  const riskNotes = [];
  const opportunities = [];
  let bias = "observe";

  const live = venues.filter((v) => v.status === "live" && v.priceUsd != null);
  const halted = venues.filter((v) => v.status === "halted");
  const impersonators = venues.filter((v) => v.status === "impersonator_warning");

  if (impersonators.length) {
    riskNotes.push(
      "Unofficial SPCX/SPCXx tokens trade on DEXs at penny prices — these are NOT 1:1 backed SpaceX shares.",
    );
  }

  if (!live.length) {
    const parts = [];
    if (nasdaqPrice != null) {
      parts.push(`Nasdaq ${SPCX_NASDAQ_TICKER} is live at ~$${nasdaqPrice.toFixed(2)}.`);
    }
    if (halted.length) {
      parts.push("Official xStocks SPCXx is halted / not on public DEX yet (expected during IPO).");
    }
    parts.push("On-chain spread will populate when Backpack, xStocks, or Ondo venues list liquid pools.");
    parts.push("Agent observes; execution requires explicit wallet confirmation.");

    riskNotes.push(
      "Many unrelated meme tokens use the SPCX ticker on Solana — always verify mint against Backed or Backpack.",
    );
    riskNotes.push(
      "Tokenized equities may have regional restrictions (US/UK/CA/AU exclusions on some venues).",
    );

    return {
      bias: halted.length ? "observe" : "unavailable",
      take: parts.join(" "),
      opportunities,
      riskNotes,
    };
  }

  const spreads = live
    .filter((v) => v.spreadPct != null)
    .map((v) => ({ ...v, absSpread: Math.abs(v.spreadPct) }));

  const maxSpread = spreads.reduce(
    (best, v) => (v.absSpread > (best?.absSpread ?? 0) ? v : best),
    null,
  );

  if (maxSpread && maxSpread.absSpread >= 3) {
    bias = "spread_alert";
    opportunities.push(
      `${maxSpread.symbol} (${maxSpread.venue}) shows ${maxSpread.spreadLabel} of ${maxSpread.spreadPct?.toFixed(2)}% vs Nasdaq.`,
    );
  }

  const lowLiq = live.filter((v) => (v.liquidityUsd ?? 0) < 50_000);
  if (lowLiq.length) {
    riskNotes.push(
      `Low liquidity on ${lowLiq.map((v) => v.symbol).join(", ")} — slippage risk elevated.`,
    );
    if (bias === "observe") bias = "liquidity_caution";
  }

  if (spreads.length >= 2 && multiVenueSpreadGap(spreads)) {
    opportunities.push("Multi-venue spread detected — compare execution routes before sizing.");
  }

  const takeParts = [];
  if (nasdaqPrice != null) {
    takeParts.push(`Nasdaq ${SPCX_NASDAQ_TICKER} ~$${nasdaqPrice.toFixed(2)}.`);
  }
  if (maxSpread) {
    takeParts.push(
      `Largest verified on-chain gap: ${maxSpread.symbol} at ${maxSpread.spreadPct?.toFixed(2)}% ${maxSpread.spreadLabel}.`,
    );
  }
  takeParts.push("Agent observes; execution requires explicit wallet confirmation.");

  riskNotes.push("Verify 1:1 backing and redemption path for your jurisdiction.");

  return { bias, take: takeParts.join(" "), opportunities, riskNotes };
}

function multiVenueSpreadGap(spreads) {
  const pcts = spreads.map((s) => s.spreadPct).filter((p) => p != null);
  if (pcts.length < 2) return false;
  return Math.abs(Math.max(...pcts) - Math.min(...pcts)) >= 2;
}

/**
 * @param {{ symbol?: string; nasdaqFallback?: number }} [opts]
 * @returns {Promise<EquityIntelligenceReport>}
 */
export async function buildEquityIntelligence(opts = {}) {
  const symbol = opts.symbol || "SPCXx";
  const token = resolveEquityToken(symbol);
  const nasdaqTicker = token?.nasdaqTicker || SPCX_NASDAQ_TICKER;
  const fallback = opts.nasdaqFallback ?? SPCX_IPO_REFERENCE_PRICE_USD;

  const nasdaqQuote = await fetchNasdaqPrice(nasdaqTicker, fallback);
  const nasdaqPrice = nasdaqQuote?.priceUsd ?? null;

  const isSpcxQuery = /^SPCX|^SPACEX/i.test(symbol);
  const xstocksMeta =
    isSpcxQuery || token?.venue === "xstocks"
      ? await fetchXStocksAsset("SPCXx")
      : token?.symbol?.endsWith("x")
        ? await fetchXStocksAsset(token.symbol)
        : null;

  const venueEntries = isSpcxQuery
    ? SPCX_VENUES
    : token
      ? [token]
      : [];

  /** @type {VenueQuote[]} */
  const venues = [];
  for (const entry of venueEntries) {
    venues.push(await buildVenueQuote(entry, nasdaqPrice, xstocksMeta));
  }

  const ctx = deriveAgentContext(venues, nasdaqPrice);

  return {
    symbol: token?.symbol || symbol,
    nasdaqTicker,
    nasdaqPriceUsd: nasdaqPrice,
    nasdaqSource: nasdaqQuote?.source ?? null,
    venues,
    agentBias: ctx.bias,
    agentTake: ctx.take,
    riskNotes: ctx.riskNotes,
    opportunities: ctx.opportunities,
    computedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
  };
}

export function getEquityCatalogMeta() {
  return {
    symbols: listEquitySymbols(),
    nasdaqTicker: SPCX_NASDAQ_TICKER,
    ipoReferencePriceUsd: SPCX_IPO_REFERENCE_PRICE_USD,
  };
}
