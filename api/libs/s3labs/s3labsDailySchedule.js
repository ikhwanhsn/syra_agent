/**
 * Random daily posting schedule for S3Labs agents (WIB wall clock).
 * Each agent gets 3–5 posts/day at unpredictable times with minimum spacing.
 */

import {
  S3LABS_POSTS_PER_DAY_MAX,
  S3LABS_POSTS_PER_DAY_MIN,
  S3LABS_SCHEDULE_HOUR_END_WIB,
  S3LABS_SCHEDULE_HOUR_START_WIB,
  S3LABS_SCHEDULE_MIN_GAP_MINUTES,
} from "../../config/s3labsAgentsConfig.js";

const AGENT_TEAM_TIMEZONE = "Asia/Jakarta";

/** @type {Map<string, { wibDateKey: string; slots: ReadonlyArray<readonly [number, number]>; slotIndex: number }>} */
const scheduleByAgent = new Map();

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD in WIB
 */
function getWibDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENT_TEAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const m = /** @type {Record<string, string>} */ ({});
  for (const p of parts) {
    if (p.type !== "literal") m[p.type] = p.value;
  }
  return `${m.year}-${m.month}-${m.day}`;
}

/**
 * @param {string} kind
 * @returns {number} 0–59 extra minute offset per agent kind (stagger topics)
 */
function agentPhaseMinutes(kind) {
  const hash = [...kind].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 45;
}

/**
 * @param {number} count
 * @param {number} hourStart
 * @param {number} hourEnd
 * @param {number} minGapMinutes
 * @param {number} phaseMinutes
 * @returns {ReadonlyArray<readonly [number, number]>}
 */
export function generateRandomWibSlots(count, hourStart, hourEnd, minGapMinutes, phaseMinutes = 0) {
  const startMin = hourStart * 60 + (phaseMinutes % 30);
  const endMin = hourEnd * 60 + 59;
  const slots = [];

  for (let attempt = 0; attempt < 400 && slots.length < count; attempt++) {
    const totalRange = Math.max(60, endMin - startMin);
    const offset = Math.floor(Math.random() * totalRange);
    const candidate = startMin + offset;
    const hour = Math.floor(candidate / 60);
    const minute = candidate % 60;

    if (hour < hourStart || hour > hourEnd) continue;

    const tooClose = slots.some(([h, m]) => {
      const existing = h * 60 + m;
      return Math.abs(existing - candidate) < minGapMinutes;
    });
    if (tooClose) continue;

    slots.push([hour, minute]);
  }

  slots.sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));
  return Object.freeze(slots.map((s) => Object.freeze(s)));
}

/**
 * @param {string} kind
 * @returns {number}
 */
function randomPostsCountForDay() {
  const min = S3LABS_POSTS_PER_DAY_MIN;
  const max = S3LABS_POSTS_PER_DAY_MAX;
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Build or return today's random slots for an agent.
 * @param {string} kind
 * @returns {{ slots: ReadonlyArray<readonly [number, number]>; slotIndex: number; wibDateKey: string; postsToday: number }}
 */
export function getOrRefreshDailySchedule(kind) {
  const wibDateKey = getWibDateKey();
  const cached = scheduleByAgent.get(kind);

  if (cached && cached.wibDateKey === wibDateKey && cached.slots.length > 0) {
    return {
      slots: cached.slots,
      slotIndex: cached.slotIndex,
      wibDateKey,
      postsToday: cached.slots.length,
    };
  }

  const phase = agentPhaseMinutes(kind);
  const hourStart = Math.min(
    S3LABS_SCHEDULE_HOUR_END_WIB - 2,
    S3LABS_SCHEDULE_HOUR_START_WIB + Math.floor(phase / 15),
  );
  const hourEnd = S3LABS_SCHEDULE_HOUR_END_WIB;
  const count = randomPostsCountForDay();
  const slots = generateRandomWibSlots(
    count,
    hourStart,
    hourEnd,
    S3LABS_SCHEDULE_MIN_GAP_MINUTES,
    phase,
  );

  scheduleByAgent.set(kind, { wibDateKey, slots, slotIndex: 0 });
  console.log(
    `[s3labs-${kind}] daily schedule (${wibDateKey} WIB): ${slots.length} posts at ${slots.map(([h, m]) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`).join(", ")}`,
  );

  return { slots, slotIndex: 0, wibDateKey, postsToday: slots.length };
}

/**
 * @param {string} kind
 * @returns {readonly [number, number] | null}
 */
export function consumeNextDailySlot(kind) {
  const wibDateKey = getWibDateKey();
  let entry = scheduleByAgent.get(kind);

  if (!entry || entry.wibDateKey !== wibDateKey) {
    getOrRefreshDailySchedule(kind);
    entry = scheduleByAgent.get(kind);
  }
  if (!entry || entry.slotIndex >= entry.slots.length) {
    return null;
  }

  const slot = entry.slots[entry.slotIndex];
  entry.slotIndex += 1;
  return slot;
}

/**
 * @param {string} kind
 * @returns {boolean}
 */
export function hasMoreSlotsToday(kind) {
  const wibDateKey = getWibDateKey();
  const entry = scheduleByAgent.get(kind);
  if (!entry || entry.wibDateKey !== wibDateKey) {
    getOrRefreshDailySchedule(kind);
  }
  const fresh = scheduleByAgent.get(kind);
  return Boolean(fresh && fresh.slotIndex < fresh.slots.length);
}

/** @internal test helper */
export function _clearDailyScheduleCache() {
  scheduleByAgent.clear();
}
