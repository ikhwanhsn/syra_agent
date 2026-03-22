/**
 * Professional Cryptocurrency Market Analysis Engine
 * Supports CoinGecko OHLC [[ms,o,h,l,c], ...] and OKX v5/v6 candles:
 *   { code, msg, data: [[ts,o,h,l,c,vol,volCcy,volCcyQuote,confirm], ...] }
 * OKX rows are strings; ts is ms. Quote volume uses volCcyQuote (index 7) when present.
 */

class CryptoAnalysisEngine {
  /**
   * Unwrap a row that might be a full OKX envelope instead of a single candle.
   * @param {unknown} row
   * @returns {unknown[]}
   */
  static unwrapOhlcEnvelope(row) {
    if (row == null) return [];
    if (Array.isArray(row)) return [row];
    if (typeof row === "object") {
      if (Array.isArray(row.data)) return row.data;
      if (Array.isArray(row.result)) return row.result;
    }
    return [];
  }

  /**
   * One candle -> internal OHLCV row.
   * CoinGecko: [timestamp_ms, open, high, low, close]
   * OKX: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm] (strings OK)
   * @param {unknown} candle
   * @param {string} instrumentName
   * @param {string} market
   */
  static normalizeCandleToOHLCV(candle, instrumentName, market) {
    if (candle == null) return null;
    let ts;
    let open;
    let high;
    let low;
    let close;
    let volume = 0;
    let quoteVolume = null;

    if (Array.isArray(candle)) {
      if (candle.length < 5) return null;
      ts = Number(candle[0]);
      open = parseFloat(String(candle[1]), 10);
      high = parseFloat(String(candle[2]), 10);
      low = parseFloat(String(candle[3]), 10);
      close = parseFloat(String(candle[4]), 10);
      if (candle.length > 5 && candle[5] !== "" && candle[5] != null) {
        volume = parseFloat(String(candle[5]), 10);
        if (Number.isNaN(volume)) volume = 0;
      }
      if (candle.length > 7 && candle[7] !== "" && candle[7] != null) {
        quoteVolume = parseFloat(String(candle[7]), 10);
        if (Number.isNaN(quoteVolume)) quoteVolume = null;
      }
    } else if (typeof candle === "object") {
      const o = /** @type {Record<string, unknown>} */ (candle);
      ts = Number(o.ts ?? o.time ?? o[0]);
      open = parseFloat(String(o.o ?? o.open ?? ""), 10);
      high = parseFloat(String(o.h ?? o.high ?? ""), 10);
      low = parseFloat(String(o.l ?? o.low ?? ""), 10);
      close = parseFloat(String(o.c ?? o.close ?? ""), 10);
      const v = o.vol ?? o.volume;
      if (v != null && v !== "") {
        volume = parseFloat(String(v), 10);
        if (Number.isNaN(volume)) volume = 0;
      }
      const qv = o.volCcyQuote ?? o.quoteVolume;
      if (qv != null && qv !== "") {
        quoteVolume = parseFloat(String(qv), 10);
        if (Number.isNaN(quoteVolume)) quoteVolume = null;
      }
    } else {
      return null;
    }

    if ([ts, open, high, low, close].some((v) => Number.isNaN(v))) return null;
    const qvFinal =
      quoteVolume != null && !Number.isNaN(quoteVolume) ? quoteVolume : volume * close;

    return {
      TIMESTAMP: ts / 1000,
      OPEN: open,
      HIGH: high,
      LOW: low,
      CLOSE: close,
      VOLUME: volume,
      VOLUME_BUY: volume ? volume * 0.5 : 0,
      VOLUME_SELL: volume ? volume * 0.5 : 0,
      QUOTE_VOLUME: qvFinal,
      INSTRUMENT: instrumentName,
      MARKET: market,
    };
  }

  constructor(ohlcData, instrumentName = "CRYPTO", market = "SPOT") {
    let rawData = ohlcData;

    // OKX / OKX DEX top-level envelope
    if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
      if (Array.isArray(rawData.data)) rawData = rawData.data;
      else if (Array.isArray(rawData.result)) rawData = rawData.result;
    }

    // n8n: [{ data: [{ json: ... }] }]
    if (Array.isArray(rawData) && rawData[0]?.data) {
      rawData = rawData[0].data.map((item) => item.json);
    } else if (Array.isArray(rawData) && rawData[0]?.json) {
      rawData = rawData.map((item) => item.json);
    }

    // Expand any row that is still a full OKX response object
    rawData = Array.isArray(rawData)
      ? rawData.flatMap((row) => CryptoAnalysisEngine.unwrapOhlcEnvelope(row))
      : [];

    this.data = rawData
      .map((candle) =>
        CryptoAnalysisEngine.normalizeCandleToOHLCV(candle, instrumentName, market)
      )
      .filter(Boolean)
      .sort((a, b) => a.TIMESTAMP - b.TIMESTAMP);

