/**
 * Up Only — **manual** RISE / on-chain fields for the /uponly page (legacy /rise redirects here).
 * Update this file when you have the real market address, mint, stats, and links.
 * No API call: values are read at build time.
 */
export type RiseUpOnlyManual = {
  name: string;
  symbol: string;
  network: string;
  launchVenue: "RISE";
  /** Optional — token or IPFS image URL for the logo */
  imageUrl: string | null;
  /** SPL token mint (RISE) */
  mint: string | null;
  /**
   * Syra-published experiment mint for Up Only, if it differs from `mint` or is announced later.
   * When null, the “Up Only (Syra) mint” row shows TBA.
   */
  syraExperimentMint: string | null;
  creator: string | null;
  createdAtLabel: string | null;
  tokenMetadataUri: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  holders: number | null;
  /** e.g. 25 for 25% */
  creatorFeePct: number | null;
  startingPriceUsd: number | null;
  /**
   * RISE rise.rich trade path id — final URL: `https://rise.rich/trade/{id}`.
   * Replace with your live Up Only id when it is listed.
   */
  riseRichTradeId: string | null;
  /**
   * Set to `true` when the Buy button should open RISE. Until then the button stays disabled
   * even if `riseRichTradeId` is set.
   */
  buyOnRiseEnabled: boolean;
  /** Protocol-enforced floor (USD) — from RISE when published */
  floorPriceUsd: number | null;
  /** e.g. 50 — RISE docs reference ~50% of ATH for floor */
  floorPctOfAth: number | null;
  allTimeHighUsd: number | null;
  /** Public cap target (constant anchor for UI / roadmap) */
  targetMarketCapUsd: number;
  /** One-time borrow origination fee, percent — RISE docs: 3% */
  originationFeePct: number;
  /** Total token supply if known */
  totalSupply: number | null;
  /** Floor-backed credit available in aggregate, if published */
  borrowableUsd: number | null;
};

export const TARGET_MARKET_CAP_USD = 100_000_000 as const;

/** Fields returned by GET /uponly-rise-market/:mint (api/routes/uponlyRiseMarket.js) */
export type RiseUpOnlyLiveStats = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  holders: number | null;
  floorPriceUsd: number | null;
  creatorFeePct: number | null;
  startingPriceUsd: number | null;
  allTimeHighUsd: number | null;
  floorPctOfAth: number | null;
  totalSupply: number | null;
  borrowableUsd: number | null;
  imageUrl: string | null;
};

function mergeNumber(base: number | null, live: number | null | undefined): number | null {
  if (typeof live === "number" && Number.isFinite(live)) return live;
  return base;
}

/** Merge RISE public API snapshot (Syra API proxy) over static TBA / manual fields. */
export function mergeRiseUpOnlyWithLive(base: RiseUpOnlyManual, live: Partial<RiseUpOnlyLiveStats> | null): RiseUpOnlyManual {
  if (!live) return base;
  return {
    ...base,
    imageUrl: typeof live.imageUrl === "string" && live.imageUrl.length > 0 ? live.imageUrl : base.imageUrl,
    priceUsd: mergeNumber(base.priceUsd, live.priceUsd),
    marketCapUsd: mergeNumber(base.marketCapUsd, live.marketCapUsd),
    volume24hUsd: mergeNumber(base.volume24hUsd, live.volume24hUsd),
    holders: mergeNumber(base.holders, live.holders),
    floorPriceUsd: mergeNumber(base.floorPriceUsd, live.floorPriceUsd),
    creatorFeePct: mergeNumber(base.creatorFeePct, live.creatorFeePct),
    startingPriceUsd: mergeNumber(base.startingPriceUsd, live.startingPriceUsd),
    allTimeHighUsd: mergeNumber(base.allTimeHighUsd, live.allTimeHighUsd),
    floorPctOfAth: mergeNumber(base.floorPctOfAth, live.floorPctOfAth),
    totalSupply: mergeNumber(base.totalSupply, live.totalSupply),
    borrowableUsd: mergeNumber(base.borrowableUsd, live.borrowableUsd),
  };
}

