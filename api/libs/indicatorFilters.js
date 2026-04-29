/**
 * Trading experiment indicator filter catalog — validators, randomizer, labels.
 * Pair with {@link extractSignalFields} output shape.
 */

/** @template T @param {readonly T[]} arr @returns {T} */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(lo, hi) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function randFloat(lo, hi, decimals = 1) {
  const x = lo + Math.random() * (hi - lo);
  return Math.round(x * 10 ** decimals) / 10 ** decimals;
}

const CONF_RANK = Object.freeze({ LOW: 0, MEDIUM: 1, HIGH: 2 });

function confRank(c) {
  const k = String(c ?? "LOW").trim().toUpperCase();
  return CONF_RANK[k] ?? 0;
}

/**
 * @param {{ min?: number | null; max?: number | null } | null | undefined} band
 * @param {number | null} x
 */
function inBand(band, x) {
  if (x == null || !Number.isFinite(x)) return false;
  if (band == null) return true;
  const min = band.min != null && Number.isFinite(Number(band.min)) ? Number(band.min) : null;
  const max = band.max != null && Number.isFinite(Number(band.max)) ? Number(band.max) : null;
  if (min != null && x < min) return false;
  if (max != null && x > max) return false;
  return true;
}

/** Legacy combined MACD modes (same as previous experimentSignalGate). */
function validateLegacyMacd(mode, ex) {
  const m = ex.macd;
  if (m == null) return false;
  switch (mode) {
    case "BULL_HIST":
      return m.histogram > 0;
    case "BEAR_HIST":
      return m.histogram < 0;
    case "BULL_CROSS":
      return m.value > m.signal;
    case "BEAR_CROSS":
      return m.value < m.signal;
    default:
      return false;
  }
}

/**
 * @type {Record<string, {
 *   validate: (value: unknown, ex: Record<string, unknown>) => boolean;
 *   randomize: () => unknown;
 *   label: (value: unknown) => string;
 * }>}
 */
