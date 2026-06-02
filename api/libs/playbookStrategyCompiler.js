/**
 * Arena strategy compiler — NL → ArenaSpec + GetAgent Playbook package (tar.gz).
 */
import { create } from "tar";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { compileVibeStrategy } from "./bitgetVibeService.js";

const BAR_RE =
  /^(1m|3m|5m|15m|30m|1h|2h|3d|4h|6h|8h|12h|1d|1w|1M|1mo)$/i;

/**
 * @typedef {Object} ArenaStrategySpec
 * @property {string} name
 * @property {string} token
 * @property {string} bar
 * @property {number} limit
 * @property {number} lookAheadBars
 * @property {string} entryCondition
 * @property {number | null} minRsi
 * @property {number | null} maxRsi
 * @property {number | null} takeProfitPct
 * @property {number | null} stopLossPct
 * @property {number | null} maxNotionalUsd
 * @property {"adaptive"|"trend"|"mean_reversion"|"flat"} regime
 * @property {"contract"|"spot"} marketType
 * @property {boolean} allowShort
 * @property {number} overlayMinBias
 */

/**
 * @param {unknown} raw
 * @param {Record<string, unknown>} base
 * @returns {ArenaStrategySpec}
 */
function validateArenaSpec(raw, base) {
  const o = raw && typeof raw === "object" ? /** @type {Record<string, unknown>} */ (raw) : {};
  const regimeRaw = String(o.regime || "adaptive").trim().toLowerCase();
  const regime = ["adaptive", "trend", "mean_reversion", "flat"].includes(regimeRaw)
    ? /** @type {ArenaStrategySpec["regime"]} */ (regimeRaw)
    : "adaptive";
  const marketRaw = String(o.marketType || o.market_type || "contract").trim().toLowerCase();
  const marketType = marketRaw === "spot" ? "spot" : "contract";
  const allowShort = marketType === "contract" && o.allowShort !== false && o.allow_short !== false;
  const overlayMinBias = Number(o.overlayMinBias ?? o.overlay_min_bias ?? -0.35);
  return {
    .../** @type {ArenaStrategySpec} */ (base),
    regime,
    marketType,
    allowShort,
    overlayMinBias: Number.isFinite(overlayMinBias) ? Math.max(-1, Math.min(1, overlayMinBias)) : -0.35,
  };
}

/**
 * @param {string} prompt
 * @returns {Promise<ArenaStrategySpec>}
 */
export async function compileArenaStrategy(prompt) {
  const text = String(prompt || "").trim();
  if (!text || text.length < 8) throw new Error("Prompt must be at least 8 characters");

  const base = await compileVibeStrategy(text);

  const system = `You extend a crypto strategy JSON for Syra Alpha Arena (Bitget futures-capable).
Return ONLY a JSON object with extra keys:
regime ("adaptive"|"trend"|"mean_reversion"|"flat"),
marketType ("contract"|"spot" — prefer contract for long/short),
allowShort (boolean, default true for contract),
overlayMinBias (number -1 to 1, minimum Syra on-chain bias to allow entries, default -0.35).
Keep all base fields from the user strategy.`;

  const { response } = await callOpenRouter(
    [
      { role: "system", content: system },
      { role: "user", content: `${text}\n\nBase spec:\n${JSON.stringify(base)}` },
    ],
    { temperature: 0.2, max_tokens: 400 },
  );

  const parsed = parseJsonObjectFromLlm(response);
  return validateArenaSpec({ ...base, ...parsed }, base);
}

/**
 * @param {string} token
 * @param {string} bar
 */
function barToNautilus(bar) {
  const b = String(bar || "1h").toLowerCase();
  const map = {
    "1m": "1-MINUTE",
    "5m": "5-MINUTE",
    "15m": "15-MINUTE",
    "30m": "30-MINUTE",
    "1h": "1-HOUR",
    "4h": "4-HOUR",
    "1d": "1-DAY",
  };
  return map[b] || "1-HOUR";
}

