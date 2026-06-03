/**
 * Next-fire delay until a daily wall-clock time in Asia/Jakarta (WIB, UTC+7, no DST).
 * Shared anchor for internal agent pipelines (agent team, x402 trends, growth agents).
 */

/** Daily run anchor — Western Indonesian Time (no DST). */
export const INTERNAL_AGENT_PIPELINES_WIB_HOUR = 6;
export const INTERNAL_AGENT_PIPELINES_WIB_MINUTE = 0;

const AGENT_TEAM_TIMEZONE = "Asia/Jakarta";

/**
 * Calendar + clock parts for `date` in {@link AGENT_TEAM_TIMEZONE}.
 * @param {Date} date
 * @returns {{ year: number; month: number; day: number; hour: number; minute: number; second: number }}
 */
function getTimeZoneCalendarParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENT_TEAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const m = /** @type {Record<string, string>} */ ({});
  for (const p of parts) {
    if (p.type !== "literal") m[p.type] = p.value;
  }
  return {
    year: Number(m.year),
    month: Number(m.month),
    day: Number(m.day),
    hour: Number(m.hour),
    minute: Number(m.minute),
    second: Number(m.second),
  };
}

/**
 * UTC instant when the Jakarta wall clock reads `hour:minute:00` on the given calendar day.
 * @param {number} year
 * @param {number} month 1–12
 * @param {number} day 1–31
 * @param {number} hour 0–23
 * @param {number} minute 0–59
 * @returns {number} epoch ms
 */
function jakartaWallClockToUtcMs(year, month, day, hour, minute) {
  return Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0);
}

/**
 * Milliseconds from `now` until the next occurrence of `targetHour:targetMinute` in Asia/Jakarta.
 *
 * @param {Date} [now]
 * @param {number} [targetHour] default {@link INTERNAL_AGENT_PIPELINES_WIB_HOUR}
 * @param {number} [targetMinute] default {@link INTERNAL_AGENT_PIPELINES_WIB_MINUTE}
 * @returns {number}
 */
export function getMsUntilNextWibWallClock(
  now = new Date(),
  targetHour = INTERNAL_AGENT_PIPELINES_WIB_HOUR,
  targetMinute = INTERNAL_AGENT_PIPELINES_WIB_MINUTE,
) {
  const { year, month, day } = getTimeZoneCalendarParts(now);
  let targetUtc = jakartaWallClockToUtcMs(year, month, day, targetHour, targetMinute);
  if (targetUtc <= now.getTime()) {
    targetUtc += 86_400_000;
  }
  return Math.max(0, targetUtc - now.getTime());
}

/**
 * UTC ms for a WIB wall-clock time on the same calendar day as `now` (no rollover).
 * @param {Date} [now]
 * @param {number} hour
 * @param {number} minute
 * @returns {number}
 */
export function getWibWallClockUtcMsToday(now = new Date(), hour, minute) {
  const { year, month, day } = getTimeZoneCalendarParts(now);
  return jakartaWallClockToUtcMs(year, month, day, hour, minute);
}
