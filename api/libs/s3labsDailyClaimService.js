/**
 * S3 Labs daily claim — 0.1 pts/day with weekly + monthly consistency bonuses.
 */
import { isMongooseConnected } from "../config/mongoose.js";
import {
  POINTS_DAILY_CLAIM_BASE,
  POINTS_DAILY_CLAIM_MONTHLY_BONUS,
  POINTS_DAILY_CLAIM_WEEKLY_BONUS,
  roundPoints,
} from "../config/s3labsPointsConfig.js";
import S3LabsDailyClaim from "../models/S3LabsDailyClaim.js";
import S3LabsPoints from "../models/S3LabsPoints.js";
import { normalizeWallet } from "./kolEngagementService.js";

const WEEKLY_CYCLE_DAYS = 7;

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("MongoDB is not connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

/**
 * @param {Date} date
 */
function formatUtcDateKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {string} dateKey
 */
function parseUtcDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * @param {string} dateKey
 * @param {number} deltaDays
 */
function shiftUtcDateKey(dateKey, deltaDays) {
  const next = parseUtcDateKey(dateKey);
  next.setUTCDate(next.getUTCDate() + deltaDays);
  return formatUtcDateKey(next);
}

/**
 * All UTC date keys in the current calendar month (28–31 days).
 * @param {Date} anchor
 */
function getCalendarMonthDateKeysUtc(anchor) {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const keys = [];
  for (let d = 1; d <= lastDay; d += 1) {
    keys.push(formatUtcDateKey(new Date(Date.UTC(y, m, d))));
  }
  return keys;
}

/**
 * @param {Date} anchor
 */
function isLastDayOfCalendarMonthUtc(anchor) {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return anchor.getUTCDate() === lastDay;
}

/**
 * @param {Date} anchor
 */
function formatCalendarMonthLabelUtc(anchor) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(anchor);
}

/**
 * @param {string} walletKey
 * @param {string} fromDateKey
 */
async function getClaimDateSetFrom(walletKey, fromDateKey) {
  const rows = await S3LabsDailyClaim.find({
    walletKey,
    claimDate: { $gte: fromDateKey },
  })
    .select("claimDate")
    .lean();

  return new Set(rows.map((row) => row.claimDate));
}

/**
 * Consecutive claim days ending the day before `todayKey`.
 * @param {Set<string>} claimDates
 * @param {string} todayKey
 */
function countConsecutiveDaysBeforeToday(claimDates, todayKey) {
  let streak = 0;
  let cursor = shiftUtcDateKey(todayKey, -1);

  while (claimDates.has(cursor)) {
    streak += 1;
    cursor = shiftUtcDateKey(cursor, -1);
  }

  return streak;
}

/**
 * @param {number} streakIncludingToday
 */
function daysInWeeklyCycle(streakIncludingToday) {
  if (streakIncludingToday <= 0) return 0;
  return ((streakIncludingToday - 1) % WEEKLY_CYCLE_DAYS) + 1;
}

/**
 * @param {number} consecutiveBeforeToday
 * @param {boolean} claimedToday
 */
function computeWeeklyStreakInfo(consecutiveBeforeToday, claimedToday) {
  const streakIncludingToday = consecutiveBeforeToday + (claimedToday ? 1 : 0);
  const daysInCurrentCycle = daysInWeeklyCycle(streakIncludingToday);
  const weeklyBonusEligible =
    !claimedToday && (consecutiveBeforeToday + 1) % WEEKLY_CYCLE_DAYS === 0;
  const daysUntilWeeklyBonus = weeklyBonusEligible
    ? 0
    : daysInCurrentCycle === 0
      ? WEEKLY_CYCLE_DAYS
      : WEEKLY_CYCLE_DAYS - daysInCurrentCycle;

  return {
    cycleDays: WEEKLY_CYCLE_DAYS,
    consecutiveStreak: streakIncludingToday,
    daysInCurrentCycle,
    daysUntilWeeklyBonus,
    weeklyBonusEligible,
  };
}

