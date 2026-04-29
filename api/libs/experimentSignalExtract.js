/**
 * Shared parsing of CryptoAnalysisEngine report fields for trading experiments.
 * @param {Record<string, unknown>} report
 */
export function extractSignalFields(report) {
  const qs = /** @type {Record<string, unknown> | undefined} */ (report?.quickSummary);
  const mo = /** @type {Record<string, unknown> | undefined} */ (report?.marketOverview);
  const ti = /** @type {Record<string, unknown> | undefined} */ (report?.technicalIndicators);
  const macdRaw = /** @type {Record<string, unknown> | undefined} */ (ti?.macd);
  const maRaw = /** @type {Record<string, unknown> | undefined} */ (ti?.movingAverages);
  const bbRaw = /** @type {Record<string, unknown> | undefined} */ (ti?.bollingerBands);
  const adxRaw = /** @type {Record<string, unknown> | undefined} */ (ti?.adx);
  const mfiRaw = /** @type {Record<string, unknown> | undefined} */ (ti?.mfi);
  const vol = /** @type {Record<string, unknown> | undefined} */ (report?.volatilityAnalysis);
  const trendA = /** @type {Record<string, unknown> | undefined} */ (report?.trendAnalysis);
  const momA = /** @type {Record<string, unknown> | undefined} */ (report?.momentumAnalysis);

  const clearSignal = String(qs?.signal ?? "HOLD").toUpperCase();
  const entry = parseFloat(String(qs?.entry ?? ""));
  const stopLoss = parseFloat(String(qs?.stopLoss ?? ""));
  const firstTarget = parseFloat(String(qs?.firstTarget ?? ""));
  const priceRaw = mo?.currentPrice;
  const priceAtSignal = parseFloat(String(priceRaw ?? ""));
  const confidence = qs?.confidence != null ? String(qs.confidence) : null;

  const rsiParsed = parseFloat(String(ti?.rsi ?? ""));
  const rsi = Number.isFinite(rsiParsed) ? rsiParsed : null;

  const macdVal = parseFloat(String(macdRaw?.value ?? ""));
  const macdSig = parseFloat(String(macdRaw?.signal ?? ""));
  const macdHist = parseFloat(String(macdRaw?.histogram ?? ""));
  const macd =
    Number.isFinite(macdVal) && Number.isFinite(macdSig) && Number.isFinite(macdHist)
      ? { value: macdVal, signal: macdSig, histogram: macdHist }
      : null;

  const ema12Parsed = parseFloat(String(maRaw?.ema12 ?? ""));
  const ema26Parsed = parseFloat(String(maRaw?.ema26 ?? ""));
  const sma20Parsed = parseFloat(String(maRaw?.sma20 ?? ""));
  const sma50Parsed = parseFloat(String(maRaw?.sma50 ?? ""));
  const ema12 = Number.isFinite(ema12Parsed) ? ema12Parsed : null;
  const ema26 = Number.isFinite(ema26Parsed) ? ema26Parsed : null;
  const sma20 = Number.isFinite(sma20Parsed) ? sma20Parsed : null;
  const sma50 = Number.isFinite(sma50Parsed) ? sma50Parsed : null;

  const bbUpper = parseFloat(String(bbRaw?.upper ?? ""));
  const bbMiddle = parseFloat(String(bbRaw?.middle ?? ""));
  const bbLower = parseFloat(String(bbRaw?.lower ?? ""));
  const bbUpperN = Number.isFinite(bbUpper) ? bbUpper : null;
  const bbMiddleN = Number.isFinite(bbMiddle) ? bbMiddle : null;
  const bbLowerN = Number.isFinite(bbLower) ? bbLower : null;

  const vwapParsed = parseFloat(String(ti?.vwap ?? ""));
  const vwap = Number.isFinite(vwapParsed) ? vwapParsed : null;

  const supParsed = parseFloat(String(ti?.support ?? ""));
  const resParsed = parseFloat(String(ti?.resistance ?? ""));
  const support = Number.isFinite(supParsed) ? supParsed : null;
  const resistance = Number.isFinite(resParsed) ? resParsed : null;

  const adxValue = parseFloat(String(adxRaw?.value ?? ""));
  const adxVal = Number.isFinite(adxValue) ? adxValue : null;
  const adxTrendStrength =
    adxRaw?.trendStrength != null ? String(adxRaw.trendStrength).trim() : null;
  const adxPdi = parseFloat(String(adxRaw?.pdi ?? ""));
  const adxMdi = parseFloat(String(adxRaw?.mdi ?? ""));
  const adxPdiN = Number.isFinite(adxPdi) ? adxPdi : null;
  const adxMdiN = Number.isFinite(adxMdi) ? adxMdi : null;
  const adxTrendDirection =
    adxRaw?.trendDirection != null ? String(adxRaw.trendDirection).trim() : null;
  const adxDiCrossover =
    adxRaw?.diCrossover != null ? String(adxRaw.diCrossover).trim() : null;

  const mfiValue = parseFloat(String(mfiRaw?.value ?? ""));
  const mfiVal = Number.isFinite(mfiValue) ? mfiValue : null;
  const mfiSignal = mfiRaw?.signal != null ? String(mfiRaw.signal).trim() : null;
  const mfiVolumePressure =
    mfiRaw?.volumePressure != null ? String(mfiRaw.volumePressure).trim() : null;
  const mfiDivergence =
    mfiRaw?.divergence != null ? String(mfiRaw.divergence).trim() : null;
  const mfiTrend = mfiRaw?.trend != null ? String(mfiRaw.trend).trim() : null;

  const atrPctStr = String(vol?.atrPercent ?? "").replace(/%/g, "").trim();
  const atrParsed = parseFloat(atrPctStr);
  const atrPercent = Number.isFinite(atrParsed) ? atrParsed : null;

  const bbWStr = String(vol?.bollingerWidth ?? "").replace(/%/g, "").trim();
  const bbWParsed = parseFloat(bbWStr);
  const bbWidthPct = Number.isFinite(bbWParsed) ? bbWParsed : null;

  const bbPosStr = String(vol?.pricePositionInBB ?? "").replace(/%/g, "").trim();
  const bbPosParsed = parseFloat(bbPosStr);
  const bbPositionPct = Number.isFinite(bbPosParsed) ? bbPosParsed : null;

  const volatilityLevel = vol?.level != null ? String(vol.level).trim() : null;

  const trendClearSignal =
    trendA?.clearSignal != null ? String(trendA.clearSignal).toUpperCase().trim() : null;
  const momentumClearSignal =
    momA?.clearSignal != null ? String(momA.clearSignal).toUpperCase().trim() : null;

  const pctRaw = String(mo?.priceChange24h ?? "").replace(/%/g, "").trim();
  const pctParsed = parseFloat(pctRaw);
  const priceChange24hPct = Number.isFinite(pctParsed) ? pctParsed : null;

  return {
    clearSignal,
    entry: Number.isFinite(entry) ? entry : null,
    stopLoss: Number.isFinite(stopLoss) ? stopLoss : null,
    firstTarget: Number.isFinite(firstTarget) ? firstTarget : null,
    priceAtSignal: Number.isFinite(priceAtSignal) ? priceAtSignal : null,
    confidence,
    rsi,
    macd,
    ema12,
    ema26,
    sma20,
    sma50,
    bbUpper: bbUpperN,
    bbMiddle: bbMiddleN,
    bbLower: bbLowerN,
    bbPositionPct,
    bbWidthPct,
    vwap,
    support,
    resistance,
    adxValue: adxVal,
    adxTrendStrength,
    adxPdi: adxPdiN,
    adxMdi: adxMdiN,
    adxTrendDirection,
    adxDiCrossover,
    mfiValue: mfiVal,
    mfiSignal,
    mfiVolumePressure,
    mfiDivergence,
    mfiTrend,
    atrPercent,
    volatilityLevel,
    trendClearSignal,
    momentumClearSignal,
    priceChange24hPct,
  };
}
