/**
 * Technical indicator registry — composable definitions for agent-readable output.
 */
import {
  RSI,
  MACD,
  SMA,
  EMA,
  WMA,
  WEMA,
  BollingerBands,
  ADX,
  ATR,
  TrueRange,
  Stochastic,
  StochasticRSI,
  WilliamsR,
  CCI,
  ROC,
  MFI,
  OBV,
  ADL,
  ForceIndex,
  VWAP,
  TRIX,
  PSAR,
  KST,
  AwesomeOscillator,
  IchimokuCloud,
  KeltnerChannels,
  ChandelierExit,
} from "technicalindicators";
import {
  alignMultiSeriesWithTimes,
  alignSeriesWithTimes,
  bollingerSignal,
  lastOf,
  macdSignal,
  makeResult,
  oscillatorSignal,
  resolveParams,
  rsiSignal,
} from "./utils.js";

/** @typedef {import('./utils.js').CandleSeries} CandleSeries */
/** @typedef {import('./utils.js').IndicatorDefinition} IndicatorDefinition */

/** @type {Record<string, IndicatorDefinition>} */
export const INDICATOR_REGISTRY = {
  rsi: {
    id: "rsi",
    name: "Relative Strength Index",
    category: "momentum",
    inputs: "close",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 100, description: "RSI lookback period" },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = RSI.calculate({ values: series.close, period: /** @type {number} */ (params.period) });
      const latest = lastOf(values);
      const signal = rsiSignal(/** @type {number} */ (latest));
      return makeResult(
        latest,
        signal,
        withSeries ? alignSeriesWithTimes(series.time, values) : undefined,
        withSeries,
      );
    },
  },

  macd: {
    id: "macd",
    name: "MACD",
    category: "momentum",
    inputs: "close",
    params: {
      fastPeriod: { type: "integer", default: 12, min: 2, max: 50 },
      slowPeriod: { type: "integer", default: 26, min: 5, max: 100 },
      signalPeriod: { type: "integer", default: 9, min: 2, max: 50 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = MACD.calculate({
        values: series.close,
        fastPeriod: /** @type {number} */ (params.fastPeriod),
        slowPeriod: /** @type {number} */ (params.slowPeriod),
        signalPeriod: /** @type {number} */ (params.signalPeriod),
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      });
      const latest = lastOf(values);
      const macdVal = latest && typeof latest === "object" ? /** @type {{ MACD?: number; signal?: number; histogram?: number }} */ (latest).MACD : null;
      const sigVal = latest && typeof latest === "object" ? /** @type {{ signal?: number }} */ (latest).signal : null;
      const histVal = latest && typeof latest === "object" ? /** @type {{ histogram?: number }} */ (latest).histogram : null;
      const signal = macdSignal(macdVal ?? NaN, sigVal ?? NaN, histVal ?? NaN);
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            {
              macd: values.map((v) => v.MACD),
              signal: values.map((v) => v.signal),
              histogram: values.map((v) => v.histogram),
            },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  sma: {
    id: "sma",
    name: "Simple Moving Average",
    category: "trend",
    inputs: "close",
    params: {
      period: { type: "integer", default: 20, min: 2, max: 500 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = SMA.calculate({ period: /** @type {number} */ (params.period), values: series.close });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const signal =
        Number.isFinite(latest) && Number.isFinite(close)
          ? close > latest
            ? "price_above_ma"
            : close < latest
              ? "price_below_ma"
              : "at_ma"
          : "insufficient_data";
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  ema: {
    id: "ema",
    name: "Exponential Moving Average",
    category: "trend",
    inputs: "close",
    params: {
      period: { type: "integer", default: 20, min: 2, max: 500 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = EMA.calculate({ period: /** @type {number} */ (params.period), values: series.close });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const signal =
        Number.isFinite(latest) && Number.isFinite(close)
          ? close > latest
            ? "price_above_ma"
            : close < latest
              ? "price_below_ma"
              : "at_ma"
          : "insufficient_data";
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  wma: {
    id: "wma",
    name: "Weighted Moving Average",
    category: "trend",
    inputs: "close",
    params: {
      period: { type: "integer", default: 20, min: 2, max: 500 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = WMA.calculate({ period: /** @type {number} */ (params.period), values: series.close });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const signal =
        Number.isFinite(latest) && Number.isFinite(close)
          ? close > latest
            ? "price_above_ma"
            : "price_below_ma"
          : "insufficient_data";
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  wema: {
    id: "wema",
    name: "Wilder Exponential Moving Average",
    category: "trend",
    inputs: "close",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 500 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = WEMA.calculate({ period: /** @type {number} */ (params.period), values: series.close });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const signal =
        Number.isFinite(latest) && Number.isFinite(close)
          ? close > latest
            ? "price_above_ma"
            : "price_below_ma"
          : "insufficient_data";
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  bollinger: {
    id: "bollinger",
    name: "Bollinger Bands",
    category: "volatility",
    inputs: "close",
    params: {
      period: { type: "integer", default: 20, min: 2, max: 200 },
      stdDev: { type: "number", default: 2, min: 0.5, max: 5 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = BollingerBands.calculate({
        period: /** @type {number} */ (params.period),
        stdDev: /** @type {number} */ (params.stdDev),
        values: series.close,
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const upper = latest && typeof latest === "object" ? latest.upper : NaN;
      const middle = latest && typeof latest === "object" ? latest.middle : NaN;
      const lower = latest && typeof latest === "object" ? latest.lower : NaN;
      const signal = bollingerSignal(close, upper, middle, lower);
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            {
              upper: values.map((v) => v.upper),
              middle: values.map((v) => v.middle),
              lower: values.map((v) => v.lower),
            },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  adx: {
    id: "adx",
    name: "Average Directional Index",
    category: "trend",
    inputs: "ohlc",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = ADX.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      const adxVal = latest && typeof latest === "object" ? latest.adx : NaN;
      let signal = "insufficient_data";
      if (Number.isFinite(adxVal)) {
        if (adxVal >= 25) signal = "strong_trend";
        else if (adxVal >= 20) signal = "developing_trend";
        else signal = "weak_trend";
      }
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            {
              adx: values.map((v) => v.adx),
              pdi: values.map((v) => v.pdi),
              mdi: values.map((v) => v.mdi),
            },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  atr: {
    id: "atr",
    name: "Average True Range",
    category: "volatility",
    inputs: "ohlc",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = ATR.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const pct = Number.isFinite(latest) && Number.isFinite(close) && close > 0 ? (latest / close) * 100 : NaN;
      let signal = "insufficient_data";
      if (Number.isFinite(pct)) {
        if (pct >= 5) signal = "high_volatility";
        else if (pct >= 2) signal = "moderate_volatility";
        else signal = "low_volatility";
      }
      return makeResult(
        { value: latest, percentOfClose: Number.isFinite(pct) ? Number(pct.toFixed(4)) : null },
        signal,
        withSeries ? alignSeriesWithTimes(series.time, values) : undefined,
        withSeries,
      );
    },
  },

  truerange: {
    id: "truerange",
    name: "True Range",
    category: "volatility",
    inputs: "ohlc",
    params: {},
    compute(series, _rawParams, { withSeries }) {
      const values = TrueRange.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
      });
      const latest = lastOf(values);
      return makeResult(
        latest,
        Number.isFinite(latest) ? "computed" : "insufficient_data",
        withSeries ? alignSeriesWithTimes(series.time, values) : undefined,
        withSeries,
      );
    },
  },

  stochastic: {
    id: "stochastic",
    name: "Stochastic Oscillator",
    category: "momentum",
    inputs: "ohlc",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 100 },
      signalPeriod: { type: "integer", default: 3, min: 1, max: 50 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = Stochastic.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        period: /** @type {number} */ (params.period),
        signalPeriod: /** @type {number} */ (params.signalPeriod),
      });
      const latest = lastOf(values);
      const k = latest && typeof latest === "object" ? latest.k : NaN;
      const signal = oscillatorSignal(k, 80, 20);
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            { k: values.map((v) => v.k), d: values.map((v) => v.d) },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  stochrsi: {
    id: "stochrsi",
    name: "Stochastic RSI",
    category: "momentum",
    inputs: "close",
    params: {
      rsiPeriod: { type: "integer", default: 14, min: 2, max: 100 },
      stochasticPeriod: { type: "integer", default: 14, min: 2, max: 100 },
      kPeriod: { type: "integer", default: 3, min: 1, max: 50 },
      dPeriod: { type: "integer", default: 3, min: 1, max: 50 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = StochasticRSI.calculate({
        values: series.close,
        rsiPeriod: /** @type {number} */ (params.rsiPeriod),
        stochasticPeriod: /** @type {number} */ (params.stochasticPeriod),
        kPeriod: /** @type {number} */ (params.kPeriod),
        dPeriod: /** @type {number} */ (params.dPeriod),
      });
      const latest = lastOf(values);
      const k = latest && typeof latest === "object" ? latest.k : NaN;
      const signal = oscillatorSignal(k, 0.8, 0.2);
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            { k: values.map((v) => v.k), d: values.map((v) => v.d) },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  williamsr: {
    id: "williamsr",
    name: "Williams %R",
    category: "momentum",
    inputs: "ohlc",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = WilliamsR.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      let signal = "insufficient_data";
      if (Number.isFinite(latest)) {
        if (latest >= -20) signal = "overbought";
        else if (latest <= -80) signal = "oversold";
        else signal = "neutral";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  cci: {
    id: "cci",
    name: "Commodity Channel Index",
    category: "momentum",
    inputs: "ohlc",
    params: {
      period: { type: "integer", default: 20, min: 2, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = CCI.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      let signal = "insufficient_data";
      if (Number.isFinite(latest)) {
        if (latest >= 100) signal = "overbought";
        else if (latest <= -100) signal = "oversold";
        else signal = "neutral";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  roc: {
    id: "roc",
    name: "Rate of Change",
    category: "momentum",
    inputs: "close",
    params: {
      period: { type: "integer", default: 12, min: 1, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = ROC.calculate({
        period: /** @type {number} */ (params.period),
        values: series.close,
      });
      const latest = lastOf(values);
      let signal = "insufficient_data";
      if (Number.isFinite(latest)) {
        if (latest > 0) signal = "positive_momentum";
        else if (latest < 0) signal = "negative_momentum";
        else signal = "flat";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  mfi: {
    id: "mfi",
    name: "Money Flow Index",
    category: "volume",
    inputs: "ohlcv",
    params: {
      period: { type: "integer", default: 14, min: 2, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = MFI.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        volume: series.volume,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      const signal = oscillatorSignal(/** @type {number} */ (latest), 80, 20);
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  obv: {
    id: "obv",
    name: "On Balance Volume",
    category: "volume",
    inputs: "ohlcv",
    params: {},
    compute(series, _rawParams, { withSeries }) {
      const values = OBV.calculate({ close: series.close, volume: series.volume });
      const latest = lastOf(values);
      const prev = values.length >= 2 ? values[values.length - 2] : null;
      let signal = "insufficient_data";
      if (Number.isFinite(latest) && Number.isFinite(prev)) {
        if (latest > prev) signal = "volume_accumulation";
        else if (latest < prev) signal = "volume_distribution";
        else signal = "flat";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  adl: {
    id: "adl",
    name: "Accumulation Distribution Line",
    category: "volume",
    inputs: "ohlcv",
    params: {},
    compute(series, _rawParams, { withSeries }) {
      const values = ADL.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        volume: series.volume,
      });
      const latest = lastOf(values);
      const prev = values.length >= 2 ? values[values.length - 2] : null;
      let signal = "insufficient_data";
      if (Number.isFinite(latest) && Number.isFinite(prev)) {
        if (latest > prev) signal = "accumulation";
        else if (latest < prev) signal = "distribution";
        else signal = "flat";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  forceindex: {
    id: "forceindex",
    name: "Force Index",
    category: "volume",
    inputs: "ohlcv",
    params: {
      period: { type: "integer", default: 13, min: 1, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = ForceIndex.calculate({
        close: series.close,
        volume: series.volume,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      let signal = "insufficient_data";
      if (Number.isFinite(latest)) {
        if (latest > 0) signal = "buying_pressure";
        else if (latest < 0) signal = "selling_pressure";
        else signal = "neutral";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  vwap: {
    id: "vwap",
    name: "Volume Weighted Average Price",
    category: "volume",
    inputs: "ohlcv",
    params: {},
    compute(series, _rawParams, { withSeries }) {
      const values = VWAP.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        volume: series.volume,
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      let signal = "insufficient_data";
      if (Number.isFinite(latest) && Number.isFinite(close)) {
        if (close > latest) signal = "price_above_vwap";
        else if (close < latest) signal = "price_below_vwap";
        else signal = "at_vwap";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  trix: {
    id: "trix",
    name: "TRIX",
    category: "momentum",
    inputs: "close",
    params: {
      period: { type: "integer", default: 18, min: 2, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = TRIX.calculate({
        values: series.close,
        period: /** @type {number} */ (params.period),
      });
      const latest = lastOf(values);
      let signal = "insufficient_data";
      if (Number.isFinite(latest)) {
        if (latest > 0) signal = "positive_momentum";
        else if (latest < 0) signal = "negative_momentum";
        else signal = "flat";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  psar: {
    id: "psar",
    name: "Parabolic SAR",
    category: "trend",
    inputs: "ohlc",
    params: {
      step: { type: "number", default: 0.02, min: 0.001, max: 0.2 },
      max: { type: "number", default: 0.2, min: 0.01, max: 1 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = PSAR.calculate({
        high: series.high,
        low: series.low,
        step: /** @type {number} */ (params.step),
        max: /** @type {number} */ (params.max),
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      let signal = "insufficient_data";
      if (Number.isFinite(latest) && Number.isFinite(close)) {
        signal = close > latest ? "bullish_trend" : close < latest ? "bearish_trend" : "neutral";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  kst: {
    id: "kst",
    name: "Know Sure Thing",
    category: "momentum",
    inputs: "close",
    params: {
      ROCPer1: { type: "integer", default: 10, min: 1, max: 50 },
      ROCPer2: { type: "integer", default: 15, min: 1, max: 50 },
      ROCPer3: { type: "integer", default: 20, min: 1, max: 50 },
      ROCPer4: { type: "integer", default: 30, min: 1, max: 100 },
      signalPeriod: { type: "integer", default: 9, min: 1, max: 50 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = KST.calculate({
        values: series.close,
        ROCPer1: /** @type {number} */ (params.ROCPer1),
        ROCPer2: /** @type {number} */ (params.ROCPer2),
        ROCPer3: /** @type {number} */ (params.ROCPer3),
        ROCPer4: /** @type {number} */ (params.ROCPer4),
        SMAROCPer1: 10,
        SMAROCPer2: 10,
        SMAROCPer3: 10,
        SMAROCPer4: 15,
        signalPeriod: /** @type {number} */ (params.signalPeriod),
      });
      const latest = lastOf(values);
      const kstVal = latest && typeof latest === "object" ? latest.kst : NaN;
      const sigVal = latest && typeof latest === "object" ? latest.signal : NaN;
      let signal = "insufficient_data";
      if (Number.isFinite(kstVal) && Number.isFinite(sigVal)) {
        if (kstVal > sigVal) signal = "bullish_momentum";
        else if (kstVal < sigVal) signal = "bearish_momentum";
        else signal = "neutral";
      }
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            { kst: values.map((v) => v.kst), signal: values.map((v) => v.signal) },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  ao: {
    id: "ao",
    name: "Awesome Oscillator",
    category: "momentum",
    inputs: "ohlc",
    params: {
      fastPeriod: { type: "integer", default: 5, min: 2, max: 50 },
      slowPeriod: { type: "integer", default: 34, min: 5, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = AwesomeOscillator.calculate({
        high: series.high,
        low: series.low,
        fastPeriod: /** @type {number} */ (params.fastPeriod),
        slowPeriod: /** @type {number} */ (params.slowPeriod),
      });
      const latest = lastOf(values);
      let signal = "insufficient_data";
      if (Number.isFinite(latest)) {
        if (latest > 0) signal = "bullish_momentum";
        else if (latest < 0) signal = "bearish_momentum";
        else signal = "neutral";
      }
      return makeResult(latest, signal, withSeries ? alignSeriesWithTimes(series.time, values) : undefined, withSeries);
    },
  },

  ichimoku: {
    id: "ichimoku",
    name: "Ichimoku Cloud",
    category: "trend",
    inputs: "ohlc",
    params: {
      conversionPeriod: { type: "integer", default: 9, min: 2, max: 50 },
      basePeriod: { type: "integer", default: 26, min: 5, max: 100 },
      spanPeriod: { type: "integer", default: 52, min: 10, max: 200 },
      displacement: { type: "integer", default: 26, min: 1, max: 100 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = IchimokuCloud.calculate({
        high: series.high,
        low: series.low,
        conversionPeriod: /** @type {number} */ (params.conversionPeriod),
        basePeriod: /** @type {number} */ (params.basePeriod),
        spanPeriod: /** @type {number} */ (params.spanPeriod),
        displacement: /** @type {number} */ (params.displacement),
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      let signal = "insufficient_data";
      if (latest && typeof latest === "object" && Number.isFinite(close)) {
        const spanA = latest.spanA;
        const spanB = latest.spanB;
        if (Number.isFinite(spanA) && Number.isFinite(spanB)) {
          const cloudTop = Math.max(spanA, spanB);
          const cloudBottom = Math.min(spanA, spanB);
          if (close > cloudTop) signal = "above_cloud";
          else if (close < cloudBottom) signal = "below_cloud";
          else signal = "inside_cloud";
        }
      }
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            {
              conversion: values.map((v) => v.conversion),
              base: values.map((v) => v.base),
              spanA: values.map((v) => v.spanA),
              spanB: values.map((v) => v.spanB),
            },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  keltner: {
    id: "keltner",
    name: "Keltner Channels",
    category: "volatility",
    inputs: "ohlc",
    params: {
      maPeriod: { type: "integer", default: 20, min: 2, max: 200 },
      atrPeriod: { type: "integer", default: 10, min: 2, max: 100 },
      multiplier: { type: "number", default: 2, min: 0.5, max: 5 },
      useSMA: { type: "boolean", default: true },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = KeltnerChannels.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        maPeriod: /** @type {number} */ (params.maPeriod),
        atrPeriod: /** @type {number} */ (params.atrPeriod),
        multiplier: /** @type {number} */ (params.multiplier),
        useSMA: /** @type {boolean} */ (params.useSMA),
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      const upper = latest && typeof latest === "object" ? latest.upper : NaN;
      const middle = latest && typeof latest === "object" ? latest.middle : NaN;
      const lower = latest && typeof latest === "object" ? latest.lower : NaN;
      const signal = bollingerSignal(close, upper, middle, lower);
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            {
              upper: values.map((v) => v.upper),
              middle: values.map((v) => v.middle),
              lower: values.map((v) => v.lower),
            },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },

  chandelier: {
    id: "chandelier",
    name: "Chandelier Exit",
    category: "volatility",
    inputs: "ohlc",
    params: {
      period: { type: "integer", default: 22, min: 2, max: 100 },
      multiplier: { type: "number", default: 3, min: 0.5, max: 10 },
    },
    compute(series, rawParams, { withSeries }) {
      const params = resolveParams(this.params, rawParams);
      const values = ChandelierExit.calculate({
        high: series.high,
        low: series.low,
        close: series.close,
        period: /** @type {number} */ (params.period),
        multiplier: /** @type {number} */ (params.multiplier),
      });
      const latest = lastOf(values);
      const close = series.close[series.close.length - 1];
      let signal = "insufficient_data";
      if (latest && typeof latest === "object" && Number.isFinite(close)) {
        const exitLong = latest.exitLong;
        const exitShort = latest.exitShort;
        if (Number.isFinite(exitLong) && close < exitLong) signal = "below_long_exit";
        else if (Number.isFinite(exitShort) && close > exitShort) signal = "above_short_exit";
        else signal = "within_range";
      }
      const seriesOut = withSeries
        ? alignMultiSeriesWithTimes(
            {
              exitLong: values.map((v) => v.exitLong),
              exitShort: values.map((v) => v.exitShort),
            },
            series.time,
          )
        : undefined;
      return makeResult(latest, signal, seriesOut, withSeries);
    },
  },
};

/**
 * @returns {Array<{ id: string; name: string; category: string; inputs: string; params: Record<string, unknown> }>}
 */
export function getIndicatorCatalog() {
  return Object.values(INDICATOR_REGISTRY).map((def) => ({
    id: def.id,
    name: def.name,
    category: def.category,
    inputs: def.inputs,
    params: def.params,
  }));
}

/**
 * @param {string} id
 * @returns {IndicatorDefinition | null}
 */
export function getIndicatorDefinition(id) {
  const key = String(id || "").trim().toLowerCase();
  return INDICATOR_REGISTRY[key] ?? null;
}

/**
 * @returns {string[]}
 */
export function listIndicatorIds() {
  return Object.keys(INDICATOR_REGISTRY);
}