export const UPONLY_MILESTONES = [
  { usd: 0, id: "genesis", label: "Genesis" },
  { usd: 5_000_000, id: "5m", label: "$5M" },
  { usd: 25_000_000, id: "25m", label: "$25M" },
  { usd: 100_000_000, id: "100m", label: "$100M" },
] as const;

export type ProgressToHundredM = {
  /** 0–100 progress toward $100M market cap */
  pctToward100M: number;
  currentStageIndex: number;
  currentStageLabel: string;
  nextMilestoneUsd: number | null;
  nextMilestoneLabel: string | null;
};

export const RISE_UP_ONLY: RiseUpOnlyManual = {
  name: "Up Only",
  symbol: "UPONLY",
  network: "Solana",
  launchVenue: "RISE",
  imageUrl: null,
  mint: "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise",
  syraExperimentMint: null,
  creator: null,
  createdAtLabel: null,
  tokenMetadataUri: null,
  twitterUrl: null,
  telegramUrl: null,
  priceUsd: null,
  marketCapUsd: null,
  volume24hUsd: null,
  holders: null,
  creatorFeePct: null,
  startingPriceUsd: null,
  /** `rise.rich/trade/{id}` — same id as mint when listed on RISE. */
  riseRichTradeId: "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise",
  buyOnRiseEnabled: true,
  floorPriceUsd: null,
  floorPctOfAth: null,
  allTimeHighUsd: null,
  targetMarketCapUsd: TARGET_MARKET_CAP_USD,
  originationFeePct: 3,
  totalSupply: null,
  borrowableUsd: null,
};

const RISE_RICH_TRADE_ORIGIN = "https://rise.rich/trade" as const;

export function getRiseRichTradeUrl(m: RiseUpOnlyManual): string | null {
  const id = m.riseRichTradeId?.trim();
  if (!id) return null;
  return `${RISE_RICH_TRADE_ORIGIN}/${id.replace(/^\//, "")}`;
}

export function riseUpOnlyHasAnyMarketStats(m: RiseUpOnlyManual): boolean {
  return [
    m.priceUsd,
    m.marketCapUsd,
    m.volume24hUsd,
    m.holders,
    m.creatorFeePct,
    m.startingPriceUsd,
    m.floorPriceUsd,
    m.allTimeHighUsd,
    m.totalSupply,
    m.borrowableUsd,
  ].some((v) => v !== null);
}

/**
 * Roadmap / progress bar: how far current MC is from the $100M public target,
 * and which published milestone the token sits in.
 */
export function computeProgressToHundredM(m: RiseUpOnlyManual): ProgressToHundredM {
  const target = m.targetMarketCapUsd;
  const mc = m.marketCapUsd;
  if (mc === null || !Number.isFinite(mc) || mc < 0) {
    const m1 = UPONLY_MILESTONES[1];
    return {
      pctToward100M: 0,
      currentStageIndex: 0,
      currentStageLabel: UPONLY_MILESTONES[0].label,
      nextMilestoneUsd: m1.usd,
      nextMilestoneLabel: m1.label,
    };
  }
  const pctToward100M = Math.min(100, (mc / target) * 100);
  let currentStageIndex = 0;
  for (let i = UPONLY_MILESTONES.length - 1; i >= 0; i -= 1) {
    if (mc >= UPONLY_MILESTONES[i].usd) {
      currentStageIndex = i;
      break;
    }
  }
  const next = UPONLY_MILESTONES[currentStageIndex + 1];
  return {
    pctToward100M,
    currentStageIndex,
    currentStageLabel: UPONLY_MILESTONES[currentStageIndex].label,
    nextMilestoneUsd: next ? next.usd : null,
    nextMilestoneLabel: next ? next.label : null,
  };
}
