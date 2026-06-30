import type {
  BtcAgentStats,
  BtcExperimentLabState,
  BtcGlobalOverview,
  BtcOhlcvPoint,
  BtcQuantRealState,
  BtcRealPositionRow,
  BtcRunRow,
  BtcSignalReportPayload,
} from "@/lib/btcQuantApi";
import { buildEquityHistoryFromRuns } from "@/lib/experimentEquityHistory";
import { buildHeatmapFromOhlcv } from "./heatmap";
import type {
  Btc2AgentState,
  EngineeredFeature,
  ExecutionEvent,
  ExecutionDecision,
  LogLine,
  MarketMetric,
  MarketRegime,
  OnchainPrediction,
  QuantFactor,
  SignalDirection,
  SparklinePoint,
  TradeRecord,
} from "./types";

export interface Btc2RealDataBundle {
  overview: BtcGlobalOverview;
  labState: BtcExperimentLabState;
  stats: { agents: BtcAgentStats[]; experimentId: string | null };
  runs: BtcRunRow[];
  signalReport: BtcSignalReportPayload;
  ohlcv: BtcOhlcvPoint[];
  realState: BtcQuantRealState | null;
  realPositions: BtcRealPositionRow[];
  leaderBar: string;
  fetchedAt: number;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parsePctString(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace("%", "").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseRiskReward(v: unknown): number {
  const s = String(v ?? "");
  const m = s.match(/1:([\d.]+)/);
  if (m?.[1]) return num(m[1]);
  return num(v, 0);
}

function signalFromClear(clear?: string | null): SignalDirection {
  const s = String(clear ?? "HOLD").toUpperCase();
  if (s === "BUY" || s === "LONG" || s === "BULLISH") return "bullish";
  if (s === "SELL" || s === "SHORT" || s === "BEARISH") return "bearish";
  return "neutral";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function regimeFromTrend(trend?: string | null): MarketRegime {
  const t = String(trend ?? "").toUpperCase();
  if (t.includes("UP") || t.includes("BULL")) return "trending";
  if (t.includes("DOWN") || t.includes("BEAR")) return "distribution";
  if (t.includes("SIDE") || t.includes("RANGE")) return "ranging";
  if (t.includes("VOLAT")) return "volatile";
  return "accumulation";
}

function toSparkline(points: BtcOhlcvPoint[]): SparklinePoint[] {
  return points.map((p) => ({ t: p.t, v: p.c }));
}

function rollingSparkline(values: number[], timestamps: number[]): SparklinePoint[] {
  return values.map((v, i) => ({ t: timestamps[i] ?? Date.now(), v }));
}

function pickLeader(
  stats: BtcAgentStats[],
  overview: BtcGlobalOverview,
  realState: BtcQuantRealState | null,
): BtcAgentStats | null {
  const leaderId =
    realState?.leaderStrategyId ??
    overview.simulation.leaderStrategyId ??
    stats[0]?.strategyId;
  if (leaderId == null) return stats[0] ?? null;
  return stats.find((a) => a.strategyId === leaderId) ?? stats[0] ?? null;
}

function agentForRun(stats: BtcAgentStats[], strategyId: number): BtcAgentStats | undefined {
  return stats.find((a) => a.strategyId === strategyId);
}

function computeSharpe(pnls: number[]): number {
  if (pnls.length < 2) return 0;
  const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
  const variance = pnls.reduce((s, p) => s + (p - mean) ** 2, 0) / (pnls.length - 1);
  const std = Math.sqrt(variance);
  return std > 0 ? (mean / std) * Math.sqrt(pnls.length) : 0;
}

function computeSortino(pnls: number[]): number {
  if (pnls.length < 2) return 0;
  const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
  const downside = pnls.filter((p) => p < 0);
  if (downside.length === 0) return mean > 0 ? 3 : 0;
  const downVar = downside.reduce((s, p) => s + p ** 2, 0) / downside.length;
  const downStd = Math.sqrt(downVar);
  return downStd > 0 ? (mean / downStd) * Math.sqrt(pnls.length) : 0;
}

function maxDrawdownFromCurve(curve: SparklinePoint[]): number {
  if (curve.length < 2) return 0;
  let peak = curve[0]!.v;
  let maxDd = 0;
  for (const p of curve) {
    if (p.v > peak) peak = p.v;
    const dd = peak > 0 ? ((p.v - peak) / peak) * 100 : 0;
    if (dd < maxDd) maxDd = dd;
  }
  return maxDd;
}

function buildFeatures(report: Record<string, unknown>): EngineeredFeature[] {
  const features: EngineeredFeature[] = [];
  let idx = 0;

  const push = (name: string, category: string, value: number, importance: number) => {
    idx++;
    features.push({
      id: `feat-${idx}`,
      name,
      category,
      value,
      normalized: clamp(value / 100, 0, 1),
      importance: clamp(importance, 0.01, 1),
      status: "active",
    });
  };

  const ti = report.technicalIndicators as Record<string, unknown> | undefined;
  if (ti) {
    push("RSI", "momentum", num(ti.rsi), 0.85);
    const macd = ti.macd as Record<string, unknown> | undefined;
    if (macd) {
      push("MACD Histogram", "momentum", num(macd.histogram), 0.78);
      push("MACD Value", "momentum", num(macd.value), 0.62);
    }
    const ma = ti.movingAverages as Record<string, unknown> | undefined;
    if (ma) {
      push("EMA 12", "trend", num(ma.ema12), 0.7);
      push("EMA 26", "trend", num(ma.ema26), 0.68);
      push("SMA 20", "trend", num(ma.sma20), 0.65);
      push("SMA 50", "trend", num(ma.sma50), 0.64);
    }
    const bb = ti.bollingerBands as Record<string, unknown> | undefined;
    if (bb) {
      push("BB Upper", "volatility", num(bb.upper), 0.55);
      push("BB Middle", "volatility", num(bb.middle), 0.5);
      push("BB Lower", "volatility", num(bb.lower), 0.55);
    }
    push("VWAP", "microstructure", num(ti.vwap), 0.72);
    push("Support", "structure", num(ti.support), 0.6);
    push("Resistance", "structure", num(ti.resistance), 0.6);
    const adx = ti.adx as Record<string, unknown> | undefined;
    if (adx) {
      push("ADX", "trend", num(adx.value), 0.74);
      push("PDI", "trend", num(adx.pdi), 0.58);
      push("MDI", "trend", num(adx.mdi), 0.58);
    }
    const mfi = ti.mfi as Record<string, unknown> | undefined;
    if (mfi) push("MFI", "volume", num(mfi.value), 0.66);
  }

  const trend = report.trendAnalysis as Record<string, unknown> | undefined;
  if (trend) push("Trend Score", "trend", num(trend.score), 0.8);

  const mom = report.momentumAnalysis as Record<string, unknown> | undefined;
  if (mom) push("Momentum Score", "momentum", num(mom.score), 0.82);

  const vol = report.volatilityAnalysis as Record<string, unknown> | undefined;
  if (vol) {
    push("ATR %", "volatility", parsePctString(vol.atrPercent), 0.76);
    push("BB Width %", "volatility", parsePctString(vol.bollingerWidth), 0.64);
    push("BB Position %", "volatility", parsePctString(vol.pricePositionInBB), 0.7);
  }

  const volume = report.volumeAnalysis as Record<string, unknown> | undefined;
  if (volume) {
    const ratio = parseFloat(String(volume.volumeRatio ?? "1").replace("x", ""));
    push("Volume Ratio", "volume", Number.isFinite(ratio) ? ratio : 0, 0.68);
  }

  const qs = report.quickSummary as Record<string, unknown> | undefined;
  if (qs) {
    push("Risk/Reward", "risk", parseRiskReward(qs.riskReward), 0.75);
    push("Signal Confidence", "oracle", num(qs.confidence), 0.9);
  }

  return features.sort((a, b) => b.importance - a.importance);
}

/** Only factors backed by onchain signal report fields. */
function buildFactors(report: Record<string, unknown>): QuantFactor[] {
  const trend = report.trendAnalysis as Record<string, unknown> | undefined;
  const mom = report.momentumAnalysis as Record<string, unknown> | undefined;
  const vol = report.volatilityAnalysis as Record<string, unknown> | undefined;
  const volume = report.volumeAnalysis as Record<string, unknown> | undefined;
  const ti = report.technicalIndicators as Record<string, unknown> | undefined;
  const qs = report.quickSummary as Record<string, unknown> | undefined;
  const mfiVal = num((ti?.mfi as Record<string, unknown> | undefined)?.value);
  const volRatio = parseFloat(String(volume?.volumeRatio ?? "0").replace("x", ""));

  const defs: { id: string; label: string; score: number; confidence: number; weight: number }[] = [
    { id: "momentum", label: "Momentum", score: num(mom?.score), confidence: num(qs?.confidence), weight: 0.18 },
    { id: "trend", label: "Trend", score: num(trend?.score), confidence: num(qs?.confidence), weight: 0.2 },
    {
      id: "volume",
      label: "Volume",
      score: clamp(volRatio * 50, 0, 100),
      confidence: num(qs?.confidence) * 0.9,
      weight: 0.14,
    },
    {
      id: "volatility",
      label: "Volatility",
      score: clamp(100 - parsePctString(vol?.atrPercent) * 8, 0, 100),
      confidence: num(qs?.confidence) * 0.85,
      weight: 0.12,
    },
    { id: "liquidity", label: "Liquidity", score: clamp(mfiVal, 0, 100), confidence: num(qs?.confidence) * 0.8, weight: 0.14 },
    { id: "orderflow", label: "Order Flow", score: num(mom?.score), confidence: num(qs?.confidence) * 0.75, weight: 0.1 },
    { id: "structure", label: "Market Structure", score: num(trend?.score), confidence: num(qs?.confidence), weight: 0.12 },
  ];

  return defs.map((d) => ({
    ...d,
    signal: signalFromClear(d.score >= 62 ? "BUY" : d.score <= 38 ? "SELL" : "HOLD"),
  }));
}

function buildMarketMetrics(
  overview: BtcGlobalOverview,
  report: Record<string, unknown>,
  ohlcv: BtcOhlcvPoint[],
): MarketMetric[] {
  const mo = report.marketOverview as Record<string, unknown> | undefined;
  const vol = report.volatilityAnalysis as Record<string, unknown> | undefined;
  const volume = report.volumeAnalysis as Record<string, unknown> | undefined;
  const trend = report.trendAnalysis as Record<string, unknown> | undefined;
  const ti = report.technicalIndicators as Record<string, unknown> | undefined;
  const qs = report.quickSummary as Record<string, unknown> | undefined;

  const price = overview.btcSpotPriceUsd ?? num(mo?.currentPrice);
  const priceSpark = toSparkline(ohlcv);
  const chg24 = parsePctString(mo?.priceChange24h);
  const volSpark = rollingSparkline(
    ohlcv.map((p) => p.v),
    ohlcv.map((p) => p.t),
  );

  const makeMetric = (
    id: string,
    label: string,
    value: number,
    displayValue: string,
    sparkline: SparklinePoint[],
  ): MarketMetric => {
    const last = sparkline[sparkline.length - 1]?.v ?? value;
    const prev = sparkline[sparkline.length - 2]?.v ?? last;
    const changePct = prev !== 0 ? ((last - prev) / Math.abs(prev)) * 100 : 0;
    return { id, label, value, displayValue, changePct, sparkline };
  };

  return [
    makeMetric("btc", "BTC Price", price, `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, priceSpark),
    makeMetric("chg24", "24h Change", chg24, `${chg24 >= 0 ? "+" : ""}${chg24.toFixed(2)}%`, priceSpark),
    makeMetric("vol24", "24h Volume", num(mo?.volume24h), num(mo?.volume24h).toFixed(4), volSpark),
    makeMetric("mcap", "Quote Volume", num(mo?.quoteVolume24h), `$${(num(mo?.quoteVolume24h) / 1e6).toFixed(2)}M`, volSpark),
    makeMetric("funding", "Cohort PnL", overview.simulation.sumPnlUsd, `$${overview.simulation.sumPnlUsd.toFixed(0)}`, priceSpark),
    makeMetric("oi", "Open Positions", overview.simulation.openPositions, String(overview.simulation.openPositions), priceSpark),
    makeMetric("vol", "ATR Volatility", parsePctString(vol?.atrPercent), `${parsePctString(vol?.atrPercent).toFixed(1)}%`, priceSpark),
    makeMetric("fg", "RSI", num(ti?.rsi), String(Math.round(num(ti?.rsi))), priceSpark),
    makeMetric("oracle", "Signal Confidence", num(qs?.confidence), `${num(qs?.confidence).toFixed(0)}%`, priceSpark),
    makeMetric("regime", "Market Regime", num(trend?.score), String(trend?.trend ?? "—"), priceSpark),
    makeMetric("liq", "Volume Ratio", volRatioNum(volume), `${String(volume?.volumeRatio ?? "—")}`, volSpark),
    makeMetric("spread", "Settled Runs", overview.simulation.settledRuns, String(overview.simulation.settledRuns), priceSpark),
  ];
}

function volRatioNum(volume: Record<string, unknown> | undefined): number {
  return parseFloat(String(volume?.volumeRatio ?? "0").replace("x", "")) || 0;
}

function mapRunsToTrades(runs: BtcRunRow[], stats: BtcAgentStats[]): TradeRecord[] {
  return runs.map((r) => {
    const entry = num(r.entry ?? r.priceAtSignal);
    const exit = num(r.simExitPrice ?? r.priceAtSignal);
    const stop = num(r.stopLoss);
    const opened = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();
    const closed = r.resolvedAt ? new Date(r.resolvedAt).getTime() : opened;
    const agent = agentForRun(stats, r.strategyId);
    const riskScore =
      entry > 0 && stop > 0 ? clamp(Math.abs(entry - stop) / entry, 0, 1) : 0;

    return {
      id: r._id,
      timestamp: closed,
      signal: signalFromClear(r.clearSignal),
      confidence: num(agent?.winRatePct, 0),
      entry,
      exit,
      pnl: num(r.simPnlUsd),
      durationMin: Math.max(1, (closed - opened) / 60_000),
      riskScore,
      hash: r._id,
    };
  });
}

function decisionFromSignal(signal: SignalDirection): ExecutionDecision {
  if (signal === "bullish") return "buy";
  if (signal === "bearish") return "sell";
  return "close";
}

function mapRealPositionsToExecutions(
  positions: BtcRealPositionRow[],
  stats: BtcAgentStats[],
  slippageBps: number,
): ExecutionEvent[] {
  return positions.map((p) => ({
    id: p._id,
    timestamp: p.openedAt ? new Date(p.openedAt).getTime() : Date.now(),
    decision: "buy",
    venue: "jupiter",
    executionPrice: num(p.entryPriceUsd),
    slippage: slippageBps / 100,
    fees: 0,
    estimatedProfit: num(p.realNetPnlUsd),
    latencyMs: 0,
    txHash: p.openTxSig ?? p._id,
    confidence: num(agentForRun(stats, p.strategyId)?.winRatePct),
    status:
      p.status === "open" || p.status === "opening"
        ? "pending"
        : p.status === "error"
          ? "failed"
          : "confirmed",
  }));
}

function mapRunsToExecutions(runs: BtcRunRow[], slippageBps: number): ExecutionEvent[] {
  return runs.map((r) => ({
    id: r._id,
    timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
    decision: decisionFromSignal(signalFromClear(r.clearSignal)),
    venue: "jupiter",
    executionPrice: num(r.entry ?? r.priceAtSignal),
    slippage: slippageBps / 100,
    fees: num(r.notionalUsd) * 0.001,
    estimatedProfit: num(r.simPnlUsd),
    latencyMs: 0,
    txHash: r._id,
    confidence: 0,
    status: r.status === "open" ? "pending" : r.status === "error" ? "failed" : "confirmed",
  }));
}

function mapRealPositionsToOnchain(
  positions: BtcRealPositionRow[],
  stats: BtcAgentStats[],
): OnchainPrediction[] {
  return positions.map((p) => ({
    id: p._id,
    timestamp: p.openedAt ? new Date(p.openedAt).getTime() : Date.now(),
    predictionHash: p._id,
    modelVersion: `strategy-${p.strategyId}`,
    confidence: num(agentForRun(stats, p.strategyId)?.winRatePct),
    decision: "bullish",
    txHash: p.openTxSig ?? p.closeTxSig ?? p._id,
    status:
      p.openTxSig && (p.status === "closed_win" || p.status === "closed_loss")
        ? "verified"
        : p.status === "open" || p.status === "opening"
          ? "pending"
          : p.status === "error"
            ? "failed"
            : "verified",
  }));
}

function mapRunsToOnchain(runs: BtcRunRow[], stats: BtcAgentStats[]): OnchainPrediction[] {
  return runs.map((r) => ({
    id: r._id,
    timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
    predictionHash: r._id,
    modelVersion: `strategy-${r.strategyId}`,
    confidence: num(agentForRun(stats, r.strategyId)?.winRatePct),
    decision: signalFromClear(r.clearSignal),
    txHash: r._id,
    status: r.status === "open" ? "pending" : r.status === "error" ? "failed" : "verified",
  }));
}

function buildPnlDistribution(runs: BtcRunRow[]): { bucket: string; probability: number }[] {
  const pnls = runs
    .filter((r) => r.status !== "open" && r.simPnlUsd != null)
    .map((r) => num(r.simPnlUsd));
  if (!pnls.length) return [];

  const buckets = [
    { bucket: "< -$100", test: (p: number) => p < -100 },
    { bucket: "-$100–-$25", test: (p: number) => p >= -100 && p < -25 },
    { bucket: "-$25–$0", test: (p: number) => p >= -25 && p < 0 },
    { bucket: "$0–$25", test: (p: number) => p >= 0 && p < 25 },
    { bucket: "$25–$100", test: (p: number) => p >= 25 && p < 100 },
    { bucket: "> $100", test: (p: number) => p >= 100 },
  ];

  return buckets.map((b) => ({
    bucket: b.bucket,
    probability: (pnls.filter(b.test).length / pnls.length) * 100,
  }));
}

function buildLogs(bundle: Btc2RealDataBundle, leader: BtcAgentStats | null): LogLine[] {
  const now = bundle.fetchedAt;
  const report = bundle.signalReport.report;
  const qs = report.quickSummary as Record<string, unknown> | undefined;
  const lines: Omit<LogLine, "id">[] = [
    {
      timestamp: now,
      level: "system",
      message: `Synced Binance OHLCV (${bundle.signalReport.meta.bar}) · ${bundle.ohlcv.length} bars`,
    },
    {
      timestamp: now,
      level: "info",
      message: `Jupiter cbBTC spot $${num(bundle.overview.btcSpotPriceUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      timestamp: now,
      level: "info",
      message: `Signal ${String(qs?.signal ?? "HOLD")} · confidence ${num(qs?.confidence).toFixed(0)}%`,
    },
    {
      timestamp: now,
      level: "success",
      message: `Leader #${leader?.strategyId ?? "—"} ${leader?.strategyName ?? ""} · equity $${num(leader?.equityUsd).toFixed(0)}`,
    },
    {
      timestamp: now,
      level: "system",
      message: `Cohort ${bundle.overview.simulation.settledRuns} settled · ${bundle.overview.simulation.openPositions} open · experiment ${bundle.stats.experimentId ?? "—"}`,
    },
  ];
  if (bundle.realState?.lastError) {
    lines.push({ timestamp: now, level: "warn", message: bundle.realState.lastError });
  }
  return lines.map((l, i) => ({ ...l, id: `log-${now}-${i}` }));
}

function ohlcvWindowReturn(ohlcv: BtcOhlcvPoint[]): number {
  if (ohlcv.length < 2) return 0;
  const first = ohlcv[0]!.c;
  const last = ohlcv[ohlcv.length - 1]!.c;
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function runsTodayCount(runs: BtcRunRow[]): number {
  const today = new Date().toDateString();
  return runs.filter((r) => r.createdAt && new Date(r.createdAt).toDateString() === today).length;
}

export function mapRealToBtc2State(bundle: Btc2RealDataBundle): Btc2AgentState {
  const { overview, labState, stats, runs, signalReport, ohlcv, realState, realPositions, fetchedAt } =
    bundle;
  const report = signalReport.report;
  const leader = pickLeader(stats.agents, overview, realState);
  const leaderLab = labState.agents.find((a) => a.strategyId === leader?.strategyId);
  const btcPrice = overview.btcSpotPriceUsd ?? ohlcv[ohlcv.length - 1]?.c ?? 0;
  const priceHistory = toSparkline(ohlcv);
  const slippageBps = realState?.slippageBps ?? 50;

  const qs = report.quickSummary as Record<string, unknown> | undefined;
  const rec = report.tradingRecommendation as Record<string, unknown> | undefined;
  const riskMgmt = report.riskManagement as Record<string, unknown> | undefined;
  const clearSignal = signalFromClear(String(qs?.signal ?? rec?.clearSignal));
  const confidence = num(qs?.confidence ?? rec?.confidence);

  const startUsd = leaderLab?.startingBankUsd ?? labState.simConfig.startingBankUsd;
  const equityUsd = leader?.equityUsd ?? startUsd;
  const equityHistory = buildEquityHistoryFromRuns({
    startBalance: startUsd,
    currentBalance: equityUsd,
    runs: runs.map((r) => ({
      status: r.status,
      resolvedAt: r.resolvedAt,
      pnl: r.simPnlUsd,
    })),
    nowMs: fetchedAt,
  });

  const equityCurve: SparklinePoint[] = equityHistory.map((p) => ({ t: p.at, v: p.value }));
  const drawdownCurve: SparklinePoint[] = equityCurve.map((p, i) => {
    const peak = Math.max(...equityCurve.slice(0, i + 1).map((x) => x.v));
    return { t: p.t, v: peak > 0 ? ((p.v - peak) / peak) * 100 : 0 };
  });

  const settledPnls = runs
    .filter((r) => r.status !== "open" && r.simPnlUsd != null)
    .map((r) => num(r.simPnlUsd));

  const bullishPct = clearSignal === "bullish" ? confidence : clearSignal === "bearish" ? 100 - confidence : 33;
  const bearishPct = clearSignal === "bearish" ? confidence : clearSignal === "bullish" ? 100 - confidence : 33;
  const neutralPct = clamp(100 - bullishPct - bearishPct, 0, 100);

  const pnl = realState?.enabled
    ? realState.realizedNetPnlUsd
    : num(leader?.sumPnlUsd ?? overview.simulation.leaderSumPnlUsd);

  const wallet = realState?.agentAddress
    ? `${realState.agentAddress.slice(0, 4)}…${realState.agentAddress.slice(-4)}`
    : "—";

  const deployed = num(leaderLab?.deployedUsd);
  const cash = num(leader?.cashUsd);
  const totalAlloc = deployed + cash;
  const btcAlloc = totalAlloc > 0 ? deployed / totalAlloc : 0;
  const usdcAlloc = totalAlloc > 0 ? cash / totalAlloc : 0;

  const grossWins = leader
    ? runs
        .filter((r) => r.strategyId === leader.strategyId && r.status === "win")
        .reduce((s, r) => s + Math.abs(num(r.simPnlUsd)), 0)
    : 0;
  const grossLosses = leader
    ? runs
        .filter((r) => r.strategyId === leader.strategyId && r.status === "loss")
        .reduce((s, r) => s + Math.abs(num(r.simPnlUsd)), 0)
    : 0;

  const executions =
    realPositions.length > 0
      ? mapRealPositionsToExecutions(realPositions, stats.agents, slippageBps)
      : mapRunsToExecutions(runs.slice(0, 12), slippageBps);

  const onchainPredictions =
    realPositions.length > 0
      ? mapRealPositionsToOnchain(realPositions, stats.agents)
      : mapRunsToOnchain(runs.slice(0, 15), stats.agents);

  const stopLoss = num(qs?.stopLoss);
  const maxDd = maxDrawdownFromCurve(equityCurve);

  return {
    tick: Math.floor(fetchedAt / 1000),
    hero: {
      btcPrice,
      currentPnl: pnl,
      agentStatus: realState?.enabled ? "running" : realState?.cronEnabled ? "running" : "syncing",
      marketRegime: regimeFromTrend(
        (report.trendAnalysis as Record<string, unknown> | undefined)?.trend as string,
      ),
      confidence,
      position: clearSignal,
      portfolioValue: equityUsd,
    },
    marketMetrics: buildMarketMetrics(overview, report, ohlcv),
    factors: buildFactors(report),
    features: buildFeatures(report),
    prediction: {
      bullish: bullishPct,
      neutral: neutralPct,
      bearish: bearishPct,
      confidence,
      horizon: signalReport.meta.bar ?? "1h",
      expectedReturn: num((report.momentumAnalysis as Record<string, unknown> | undefined)?.score),
      expectedDrawdown: -parsePctString(
        (report.volatilityAnalysis as Record<string, unknown> | undefined)?.atrPercent,
      ),
      riskReward: parseRiskReward(qs?.riskReward ?? riskMgmt?.riskRewardRatio),
      models: stats.agents.slice(0, 5).map((a, i) => {
        const ret = num(a.returnPct);
        const prediction: SignalDirection =
          ret > 0.5 ? "bullish" : ret < -0.5 ? "bearish" : "neutral";
        const totalPnl = stats.agents.reduce((s, x) => s + Math.abs(num(x.sumPnlUsd)), 0);
        const weight =
          totalPnl > 0 ? Math.abs(num(a.sumPnlUsd)) / totalPnl : 1 / stats.agents.length;
        return {
          id: `agent-${a.strategyId}`,
          name: a.strategyName,
          prediction,
          confidence: num(a.winRatePct),
          weight,
          expectedReturn: ret,
        };
      }),
      distribution: buildPnlDistribution(runs),
    },
    risk: {
      kellyFraction: parsePctString(riskMgmt?.recommendedRiskPerTrade) / 100,
      positionSize: equityUsd > 0 ? deployed / equityUsd : 0,
      sharpe: computeSharpe(settledPnls),
      sortino: computeSortino(settledPnls),
      cvar: settledPnls.length
        ? settledPnls.sort((a, b) => a - b).slice(0, Math.max(1, Math.floor(settledPnls.length * 0.05))).reduce((a, b) => a + b, 0) /
          Math.max(1, Math.floor(settledPnls.length * 0.05))
        : 0,
      var95: settledPnls.length
        ? settledPnls.sort((a, b) => a - b)[Math.floor(settledPnls.length * 0.05)] ?? 0
        : 0,
      expectedValue: num(leader?.avgPnlUsd),
      drawdown: maxDd,
      portfolioExposure: equityUsd > 0 ? deployed / equityUsd : 0,
      volatilityTarget: parsePctString(
        (report.volatilityAnalysis as Record<string, unknown> | undefined)?.atrPercent,
      ),
      cashReservePct: equityUsd > 0 ? cash / equityUsd : 0,
      stopLossPrice: stopLoss > 0 ? stopLoss : 0,
    },
    executions,
    portfolio: {
      assets: [
        { symbol: "BTC", allocation: btcAlloc, valueUsd: deployed },
        { symbol: "USDC", allocation: usdcAlloc, valueUsd: cash },
      ],
      availableBalance: cash,
      unrealizedPnl: runs
        .filter((r) => r.status === "open")
        .reduce((s, r) => s + num(r.simPnlUsd), 0),
      realizedPnl: num(leader?.sumPnlUsd),
      dailyReturn:
        ohlcv.length >= 2
          ? ((ohlcv[ohlcv.length - 1]!.c - ohlcv[ohlcv.length - 2]!.c) /
              ohlcv[ohlcv.length - 2]!.c) *
            100
          : 0,
      weeklyReturn: ohlcvWindowReturn(ohlcv),
      monthlyReturn: num(leader?.returnPct),
      maxDrawdown: maxDd,
      totalValue: equityUsd,
    },
    onchainPredictions,
    performance: {
      winRate: num(leader?.winRatePct),
      sharpe: computeSharpe(settledPnls),
      sortino: computeSortino(settledPnls),
      profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? grossWins : 0,
      avgTrade: num(leader?.avgPnlUsd),
      maxDrawdown: maxDd,
      expectancy: num(leader?.avgPnlUsd) / Math.max(startUsd, 1),
      monthlyReturn: num(leader?.returnPct),
      equityCurve,
      drawdownCurve,
      returnDistribution: [
        { bucket: "< -2%", count: stats.agents.filter((a) => num(a.returnPct) < -2).length },
        { bucket: "-2 to -1%", count: stats.agents.filter((a) => num(a.returnPct) >= -2 && num(a.returnPct) < -1).length },
        { bucket: "-1 to 0%", count: stats.agents.filter((a) => num(a.returnPct) >= -1 && num(a.returnPct) < 0).length },
        { bucket: "0 to 1%", count: stats.agents.filter((a) => num(a.returnPct) >= 0 && num(a.returnPct) < 1).length },
        { bucket: "1 to 2%", count: stats.agents.filter((a) => num(a.returnPct) >= 1 && num(a.returnPct) < 2).length },
        { bucket: "> 2%", count: stats.agents.filter((a) => num(a.returnPct) >= 2).length },
      ],
      rollingReturns: equityCurve.slice(-30),
      heatmap: buildHeatmapFromOhlcv(ohlcv),
    },
    recentTrades: mapRunsToTrades(runs, stats.agents),
    logs: buildLogs(bundle, leader),
    runtime: {
      cpu: 0,
      memory: 0,
      inferenceMs: 0,
      oracleDelayMs: 0,
      transactionsToday: runsTodayCount(runs),
      predictionsToday: runsTodayCount(runs),
      currentEpoch: 0,
      currentBlock: 0,
      wallet,
      treasuryBalance: equityUsd,
    },
    priceHistory,
  };
}
