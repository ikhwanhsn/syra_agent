import UponlyTerminalKpiDaily from '../models/UponlyTerminalKpiDaily.js';

export function utcCalendarDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function previousUtcCalendarDayKey(dayUtc) {
  const [y, m, da] = dayUtc.split('-').map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(da)) return dayUtc;
  const dt = new Date(Date.UTC(y, m - 1, da));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function pctChangeVsBaseline(current, baseline) {
  if (typeof current !== 'number' || !Number.isFinite(current)) return null;
  if (typeof baseline !== 'number' || !Number.isFinite(baseline) || baseline === 0) return null;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Upserts today's KPI row and returns trend payload for the aggregate API.
 * Safe no-op on Mongo failure (returns null).
 *
 * @param {{
 *   marketCount: number,
 *   volume24hUsd: number,
 *   marketCapUsd: number,
 *   alphaPicks: number,
 * }} todaySnapshot
 * @param {{ sampledCount: number }} meta
 */
export async function persistAndBuildTerminalKpiTrend(todaySnapshot, meta) {
  const dayUtc = utcCalendarDayKey();

  try {
    await UponlyTerminalKpiDaily.findOneAndUpdate(
      { dayUtc },
      {
        $set: {
          marketCount: todaySnapshot.marketCount,
          volume24hUsd: todaySnapshot.volume24hUsd,
          marketCapUsd: todaySnapshot.marketCapUsd,
          alphaPicks: todaySnapshot.alphaPicks,
          sampledCount: meta.sampledCount,
          recordedAt: new Date(),
        },
      },
      { upsert: true },
    );
  } catch (e) {
    console.warn('[uponly-terminal-kpi] upsert failed:', e?.message || e);
    return null;
  }

  let yDoc = null;
  try {
    const yKey = previousUtcCalendarDayKey(dayUtc);
    yDoc = await UponlyTerminalKpiDaily.findOne({ dayUtc: yKey }).lean();
  } catch (e) {
    console.warn('[uponly-terminal-kpi] yesterday load failed:', e?.message || e);
    yDoc = null;
  }

  const yesterday = yDoc
    ? {
        dayUtc: yDoc.dayUtc,
        marketCount: yDoc.marketCount,
        volume24hUsd: yDoc.volume24hUsd,
        marketCapUsd: yDoc.marketCapUsd,
        alphaPicks: yDoc.alphaPicks,
      }
    : null;

  const growthPctVsYesterday = yesterday
    ? {
        marketCount: pctChangeVsBaseline(todaySnapshot.marketCount, yesterday.marketCount),
        volume24hUsd: pctChangeVsBaseline(todaySnapshot.volume24hUsd, yesterday.volume24hUsd),
        marketCapUsd: pctChangeVsBaseline(todaySnapshot.marketCapUsd, yesterday.marketCapUsd),
        alphaPicks: pctChangeVsBaseline(todaySnapshot.alphaPicks, yesterday.alphaPicks),
      }
    : {
        marketCount: null,
        volume24hUsd: null,
        marketCapUsd: null,
        alphaPicks: null,
      };

  return {
    dayUtc,
    baselineDayUtc: yesterday?.dayUtc ?? null,
    today: { ...todaySnapshot },
    yesterday,
    growthPctVsYesterday,
  };
}
