/**
 * Shared Binance OHLC → Pearson correlation matrix (extracted for BTC dashboard + correlation route).
 */

export function normalizeOHLC(data) {
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    time: c.time,
    close: parseFloat(c.close),
  }));
}

export function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const r = Math.log(prices[i].close / prices[i - 1].close);
    returns.push({ time: prices[i].time, value: r });
  }
  return returns;
}

export function alignSeries(seriesMap) {
  const keys = Object.keys(seriesMap);
  if (keys.length === 0) return {};
  const firstSeries = seriesMap[keys[0]];
  if (!Array.isArray(firstSeries)) return {};
  const timestamps = firstSeries.map((p) => p.time);
  const aligned = {};

  for (const [symbol, series] of Object.entries(seriesMap)) {
    const map = new Map(series.map((p) => [p.time, p.value]));
    aligned[symbol] = timestamps.map((t) => map.get(t)).filter((v) => v !== undefined);
  }

  return aligned;
}

export function pearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

export function buildCorrelationMatrix(returnsMap) {
  const tokens = Object.keys(returnsMap);
  const matrix = {};

  for (let i = 0; i < tokens.length; i++) {
    const t1 = tokens[i];
    matrix[t1] = {};

    for (let j = i; j < tokens.length; j++) {
      const t2 = tokens[j];
      const corr = t1 === t2 ? 1 : pearsonCorrelation(returnsMap[t1], returnsMap[t2]);

      matrix[t1][t2] = +corr.toFixed(4);
      if (!matrix[t2]) matrix[t2] = {};
      matrix[t2][t1] = +corr.toFixed(4);
    }
  }

  return matrix;
}

/** @param {{ results?: Array<{ symbol: string; success: boolean; data?: unknown[] }> }} ohlcPayload */
export function computeCorrelationFromOHLC(ohlcPayload) {
  const results = ohlcPayload?.results;
  if (!Array.isArray(results)) return null;

  const seriesMap = {};
  for (const item of results) {
    if (!item || !item.success || !item.data) continue;
    const prices = normalizeOHLC(item.data);
    if (prices.length < 2) continue;
    const returns = calculateReturns(prices);
    seriesMap[item.symbol] = returns;
  }

  const alignedReturns = alignSeries(seriesMap);
  const tokens = Object.keys(alignedReturns);
  if (tokens.length === 0) return null;

  return buildCorrelationMatrix(alignedReturns);
}

export const BTC_CORRELATION_SYMBOLS =
  "BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,AVAXUSDT,DOGEUSDT,LINKUSDT";

/** Full ticker list for paid correlation route + analytics summary. */
export const BINANCE_CORRELATION_TICKER =
  "BTCUSDT,ETHUSDT,BNBUSDT,SOLUSDT,XRPUSDT,ADAUSDT,AVAXUSDT,DOGEUSDT,DOTUSDT,LINKUSDT,MATICUSDT,OPUSDT,ARBUSDT,NEARUSDT,ATOMUSDT,FTMUSDT,INJUSDT,SUIUSDT,SEIUSDT,APTUSDT,RNDRUSDT,FETUSDT,UNIUSDT,AAVEUSDT,LDOUSDT,PENDLEUSDT,MKRUSDT,SNXUSDT,LTCUSDT,BCHUSDT,ETCUSDT,TRXUSDT,XLMUSDT,SHIBUSDT,PEPEUSDT,TIAUSDT,ORDIUSDT,STXUSDT,FILUSDT,ICPUSDT,HBARUSDT,VETUSDT,GRTUSDT,THETAUSDT,EGLDUSDT,ALGOUSDT,FLOWUSDT,SANDUSDT,MANAUSDT,AXSUSDT";

const SYMBOL_LABELS = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  BNBUSDT: "BNB",
  SOLUSDT: "SOL",
  XRPUSDT: "XRP",
  ADAUSDT: "ADA",
  AVAXUSDT: "AVAX",
  DOGEUSDT: "DOGE",
  LINKUSDT: "LINK",
};

/** @param {Record<string, Record<string, number>> | null} matrix */
export function btcCorrelationPairs(matrix) {
  if (!matrix?.BTCUSDT) return [];
  const row = matrix.BTCUSDT;
  return Object.entries(row)
    .filter(([sym]) => sym !== "BTCUSDT")
    .map(([symbol, correlation]) => ({
      symbol,
      label: SYMBOL_LABELS[symbol] ?? symbol.replace("USDT", ""),
      correlation,
    }))
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}
