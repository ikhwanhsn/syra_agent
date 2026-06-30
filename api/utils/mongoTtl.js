/**
 * TTL helpers for MongoDB schema indexes (env-configurable retention).
 */

/**
 * @param {string} envKey
 * @param {number} defaultDays
 * @returns {number}
 */
export function ttlDaysFromEnv(envKey, defaultDays) {
  const raw = Number(process.env[envKey]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : defaultDays;
}

/**
 * @param {string} envKey
 * @param {number} defaultDays
 * @returns {number}
 */
export function ttlExpireSeconds(envKey, defaultDays) {
  return ttlDaysFromEnv(envKey, defaultDays) * 24 * 60 * 60;
}