export const INDICATOR_FILTER_SPECS = {
  rsiBand: {
    validate: (v, ex) => inBand(v, ex.rsi),
    randomize: () => (Math.random() < 0.5 ? { max: pick([30, 35, 40, 45]) } : { min: pick([55, 60, 65]) }),
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      const parts = [];
      if (b?.min != null) parts.push(`RSI≥${b.min}`);
      if (b?.max != null) parts.push(`RSI≤${b.max}`);
      return parts.join(" ");
    },
  },
  rsiOversold: {
    validate: (v, ex) => v === true && ex.rsi != null && ex.rsi <= 30,
    randomize: () => true,
    label: () => "RSI≤30",
  },
  rsiOverbought: {
    validate: (v, ex) => v === true && ex.rsi != null && ex.rsi >= 70,
    randomize: () => true,
    label: () => "RSI≥70",
  },
  rsiBullishZone: {
    validate: (v, ex) => v === true && ex.rsi != null && ex.rsi >= 40 && ex.rsi <= 60,
    randomize: () => true,
    label: () => "RSI 40–60",
  },
  /** @deprecated use macdHist/macdCross — kept for Mongo + static strategies */
  macd: {
    validate: (v, ex) =>
      typeof v === "string" &&
      ["BULL_HIST", "BEAR_HIST", "BULL_CROSS", "BEAR_CROSS"].includes(v) &&
      validateLegacyMacd(v, ex),
    randomize: () => pick(["BULL_HIST", "BEAR_HIST", "BULL_CROSS", "BEAR_CROSS"]),
    label: (v) =>
      ({
        BULL_HIST: "MACD+hist",
        BEAR_HIST: "MACD−hist",
        BULL_CROSS: "MACD>sig",
        BEAR_CROSS: "MACD<sig",
      })[String(v)] ?? String(v),
  },
  macdHist: {
    validate: (v, ex) =>
      (v === "BULL_HIST" || v === "BEAR_HIST") && validateLegacyMacd(v, ex),
    randomize: () => pick(["BULL_HIST", "BEAR_HIST"]),
    label: (v) => (v === "BULL_HIST" ? "MACD+hist" : "MACD−hist"),
  },
  macdCross: {
    validate: (v, ex) =>
      (v === "BULL_CROSS" || v === "BEAR_CROSS") && validateLegacyMacd(v, ex),
    randomize: () => pick(["BULL_CROSS", "BEAR_CROSS"]),
    label: (v) => (v === "BULL_CROSS" ? "MACD>sig" : "MACD<sig"),
  },
  macdZeroLine: {
    validate: (v, ex) => {
      const m = ex.macd;
      if (m == null) return false;
      if (v === "ABOVE") return m.value > 0;
      if (v === "BELOW") return m.value < 0;
      return false;
    },
    randomize: () => pick(["ABOVE", "BELOW"]),
    label: (v) => (v === "ABOVE" ? "MACD>0" : "MACD<0"),
  },
  emaStack: {
    validate: (v, ex) => {
      if (ex.ema12 == null || ex.ema26 == null) return false;
      if (v === "GOLDEN") return ex.ema12 > ex.ema26;
      if (v === "DEATH") return ex.ema12 < ex.ema26;
      return false;
    },
    randomize: () => pick(["GOLDEN", "DEATH"]),
    label: (v) => (v === "GOLDEN" ? "EMA golden" : "EMA death"),
  },
  smaStack: {
    validate: (v, ex) => {
      if (ex.sma20 == null || ex.sma50 == null) return false;
      if (v === "BULL") return ex.sma20 > ex.sma50;
      if (v === "BEAR") return ex.sma20 < ex.sma50;
      return false;
    },
    randomize: () => pick(["BULL", "BEAR"]),
    label: (v) => (v === "BULL" ? "SMA bull stack" : "SMA bear stack"),
  },
  priceVsMa: {
    validate: (v, ex) => {
      const p = ex.priceAtSignal;
      if (p == null) return false;
      switch (v) {
        case "ABOVE_SMA20":
          return ex.sma20 != null && p > ex.sma20;
        case "ABOVE_SMA50":
          return ex.sma50 != null && p > ex.sma50;
        case "BELOW_SMA20":
          return ex.sma20 != null && p < ex.sma20;
        case "BELOW_SMA50":
          return ex.sma50 != null && p < ex.sma50;
        default:
          return false;
      }
    },
    randomize: () => pick(["ABOVE_SMA20", "ABOVE_SMA50", "BELOW_SMA20", "BELOW_SMA50"]),
    label: (v) =>
      ({
        ABOVE_SMA20: ">SMA20",
        ABOVE_SMA50: ">SMA50",
        BELOW_SMA20: "<SMA20",
        BELOW_SMA50: "<SMA50",
      })[String(v)] ?? String(v),
  },
  priceVsEma12: {
    validate: (v, ex) => {
      if (ex.priceAtSignal == null || ex.ema12 == null) return false;
      if (v === "ABOVE") return ex.priceAtSignal > ex.ema12;
      if (v === "BELOW") return ex.priceAtSignal < ex.ema12;
      return false;
    },
    randomize: () => pick(["ABOVE", "BELOW"]),
    label: (v) => (v === "ABOVE" ? ">EMA12" : "<EMA12"),
  },
  priceVsEma26: {
    validate: (v, ex) => {
      if (ex.priceAtSignal == null || ex.ema26 == null) return false;
      if (v === "ABOVE") return ex.priceAtSignal > ex.ema26;
      if (v === "BELOW") return ex.priceAtSignal < ex.ema26;
      return false;
    },
    randomize: () => pick(["ABOVE", "BELOW"]),
    label: (v) => (v === "ABOVE" ? ">EMA26" : "<EMA26"),
  },
  bollingerPosition: {
    validate: (v, ex) => {
      const pos = ex.bbPositionPct;
      if (pos == null) return false;
      if (v === "LOWER") return pos <= 15;
      if (v === "UPPER") return pos >= 85;
      if (v === "INSIDE") return pos > 15 && pos < 85;
      return false;
    },
    randomize: () => pick(["LOWER", "UPPER", "INSIDE"]),
    label: (v) =>
      ({ LOWER: "BB lower", UPPER: "BB upper", INSIDE: "BB mid" })[String(v)] ?? String(v),
  },
  bbPositionBand: {
    validate: (v, ex) => inBand(v, ex.bbPositionPct),
    randomize: () => {
      const a = randInt(5, 45);
      const b = randInt(Math.min(95, a + 5), 95);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    },
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      return `BBpos ${b?.min ?? "?"}–${b?.max ?? "?"}%`;
    },
  },
  bbWidthBand: {
    validate: (v, ex) => inBand(v, ex.bbWidthPct),
    randomize: () => {
      const a = randFloat(3, 12);
      const b = randFloat(Math.max(4, a + 0.5), 28);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    },
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      return `BBw ${b?.min ?? "?"}–${b?.max ?? "?"}%`;
    },
  },
  volatilityLevel: {
    validate: (v, ex) => ex.volatilityLevel === v,
    randomize: () => pick(["LOW", "MODERATE", "HIGH"]),
    label: (v) => `Vol ${String(v).toLowerCase()}`,
  },
  priceVsVwap: {
    validate: (v, ex) => {
      if (ex.priceAtSignal == null || ex.vwap == null) return false;
      if (v === "ABOVE") return ex.priceAtSignal > ex.vwap;
      if (v === "BELOW") return ex.priceAtSignal < ex.vwap;
      return false;
    },
    randomize: () => pick(["ABOVE", "BELOW"]),
    label: (v) => (v === "ABOVE" ? ">VWAP" : "<VWAP"),
  },
  supportProximityPct: {
    validate: (v, ex) => {
      if (typeof v !== "number" || !Number.isFinite(v) || ex.priceAtSignal == null || ex.support == null)
        return false;
      const dist = (Math.abs(ex.priceAtSignal - ex.support) / ex.support) * 100;
      return dist <= v;
    },
    randomize: () => randFloat(0.3, 2.5, 2),
    label: (v) => `near S ±${v}%`,
  },
  resistanceProximityPct: {
    validate: (v, ex) => {
      if (typeof v !== "number" || !Number.isFinite(v) || ex.priceAtSignal == null || ex.resistance == null)
        return false;
      const dist = (Math.abs(ex.resistance - ex.priceAtSignal) / ex.resistance) * 100;
      return dist <= v;
    },
    randomize: () => randFloat(0.3, 2.5, 2),
    label: (v) => `near R ±${v}%`,
  },
  adxValueBand: {
    validate: (v, ex) => inBand(v, ex.adxValue),
    randomize: () => {
      const a = randInt(10, 35);
      const b = randInt(Math.max(36, a + 1), 55);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    },
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      return `ADX ${b?.min ?? "?"}–${b?.max ?? ""}`;
    },
  },
  adxTrendStrength: {
    validate: (v, ex) => ex.adxTrendStrength === v,
    randomize: () => pick(["WEAK", "MODERATE", "STRONG", "VERY STRONG", "NO TREND"]),
    label: (v) => `ADX ${String(v).replace(/_/g, " ").toLowerCase()}`,
  },
  adxDiStack: {
    validate: (v, ex) => {
      if (ex.adxPdi == null || ex.adxMdi == null) return false;
      if (v === "BULL") return ex.adxPdi > ex.adxMdi;
      if (v === "BEAR") return ex.adxPdi < ex.adxMdi;
      return false;
    },
    randomize: () => pick(["BULL", "BEAR"]),
    label: (v) => (v === "BULL" ? "+DI>−DI" : "+DI<−DI"),
  },
  adxDiCrossover: {
    validate: (v, ex) => ex.adxDiCrossover === v,
    randomize: () => pick(["BULLISH CROSS", "BEARISH CROSS"]),
    label: (v) => (String(v).includes("BULLISH") ? "DI bull X" : "DI bear X"),
  },
  adxTrendDirection: {
    validate: (v, ex) => ex.adxTrendDirection === v,
    randomize: () => pick(["BULLISH", "BEARISH"]),
    label: (v) => `ADX ${String(v).toLowerCase()}`,
  },
  mfiBand: {
    validate: (v, ex) => inBand(v, ex.mfiValue),
    randomize: () => {
      const a = randInt(15, 55);
      const b = randInt(Math.max(56, a + 2), 95);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    },
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      return `MFI ${b?.min ?? "?"}–${b?.max ?? ""}`;
    },
  },
  mfiOverbought: {
    validate: (v, ex) => v === true && ex.mfiValue != null && ex.mfiValue >= 80,
    randomize: () => true,
    label: () => "MFI≥80",
  },
  mfiOversold: {
    validate: (v, ex) => v === true && ex.mfiValue != null && ex.mfiValue <= 20,
    randomize: () => true,
    label: () => "MFI≤20",
  },
  volumePressure: {
    validate: (v, ex) => ex.mfiVolumePressure === v,
    randomize: () =>
      pick([
        "STRONG BUYING PRESSURE",
        "MODERATE BUYING PRESSURE",
        "POSITIVE FLOW",
        "NEGATIVE FLOW",
        "MODERATE SELLING PRESSURE",
        "STRONG SELLING PRESSURE",
        "BALANCED",
      ]),
    label: (v) => `VolΔ ${String(v).split(" ")[0]}`,
  },
  mfiDivergence: {
    validate: (v, ex) => ex.mfiDivergence === v,
    randomize: () => pick(["BULLISH DIVERGENCE", "BEARISH DIVERGENCE"]),
    label: (v) => (String(v).includes("BULLISH") ? "MFI bull div" : "MFI bear div"),
  },
  atrPercentBand: {
    validate: (v, ex) => inBand(v, ex.atrPercent),
    randomize: () => {
      const a = randFloat(0.5, 4);
      const b = randFloat(Math.max(4.5, a + 0.2), 14);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    },
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      return `ATR% ${b?.min ?? "?"}–${b?.max ?? ""}`;
    },
  },
  trendClearSignal: {
    validate: (v, ex) => ex.trendClearSignal === v,
    randomize: () => pick(["BUY", "SELL"]),
    label: (v) => `Trend ${String(v)}`,
  },
  momentumClearSignal: {
    validate: (v, ex) => ex.momentumClearSignal === v,
    randomize: () => pick(["BUY", "SELL"]),
    label: (v) => `Mom ${String(v)}`,
  },
  priceChange24hBand: {
    validate: (v, ex) => inBand(v, ex.priceChange24hPct),
    randomize: () => {
      const a = randFloat(-12, -0.3);
      const b = randFloat(0.3, 15);
      return { min: Math.min(a, b), max: Math.max(a, b) };
    },
    label: (v) => {
      const b = /** @type {{ min?: number; max?: number }} */ (v);
      return `24h ${b?.min ?? "?"}–${b?.max ?? ""}%`;
    },
  },
  confidenceFloor: {
    validate: (v, ex) => confRank(ex.confidence) >= confRank(v),
    randomize: () => pick(["LOW", "MEDIUM", "HIGH"]),
    label: (v) => `Conf≥${String(v)}`,
  },
};

