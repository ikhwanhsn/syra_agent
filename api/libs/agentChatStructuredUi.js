/**
 * Structured UI payload helpers for agent chat (sources, reasoning steps,
 * follow-ups, recommendations). Extract from real tool data, never invent.
 */

const MAX_SOURCES = 12;
const MAX_FOLLOWUPS = 4;

const SEARCH_TOOL_RE = /news|search|crawl|website|headline|rss/i;

/**
 * @param {string} toolId
 * @returns {'search' | 'tool'}
 */
export function kindForToolId(toolId) {
  return SEARCH_TOOL_RE.test(String(toolId || '')) ? 'search' : 'tool';
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}

/**
 * @param {string} url
 * @returns {string}
 */
function originHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Pull citation-worthy URLs/titles from a tool result object.
 * @param {string} toolId
 * @param {unknown} data
 * @returns {Array<{ url: string; title: string; origin?: string }>}
 */
export function extractSourcesFromToolData(toolId, data) {
  /** @type {Array<{ url: string; title: string; origin?: string }>} */
  const out = [];
  const seen = new Set();

  /**
   * @param {string} url
   * @param {string} [title]
   */
  function add(url, title) {
    if (out.length >= MAX_SOURCES) return;
    const href = typeof url === 'string' ? url.trim() : '';
    if (!isHttpUrl(href)) return;
    const key = href.toLowerCase().replace(/\/+$/, '');
    if (seen.has(key)) return;
    seen.add(key);
    const label =
      (typeof title === 'string' && title.trim()) || originHost(href) || href;
    const origin = originHost(href);
    out.push({ url: href, title: label.slice(0, 180), ...(origin ? { origin } : {}) });
  }

  /**
   * @param {unknown} node
   * @param {number} depth
   */
  function walk(node, depth) {
    if (out.length >= MAX_SOURCES || depth > 6 || node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node !== 'object') return;
    const row = /** @type {Record<string, unknown>} */ (node);
    const url =
      (typeof row.news_url === 'string' && row.news_url) ||
      (typeof row.url === 'string' && row.url) ||
      (typeof row.link === 'string' && row.link) ||
      (typeof row.href === 'string' && row.href) ||
      '';
    const title =
      (typeof row.title === 'string' && row.title) ||
      (typeof row.headline === 'string' && row.headline) ||
      (typeof row.name === 'string' && row.name) ||
      '';
    if (url) add(url, title);
    for (const [k, v] of Object.entries(row)) {
      if (k === 'transaction' || k === 'serializedTransaction') continue;
      if (v && typeof v === 'object') walk(v, depth + 1);
    }
  }

  walk(data, 0);
  if (toolId === 'asset-research' && data && typeof data === 'object') {
    const sources = /** @type {Record<string, unknown>} */ (data).sources;
    if (sources && typeof sources === 'object') {
      for (const v of Object.values(sources)) {
        if (typeof v === 'string') add(v, originHost(v) || 'Source');
      }
    }
  }
  return out;
}

/**
 * @param {string} toolId
 * @param {unknown} data
 * @returns {{ title: string; detail?: string; confidence?: number; actions?: Array<{ id: string; label: string }> } | null}
 */
export function extractRecommendationFromToolData(toolId, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const row = /** @type {Record<string, unknown>} */ (data);

  if (toolId === 'asset-research' && Array.isArray(row.nextActions) && row.nextActions.length) {
    const actions = row.nextActions
      .filter((a) => typeof a === 'string' && a.trim())
      .slice(0, 4)
      .map((label, i) => ({ id: `action-${i}`, label: String(label).trim() }));
    if (!actions.length) return null;
    const intel = row.intelligence && typeof row.intelligence === 'object'
      ? /** @type {Record<string, unknown>} */ (row.intelligence).data
      : null;
    const signal =
      intel && typeof intel === 'object'
        ? /** @type {Record<string, unknown>} */ (intel).signal
        : null;
    const tradingSignal =
      signal && typeof signal === 'object'
        ? String(/** @type {Record<string, unknown>} */ (signal).tradingSignal || '').trim()
        : '';
    const title = tradingSignal
      ? `Syra signal leans ${tradingSignal}`
      : actions[0].label;
    return {
      title,
      detail: actions.length > 1 ? actions.slice(1).map((a) => a.label).join(' ') : undefined,
      actions,
    };
  }

  if (toolId === 'signal') {
    const tradingSignal = String(
      row.tradingSignal || row.TRADING_SIGNAL || row.recommendation || ''
    ).trim();
    const strengthRaw = String(row.strength || row.STRENGTH || '').trim();
    if (!tradingSignal && !strengthRaw) return null;
    /** @type {number | undefined} */
    let confidence;
    const n = Number(row.confidence ?? row.score);
    if (Number.isFinite(n)) {
      confidence = n > 1 ? Math.min(1, n / 100) : Math.max(0, Math.min(1, n));
    } else if (/strong/i.test(strengthRaw)) {
      confidence = 0.78;
    } else if (/moderate|medium/i.test(strengthRaw)) {
      confidence = 0.55;
    } else if (/weak/i.test(strengthRaw)) {
      confidence = 0.32;
    }
    const title = tradingSignal
      ? `Signal: ${tradingSignal}${strengthRaw ? ` (${strengthRaw})` : ''}`
      : `Signal strength: ${strengthRaw}`;
    const detail =
      typeof row.summary === 'string'
        ? row.summary.trim()
        : typeof row.reason === 'string'
          ? row.reason.trim()
          : undefined;
    return {
      title,
      ...(detail ? { detail: detail.slice(0, 280) } : {}),
      ...(confidence != null ? { confidence } : {}),
    };
  }

  return null;
}

/**
 * Split a trailing FOLLOWUPS: block from the synthesis reply.
 * @param {string} text
 * @returns {{ response: string; followUps: string[] }}
 */
export function splitFollowUpsFromResponse(text) {
  const raw = typeof text === 'string' ? text : '';
  if (!raw.trim()) return { response: raw, followUps: [] };
  const m = raw.match(/\n+FOLLOWUPS:\s*\n([\s\S]+)$/i);
  if (!m || m.index == null) return { response: raw, followUps: [] };
  const followUps = m[1]
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s+/, '').replace(/^\s*\d+[.)]\s+/, '').trim())
    .filter((line) => line.length > 0 && line.length < 160 && !/^FOLLOWUPS:?$/i.test(line))
    .slice(0, MAX_FOLLOWUPS);
  return {
    response: raw.slice(0, m.index).trimEnd(),
    followUps,
  };
}

export const FOLLOWUPS_SYNTHESIS_NOTE =
  'If the user would reasonably ask a next question, end your reply with a FOLLOWUPS block: a line that is exactly FOLLOWUPS: then 2-3 short questions, one per line, each starting with "- ". Skip FOLLOWUPS for errors, empty replies, or when nothing useful remains to ask.';

/**
 * Extra structured fields on persisted assistant messages.
 * @param {Record<string, unknown>} m
 * @returns {Record<string, unknown>}
 */
export function extraAssistantUiFields(m) {
  if (!m || typeof m !== 'object') return {};
  /** @type {Record<string, unknown>} */
  const out = {};
  if (Array.isArray(m.sources) && m.sources.length > 0) out.sources = m.sources;
  if (Array.isArray(m.reasoningSteps) && m.reasoningSteps.length > 0) {
    out.reasoningSteps = m.reasoningSteps;
  }
  if (Array.isArray(m.followUps) && m.followUps.length > 0) out.followUps = m.followUps;
  if (m.recommendation && typeof m.recommendation === 'object') {
    out.recommendation = m.recommendation;
  }
  return out;
}
