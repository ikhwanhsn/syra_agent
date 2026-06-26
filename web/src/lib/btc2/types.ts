export type SignalDirection = "bullish" | "neutral" | "bearish";
export type MarketRegime = "trending" | "ranging" | "volatile" | "accumulation" | "distribution";
export type FeatureStatus = "active" | "stale" | "warming";
export type ExecutionDecision = "buy" | "sell" | "scale_in" | "scale_out" | "close";
export type ExecutionVenue = "jupiter";
export type ExecutionStatus = "pending" | "confirmed" | "failed";
export type OnchainStatus = "verified" | "pending" | "failed";
export type LogLevel = "info" | "success" | "warn" | "system";

export interface SparklinePoint {
  t: number;
  v: number;
}

export interface MarketMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  changePct: number;
  sparkline: SparklinePoint[];
}

export interface QuantFactor {
  id: string;
  label: string;
  score: number;
  confidence: number;
  weight: number;
  signal: SignalDirection;
}

export interface EngineeredFeature {
  id: string;
  name: string;
  category: string;
  value: number;
  normalized: number;
  importance: number;
  status: FeatureStatus;
}

export interface ModelPrediction {
  id: string;
  name: string;
  prediction: SignalDirection;
  confidence: number;
  weight: number;
  expectedReturn: number;
}

export interface EnsemblePrediction {
  bullish: number;
  neutral: number;
  bearish: number;
  confidence: number;
  horizon: string;
  expectedReturn: number;
  expectedDrawdown: number;
  riskReward: number;
  models: ModelPrediction[];
  distribution: { bucket: string; probability: number }[];
}

export interface RiskMetrics {
  kellyFraction: number;
  positionSize: number;
  sharpe: number;
  sortino: number;
  cvar: number;
  var95: number;
  expectedValue: number;
  drawdown: number;
  portfolioExposure: number;
  volatilityTarget: number;
  cashReservePct: number;
  stopLossPrice: number;
}

export interface ExecutionEvent {
  id: string;
  timestamp: number;
  decision: ExecutionDecision;
  venue: ExecutionVenue;
  executionPrice: number;
  slippage: number;
  fees: number;
  estimatedProfit: number;
  latencyMs: number;
  txHash: string;
  confidence: number;
  status: ExecutionStatus;
}

export interface PortfolioAsset {
  symbol: string;
  allocation: number;
  valueUsd: number;
}

export interface PortfolioState {
  assets: PortfolioAsset[];
  availableBalance: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  maxDrawdown: number;
  totalValue: number;
}

export interface OnchainPrediction {
  id: string;
  timestamp: number;
  predictionHash: string;
  modelVersion: string;
  confidence: number;
  decision: SignalDirection;
  txHash: string;
  status: OnchainStatus;
}

export interface TradeRecord {
  id: string;
  timestamp: number;
  signal: SignalDirection;
  confidence: number;
  entry: number;
  exit: number;
  pnl: number;
  durationMin: number;
  riskScore: number;
  hash: string;
}

export interface LogLine {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
}

export interface AgentRuntime {
  cpu: number;
  memory: number;
  inferenceMs: number;
  oracleDelayMs: number;
  transactionsToday: number;
  predictionsToday: number;
  currentEpoch: number;
  currentBlock: number;
  wallet: string;
  treasuryBalance: number;
}

export interface PerformanceMetrics {
  winRate: number;
  sharpe: number;
  sortino: number;
  profitFactor: number;
  avgTrade: number;
  maxDrawdown: number;
  expectancy: number;
  monthlyReturn: number;
  equityCurve: SparklinePoint[];
  drawdownCurve: SparklinePoint[];
  returnDistribution: { bucket: string; count: number }[];
  rollingReturns: SparklinePoint[];
  heatmap: number[][];
}

export interface HeroKpis {
  btcPrice: number;
  currentPnl: number;
  agentStatus: "running" | "paused" | "syncing";
  marketRegime: MarketRegime;
  confidence: number;
  position: SignalDirection;
  portfolioValue: number;
}

export interface Btc2AgentState {
  tick: number;
  hero: HeroKpis;
  marketMetrics: MarketMetric[];
  factors: QuantFactor[];
  features: EngineeredFeature[];
  prediction: EnsemblePrediction;
  risk: RiskMetrics;
  executions: ExecutionEvent[];
  portfolio: PortfolioState;
  onchainPredictions: OnchainPrediction[];
  performance: PerformanceMetrics;
  recentTrades: TradeRecord[];
  logs: LogLine[];
  runtime: AgentRuntime;
  priceHistory: SparklinePoint[];
}