/** Keys used by {@link randomIndicatorFilter} (excludes legacy alias `macd` — use slices). */
export const RANDOM_INDICATOR_FILTER_KEYS = Object.keys(INDICATOR_FILTER_SPECS).filter((k) => k !== "macd");

/**
 * @param {Record<string, unknown> | null | undefined} filter
 * @param {Record<string, unknown>} extracted
 * @returns {boolean}
 */
export function validateIndicatorFilter(filter, extracted) {
  if (filter == null || typeof filter !== "object") return true;
  const keys = Object.keys(filter);
  if (keys.length === 0) return true;
  for (const key of keys) {
    const spec = INDICATOR_FILTER_SPECS[key];
    if (!spec) return false;
    if (!spec.validate(filter[key], extracted)) return false;
  }
  return true;
}

/**
 * @param {{ min?: number; max?: number }} [opts]
 * @returns {Record<string, unknown> | null}
 */
export function randomIndicatorFilter(opts = {}) {
  const min = opts.min ?? 0;
  const max = opts.max ?? 3;
  if (min === 0 && Math.random() < 0.5) return null;
  const n = randInt(min, max);
  if (n === 0) return null;

  const keys = [...RANDOM_INDICATOR_FILTER_KEYS];
  /** @type {Record<string, unknown>} */
  const out = {};
  const used = new Set();
  let added = 0;
  let guard = 0;
  while (added < n && guard < 80) {
    guard += 1;
    const k = pick(keys);
    if (used.has(k)) continue;
    used.add(k);
    const spec = INDICATOR_FILTER_SPECS[k];
    if (!spec) continue;
    try {
      out[k] = spec.randomize();
      added += 1;
    } catch {
      /* skip */
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * @param {Record<string, unknown> | null | undefined} filter
 * @returns {string[]}
 */
export function indicatorFilterBadgeLabels(filter) {
  if (filter == null || typeof filter !== "object") return [];
  const out = [];
  for (const key of Object.keys(filter)) {
    const spec = INDICATOR_FILTER_SPECS[key];
    if (!spec) {
      out.push(key);
      continue;
    }
    try {
      out.push(spec.label(filter[key]));
    } catch {
      out.push(key);
    }
  }
  return out;
}
