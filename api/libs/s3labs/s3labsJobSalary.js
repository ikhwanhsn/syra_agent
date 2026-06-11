/**
 * Parse and score job compensation from title/description text.
 */

/**
 * @typedef {{ label: string; minUsd: number; maxUsd: number; score: number }} ParsedSalary
 */

const CURRENCY_TO_USD = Object.freeze({
  $: 1,
  usd: 1,
  "€": 1.08,
  eur: 1.08,
  "£": 1.27,
  gbp: 1.27,
});

/**
 * @param {number} amount
 * @param {string} unit
 * @returns {number}
 */
function normalizeToAnnualUsd(amount, unit) {
  const u = unit.toLowerCase();
  if (u.includes("hour") || u === "hr" || u === "/h") return amount * 2080;
  if (u.includes("month") || u === "mo" || u === "/mo") return amount * 12;
  return amount;
}

/**
 * @param {string} raw
 * @returns {number}
 */
function parseMoneyToken(raw) {
  const cleaned = String(raw || "")
    .replace(/,/g, "")
    .trim()
    .toLowerCase();
  const m = cleaned.match(/([\d.]+)\s*(k)?/);
  if (!m) return 0;
  let n = Number.parseFloat(m[1]);
  if (Number.isNaN(n)) return 0;
  if (m[2] === "k") n *= 1000;
  return n;
}

/**
 * @param {string} text
 * @returns {ParsedSalary | null}
 */
export function parseSalaryFromText(text) {
  const input = String(text || "");
  if (!input.trim()) return null;

  const rangeRe =
    /([$€£]|USD|EUR|GBP)\s*([\d,]+(?:\.\d+)?)\s*(k|K)?\s*(?:-|–|to)\s*([$€£]|USD|EUR|GBP)?\s*([\d,]+(?:\.\d+)?)\s*(k|K)?(?:\s*\/\s*(year|yr|annum|hour|hr|h|month|mo))?/gi;

  let best = /** @type {ParsedSalary | null} */ (null);

  let m;
  while ((m = rangeRe.exec(input)) !== null) {
    const cur1 = m[1].toLowerCase();
    const cur2 = (m[4] || m[1]).toLowerCase();
    const rate = CURRENCY_TO_USD[cur1] ?? CURRENCY_TO_USD[cur2] ?? 1;
    const unit = m[7] || "year";
    const min = normalizeToAnnualUsd(parseMoneyToken(`${m[2]}${m[3] || ""}`), unit) * rate;
    const max = normalizeToAnnualUsd(parseMoneyToken(`${m[5]}${m[6] || ""}`), unit) * rate;
    if (min <= 0 && max <= 0) continue;

    const lo = min || max * 0.85;
    const hi = max || min * 1.15;
    const score = (lo + hi) / 2;
    const label = m[0].trim();

    if (!best || score > best.score) {
      best = { label, minUsd: lo, maxUsd: hi, score };
    }
  }

  if (best) return best;

  const singleRe =
    /([$€£]|USD|EUR|GBP)\s*([\d,]+(?:\.\d+)?)\s*(k|K)?(?:\s*\/\s*(year|yr|annum|hour|hr|h|month|mo))?/gi;
  while ((m = singleRe.exec(input)) !== null) {
    const cur = m[1].toLowerCase();
    const rate = CURRENCY_TO_USD[cur] ?? 1;
    const unit = m[4] || "year";
    const amount = normalizeToAnnualUsd(parseMoneyToken(`${m[2]}${m[3] || ""}`), unit) * rate;
    if (amount <= 0) continue;
    const label = m[0].trim();
    if (!best || amount > best.score) {
      best = { label, minUsd: amount, maxUsd: amount, score: amount };
    }
  }

  return best;
}

/**
 * @param {ParsedSalary | null | undefined} salary
 * @returns {string}
 */
export function formatSalaryLabel(salary) {
  if (!salary?.label) return "Gaji tidak disebutkan";
  return salary.label.replace(/\s+/g, " ").trim();
}
