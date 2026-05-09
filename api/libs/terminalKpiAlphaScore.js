/**
 * Mirrors `uponly-fund/src/components/terminal/IntelligenceEngine.ts` computeAlphaScore
 * so terminal KPI "alpha picks" counts stay consistent server-side.
 *
 * @param {Record<string, unknown>} row — normalized RISE market row from `normalizeRiseMarketRow`
 */
export function computeTerminalAlphaScore(row) {
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
  const safe = (value) =>
    value === null || typeof value !== "number" || !Number.isFinite(value) ? 0 : value;

  const deltaPct = safe(row.priceChange24hPct);
  const momentumNormalized = (Math.tanh(deltaPct / 50) + 1) / 2;
  const momentum = clamp(momentumNormalized * 40, 0, 40);

  const volumeUsd = safe(row.volume24hUsd);
  const mcapUsd = safe(row.marketCapUsd);
  const flowRatio = mcapUsd > 0 ? volumeUsd / mcapUsd : 0;
  const flow = clamp((Math.log10(flowRatio + 1) / Math.log10(2)) * 25, 0, 25);

  const holders = safe(row.holders);
  const depth = clamp((Math.log10(holders + 1) / 5) * 20, 0, 20);

  const ageHours = row.ageHours;
  let freshnessBase = 0;
  const newAgeHours = 24;
  if (ageHours !== null && typeof ageHours === "number" && Number.isFinite(ageHours)) {
    if (ageHours < newAgeHours) freshnessBase = 4;
    else if (ageHours <= 240) freshnessBase = 15;
    else if (ageHours <= 30 * 24) freshnessBase = 9;
    else freshnessBase = 4;
  }
  const freshness = clamp(freshnessBase, 0, 15);

  return clamp(momentum + flow + depth + freshness, 0, 100);
}

/** Count markets whose terminal alpha score meets the pick threshold (default 70). */
export function countTerminalAlphaPicks(allRows, minScore = 70) {
  let n = 0;
  for (const row of allRows) {
    if (computeTerminalAlphaScore(row) >= minScore) n += 1;
  }
  return n;
}
