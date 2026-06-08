const STORAGE_PREFIX = "syra-treasury-history:";
const MAX_SNAPSHOTS = 168;
const MIN_SNAPSHOT_GAP_MS = 5 * 60_000;
const TWENTY_FOUR_H_MS = 24 * 60 * 60_000;
const ONE_HOUR_MS = 60 * 60_000;

export interface TreasuryBalanceSnapshot {
  at: number;
  totalUsd: number;
  userUsd: number;
  tradingUsd: number;
  lpUsd: number;
  agentUsd: number;
}

export interface TreasurySnapshotInput {
  userUsdc: number | null;
  userSol: number | null;
  chatUsdc: number | null;
  chatSol: number | null;
  lpUsdc: number | null;
  lpSol: number | null;
  totalUsd: number | null;
  totalUsdc: number | null;
  agentUsdc: number | null;
  chatUsdcBalance?: number | null;
  solPriceUsd?: number | null;
}

export interface BalanceChangeResult {
  deltaUsd: number;
  deltaPct: number | null;
  label: string;
}

function segmentUsd(
  usdc: number | null,
  sol: number | null,
  solPriceUsd: number | null | undefined,
): number {
  const u = usdc ?? 0;
  const s = sol ?? 0;
  const px = solPriceUsd != null && solPriceUsd > 0 ? solPriceUsd : 0;
  return u + s * px;
}

export function treasuryToSnapshotValues(
  treasury: TreasurySnapshotInput,
): Omit<TreasuryBalanceSnapshot, "at"> | null {
  const px = treasury.solPriceUsd;
  const userUsd = segmentUsd(treasury.userUsdc, treasury.userSol, px);
  const tradingUsd = segmentUsd(treasury.chatUsdc, treasury.chatSol, px);
  const lpUsd = segmentUsd(treasury.lpUsdc, treasury.lpSol, px);
  const agentUsdc = treasury.agentUsdc ?? 0;
  const agentSolPart =
    px != null && px > 0
      ? ((treasury.chatSol ?? 0) + (treasury.lpSol ?? 0)) * px
      : 0;
  const agentUsd = agentUsdc + agentSolPart;

  const totalUsd =
    treasury.totalUsd != null && treasury.totalUsd > 0
      ? treasury.totalUsd
      : treasury.totalUsdc != null
        ? treasury.totalUsdc
        : userUsd + tradingUsd + lpUsd;

  if (!Number.isFinite(totalUsd)) return null;

  return { totalUsd, userUsd, tradingUsd, lpUsd, agentUsd };
}

function storageKey(walletAddress: string): string {
  return `${STORAGE_PREFIX}${walletAddress}`;
}

export function readTreasuryHistory(walletAddress: string): TreasuryBalanceSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(walletAddress));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TreasuryBalanceSnapshot[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s) =>
        s &&
        typeof s.at === "number" &&
        typeof s.totalUsd === "number" &&
        Number.isFinite(s.totalUsd),
    );
  } catch {
    return [];
  }
}

export function writeTreasuryHistory(walletAddress: string, snapshots: TreasuryBalanceSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = snapshots.slice(-MAX_SNAPSHOTS);
    window.localStorage.setItem(storageKey(walletAddress), JSON.stringify(trimmed));
  } catch {
    /* quota or private mode */
  }
}

export function appendTreasurySnapshot(
  walletAddress: string,
  values: Omit<TreasuryBalanceSnapshot, "at">,
): TreasuryBalanceSnapshot[] {
  const now = Date.now();
  const history = readTreasuryHistory(walletAddress);
  const last = history.at(-1);

  const unchanged =
    last &&
    Math.abs(last.totalUsd - values.totalUsd) < 0.01 &&
    Math.abs(last.userUsd - values.userUsd) < 0.01 &&
    Math.abs(last.tradingUsd - values.tradingUsd) < 0.01 &&
    Math.abs(last.lpUsd - values.lpUsd) < 0.01;

  if (unchanged && last && now - last.at < MIN_SNAPSHOT_GAP_MS) {
    return history;
  }

  const next = [...history, { ...values, at: now }];
  writeTreasuryHistory(walletAddress, next);
  return next;
}

function computeDelta(current: number, baseline: number): BalanceChangeResult {
  const deltaUsd = current - baseline;
  const deltaPct = baseline !== 0 ? (deltaUsd / baseline) * 100 : null;
  return { deltaUsd, deltaPct, label: "" };
}

function findBaseline(
  history: TreasuryBalanceSnapshot[],
): { snapshot: TreasuryBalanceSnapshot; label: string } | null {
  if (history.length < 2) return null;
  const now = Date.now();
  const target24h = now - TWENTY_FOUR_H_MS;

  let best24h: TreasuryBalanceSnapshot | null = null;
  let bestDiff = Infinity;
  for (const s of history.slice(0, -1)) {
    if (now - s.at < ONE_HOUR_MS) continue;
    const diff = Math.abs(s.at - target24h);
    if (diff < bestDiff) {
      bestDiff = diff;
      best24h = s;
    }
  }
  if (best24h && bestDiff <= 3 * ONE_HOUR_MS) {
    return { snapshot: best24h, label: "24h" };
  }

  const oldest = history[0];
  if (oldest && now - oldest.at >= ONE_HOUR_MS) {
    return { snapshot: oldest, label: "All time" };
  }

  const prev = history[history.length - 2];
  if (prev) {
    return { snapshot: prev, label: "Since last visit" };
  }

  return null;
}

export function computeTreasuryBalanceChanges(
  history: TreasuryBalanceSnapshot[],
  current: Omit<TreasuryBalanceSnapshot, "at">,
): {
  total: BalanceChangeResult | null;
  user: BalanceChangeResult | null;
  trading: BalanceChangeResult | null;
  lp: BalanceChangeResult | null;
  agent: BalanceChangeResult | null;
  chartPoints: Array<{ label: string; value: number; at: number }>;
} {
  const baseline = findBaseline(history);
  const label = baseline?.label ?? "";

  const mk = (cur: number, base: number | undefined): BalanceChangeResult | null => {
    if (base == null || !Number.isFinite(base)) return null;
    const result = computeDelta(cur, base);
    return { ...result, label };
  };

  const chartPoints = history.map((s) => ({
    at: s.at,
    value: s.totalUsd,
    label: new Date(s.at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit" }),
  }));

  if (!baseline) {
    return {
      total: null,
      user: null,
      trading: null,
      lp: null,
      agent: null,
      chartPoints,
    };
  }

  const b = baseline.snapshot;
  return {
    total: mk(current.totalUsd, b.totalUsd),
    user: mk(current.userUsd, b.userUsd),
    trading: mk(current.tradingUsd, b.tradingUsd),
    lp: mk(current.lpUsd, b.lpUsd),
    agent: mk(current.agentUsd, b.agentUsd),
    chartPoints,
  };
}

export function formatBalanceChangeUsd(delta: number): string {
  if (!Number.isFinite(delta)) return "—";
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const abs = Math.abs(delta);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}$${Math.round(abs / 1000)}k`;
  if (abs >= 100) return `${sign}$${Math.round(abs)}`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatBalanceChangePct(deltaPct: number | null): string | null {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return null;
  const sign = deltaPct > 0 ? "+" : "";
  return `${sign}${deltaPct.toFixed(1)}%`;
}
