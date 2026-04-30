/**
 * Up Only Fund — manual fields for the /uponly/fund transparency page.
 * Update this file when treasury address, AUM, holdings, and links are published.
 * v1: static TBA placeholders; a future API can merge live stats like riseUpOnly.ts.
 */

export type UpOnlyFundHolding = {
  symbol: string;
  name: string;
  network: "Solana" | "RISE";
  mint: string | null;
  riseRichTradeId: string | null;
  thesisOneLiner: string;
  weightPct: number | null;
  positionUsd: number | null;
  imageUrl: string | null;
};

export type UpOnlyFundStats = {
  aumUsd: number | null;
  navUsd: number | null;
  deployedPct: number | null;
  positionsCount: number | null;
  inceptionLabel: string | null;
  realizedPnlUsd: number | null;
};

export type UpOnlyFundUtilityStatus = "live" | "in-progress" | "planned";

export type UpOnlyFundUtilityItem = {
  id: string;
  title: string;
  status: UpOnlyFundUtilityStatus;
  description: string;
};

export type UpOnlyFundData = {
  name: string;
  shortName: string;
  /** One short paragraph for hero, CTAs, and cross-links (not the legal mandate). */
  publicSummary: string;
  backedBy: "Syra";
  mandate: string;
  treasuryAddress: string | null;
  stats: UpOnlyFundStats;
  holdings: UpOnlyFundHolding[];
  utilityRoadmap: UpOnlyFundUtilityItem[];
  twitterUrl: string | null;
  contactUrl: string | null;
};

export const UP_ONLY_FUND: UpOnlyFundData = {
  name: "Up Only Fund",
  shortName: "UOF",
  publicSummary:
    "Syra-seeded venture allocator with a published mandate to deploy capital and operator leverage across the RISE ecosystem. Treasury address and positions publish as they go live—no public LP subscriptions in v1.",
  backedBy: "Syra",
  mandate:
    "A Syra-seeded venture and strategic hedge desk focused on RISE-native teams—capital for liquidity and distribution, strategy support where Syra tooling compounds outcomes. Nothing here promises returns: markets are uncertain and any sleeve should be treated as high risk.",
  treasuryAddress: null,
  stats: {
    aumUsd: null,
    navUsd: null,
    deployedPct: null,
    positionsCount: null,
    inceptionLabel: null,
    realizedPnlUsd: null,
  },
  holdings: [],
  utilityRoadmap: [
    {
      id: "uof-transparency",
      title: "Public mandate & positions",
      status: "in-progress",
      description:
        "This page: mandate, future treasury address, and holdings as they are published. No public deposits in v1.",
    },
    {
      id: "uof-syra-tools",
      title: "Syra tooling for fund analytics",
      status: "planned",
      description: "Deeper on-chain and market context for RISE ecosystem positions via Syra agents and dashboard surfaces (roadmap TBA).",
    },
    {
      id: "uof-broader-utility",
      title: "Additional fund utility",
      status: "planned",
      description: "Future mechanisms announced when ready—aligned with the same risk and transparency posture as this page.",
    },
  ],
  twitterUrl: "https://x.com/uponly_fund",
  contactUrl: null,
};

const RISE_RICH_TRADE_ORIGIN = "https://rise.rich/trade" as const;

/** Trade URL for a RISE position when `riseRichTradeId` is known. */
export function getFundHoldingRiseUrl(riseRichTradeId: string | null): string | null {
  const id = riseRichTradeId?.trim();
  if (!id) return null;
  return `${RISE_RICH_TRADE_ORIGIN}/${id.replace(/^\//, "")}`;
}
