/**
 * Jupiter Tokens V2 search proxy for the swap UI.
 */
import axios from "axios";

const JUPITER_TOKENS_SEARCH = "https://api.jup.ag/tokens/v2/search";
const JUPITER_TOKENS_TAG = "https://api.jup.ag/tokens/v2/tag";

function jupiterHeaders() {
  const headers = { Accept: "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

/**
 * @param {unknown} row
 */
function pickIconUrl(row) {
  if (!row || typeof row !== "object") return null;
  const candidates = [
    row.icon,
    row.logoURI,
    row.logoUri,
    row.image,
    row.imageUrl,
    row.image_uri,
  ];
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const t = c.trim();
    if (!t) continue;
    if (/^https?:\/\//i.test(t)) return t;
    if (t.startsWith("//")) return `https:${t}`;
  }
  return null;
}

/**
 * @param {unknown} row
 */
function trimTokenRow(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id ?? row.address ?? row.mint ?? "").trim();
  if (!id) return null;
  const decimals = Number(row.decimals);
  return {
    id,
    symbol: String(row.symbol ?? "").trim() || id.slice(0, 4),
    name: String(row.name ?? "").trim() || String(row.symbol ?? id.slice(0, 8)),
    icon: pickIconUrl(row),
    decimals: Number.isFinite(decimals) ? decimals : 9,
    isVerified: Boolean(row.isVerified ?? row.verified),
    usdPrice: row.usdPrice != null && Number.isFinite(Number(row.usdPrice)) ? Number(row.usdPrice) : null,
  };
}

/**
 * @param {string} [query]
 * @returns {Promise<{ tokens: ReturnType<typeof trimTokenRow>[]; source: string }>}
 */
export async function searchTokens(query) {
  const q = String(query ?? "").trim();
  const headers = jupiterHeaders();

  let url;
  let source;
  if (!q) {
    url = `${JUPITER_TOKENS_TAG}?query=verified`;
    source = "verified";
  } else {
    url = `${JUPITER_TOKENS_SEARCH}?query=${encodeURIComponent(q)}`;
    source = "search";
  }

  let response;
  try {
    response = await axios.get(url, {
      headers,
      timeout: 20_000,
      validateStatus: (s) => s < 500,
    });
  } catch (err) {
    const msg = err?.response?.data?.error ?? err?.message ?? "Jupiter token search failed";
    throw new Error(String(msg));
  }

  if (response.status >= 400) {
    const msg =
      response.data?.error ??
      response.data?.message ??
      `Jupiter tokens HTTP ${response.status}`;
    throw new Error(String(msg));
  }

  const raw = Array.isArray(response.data) ? response.data : [];
  const tokens = raw.map(trimTokenRow).filter(Boolean);
  return { tokens, source, computedAt: new Date().toISOString() };
}