/**
 * @param {ArenaStrategySpec} spec
 */
function slugName(spec) {
  const raw = String(spec.name || "syra-arena")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const token = String(spec.token || "btc").toLowerCase();
  return raw && /^[a-z0-9]/.test(raw) ? raw : `syra-${token}-regime`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildLongDescription(spec) {
  const sym = `${String(spec.token || "BTC").toUpperCase()}USDT`;
  const regime =
    spec.regime === "trend"
      ? "trend-following"
      : spec.regime === "mean_reversion"
        ? "mean reversion"
        : spec.regime === "flat"
          ? "capital preservation"
          : "adaptive regime switching";
  return `This Playbook targets ${sym} perpetual futures on Bitget with a ${regime} philosophy. It is built on the idea that markets alternate between directional trends and choppy ranges, and that a single rigid rule set underperforms when the regime shifts. The strategy aims to participate when price behavior aligns with the active regime model and to stand aside when conditions are unclear.

For entries, the agent waits until momentum and volatility structure suggest a favorable directional setup on the selected timeframe. In adaptive mode it shifts between trend participation and fade setups when range behavior dominates. The decision path is deterministic and replayable on historical candles without discretionary narrative input.

Exits combine staged profit capture with defensive stop discipline. Positions are closed when the thesis is invalidated, when profit objectives are reached, or when maximum holding logic suggests the edge has decayed. The intent is to keep losses bounded while allowing winners to develop in trending phases.

Subscribers can tune trading symbol, leverage, margin budget, take-profit and stop-loss percentages, and regime sensitivity. Raising leverage amplifies both gains and drawdowns. A higher margin budget changes the reported return denominator. Tighter stops reduce per-trade risk but may increase whipsaw exits in volatile periods.

Risks include sudden news gaps, funding spikes, and extended sideways markets where both trend and reversion models may churn. Past sandbox backtests do not guarantee future live results. The strategy may underperform during low-liquidity holidays and around major macro announcements when correlations break down.`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildReadme(spec) {
  const sym = `${String(spec.token || "BTC").toUpperCase()}USDT`;
  return `# ${spec.name}

## 策略概述
Syra Alpha Arena 在 Bitget 合约上运行自适应 ${spec.regime} 逻辑，结合 CEX 技术面与 Syra 链上 Alpha 门禁。

## 开仓
当趋势/震荡体制与信号一致且 Syra overlay 允许时，策略发出 long 或 short 信号。

## 平仓
达到止盈、止损或持仓上限后退出；不明确时保持 flat。

## 可调参数
交易对、杠杆、保证金预算、止盈止损百分比、体制模式（adaptive/trend/mean_reversion）。

## 风险
震荡市可能反复止损；高杠杆放大回撤。回测不代表未来收益。

Symbol: ${sym} · Timeframe: ${spec.bar} · Market: ${spec.marketType}
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildManifestYaml(spec) {
  const name = slugName(spec);
  const sym = `${String(spec.token || "BTC").toUpperCase()}USDT`;
  const tp = spec.takeProfitPct != null ? Number(spec.takeProfitPct) : 2;
  const sl = spec.stopLossPct != null ? Number(spec.stopLossPct) : 1;
  const longDesc = buildLongDescription(spec).replace(/\n/g, "\n  ");
  return `name: ${name}
display_name: "${String(spec.name || "Syra Arena Agent").replace(/"/g, "'")}"
description: "Syra Alpha Arena ${spec.regime} ${sym} on Bitget"
long_description: |
  ${longDesc}
market_type: contract
trading_symbols:
  - ${sym}
decision_mode: deterministic
backtest_support: full
runtime_profile: deterministic
execution_mode: signal_only
follow_trade_supported: true
tags:
  - syra
  - arena
  - ${spec.regime}
schedule:
  cron: "0 */4 * * *"
  tz: "UTC"
strategy_config:
  trading_symbols:
    - ${sym}
  leverage: 5
  margin_budget: "100"
  take_profit_pct: "${tp}"
  stop_loss_pct: "${sl}"
  regime: "${spec.regime}"
  allow_short: ${spec.allowShort ? "true" : "false"}
  overlay_min_bias: "${spec.overlayMinBias}"
user_config_schema:
  trading_symbols:
    type: array
    item_type: string
    default:
      - ${sym}
    options:
      - ${sym}
      - ETHUSDT
      - SOLUSDT
    min_items: 1
    max_items: 1
    label: Trading symbol
  leverage:
    type: integer
    default: 5
    min: 1
    max: 20
    label: Leverage
  margin_budget:
    type: string
    default: "100"
    pattern: "^[0-9]+(\\.[0-9]+)?$"
    label: Margin budget USDT
  take_profit_pct:
    type: string
    default: "${tp}"
    label: Take profit percent
  stop_loss_pct:
    type: string
    default: "${sl}"
    label: Stop loss percent
  regime:
    type: string
    default: "${spec.regime}"
    options:
      - adaptive
      - trend
      - mean_reversion
      - flat
    label: Regime mode
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildBacktestYaml(spec) {
  const sym = `${String(spec.token || "BTC").toUpperCase()}USDT`;
  const barType = `${sym}.BINANCE-${barToNautilus(spec.bar)}-LAST-EXTERNAL`;
  return `venue:
  name: BINANCE
  account_type: MARGIN
  oms_type: NETTING
  starting_balances:
    - amount: 100000
      currency: USDT

strategy:
  module: strategy
  class: SyraRegimeStrategy
  config_class: SyraRegimeStrategyConfig

instrument:
  id: ${sym}.BINANCE
  kind: PERP
  raw_symbol: ${sym}
  base_currency: ${String(spec.token || "BTC").toUpperCase()}
  quote_currency: USDT
  price_precision: 2
  size_precision: 3
  price_increment: "0.01"
  size_increment: "0.001"
  lot_size: "0.001"
  maker_fee: "0.0002"
  taker_fee: "0.0005"
  settlement_currency: USDT
  bar_type: ${barType}

execution:
  start: "2025-01-01"
  end: "2026-01-01"
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildMainPy() {
  return `from getagent import runtime
from . import main_backtest, main_live


def run() -> None:
    if runtime.is_historical():
        main_backtest.run()
    elif runtime.is_live():
        main_live.run()
    else:
        raise ValueError(f"unsupported evaluation_mode={runtime.evaluation_mode!r}")
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildMainBacktestPy(spec) {
  return `from getagent import backtest, data, runtime
from .strategy import build_frames, run_replay


def run() -> None:
    cfg = runtime.manifest.get("strategy_config") or {}
    symbols = cfg.get("trading_symbols") or runtime.manifest.get("trading_symbols") or ["BTCUSDT"]
    symbol = symbols[0] if isinstance(symbols, list) and symbols else "BTCUSDT"
    interval = "${spec.bar}"
    frames = build_frames(symbol=symbol, interval=interval)
    result = run_replay(frames)
    chart_path = backtest.generate_chart(result)
    metrics = {
        "total_return_pct": getattr(result, "total_return_pct", 0.0),
        "sharpe_ratio": getattr(result, "sharpe_ratio", 0.0),
        "max_drawdown_pct": getattr(result, "max_drawdown_pct", 0.0),
        "win_rate": getattr(result, "win_rate", 0.0),
        "total_trades": getattr(result, "total_trades", 0),
        "chart_path": chart_path,
        "regime": str(cfg.get("regime", "${spec.regime}")),
    }
    runtime.emit_signal(
        action="watch",
        symbol=symbol,
        confidence=0.5,
        metrics=metrics,
        meta={"syra_arena": True, "phase": "backtest_complete"},
    )
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildMainLivePy(spec) {
  return `from getagent import runtime
from .features import compute_live_decision


def run() -> None:
    cfg = runtime.manifest.get("strategy_config") or {}
    decision = compute_live_decision(cfg)
    runtime.emit_signal_or_follow(
        action=decision["action"],
        symbol=decision["symbol"],
        confidence=decision["confidence"],
        metrics=decision.get("metrics"),
        meta=decision.get("meta"),
        execute_trade=decision.get("execute_trade"),
    )
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildStrategyPy(spec) {
  return `from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd
from getagent import backtest, data, runtime
from nautilus_trader.config import StrategyConfig
from nautilus_trader.model.data import Bar
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.trading.strategy import Strategy


@dataclass
class SyraRegimeStrategyConfig(StrategyConfig):
    instrument_id: InstrumentId | None = None
    fast_ema: int = 12
    slow_ema: int = 26
    rsi_period: int = 14
    adx_period: int = 14
    regime: str = "${spec.regime}"


class SyraRegimeStrategy(Strategy):
    def __init__(self, config: SyraRegimeStrategyConfig) -> None:
        super().__init__(config)
        self._bars: list[Bar] = []

    def on_bar(self, bar: Bar) -> None:
        self._bars.append(bar)
        if len(self._bars) < max(self.config.slow_ema, self.config.adx_period) + 5:
            return
        closes = pd.Series([float(b.close) for b in self._bars])
        fast = closes.ewm(span=self.config.fast_ema, adjust=False).mean().iloc[-1]
        slow = closes.ewm(span=self.config.slow_ema, adjust=False).mean().iloc[-1]
        delta = closes.diff()
        gain = delta.clip(lower=0).rolling(self.config.rsi_period).mean()
        loss = (-delta.clip(upper=0)).rolling(self.config.rsi_period).mean()
        rs = gain / loss.replace(0, 1e-9)
        rsi = 100 - (100 / (1 + rs)).iloc[-1]
        regime = str(self.config.regime or "adaptive")
        action = "hold"
        if regime == "flat":
            action = "hold"
        elif regime == "trend" or (regime == "adaptive" and fast > slow):
            if fast > slow and rsi < 70:
                action = "long"
            elif fast < slow and rsi > 30:
                action = "short"
        else:
            if rsi < 35:
                action = "long"
            elif rsi > 65:
                action = "short"
        if action == "hold":
            return
        instrument_id = self.config.instrument_id
        if instrument_id is None:
            return
        side = OrderSide.BUY if action == "long" else OrderSide.SELL
        if not self.portfolio.is_flat(instrument_id):
            return
        self.submit_market_order(instrument_id=instrument_id, order_side=side, quantity=self.cache.instrument(instrument_id).make_qty("0.01"))


def build_frames(symbol: str, interval: str) -> dict[str, pd.DataFrame]:
    bars = data.crypto.futures.kline(symbol=symbol, interval=interval, limit=500)
    frame = backtest.prepare_frame(bars)
    key = f"{symbol}.BINANCE"
    return {key: frame}


def run_replay(frames: dict[str, pd.DataFrame]) -> Any:
    spec = runtime.backtest_spec
    loaded = {k: v for k, v in frames.items() if v is not None and len(v) > 0}
    if spec and "instruments" in spec:
        allowed = {inst.get("id") for inst in spec.get("instruments") or [] if isinstance(inst, dict)}
        allowed.discard(None)
        if allowed:
            loaded = {k: v for k, v in loaded.items() if k in allowed}
    return backtest.run(ohlcv_data=loaded, spec=spec)
`;
}

/**
 * @param {ArenaStrategySpec} spec
 */
function buildFeaturesPy(spec) {
  return `from __future__ import annotations

from typing import Any, Callable

from getagent import data, runtime


def compute_live_decision(cfg: dict) -> dict[str, Any]:
    symbols = cfg.get("trading_symbols") or ["BTCUSDT"]
    symbol = symbols[0] if isinstance(symbols, list) and symbols else "BTCUSDT"
    interval = "${spec.bar}"
    bars = data.crypto.futures.kline(symbol=symbol, interval=interval, limit=120)
    frame = __import__("getagent").backtest.prepare_frame(bars)
    if frame is None or len(frame) < 30:
        return {"action": "hold", "symbol": symbol, "confidence": 0.0, "metrics": {}, "meta": {}}
    closes = frame["close"].astype(float)
    fast = closes.ewm(span=12, adjust=False).mean().iloc[-1]
    slow = closes.ewm(span=26, adjust=False).mean().iloc[-1]
    delta = closes.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rsi = (100 - (100 / (1 + (gain / loss.replace(0, 1e-9))))).iloc[-1]
    regime = str(cfg.get("regime", "${spec.regime}"))
    action = "hold"
    if regime != "flat":
        if regime == "trend" or (regime == "adaptive" and fast > slow):
            if fast > slow and rsi < 70:
                action = "long"
            elif fast < slow and rsi > 30:
                action = "short"
        else:
            if rsi < 35:
                action = "long"
            elif rsi > 65:
                action = "short"
    confidence = 0.55 if action in ("long", "short") else 0.2
    execute_trade: Callable[[], None] | None = None
    if runtime.should_follow_trade(action):

        def execute_trade() -> None:
            from getagent import trade

            lev = int(cfg.get("leverage") or 5)
            budget = str(cfg.get("margin_budget") or "50")
            if action == "long":
                trade.contract.open_long_market(symbol=symbol, qty=trade.helpers.compute_qty(symbol=symbol, market="contract", budget_amount=budget, leverage=lev).qty, leverage=lev)
            elif action == "short":
                trade.contract.open_short_market(symbol=symbol, qty=trade.helpers.compute_qty(symbol=symbol, market="contract", budget_amount=budget, leverage=lev).qty, leverage=lev)

    return {
        "action": action,
        "symbol": symbol,
        "confidence": confidence,
        "metrics": {"rsi": float(rsi), "fast_ema": float(fast), "slow_ema": float(slow), "regime": regime},
        "meta": {"syra_arena": True},
        "execute_trade": execute_trade,
    }
`;
}

/**
 * @param {ArenaStrategySpec} spec
 * @returns {Record<string, string>}
 */
export function buildPlaybookFileMap(spec) {
  const name = slugName(spec);
  return {
    "README.md": buildReadme(spec),
    "manifest.yaml": buildManifestYaml(spec),
    "backtest.yaml": buildBacktestYaml(spec),
    "src/main.py": buildMainPy(),
    "src/main_backtest.py": buildMainBacktestPy(spec),
    "src/main_live.py": buildMainLivePy(spec),
    "src/strategy.py": buildStrategyPy(spec),
    "src/features.py": buildFeaturesPy(spec),
    [`package-meta.json`]: JSON.stringify({ slug: name, syraArena: true, token: spec.token }, null, 2),
  };
}

/**
 * @param {Record<string, string>} files relative path -> content
 * @returns {Promise<Buffer>}
 */
export async function packPlaybookTarGz(files) {
  const entries = Object.entries(files).map(([path, content]) => ({
    path,
    content: Buffer.from(content, "utf8"),
  }));

  const chunks = [];
  const pack = create(
    { gzip: true, portable: true },
    {
      write(chunk) {
        chunks.push(chunk);
      },
      end() {},
    },
  );

  for (const { path, content } of entries) {
    pack.write({ path, size: content.length }, content);
  }
  pack.end();

  await new Promise((resolve, reject) => {
    pack.on("end", resolve);
    pack.on("error", reject);
  });

  return Buffer.concat(chunks);
}

/**
 * @param {ArenaStrategySpec} spec
 * @returns {Promise<{ buffer: Buffer; slug: string; files: Record<string, string> }>}
 */
export async function buildPlaybookPackage(spec) {
  const files = buildPlaybookFileMap(spec);
  const slug = slugName(spec);
  const buffer = await packPlaybookTarGz(files);
  return { buffer, slug, files };
}