/**
 * @param {string} walletKey
 * @param {string[]} dateKeys
 */
async function countClaimsForDates(walletKey, dateKeys) {
  if (dateKeys.length === 0) return 0;
  return S3LabsDailyClaim.countDocuments({
    walletKey,
    claimDate: { $in: dateKeys },
  });
}

/**
 * @param {string} walletKey
 * @param {string[]} requiredBeforeToday
 */
async function hasConsistentStreak(walletKey, requiredBeforeToday) {
  if (requiredBeforeToday.length === 0) return true;
  const claimed = await countClaimsForDates(walletKey, requiredBeforeToday);
  return claimed === requiredBeforeToday.length;
}

/**
 * @param {import("../models/S3LabsDailyClaim.js").default | Record<string, unknown>} row
 */
function serializeDailyClaim(row) {
  const doc = row.toObject ? row.toObject() : row;
  return {
    id: String(doc._id),
    claimDate: doc.claimDate,
    basePoints: roundPoints(doc.basePoints ?? 0),
    weeklyBonus: roundPoints(doc.weeklyBonus ?? 0),
    monthlyBonus: roundPoints(doc.monthlyBonus ?? 0),
    totalPoints: roundPoints(doc.totalPoints ?? 0),
    claimedAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/**
 * @param {string} wallet
 * @param {Date} [now]
 */
export async function getDailyClaimStatus(wallet, now = new Date()) {
  assertMongo();

  const normalized = normalizeWallet(wallet);
  if (!normalized) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const walletKey = normalized.toLowerCase();
  const todayKey = formatUtcDateKey(now);
  const todayClaim = await S3LabsDailyClaim.findOne({ walletKey, claimDate: todayKey }).lean();
  const aggregate = await S3LabsPoints.findOne({ walletKey }).lean();
  const claimedToday = Boolean(todayClaim);

  const monthKeys = getCalendarMonthDateKeysUtc(now);
  const monthKeysBeforeToday = monthKeys.filter((k) => k < todayKey);
  const lookbackFrom = shiftUtcDateKey(todayKey, -(WEEKLY_CYCLE_DAYS + 5));
  const monthStartKey = monthKeys[0];
  const claimFromKey = lookbackFrom < monthStartKey ? lookbackFrom : monthStartKey;

  const claimDates = await getClaimDateSetFrom(walletKey, claimFromKey);
  const consecutiveBeforeToday = countConsecutiveDaysBeforeToday(claimDates, todayKey);
  const weekInfo = computeWeeklyStreakInfo(consecutiveBeforeToday, claimedToday);

  const monthClaimed = await countClaimsForDates(
    walletKey,
    monthKeys.filter((k) => k <= todayKey),
  );
  const monthConsistent = await hasConsistentStreak(walletKey, monthKeysBeforeToday);
  const isMonthEnd = isLastDayOfCalendarMonthUtc(now);
  const monthlyBonusEligible = isMonthEnd && monthConsistent && !claimedToday;

  const previewTotal = roundPoints(
    POINTS_DAILY_CLAIM_BASE +
      (weekInfo.weeklyBonusEligible ? POINTS_DAILY_CLAIM_WEEKLY_BONUS : 0) +
      (monthlyBonusEligible ? POINTS_DAILY_CLAIM_MONTHLY_BONUS : 0),
  );

  return {
    wallet: normalized,
    todayUtc: todayKey,
    claimedToday,
    canClaimToday: !claimedToday,
    config: {
      dailyBase: POINTS_DAILY_CLAIM_BASE,
      weeklyBonus: POINTS_DAILY_CLAIM_WEEKLY_BONUS,
      monthlyBonus: POINTS_DAILY_CLAIM_MONTHLY_BONUS,
      weeklyCycleDays: WEEKLY_CYCLE_DAYS,
    },
    week: {
      ...weekInfo,
      weeklyBonusEarnedToday: todayClaim ? roundPoints(todayClaim.weeklyBonus ?? 0) > 0 : false,
    },
    month: {
      calendarLabel: formatCalendarMonthLabelUtc(now),
      daysInMonth: monthKeys.length,
      daysClaimed: monthClaimed,
      daysElapsed: monthKeys.filter((k) => k <= todayKey).length,
      isMonthEnd,
      monthlyBonusEligible,
      monthlyBonusEarnedToday: todayClaim ? roundPoints(todayClaim.monthlyBonus ?? 0) > 0 : false,
    },
    preview: {
      basePoints: POINTS_DAILY_CLAIM_BASE,
      weeklyBonus: weekInfo.weeklyBonusEligible ? POINTS_DAILY_CLAIM_WEEKLY_BONUS : 0,
      monthlyBonus: monthlyBonusEligible ? POINTS_DAILY_CLAIM_MONTHLY_BONUS : 0,
      totalPoints: todayClaim ? roundPoints(todayClaim.totalPoints) : previewTotal,
    },
    lastClaim: todayClaim ? serializeDailyClaim(todayClaim) : null,
    totalDailyClaimPoints: roundPoints(aggregate?.dailyClaimPoints ?? 0),
    policy: {
      summary:
        "Claim once per UTC day for 0.1 points. Claim 7 days in a row for a +1 bonus on the 7th day. Claim every calendar day of the month (28–31 days) for a +10 bonus on the last day.",
    },
  };
}

/**
 * @param {string} wallet
 * @param {Date} [now]
 */
export async function claimDailyPoints(wallet, now = new Date()) {
  assertMongo();

  const normalized = normalizeWallet(wallet);
  if (!normalized) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const walletKey = normalized.toLowerCase();
  const todayKey = formatUtcDateKey(now);

  const existing = await S3LabsDailyClaim.findOne({ walletKey, claimDate: todayKey }).lean();
  if (existing) {
    const err = new Error("Daily claim already collected for today");
    err.code = "already_claimed";
    throw err;
  }

  const monthKeys = getCalendarMonthDateKeysUtc(now);
  const monthKeysBeforeToday = monthKeys.filter((k) => k < todayKey);
  const lookbackFrom = shiftUtcDateKey(todayKey, -(WEEKLY_CYCLE_DAYS + 5));
  const claimDates = await getClaimDateSetFrom(walletKey, lookbackFrom);

  const consecutiveBeforeToday = countConsecutiveDaysBeforeToday(claimDates, todayKey);
  const streakIncludingToday = consecutiveBeforeToday + 1;

  const weeklyBonus =
    streakIncludingToday % WEEKLY_CYCLE_DAYS === 0 ? POINTS_DAILY_CLAIM_WEEKLY_BONUS : 0;
  const monthlyBonus =
    isLastDayOfCalendarMonthUtc(now) &&
    (await hasConsistentStreak(walletKey, monthKeysBeforeToday))
      ? POINTS_DAILY_CLAIM_MONTHLY_BONUS
      : 0;

  const totalPoints = roundPoints(POINTS_DAILY_CLAIM_BASE + weeklyBonus + monthlyBonus);

  const claim = await S3LabsDailyClaim.create({
    walletKey,
    wallet: normalized,
    claimDate: todayKey,
    basePoints: POINTS_DAILY_CLAIM_BASE,
    weeklyBonus,
    monthlyBonus,
    totalPoints,
  });

  await S3LabsPoints.findOneAndUpdate(
    { walletKey },
    {
      $setOnInsert: { wallet: normalized },
      $set: { lastAwardedAt: now },
      $inc: {
        totalPoints,
        dailyClaimPoints: totalPoints,
      },
    },
    { upsert: true },
  );

  const aggregate = await S3LabsPoints.findOne({ walletKey }).lean();

  return {
    wallet: normalized,
    claim: serializeDailyClaim(claim),
    totals: {
      totalPoints: roundPoints(aggregate?.totalPoints ?? totalPoints),
      dailyClaimPoints: roundPoints(aggregate?.dailyClaimPoints ?? totalPoints),
    },
    bonuses: {
      weekly: weeklyBonus > 0,
      monthly: monthlyBonus > 0,
    },
  };
}