    this.closes = this.data.map((d) => d.CLOSE);
    this.highs = this.data.map((d) => d.HIGH);
    this.lows = this.data.map((d) => d.LOW);
    this.opens = this.data.map((d) => d.OPEN);
    this.volumes = this.data.map((d) => d.VOLUME);
  }
  // ===== TECHNICAL INDICATOR CALCULATIONS =====

  /**
   * Simple Moving Average
   */
  calculateSMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  /**
   * Exponential Moving Average
   */
  calculateEMA(data, period) {
    const result = [];
    const multiplier = 2 / (period + 1);

    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);

    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
    return result;
  }

  /**
   * Relative Strength Index (RSI)
   */
  calculateRSI(data, period = 14) {
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }

    const result = [];
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] >= 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgGain / (avgLoss || 0.0001);
    result.push(100 - 100 / (1 + rs));

    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change >= 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rs = avgGain / (avgLoss || 0.0001);
      result.push(100 - 100 / (1 + rs));
    }

    return result;
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const emaFast = this.calculateEMA(data, fastPeriod);
    const emaSlow = this.calculateEMA(data, slowPeriod);

    const offset = emaFast.length - emaSlow.length;
    const macdLine = [];

    for (let i = 0; i < emaSlow.length; i++) {
      macdLine.push(emaFast[i + offset] - emaSlow[i]);
    }

    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = [];
    const signalOffset = macdLine.length - signalLine.length;

    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + signalOffset] - signalLine[i]);
    }

    return {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1],
    };
  }

  /**
   * Bollinger Bands
   */
  calculateBollingerBands(data, period = 20, stdDev = 2) {
    const sma = this.calculateSMA(data, period);
    const result = [];

    for (let i = 0; i < sma.length; i++) {
      const dataSlice = data.slice(i, i + period);
      const mean = sma[i];

      const squaredDiffs = dataSlice.map((val) => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const std = Math.sqrt(variance);

      result.push({
        upper: mean + std * stdDev,
        middle: mean,
        lower: mean - std * stdDev,
      });
    }

    return result[result.length - 1];
  }

  /**
   * Average True Range (ATR)
   */
  calculateATR(period = 14) {
    const trueRanges = [];

    for (let i = 1; i < this.data.length; i++) {
      const high = this.highs[i];
      const low = this.lows[i];
      const prevClose = this.closes[i - 1];

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
    return atr;
  }

  /**
   * Stochastic Oscillator
   */
  calculateStochastic(period = 14, smoothK = 3) {
    const result = [];

    for (let i = period - 1; i < this.closes.length; i++) {
      const slice = {
        highs: this.highs.slice(i - period + 1, i + 1),
        lows: this.lows.slice(i - period + 1, i + 1),
        close: this.closes[i],
      };

      const highestHigh = Math.max(...slice.highs);
      const lowestLow = Math.min(...slice.lows);

      const k = ((slice.close - lowestLow) / (highestHigh - lowestLow)) * 100;
      result.push(k);
    }

    const smoothedK = this.calculateSMA(result, smoothK);

    return {
      k: smoothedK[smoothedK.length - 1],
      d: this.calculateSMA(smoothedK, 3).slice(-1)[0],
    };
  }

  /**
   * VWAP (Volume Weighted Average Price)
   */
  calculateVWAP() {
    let cumulativeTPV = 0;
    let cumulativeVolume = 0;
    const vwap = [];

    for (let i = 0; i < this.data.length; i++) {
      const typicalPrice = (this.highs[i] + this.lows[i] + this.closes[i]) / 3;
      cumulativeTPV += typicalPrice * this.volumes[i];
      cumulativeVolume += this.volumes[i];
      vwap.push(cumulativeTPV / cumulativeVolume);
    }

    return vwap[vwap.length - 1];
  }

  /**
   * ADX (Average Directional Index)
   */
  calculateADX(period = 14) {
    if (this.data.length < period * 2) {
      return { adx: 0, pdi: 0, mdi: 0, trendStrength: "NO TREND" };
    }

    const highs = this.highs;
    const lows = this.lows;
    const closes = this.closes;

    const plusDM = [0];
    const minusDM = [0];
    const trueRanges = [highs[0] - lows[0]];

    for (let i = 1; i < highs.length; i++) {
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];

      if (upMove > downMove && upMove > 0) {
        plusDM.push(upMove);
        minusDM.push(0);
      } else if (downMove > upMove && downMove > 0) {
        plusDM.push(0);
        minusDM.push(downMove);
      } else {
        plusDM.push(0);
        minusDM.push(0);
      }

      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }

    const smoothPlusDM = [plusDM.slice(0, period).reduce((a, b) => a + b, 0) / period];
    const smoothMinusDM = [minusDM.slice(0, period).reduce((a, b) => a + b, 0) / period];
    const smoothTR = [trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period];

    for (let i = period; i < highs.length; i++) {
      smoothPlusDM.push(
        (smoothPlusDM[smoothPlusDM.length - 1] * (period - 1) + plusDM[i]) / period
      );
      smoothMinusDM.push(
        (smoothMinusDM[smoothMinusDM.length - 1] * (period - 1) + minusDM[i]) / period
      );
      smoothTR.push((smoothTR[smoothTR.length - 1] * (period - 1) + trueRanges[i]) / period);
    }

    const plusDI = [];
    const minusDI = [];
    const dx = [];

    for (let i = 0; i < smoothTR.length; i++) {
      plusDI.push((smoothPlusDM[i] / smoothTR[i]) * 100);
      minusDI.push((smoothMinusDM[i] / smoothTR[i]) * 100);

      const diDiff = Math.abs(plusDI[i] - minusDI[i]);
      const diSum = plusDI[i] + minusDI[i];
      dx.push((diDiff / (diSum || 1)) * 100);
    }

    let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < dx.length; i++) {
      adx = (adx * (period - 1) + dx[i]) / period;
    }

    let trendStrength = "NO TREND";
    if (adx > 50) trendStrength = "EXTREMELY STRONG";
    else if (adx > 40) trendStrength = "VERY STRONG";
    else if (adx > 25) trendStrength = "STRONG";
    else if (adx > 20) trendStrength = "MODERATE";
    else if (adx > 10) trendStrength = "WEAK";

    return {
      adx,
      pdi: plusDI[plusDI.length - 1],
      mdi: minusDI[minusDI.length - 1],
      trendStrength,
      trendDirection:
        plusDI[plusDI.length - 1] > minusDI[minusDI.length - 1] ? "BULLISH" : "BEARISH",
      diCrossover:
        plusDI[plusDI.length - 1] > minusDI[minusDI.length - 1] &&
        plusDI[plusDI.length - 2] <= minusDI[minusDI.length - 2]
          ? "BULLISH CROSS"
          : plusDI[plusDI.length - 1] < minusDI[minusDI.length - 1] &&
              plusDI[plusDI.length - 2] >= minusDI[minusDI.length - 2]
            ? "BEARISH CROSS"
            : "NO CROSS",
    };
  }

  /**
   * MFI (Money Flow Index)
   */
  calculateMFI(period = 14) {
    if (this.data.length < period + 1) {
      return { mfi: 50, signal: "NEUTRAL", volumePressure: "BALANCED" };
    }

    const typicalPrices = [];
    const moneyFlows = [];

    for (let i = 0; i < this.data.length; i++) {
      const typicalPrice = (this.highs[i] + this.lows[i] + this.closes[i]) / 3;
      typicalPrices.push(typicalPrice);
      moneyFlows.push(typicalPrice * this.volumes[i]);
    }

    const positiveFlow = [];
    const negativeFlow = [];

    for (let i = 1; i < typicalPrices.length; i++) {
      if (typicalPrices[i] > typicalPrices[i - 1]) {
        positiveFlow.push(moneyFlows[i]);
        negativeFlow.push(0);
      } else if (typicalPrices[i] < typicalPrices[i - 1]) {
        positiveFlow.push(0);
        negativeFlow.push(moneyFlows[i]);
      } else {
        positiveFlow.push(0);
        negativeFlow.push(0);
      }
    }

    const mfiValues = [];

    for (let i = period - 1; i < positiveFlow.length; i++) {
      const periodPositive = positiveFlow.slice(i - period + 1, i + 1);
      const periodNegative = negativeFlow.slice(i - period + 1, i + 1);

      const sumPositive = periodPositive.reduce((a, b) => a + b, 0);
      const sumNegative = periodNegative.reduce((a, b) => a + b, 0);

      const moneyRatio = sumPositive / (sumNegative || 0.0001);
      const mfi = 100 - 100 / (1 + moneyRatio);
      mfiValues.push(mfi);
    }

    const currentMFI = mfiValues[mfiValues.length - 1];

    let signal = "NEUTRAL";
    let volumePressure = "BALANCED";

    if (currentMFI > 80) {
      signal = "OVERBOUGHT";
      volumePressure = "STRONG SELLING PRESSURE";
    } else if (currentMFI > 70) {
      signal = "BULLISH EXHAUSTION";
      volumePressure = "MODERATE SELLING PRESSURE";
    } else if (currentMFI < 20) {
      signal = "OVERSOLD";
      volumePressure = "STRONG BUYING PRESSURE";
    } else if (currentMFI < 30) {
      signal = "BEARISH EXHAUSTION";
      volumePressure = "MODERATE BUYING PRESSURE";
    } else if (currentMFI > 50) {
      signal = "BULLISH";
      volumePressure = "POSITIVE FLOW";
    } else {
      signal = "BEARISH";
      volumePressure = "NEGATIVE FLOW";
    }

    return {
      mfi: currentMFI,
      signal,
      volumePressure,
      divergence: this.calculateMFIDivergence(mfiValues, this.closes, period),
      trend: currentMFI > 50 ? "BULLISH" : "BEARISH",
    };
  }

  calculateMFIDivergence(mfiValues, prices, period) {
    if (mfiValues.length < 10) return "NO DIVERGENCE";

    const recentMFI = mfiValues.slice(-8);
    const recentPrices = prices.slice(-8 - period);

    const mfiHigh = Math.max(...recentMFI);
    const mfiLow = Math.min(...recentMFI);
    const priceHigh = Math.max(...recentPrices);
    const priceLow = Math.min(...recentPrices);

    const currentMFI = recentMFI[recentMFI.length - 1];
    const currentPrice = recentPrices[recentPrices.length - 1];

    if (currentPrice <= priceLow && currentMFI > mfiLow + 5) {
      return "BULLISH DIVERGENCE";
    }
    if (currentPrice >= priceHigh && currentMFI < mfiHigh - 5) {
      return "BEARISH DIVERGENCE";
    }

    return "NO DIVERGENCE";
  }

  calculateSupportResistance() {
    const lookback = Math.min(50, this.data.length);
    const recentData = this.data.slice(-lookback);

    const highs = [];
    const lows = [];

    for (let i = 2; i < recentData.length - 2; i++) {
      if (
        recentData[i].HIGH > recentData[i - 1].HIGH &&
        recentData[i].HIGH > recentData[i - 2].HIGH &&
        recentData[i].HIGH > recentData[i + 1].HIGH &&
        recentData[i].HIGH > recentData[i + 2].HIGH
      ) {
        highs.push(recentData[i].HIGH);
      }

      if (
        recentData[i].LOW < recentData[i - 1].LOW &&
        recentData[i].LOW < recentData[i - 2].LOW &&
        recentData[i].LOW < recentData[i + 1].LOW &&
        recentData[i].LOW < recentData[i + 2].LOW
      ) {
        lows.push(recentData[i].LOW);
      }
    }

    const resistance = highs.length > 0 ? Math.max(...highs) : this.highs[this.highs.length - 1];
    const support = lows.length > 0 ? Math.min(...lows) : this.lows[this.lows.length - 1];

    return { support, resistance };
  }

  calculateIndicators() {
    const currentPrice = this.closes[this.closes.length - 1];

    const sma20 = this.calculateSMA(this.closes, Math.min(20, this.closes.length - 1));
    const sma50 = this.calculateSMA(this.closes, Math.min(50, this.closes.length - 1));
    const ema12 = this.calculateEMA(this.closes, Math.min(12, this.closes.length - 1));
    const ema26 = this.calculateEMA(this.closes, Math.min(26, this.closes.length - 1));
    const rsi = this.calculateRSI(this.closes, Math.min(14, Math.floor(this.closes.length / 2)));
    const macd = this.calculateMACD(
      this.closes,
      Math.min(12, this.closes.length - 1),
      Math.min(26, this.closes.length - 1),
      Math.min(9, this.closes.length - 1)
    );
    const bb = this.calculateBollingerBands(this.closes, Math.min(20, this.closes.length - 1), 2);
    const atr = this.calculateATR(Math.min(14, this.closes.length - 1));
    const stochastic = this.calculateStochastic(Math.min(14, this.closes.length - 1), 3);
    const vwap = this.calculateVWAP();
    const { support, resistance } = this.calculateSupportResistance();

    const adx = this.calculateADX(Math.min(14, Math.floor(this.closes.length / 2)));
    const mfi = this.calculateMFI(Math.min(14, Math.floor(this.closes.length / 2)));

    return {
      currentPrice,
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      ema12: ema12[ema12.length - 1],
      ema26: ema26[ema26.length - 1],
      rsi: rsi[rsi.length - 1],
      macd,
      bb,
      atr,
      stochastic,
      vwap,
      support,
      resistance,
      adx,
      mfi,
    };
  }

  analyzeTrend(indicators) {
    const { currentPrice, sma20, sma50, ema12, ema26, adx } = indicators;

    let trendScore = 0;
    const trendSignals = [];
    let clearSignal = null;

    const priceAboveSMA20 = currentPrice > sma20;
    const priceAboveSMA50 = currentPrice > sma50;
    const emaBullish = ema12 > ema26;

    const strongTrend = adx.adx > 20;
    const trendDirection = adx.trendDirection;

    if (priceAboveSMA20 && priceAboveSMA50 && emaBullish) {
      trendScore += 5;
      trendSignals.push("TRIPLE BULLISH: Price above both SMAs + EMA Golden Cross");

      if (strongTrend && trendDirection === "BULLISH") {
        trendScore += 2;
        trendSignals.push(`ADX CONFIRMATION: Strong uptrend (ADX: ${adx.adx.toFixed(2)})`);
        clearSignal = "BUY";
      } else if (!strongTrend) {
        trendSignals.push("WARNING: Weak trend strength - wait for ADX > 20");
      }
    } else if (!priceAboveSMA20 && !priceAboveSMA50 && !emaBullish) {
      trendScore -= 5;
      trendSignals.push("TRIPLE BEARISH: Price below both SMAs + EMA Death Cross");

      if (strongTrend && trendDirection === "BEARISH") {
        trendScore -= 2;
        trendSignals.push(`ADX CONFIRMATION: Strong downtrend (ADX: ${adx.adx.toFixed(2)})`);
        clearSignal = "SELL";
      } else if (!strongTrend) {
        trendSignals.push("WARNING: Weak trend strength - wait for ADX > 20");
      }
    } else if (priceAboveSMA20 && emaBullish) {
      trendScore += 3;
      trendSignals.push("DOUBLE BULLISH: Price above SMA20 + EMA Golden Cross");
      if (strongTrend && trendDirection === "BULLISH") {
        clearSignal = "BUY";
      }
    } else if (!priceAboveSMA20 && !emaBullish) {
      trendScore -= 3;
      trendSignals.push("DOUBLE BEARISH: Price below SMA20 + EMA Death Cross");
      if (strongTrend && trendDirection === "BEARISH") {
        clearSignal = "SELL";
      }
    } else {
      trendSignals.push("MIXED SIGNALS: Wait for confirmation");
    }

    if (adx.diCrossover === "BULLISH CROSS") {
      trendScore += 2;
      trendSignals.push("BULLISH DI CROSSOVER: +DI crossed above -DI");
      if (!clearSignal && strongTrend) clearSignal = "BUY";
    } else if (adx.diCrossover === "BEARISH CROSS") {
      trendScore -= 2;
      trendSignals.push("BEARISH DI CROSSOVER: -DI crossed above +DI");
      if (!clearSignal && strongTrend) clearSignal = "SELL";
    }

    let trend = "NEUTRAL";
    if (trendScore >= 4) trend = "STRONG BULLISH";
    else if (trendScore >= 2) trend = "BULLISH";
    else if (trendScore <= -4) trend = "STRONG BEARISH";
    else if (trendScore <= -2) trend = "BEARISH";

    return { trend, trendScore, trendSignals, clearSignal, adxStrength: adx.trendStrength };
  }

  analyzeMomentum(indicators) {
    const { rsi, macd, stochastic, currentPrice, vwap, mfi } = indicators;

    let momentumScore = 0;
    const momentumSignals = [];
    const signals = [];
    let clearSignal = null;

    const rsiOversold = rsi < 35;
    const rsiOverbought = rsi > 65;
    const macdBullish = macd.macd > macd.signal && macd.macd > 0;
    const stochasticOversold = stochastic.k < 25;
    const priceAboveVWAP = currentPrice > vwap;

    const mfiOversold = mfi.mfi < 25;
    const mfiOverbought = mfi.mfi > 75;
    const mfiBullish = mfi.mfi > 50;
    const mfiBearish = mfi.mfi < 50;

    if (rsiOversold && macdBullish && stochasticOversold && mfiOversold) {
      momentumScore += 5;
      momentumSignals.push(
        "QUADRUPLE MOMENTUM BUY: RSI oversold + MACD bullish + Stochastic oversold + MFI oversold"
      );
      signals.push({
        type: "BUY",
        strength: "VERY STRONG",
        reason: "All momentum indicators bullish with volume confirmation",
      });
      clearSignal = "BUY";
    } else if (rsiOverbought && !macdBullish && stochastic.k > 75 && mfiOverbought) {
      momentumScore -= 5;
      momentumSignals.push(
        "QUADRUPLE MOMENTUM SELL: RSI overbought + MACD bearish + Stochastic overbought + MFI overbought"
      );
      signals.push({
        type: "SELL",
        strength: "VERY STRONG",
        reason: "All momentum indicators bearish with volume confirmation",
      });
      clearSignal = "SELL";
    } else if (rsiOversold && priceAboveVWAP && mfiBullish) {
      momentumScore += 4;
      momentumSignals.push("TRIPLE MOMENTUM BUY: RSI oversold + Price above VWAP + MFI bullish");
      signals.push({
        type: "BUY",
        strength: "STRONG",
        reason: "RSI oversold with VWAP support and bullish volume",
      });
      if (!clearSignal) clearSignal = "BUY";
    } else if (rsiOverbought && !priceAboveVWAP && mfiBearish) {
      momentumScore -= 4;
      momentumSignals.push("TRIPLE MOMENTUM SELL: RSI overbought + Price below VWAP + MFI bearish");
      signals.push({
        type: "SELL",
        strength: "STRONG",
        reason: "RSI overbought with VWAP resistance and bearish volume",
      });
      if (!clearSignal) clearSignal = "SELL";
    } else if (mfi.divergence === "BULLISH DIVERGENCE" && (rsiOversold || stochasticOversold)) {
      momentumScore += 3;
      momentumSignals.push(
        "BULLISH MFI DIVERGENCE: Price making lower lows but MFI making higher lows"
      );
      signals.push({
        type: "BUY",
        strength: "MODERATE",
        reason: "Bullish divergence with momentum oversold",
      });
      if (!clearSignal) clearSignal = "BUY";
    } else if (mfi.divergence === "BEARISH DIVERGENCE" && (rsiOverbought || stochastic.k > 75)) {
      momentumScore -= 3;
      momentumSignals.push(
        "BEARISH MFI DIVERGENCE: Price making higher highs but MFI making lower highs"
      );
      signals.push({
        type: "SELL",
        strength: "MODERATE",
        reason: "Bearish divergence with momentum overbought",
      });
      if (!clearSignal) clearSignal = "SELL";
    } else if (rsiOversold || mfiOversold) {
      momentumScore += 1;
      momentumSignals.push("Oversold conditions - Potential bounce");
    } else if (rsiOverbought || mfiOverbought) {
      momentumScore -= 1;
      momentumSignals.push("Overbought conditions - Potential pullback");
    }

    if (priceAboveVWAP) {
      momentumScore += 1;
      momentumSignals.push("Price above VWAP - Bullish intraday momentum");
    } else {
      momentumScore -= 1;
      momentumSignals.push("Price below VWAP - Bearish intraday momentum");
    }

    momentumSignals.push(`MFI Volume Pressure: ${mfi.volumePressure}`);

    return {
      momentumScore,
      momentumSignals,
      signals,
      clearSignal,
      mfiSignal: mfi.signal,
    };
  }

  generateRecommendation(trend, momentum, volatility, volume) {
    let action = "HOLD";
    let confidence = "MEDIUM";
    const reasoning = [];
    let clearSignal = null;

    const buySignals = [];
    const sellSignals = [];

    if (trend.clearSignal === "BUY") buySignals.push("Trend");
    if (trend.clearSignal === "SELL") sellSignals.push("Trend");

    if (momentum.clearSignal === "BUY") buySignals.push("Momentum");
    if (momentum.clearSignal === "SELL") sellSignals.push("Momentum");

    if (volatility.tradingSignal === "BUY") buySignals.push("Volatility");
    if (volatility.tradingSignal === "SELL") sellSignals.push("Volatility");

    if (volume.volumeTradingSignal === "BUY") buySignals.push("Volume");
    if (volume.volumeTradingSignal === "SELL") sellSignals.push("Volume");

    const strongTrend = trend.adxStrength !== "WEAK" && trend.adxStrength !== "NO TREND";
    const veryStrongTrend = trend.adxStrength === "STRONG" || trend.adxStrength === "VERY STRONG";

    if (buySignals.length >= 3 && strongTrend) {
      action = veryStrongTrend ? "VERY STRONG BUY" : "STRONG BUY";
      confidence = "HIGH";
      clearSignal = "BUY";
      reasoning.push(`Multiple confirmations: ${buySignals.join(", ")}`);
      reasoning.push(`ADX Trend Strength: ${trend.adxStrength}`);
      reasoning.push("High probability long setup with trend confirmation");
    } else if (sellSignals.length >= 3 && strongTrend) {
      action = veryStrongTrend ? "VERY STRONG SELL" : "STRONG SELL";
      confidence = "HIGH";
      clearSignal = "SELL";
      reasoning.push(`Multiple confirmations: ${sellSignals.join(", ")}`);
      reasoning.push(`ADX Trend Strength: ${trend.adxStrength}`);
      reasoning.push("High probability short setup with trend confirmation");
    } else if (buySignals.length >= 2 && strongTrend) {
      action = "BUY";
      confidence = "MEDIUM";
      clearSignal = "BUY";
      reasoning.push(`Moderate confirmations: ${buySignals.join(", ")}`);
      reasoning.push(`ADX Trend Strength: ${trend.adxStrength}`);
    } else if (sellSignals.length >= 2 && strongTrend) {
      action = "SELL";
      confidence = "MEDIUM";
      clearSignal = "SELL";
      reasoning.push(`Moderate confirmations: ${sellSignals.join(", ")}`);
      reasoning.push(`ADX Trend Strength: ${trend.adxStrength}`);
    } else if (buySignals.length >= 3 && !strongTrend) {
      action = "CAUTIOUS BUY";
      confidence = "LOW";
      clearSignal = "BUY";
      reasoning.push(`Multiple signals but weak trend: ${buySignals.join(", ")}`);
      reasoning.push("WARNING: Low ADX - Market may be ranging");
    } else if (sellSignals.length >= 3 && !strongTrend) {
      action = "CAUTIOUS SELL";
      confidence = "LOW";
      clearSignal = "SELL";
      reasoning.push(`Multiple signals but weak trend: ${sellSignals.join(", ")}`);
      reasoning.push("WARNING: Low ADX - Market may be ranging");
    } else {
      action = "HOLD";
      reasoning.push("Insufficient confirmations - Wait for clearer signals");
      reasoning.push(`Current signals: BUY(${buySignals.length}) vs SELL(${sellSignals.length})`);
      reasoning.push(`ADX Trend Strength: ${trend.adxStrength}`);
    }

    if (momentum.mfiSignal === "OVERBOUGHT" && action.includes("BUY")) {
      reasoning.push("WARNING: MFI shows overbought - Consider waiting for pullback");
      if (confidence === "HIGH") confidence = "MEDIUM";
    } else if (momentum.mfiSignal === "OVERSOLD" && action.includes("SELL")) {
      reasoning.push("WARNING: MFI shows oversold - Consider waiting for bounce");
      if (confidence === "HIGH") confidence = "MEDIUM";
    } else if (momentum.mfiSignal === "BULLISH" && action.includes("BUY")) {
      reasoning.push("CONFIRMATION: MFI shows bullish volume flow");
    } else if (momentum.mfiSignal === "BEARISH" && action.includes("SELL")) {
      reasoning.push("CONFIRMATION: MFI shows bearish volume flow");
    }

    if (volatility.volatilityLevel === "HIGH" && action.includes("BUY")) {
      reasoning.push("High volatility - Use smaller position size");
      if (confidence === "HIGH") confidence = "MEDIUM";
    }

    if (volume.volumeSignal === "LOW" && action !== "HOLD") {
      reasoning.push("Low volume - Confirm with price action");
      if (confidence === "HIGH") confidence = "MEDIUM";
    }

    return { action, confidence, reasoning, clearSignal };
  }

  analyze() {
    const indicators = this.calculateIndicators();
    const trend = this.analyzeTrend(indicators);
    const momentum = this.analyzeMomentum(indicators);
    const volatility = this.analyzeVolatility(indicators);
    const volume = this.analyzeVolume();
    const targets = this.calculateTargets(indicators);
    const recommendation = this.generateRecommendation(trend, momentum, volatility, volume);
    const risk = this.calculateRiskMetrics(indicators, targets);

    const latestData = this.data[this.data.length - 1];
    const previousData = this.data[this.data.length - 2];
    const priceChange = ((latestData.CLOSE - previousData.CLOSE) / previousData.CLOSE) * 100;

    const finalSignal = recommendation.clearSignal || "HOLD";
    const signalStrength = recommendation.confidence;

    return {
      metadata: {
        instrument: latestData.INSTRUMENT,
        market: latestData.MARKET,
        timestamp: this.formatTimestamp(latestData.TIMESTAMP),
        analysisDate: new Date().toISOString().slice(0, 19),
        dataPoints: this.data.length,
        TRADING_SIGNAL: finalSignal,
        SIGNAL_STRENGTH: signalStrength,
      },

      marketOverview: {
        currentPrice: indicators.currentPrice.toFixed(2),
        priceChange24h: priceChange.toFixed(2) + "%",
        high24h: latestData.HIGH.toFixed(2),
        low24h: latestData.LOW.toFixed(2),
        volume24h: latestData.VOLUME.toFixed(4),
        quoteVolume24h: latestData.QUOTE_VOLUME.toFixed(2),
      },

      technicalIndicators: {
        rsi: indicators.rsi.toFixed(2),
        macd: {
          value: indicators.macd.macd.toFixed(2),
          signal: indicators.macd.signal.toFixed(2),
          histogram: indicators.macd.histogram.toFixed(2),
        },
        movingAverages: {
          sma20: indicators.sma20.toFixed(2),
          sma50: indicators.sma50.toFixed(2),
          ema12: indicators.ema12.toFixed(2),
          ema26: indicators.ema26.toFixed(2),
        },
        bollingerBands: {
          upper: indicators.bb.upper.toFixed(2),
          middle: indicators.bb.middle.toFixed(2),
          lower: indicators.bb.lower.toFixed(2),
        },
        vwap: indicators.vwap.toFixed(2),
        support: indicators.support.toFixed(2),
        resistance: indicators.resistance.toFixed(2),
        adx: {
          value: indicators.adx.adx.toFixed(2),
          trendStrength: indicators.adx.trendStrength,
          pdi: indicators.adx.pdi.toFixed(2),
          mdi: indicators.adx.mdi.toFixed(2),
          trendDirection: indicators.adx.trendDirection,
          diCrossover: indicators.adx.diCrossover,
        },
        mfi: {
          value: indicators.mfi.mfi.toFixed(2),
          signal: indicators.mfi.signal,
          volumePressure: indicators.mfi.volumePressure,
          divergence: indicators.mfi.divergence,
          trend: indicators.mfi.trend,
        },
      },

      trendAnalysis: {
        trend: trend.trend,
        score: trend.trendScore,
        signals: trend.trendSignals,
        clearSignal: trend.clearSignal,
        adxStrength: trend.adxStrength,
      },

      momentumAnalysis: {
        score: momentum.momentumScore,
        signals: momentum.momentumSignals,
        actionableSignals: momentum.signals,
        clearSignal: momentum.clearSignal,
        mfiSignal: momentum.mfiSignal,
      },

      volatilityAnalysis: {
        level: volatility.volatilityLevel,
        atrPercent: volatility.atrPercent + "%",
        bollingerWidth: volatility.bbWidth + "%",
        pricePositionInBB: volatility.bbPosition + "%",
        signals: volatility.riskSignals,
        tradingSignal: volatility.tradingSignal,
      },

      volumeAnalysis: {
        signal: volume.volumeSignal,
        volumeRatio: volume.volumeRatio + "x",
        signals: volume.volumeSignals,
        volumeTradingSignal: volume.volumeTradingSignal,
      },

      tradingRecommendation: {
        action: recommendation.action,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        clearSignal: recommendation.clearSignal,
      },

      priceTargets: targets,
      riskManagement: risk,
      actionPlan: this.generateActionPlan(recommendation, targets, risk),

      quickSummary: {
        signal: finalSignal,
        entry: finalSignal === "BUY" ? targets.longEntry : targets.shortEntry,
        stopLoss: finalSignal === "BUY" ? targets.longStopLoss : targets.shortStopLoss,
        firstTarget: finalSignal === "BUY" ? targets.longTarget1 : targets.shortTarget1,
        confidence: signalStrength,
        riskReward: risk.riskRewardRatio,
        trendStrength: indicators.adx.trendStrength,
        volumeConfirmation: indicators.mfi.signal,
      },
    };
  }

  analyzeVolatility(indicators) {
    const { currentPrice, bb, atr } = indicators;

    let volatilityLevel = "MODERATE";
    const riskSignals = [];
    let tradingSignal = null;

    const bbWidth = ((bb.upper - bb.lower) / bb.middle) * 100;
    const bbPosition = ((currentPrice - bb.lower) / (bb.upper - bb.lower)) * 100;
    const atrPercent = (atr / currentPrice) * 100;

    if (bbWidth < 4 && atrPercent < 2) {
      volatilityLevel = "LOW";
      riskSignals.push("BOLLINGER BAND SQUEEZE: High probability breakout setup - Watch for direction");
    } else if (bbWidth > 8) {
      volatilityLevel = "HIGH";
      riskSignals.push("HIGH VOLATILITY: Larger stops required - Consider smaller position size");
    }

    if (bbPosition < 10) {
      riskSignals.push("PRICE AT LOWER BB: Strong support - Potential BUY setup");
      tradingSignal = "BUY";
    } else if (bbPosition > 90) {
      riskSignals.push("PRICE AT UPPER BB: Strong resistance - Potential SELL setup");
      tradingSignal = "SELL";
    } else if (bbPosition < 30 && currentPrice > bb.lower) {
      riskSignals.push("PRICE BOUNCING FROM LOWER BB: Bullish reversal signal");
      if (!tradingSignal) tradingSignal = "BUY";
    } else if (bbPosition > 70 && currentPrice < bb.upper) {
      riskSignals.push("PRICE REJECTING UPPER BB: Bearish reversal signal");
      if (!tradingSignal) tradingSignal = "SELL";
    }

    return {
      volatilityLevel,
      atrPercent: atrPercent.toFixed(2),
      bbWidth: bbWidth.toFixed(2),
      bbPosition: bbPosition.toFixed(2),
      riskSignals,
      tradingSignal,
    };
  }

  analyzeVolume() {
    const recentData = this.data.slice(-Math.min(20, this.data.length));
    const avgVolume = recentData.reduce((sum, d) => sum + d.VOLUME, 0) / recentData.length;
    const currentVolume = recentData[recentData.length - 1].VOLUME;

    const volumeRatio = currentVolume / avgVolume;
    let volumeSignal = "NEUTRAL";
    const volumeSignals = [];
    let volumeTradingSignal = null;

    if (volumeRatio > 2.0) {
      volumeSignal = "VERY HIGH";
      volumeSignals.push("VOLUME SURGE 200%+: Strong institutional interest - Confirm direction");
    } else if (volumeRatio > 1.5) {
      volumeSignal = "HIGH";
      volumeSignals.push("VOLUME SPIKE 150%+: Significant market movement");
    } else if (volumeRatio < 0.5) {
      volumeSignal = "VERY LOW";
      volumeSignals.push("LOW VOLUME 50%-: Weak participation - Wait for confirmation");
    }

    const priceChange =
      ((recentData[recentData.length - 1].CLOSE - recentData[recentData.length - 2].CLOSE) /
        recentData[recentData.length - 2].CLOSE) *
      100;

    if (volumeRatio > 1.5 && priceChange > 1) {
      volumeSignals.push("HIGH VOLUME + PRICE UP: Strong BUY confirmation");
      volumeTradingSignal = "BUY";
    } else if (volumeRatio > 1.5 && priceChange < -1) {
      volumeSignals.push("HIGH VOLUME + PRICE DOWN: Strong SELL confirmation");
      volumeTradingSignal = "SELL";
    } else if (volumeRatio < 0.7 && Math.abs(priceChange) < 0.5) {
      volumeSignals.push("LOW VOLUME + SIDEWAYS: Consolidation - Wait for breakout");
    }

    return {
      volumeSignal,
      volumeRatio: volumeRatio.toFixed(2),
      volumeSignals,
      volumeTradingSignal,
    };
  }

  calculateTargets(indicators) {
    const { currentPrice, bb, atr, support, resistance } = indicators;

    const atrMultiplier = 1.5;

    return {
      support: support.toFixed(2),
      resistance: resistance.toFixed(2),
      longEntry: currentPrice.toFixed(2),
      longStopLoss: Math.min(currentPrice - atr * atrMultiplier, support).toFixed(2),
      longTarget1: (currentPrice + atr * 2).toFixed(2),
      longTarget2: (currentPrice + atr * 3).toFixed(2),
      longTarget3: resistance,
      shortEntry: currentPrice.toFixed(2),
      shortStopLoss: Math.max(currentPrice + atr * atrMultiplier, resistance).toFixed(2),
      shortTarget1: (currentPrice - atr * 2).toFixed(2),
      shortTarget2: (currentPrice - atr * 3).toFixed(2),
      shortTarget3: support,
      bbUpper: bb.upper.toFixed(2),
      bbMiddle: bb.middle.toFixed(2),
      bbLower: bb.lower.toFixed(2),
      atr: atr.toFixed(2),
    };
  }

  calculateRiskMetrics(indicators, targets) {
    const { currentPrice, atr } = indicators;

    const riskPerTrade = 1.5;
    const accountSize = 10000;
    const stopLossDistance = Math.abs(currentPrice - targets.longStopLoss);
    const positionSize = (accountSize * (riskPerTrade / 100)) / stopLossDistance;
    const positionValue = positionSize * currentPrice;

    const rewardRiskRatio = ((targets.longTarget1 - currentPrice) / stopLossDistance).toFixed(2);

    return {
      recommendedRiskPerTrade: `${riskPerTrade}%`,
      suggestedStopLoss: stopLossDistance.toFixed(2),
      maxPositionSize: Math.min(positionSize, 1000 / currentPrice).toFixed(4),
      maxPositionValue: Math.min(positionValue, 1000).toFixed(2),
      riskRewardRatio: `1:${rewardRiskRatio}`,
      atrMultiple: (stopLossDistance / atr).toFixed(1),
    };
  }

  generateActionPlan(recommendation, targets, risk) {
    const plan = {
      immediateActions: [],
      entryStrategy: [],
      exitStrategy: [],
      riskManagement: [],
      warnings: [],
    };

    if (recommendation.clearSignal === "BUY") {
      plan.immediateActions = [
        "READY TO ENTER LONG POSITION",
        `BUY at: ${targets.longEntry}`,
        `STOP LOSS: ${targets.longStopLoss} (Risk: ${risk.suggestedStopLoss} points)`,
        `MAX POSITION: ${risk.maxPositionSize} units ($${risk.maxPositionValue})`,
      ];

      plan.entryStrategy = [
        "Enter 50% position at current price",
        "Add 25% if price retests support",
        "Add 25% on break above resistance",
        "Wait for 1-minute candle close above entry",
      ];

      plan.exitStrategy = [
        `TAKE PROFIT 1: ${targets.longTarget1} (33% of position)`,
        `TAKE PROFIT 2: ${targets.longTarget2} (33% of position)`,
        `TAKE PROFIT 3: ${targets.longTarget3} (34% of position)`,
        "Move stop to breakeven after Target 1",
        "Trail stop loss after Target 2",
      ];

      plan.riskManagement = [
        `Risk/Reward: ${risk.riskRewardRatio}`,
        "Never risk more than 1.5% per trade",
        "Monitor volume for confirmation",
        "Exit if fundamental news contradicts",
      ];
    } else if (recommendation.clearSignal === "SELL") {
      plan.immediateActions = [
        "READY TO ENTER SHORT POSITION",
        `SELL at: ${targets.shortEntry}`,
        `STOP LOSS: ${targets.shortStopLoss} (Risk: ${risk.suggestedStopLoss} points)`,
        `MAX POSITION: ${risk.maxPositionSize} units ($${risk.maxPositionValue})`,
      ];

      plan.entryStrategy = [
        "Enter 50% position at current price",
        "Add 25% if price retests resistance",
        "Add 25% on break below support",
        "Wait for 1-minute candle close below entry",
      ];

      plan.exitStrategy = [
        `TAKE PROFIT 1: ${targets.shortTarget1} (33% of position)`,
        `TAKE PROFIT 2: ${targets.shortTarget2} (33% of position)`,
        `TAKE PROFIT 3: ${targets.shortTarget3} (34% of position)`,
        "Move stop to breakeven after Target 1",
        "Trail stop loss after Target 2",
      ];
    } else {
      plan.immediateActions = [
        "WAIT FOR BETTER SETUP",
        `Monitor support: ${targets.support}`,
        `Monitor resistance: ${targets.resistance}`,
        "Wait for volume confirmation",
      ];

      plan.entryStrategy = [
        "Set price alerts at key levels",
        "Wait for multiple timeframe alignment",
        "Confirm with volume spike",
      ];
    }

    plan.warnings = [
      "ALWAYS USE STOP LOSSES",
      "Maximum 1.5% risk per trade",
      "Verify with higher timeframe analysis",
      "Market conditions can change rapidly",
    ];

    return plan;
  }

  formatTimestamp(unix) {
    const date = new Date(unix * 1000);
    return date.toISOString().replace("T", " ").slice(0, 19);
  }
}

export { CryptoAnalysisEngine };

/*
 * ===== n8n Code node (OKX HTTP response) =====
 * Pass the full JSON body from OKX (includes code, msg, data).
 *
 * const inputData = $input.first().json;
 * const instId = 'BTC-USDT'; // or from prior node
 * const analyzer = new CryptoAnalysisEngine(inputData, instId, 'OKX');
 * const report = analyzer.analyze();
 * return [{ json: report }];
 *
 * CoinGecko OHLC array still works: pass the array or [[ms,o,h,l,c],...] as first arg.
 *
 * Node (this repo uses "type": "module"):
 *   import { CryptoAnalysisEngine } from './cryptoAnalysisEngine.js';
 *
 * CommonJS (e.g. some n8n setups): rename this file to .cjs and use module.exports instead of export.
 */
