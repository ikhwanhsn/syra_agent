export type FundStats = {
  asOfIso: string;
  aumUsd: number;
  deployedUsd: number;
  idleUsd: number;
  realizedPnl30dUsd: number;
  unrealizedPnlUsd: number;
  alphaPicksToday: number;
  agentsOnline: number;
  winRate30d: number;
  inceptionIso: string;
  telegramUrl: string;
};

export const FUND_STATS: FundStats = {
  asOfIso: "2026-04-30T00:00:00.000Z",
  aumUsd: 100_000_000,
  deployedUsd: 78_400_000,
  idleUsd: 21_600_000,
  realizedPnl30dUsd: 6_850_000,
  unrealizedPnlUsd: 12_400_000,
  alphaPicksToday: 14,
  agentsOnline: 9,
  winRate30d: 0.684,
  inceptionIso: "2025-10-01T00:00:00.000Z",
  telegramUrl: "https://t.me/uponly_fund",
};
