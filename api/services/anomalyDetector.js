/**
 * Per-user spend anomaly detector (P2).
 *
 * Runs over a window of sign-audit rows and flags users whose recent spend is materially
 * different from their baseline. Pure functions over arrays; the cron job in
 * scripts/run-anomaly-scan.js feeds it from MongoDB.
 *
 * Two simple detectors:
 *   - velocity:   > N sign events in a 60s window
 *   - sum-spike:  hourly sum > k * median(daily) over the last 14 days
 *   - novel-dest: a non-allowlist destination address appeared in the last 24h
 *
 * Output is an array of `{ anonymousId, kind, severity, evidence }` rows; the cron persists them
 * to a `walletincidents` collection (P2) and alerts via the configured channel.
 */

const VELOCITY_WINDOW_MS = 60 * 1000;
const VELOCITY_THRESHOLD = 10;
const SPIKE_LOOKBACK_HOURS = 1;
const BASELINE_LOOKBACK_DAYS = 14;
const SPIKE_MULTIPLIER = 5;

/**
 * @typedef {Object} AuditRow
 * @property {string} anonymousId
 * @property {Date|string} ts
 * @property {string} action
 * @property {number=} amountUsd
 * @property {string=} status
 * @property {string=} toAddress
 *
 * @typedef {Object} WalletAllowlist
 * @property {string[]} destinationAllowlist
 * @property {string} linkedUserWallet
 *
 * @typedef {Object} Incident
 * @property {string} anonymousId
 * @property {'velocity'|'sum_spike'|'novel_destination'} kind
 * @property {'low'|'medium'|'high'} severity
 * @property {string[]} evidence
 */

/**
 * @param {AuditRow[]} rows
 * @param {Map<string, WalletAllowlist>=} walletAllowlists
 * @returns {Incident[]}
 */
export function detectIncidents(rows, walletAllowlists = new Map()) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const byUser = new Map();
  for (const r of rows) {
    if (!r?.anonymousId) continue;
    if (!byUser.has(r.anonymousId)) byUser.set(r.anonymousId, []);
    byUser.get(r.anonymousId).push(r);
  }
  const out = [];
  const now = Date.now();
  for (const [aid, list] of byUser.entries()) {
    list.sort((a, b) => tsMs(a.ts) - tsMs(b.ts));
    // Velocity
    let velocityHits = 0;
    for (let i = 0; i < list.length; i++) {
      const t = tsMs(list[i].ts);
      let count = 1;
      for (let j = i - 1; j >= 0 && tsMs(list[j].ts) >= t - VELOCITY_WINDOW_MS; j--) count++;
      if (count > velocityHits) velocityHits = count;
    }
    if (velocityHits >= VELOCITY_THRESHOLD) {
      out.push({
        anonymousId: aid,
        kind: 'velocity',
        severity: velocityHits >= VELOCITY_THRESHOLD * 2 ? 'high' : 'medium',
        evidence: [`peak_velocity=${velocityHits}/min`],
      });
    }
    // Sum spike
    const hourly = sumAmount(list, now - SPIKE_LOOKBACK_HOURS * 60 * 60 * 1000);
    const dailySums = bucketize(list, BASELINE_LOOKBACK_DAYS);
    const median = approxMedian(dailySums);
    if (median > 0 && hourly > median * SPIKE_MULTIPLIER) {
      out.push({
        anonymousId: aid,
        kind: 'sum_spike',
        severity: hourly > median * SPIKE_MULTIPLIER * 2 ? 'high' : 'medium',
        evidence: [`hourly=${hourly.toFixed(2)} median_daily=${median.toFixed(2)}`],
      });
    }
    // Novel destination
    const allow = walletAllowlists.get(aid);
    if (allow) {
      const novel = new Set();
      for (const r of list) {
        if (r.action !== 'withdraw' && r.action !== 'tx_submit') continue;
        if (!r.toAddress) continue;
        if (tsMs(r.ts) < now - 24 * 60 * 60 * 1000) continue;
        if (r.toAddress === allow.linkedUserWallet) continue;
        if (Array.isArray(allow.destinationAllowlist) && allow.destinationAllowlist.includes(r.toAddress)) continue;
        novel.add(r.toAddress);
      }
      if (novel.size > 0) {
        out.push({
          anonymousId: aid,
          kind: 'novel_destination',
          severity: 'high',
          evidence: [...novel].slice(0, 5).map((addr) => `to=${addr}`),
        });
      }
    }
  }
  return out;
}

function tsMs(ts) {
  if (ts instanceof Date) return ts.getTime();
  const v = new Date(ts).getTime();
  return Number.isFinite(v) ? v : 0;
}

function sumAmount(list, sinceMs) {
  let s = 0;
  for (const r of list) {
    if (tsMs(r.ts) < sinceMs) continue;
    if (r.status === 'rejected') continue;
    if (Number.isFinite(r.amountUsd)) s += Number(r.amountUsd);
  }
  return s;
}

function bucketize(list, days) {
  const buckets = new Map();
  for (const r of list) {
    if (r.status === 'rejected') continue;
    if (!Number.isFinite(r.amountUsd)) continue;
    const day = new Date(tsMs(r.ts));
    const key = `${day.getUTCFullYear()}-${day.getUTCMonth()}-${day.getUTCDate()}`;
    buckets.set(key, (buckets.get(key) || 0) + Number(r.amountUsd));
  }
  return [...buckets.values()].slice(-days);
}

function approxMedian(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

export { VELOCITY_THRESHOLD, SPIKE_MULTIPLIER };
