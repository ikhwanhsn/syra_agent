/**
 * Telegram formatting for Up Only Fund internal dev team (15 slots; dev bot only).
 */

/** @param {string} [s] @param {number} max */
function clip(s, max) {
  if (!s || typeof s !== "string") return "";
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * @param {number} slot 1–15
 * @param {string} title
 * @param {string[]} bodyLines
 * @returns {string}
 */
export function formatUponlyFundDevTeamTelegram(slot, title, bodyLines) {
  const safeSlot = Math.min(15, Math.max(1, slot));
  const head = `Up Only Fund · Dev Internal ${safeSlot}/15 — ${title}`;
  const body = (bodyLines || []).filter((l) => l != null && String(l).trim().length > 0);
  return [head, "", ...body.map((l) => String(l))].join("\n");
}

/**
 * @param {{ baseUrls?: string[]; pageCount?: number; crawledAt?: string }} p
 */
export function formatUponlyFundSurfaceScoutTelegram(p) {
  const urls = Array.isArray(p.baseUrls) ? p.baseUrls.join(", ") : "—";
  const n = typeof p.pageCount === "number" ? p.pageCount : "—";
  const when = p.crawledAt || "—";
  return formatUponlyFundDevTeamTelegram(1, "Surface Scout", [
    `When: ${when}`,
    `Pages saved: ${n}`,
    `Sites: ${clip(urls, 400)}`,
    "Automatic crawl of Up Only Fund surfaces + public OpenAPI excerpt (no AI for this message).",
  ]);
}

/**
 * @param {{ generatedAt: string; coaching: string }} hr
 */
export function formatUponlyFundHrCoachTelegram(hr) {
  const lines = String(hr.coaching || "")
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);
  return formatUponlyFundDevTeamTelegram(15, "HR · Dev Team Coach", [
    `When: ${hr.generatedAt}`,
    "",
    ...(lines.length ? lines : ["(no coaching text)"]),
  ]);
}

/**
 * @param {number} slot 2–14
 * @param {string} title
 * @param {string} generatedAt
 * @param {string[]} bullets
 */
export function formatUponlyFundSpecialistTelegram(slot, title, generatedAt, bullets) {
  const b = (bullets || [])
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => `- ${clip(x.trim(), 220)}`)
    .slice(0, 6);
  return formatUponlyFundDevTeamTelegram(slot, title, [
    `When: ${generatedAt || "—"}`,
    "",
    ...(b.length ? b : ["- (empty)"]),
  ]);
}
