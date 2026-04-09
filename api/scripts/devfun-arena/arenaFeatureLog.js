import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, "../../../.arena-feature-log.json");
const MAX = 450;

/**
 * @typedef {{
 *   trendBoost: number;
 *   trendProfile: number;
 *   meta: number;
 *   tape: number;
 *   rug: number;
 *   narr: number;
 *   flow: number;
 *   horizonDiv: number;
 *   directionScore: number;
 * }} ArenaFeatureVector
 */

/**
 * @typedef {{
 *   version: number;
 *   order: string[];
 *   byId: Record<string, { mint: string; f: ArenaFeatureVector; ts: number }>;
 * }} FeatureLogFile
 */

function defaultFile() {
  return { version: 1, order: [], byId: {} };
}

export function resolveFeatureLogPath() {
  return process.env.ARENA_FEATURE_LOG_PATH?.trim() || DEFAULT_PATH;
}

/**
 * @returns {Promise<FeatureLogFile>}
 */
export async function loadFeatureLog() {
  const p = resolveFeatureLogPath();
  try {
    const raw = await readFile(p, "utf8");
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return defaultFile();
    return {
      version: 1,
      order: Array.isArray(o.order) ? o.order.filter((x) => typeof x === "string") : [],
      byId: o.byId && typeof o.byId === "object" ? o.byId : {},
    };
  } catch {
    return defaultFile();
  }
}

/**
 * @param {FeatureLogFile} file
 */
export async function saveFeatureLog(file) {
  const p = resolveFeatureLogPath();
  const order = file.order.slice(-MAX);
  const byId = { ...file.byId };
  for (const k of Object.keys(byId)) {
    if (!order.includes(k)) delete byId[k];
  }
  await writeFile(p, `${JSON.stringify({ version: 1, order, byId })}\n`, "utf8");
}

/**
 * @param {string} challengeId
 * @param {string} mint
 * @param {ArenaFeatureVector} f
 * @param {FeatureLogFile} file
 */
export function recordArenaFeatures(challengeId, mint, f, file) {
  if (!challengeId || !mint) return;
  file.byId[challengeId] = { mint, f: { ...f }, ts: Date.now() };
  file.order = file.order.filter((id) => id !== challengeId);
  file.order.push(challengeId);
  while (file.order.length > MAX) {
    const drop = file.order.shift();
    if (drop && file.byId[drop]) delete file.byId[drop];
  }
}

/**
 * @param {string} challengeId
 * @param {FeatureLogFile} file
 * @returns {ArenaFeatureVector | null}
 */
export function getStoredFeatures(challengeId, file) {
  const row = file.byId[challengeId];
  return row?.f ?? null;
}
