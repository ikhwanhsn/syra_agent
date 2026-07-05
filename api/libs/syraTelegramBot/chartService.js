/**
 * Telegram price chart PNG — area chart styled like Syra web chat (PumpfunPriceChart).
 */
import sharp from 'sharp';
import { getCoingeckoDataApiBaseUrl, coingeckoDataApiHeaders } from '../../utils/coingeckoAPI.js';
import { fetchPumpfunChartSeries } from '../pumpfunChartService.js';
import { buildMintChart } from '../tokensDossierService.js';
import { getSyraSocialLinks } from '../../config/syraSocialLinks.js';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const CHART_WIDTH = 960;
const CHART_HEIGHT = 580;
const DEFAULT_RANGE = '1W';
const RANGE_PILLS = ['1D', '1W', '1M', '1Y'];

/** Syra swap / PumpfunPriceChart terminal palette (dark). */
const THEME = {
  page: '#09090b',
  card: '#0c0c0e',
  cardBorder: 'rgba(255,255,255,0.08)',
  headerBg: 'rgba(255,255,255,0.03)',
  muted: '#71717a',
  mutedSoft: '#52525b',
  foreground: '#fafafa',
  grid: 'rgba(255,255,255,0.04)',
  openLine: 'rgba(161,161,170,0.35)',
  up: { line: '#22c55e', top: 'rgba(34,197,94,0.42)', bottom: 'rgba(34,197,94,0.02)', pill: 'rgba(34,197,94,0.12)' },
  down: { line: '#ef4444', top: 'rgba(239,68,68,0.38)', bottom: 'rgba(239,68,68,0.02)', pill: 'rgba(239,68,68,0.12)' },
  pillActive: '#fafafa',
  pillActiveText: '#09090b',
  pillIdle: 'rgba(255,255,255,0.06)',
  pillIdleText: '#a1a1aa',
  statLabel: 'rgba(161,161,170,0.75)',
};

/** @typedef {{ coinId?: string; mint?: string; symbol: string; name: string; range?: string }} TelegramChartMeta */

/**
 * Same mapping as website agentChartUiMeta (routes/agent/chat.js).
 * @param {string} toolId
 * @param {Record<string, string>} params
 * @param {unknown} toolData
 * @returns {TelegramChartMeta | null}
 */
export function resolveTelegramChartMeta(toolId, params, toolData) {
  const id = typeof toolId === 'string' ? toolId : '';
  if (id === 'pumpfun-coin' || id === 'pumpfun-coin-query') {
    const mint = params?.mint && String(params.mint).trim();
    if (!mint) return null;
    const symbol =
      (toolData && typeof toolData === 'object' && typeof toolData.symbol === 'string' && toolData.symbol.trim()) ||
      mint.slice(0, 4).toUpperCase();
    const name =
      (toolData && typeof toolData === 'object' && typeof toolData.name === 'string' && toolData.name.trim()) ||
      symbol;
    return { mint, symbol, name, range: DEFAULT_RANGE };
  }
  if (id === 'pumpfun-sol-price') {
    return { mint: WSOL_MINT, symbol: 'SOL', name: 'Solana', range: DEFAULT_RANGE };
  }
  if (id === 'signal') {
    const raw = (params?.token && String(params.token).trim()) || 'bitcoin';
    const normalized = raw.toLowerCase();
    const SIGNAL_CHART = {
      bitcoin: { coinId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      btc: { coinId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
      ethereum: { coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      eth: { coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
      solana: { coinId: 'solana', symbol: 'SOL', name: 'Solana' },
      sol: { coinId: 'solana', symbol: 'SOL', name: 'Solana' },
    };
    const row = SIGNAL_CHART[normalized];
    if (row) {
      return { coinId: row.coinId, symbol: row.symbol, name: row.name, range: DEFAULT_RANGE };
    }
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) && normalized.length <= 80) {
      return {
        coinId: normalized,
        symbol: normalized.slice(0, 8).toUpperCase(),
        name: normalized,
        range: DEFAULT_RANGE,
      };
    }
  }
  return null;
}

/**
 * @param {string} range
 * @returns {number}
 */
function rangeToDays(range) {
  const r = String(range || '').trim().toUpperCase();
  if (r === '1D') return 1;
  if (r === '1W') return 7;
  if (r === '1M') return 30;
  if (r === '1Y') return 365;
  return 7;
}

/**
 * @param {string} coinId
 * @param {string} range
 * @returns {Promise<Array<{ time: number; value: number }>>}
 */
async function fetchCoinGeckoUsdSeries(coinId, range) {
  const days = rangeToDays(range);
  const ohlcBase = getCoingeckoDataApiBaseUrl();
  const ohlcUrl = `${ohlcBase}/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;
  const res = await fetch(ohlcUrl, { headers: coingeckoDataApiHeaders() });
  const body = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(body)) return [];

  return body
    .map((row) => {
      if (!Array.isArray(row) || row.length < 5) return null;
      const ts = Number(row[0]);
      const c = Number(row[4]);
      if (!Number.isFinite(ts) || !Number.isFinite(c) || c <= 0) return null;
      return { time: Math.floor(ts / 1000), value: c };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
}

/**
 * @param {string} mint
 * @param {string} range
 * @returns {Promise<Array<{ time: number; value: number }>>}
 */
async function fetchMintUsdSeries(mint, range) {
  const trimmed = String(mint || '').trim();
  if (!trimmed) return [];

  if (trimmed !== WSOL_MINT) {
    const pump = await fetchPumpfunChartSeries(trimmed, range);
    if (pump.points?.length >= 2) return pump.points;
  }

  try {
    const dossier = await buildMintChart({ mint: trimmed });
    if (dossier.ok && Array.isArray(dossier.data?.ohlcv?.candles)) {
      const candles = dossier.data.ohlcv.candles;
      const points = candles
        .map((c) => {
          const time = Number(c?.time);
          const value = Number(c?.close);
          if (!Number.isFinite(time) || !Number.isFinite(value) || value <= 0) return null;
          return { time, value };
        })
        .filter(Boolean)
        .sort((a, b) => a.time - b.time);
      if (points.length >= 2) return points;
    }
  } catch {
    /* optional paid path */
  }

  return [];
}

/**
 * @param {TelegramChartMeta} meta
 * @returns {Promise<Array<{ time: number; value: number }>>}
 */
async function fetchChartPoints(meta) {
  const range = meta.range || DEFAULT_RANGE;
  if (meta.coinId) {
    const points = await fetchCoinGeckoUsdSeries(meta.coinId, range);
    if (points.length >= 2) return points;
  }
  if (meta.mint) {
    const cgId = meta.mint === WSOL_MINT ? 'solana' : null;
    if (cgId) {
      const cg = await fetchCoinGeckoUsdSeries(cgId, range);
      if (cg.length >= 2) return cg;
    }
    return fetchMintUsdSeries(meta.mint, range);
  }
  return [];
}

/**
 * @param {number} p
 */
function formatPrice(p) {
  if (!Number.isFinite(p)) return '—';
  if (p >= 1) return p.toLocaleString('en-US', { maximumFractionDigits: 4 });
  if (p >= 0.0001) return p.toLocaleString('en-US', { maximumSignificantDigits: 6 });
  return p.toExponential(2);
}

/**
 * @param {number} n
 */
function formatPct(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

/**
 * @param {string} s
 */
function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Array<{ value: number }>} points
 */
function computeRangeStats(points) {
  if (!points.length) return null;
  const open = points[0].value;
  const close = points[points.length - 1].value;
  let high = open;
  let low = open;
  for (const p of points) {
    if (p.value > high) high = p.value;
    if (p.value < low) low = p.value;
  }
  const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
  return { open, close, high, low, changePct };
}

/**
 * Smooth line path (Catmull-Rom → cubic bezier), matching lightweight-charts curves.
 * @param {Array<{ x: number; y: number }>} coords
 */
function buildSmoothPath(coords) {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`;
  if (coords.length === 2) {
    return `M${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)} L${coords[1].x.toFixed(2)},${coords[1].y.toFixed(2)}`;
  }

  let d = `M${coords[0].x.toFixed(2)},${coords[0].y.toFixed(2)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * @param {Array<{ x: number; y: number }>} coords
 * @param {number} baselineY
 */
function buildSmoothAreaPath(coords, baselineY) {
  const line = buildSmoothPath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  return `${line} L${last.x.toFixed(2)},${baselineY.toFixed(2)} L${first.x.toFixed(2)},${baselineY.toFixed(2)} Z`;
}

/**
 * @param {number} ts
 * @param {string} range
 */
function formatAxisTime(ts, range) {
  const d = new Date(ts * 1000);
  const r = String(range || '').toUpperCase();
  if (r === '1D') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * @param {Array<{ time: number; value: number }>} points
 * @param {TelegramChartMeta} meta
 * @returns {string}
 */
function buildChartSvg(points, meta) {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  const stats = computeRangeStats(points);
  if (!stats) return '';

  const rangeLabel = String(meta.range || DEFAULT_RANGE).toUpperCase();
  const symbol = escapeXml(meta.symbol || '—');
  const name = escapeXml(meta.name || meta.symbol || 'Asset');
  const isUp = stats.changePct >= 0;
  const palette = isUp ? THEME.up : THEME.down;

  const headerH = 168;
  const chartTop = headerH + 8;
  const chartBottom = height - 36;
  const chartLeft = 20;
  const chartRight = width - 88;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const values = points.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const padY = (maxV - minV) * 0.08 || maxV * 0.02 || 1;
  const yMin = minV - padY;
  const yMax = maxV + padY;
  const ySpan = yMax - yMin || 1;

  const yFor = (v) => chartTop + chartH - ((v - yMin) / ySpan) * chartH;

  const coords = points.map((p, i) => ({
    x: chartLeft + (points.length <= 1 ? 0 : (i / (points.length - 1)) * chartW),
    y: yFor(p.value),
    time: p.time,
  }));

  const linePath = buildSmoothPath(coords);
  const areaPath = buildSmoothAreaPath(coords, chartBottom);
  const openY = yFor(stats.open);
  const last = coords[coords.length - 1];

  const priceLabel = `$${formatPrice(stats.close)}`;
  const priceStr = escapeXml(priceLabel);
  const pctStr = escapeXml(formatPct(stats.changePct));
  const changeArrow = isUp ? '▲' : '▼';
  const pillX = 24 + priceLabel.length * 15 + 8;
  const changePillW = Math.max(92, pctStr.length * 8 + 40);

  // Y-axis ticks (right side, like lightweight-charts)
  const tickCount = 4;
  let yAxisSvg = '';
  let gridSvg = '';
  for (let i = 0; i <= tickCount; i++) {
    const v = yMax - (i / tickCount) * ySpan;
    const y = yFor(v);
    gridSvg += `<line x1="${chartLeft}" y1="${y.toFixed(1)}" x2="${chartRight}" y2="${y.toFixed(1)}" stroke="${THEME.grid}" stroke-width="1" stroke-dasharray="3 5"/>`;
    yAxisSvg += `<text x="${chartRight + 10}" y="${(y + 4).toFixed(1)}" fill="${THEME.muted}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" text-anchor="start">${escapeXml(formatPrice(v))}</text>`;
  }

  // X-axis time labels
  const xLabelCount = 4;
  let xAxisSvg = '';
  for (let i = 0; i <= xLabelCount; i++) {
    const idx = Math.round((i / xLabelCount) * (points.length - 1));
    const pt = points[idx];
    const x = chartLeft + (idx / Math.max(points.length - 1, 1)) * chartW;
    xAxisSvg += `<text x="${x.toFixed(1)}" y="${(chartBottom + 22).toFixed(1)}" fill="${THEME.mutedSoft}" font-family="ui-monospace, monospace" font-size="10" text-anchor="middle">${escapeXml(formatAxisTime(pt.time, rangeLabel))}</text>`;
  }

  // Range pills (swap panel style)
  const rangePillW = 52;
  const pillH = 32;
  const pillGap = 4;
  const pillsTotalW = RANGE_PILLS.length * rangePillW + (RANGE_PILLS.length - 1) * pillGap;
  let pillStartX = width - 24 - pillsTotalW;
  let pillsSvg = '';
  for (const pill of RANGE_PILLS) {
    const active = pill === rangeLabel;
    pillsSvg += `<rect x="${pillStartX}" y="28" width="${rangePillW}" height="${pillH}" rx="10" fill="${active ? THEME.pillActive : THEME.pillIdle}"/>`;
    pillsSvg += `<text x="${pillStartX + rangePillW / 2}" y="49" fill="${active ? THEME.pillActiveText : THEME.pillIdleText}" font-family="ui-monospace, monospace" font-size="12" font-weight="600" text-anchor="middle">${pill}</text>`;
    pillStartX += rangePillW + pillGap;
  }

  // Stats row (Open / High / Low / Change) — like terminal chart header
  const statCols = [
    { label: 'Open', value: formatPrice(stats.open), color: THEME.foreground },
    { label: 'High', value: formatPrice(stats.high), color: THEME.up.line },
    { label: 'Low', value: formatPrice(stats.low), color: THEME.down.line },
    { label: `${rangeLabel} chg`, value: formatPct(stats.changePct), color: palette.line },
  ];
  const statW = (width - 48) / 4;
  let statsSvg = '';
  statCols.forEach((col, i) => {
    const x = 24 + i * statW;
    statsSvg += `<text x="${x}" y="118" fill="${THEME.statLabel}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="10" font-weight="600" letter-spacing="1.2">${escapeXml(col.label.toUpperCase())}</text>`;
    statsSvg += `<text x="${x}" y="140" fill="${col.color}" font-family="ui-monospace, monospace" font-size="14" font-weight="600">${escapeXml(col.value)}</text>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.top}"/>
      <stop offset="85%" stop-color="${palette.bottom}"/>
      <stop offset="100%" stop-color="${THEME.card}"/>
    </linearGradient>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.045)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${THEME.card}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${THEME.card}" stop-opacity="0.92"/>
    </linearGradient>
    <clipPath id="chartClip">
      <rect x="${chartLeft}" y="${chartTop}" width="${chartW}" height="${chartH + 8}" rx="4"/>
    </clipPath>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="${THEME.page}"/>
  <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="20" fill="${THEME.card}" stroke="${THEME.cardBorder}" stroke-width="1"/>
  <rect x="12" y="12" width="${width - 24}" height="${headerH}" rx="20" fill="url(#headerGrad)"/>
  <line x1="24" y1="${headerH + 12}" x2="${width - 24}" y2="${headerH + 12}" stroke="${THEME.cardBorder}" stroke-width="1"/>

  <!-- Live badge -->
  <circle cx="36" cy="34" r="5" fill="${THEME.up.line}" opacity="0.35"/>
  <circle cx="36" cy="34" r="3" fill="${THEME.up.line}"/>
  <text x="48" y="38" fill="${THEME.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1.6">LIVE USD</text>

  ${pillsSvg}

  <!-- Title + price -->
  <text x="24" y="72" fill="${THEME.foreground}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26" font-weight="700">${symbol}</text>
  <text x="${24 + (meta.symbol || '').length * 16 + 10}" y="72" fill="${THEME.muted}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="500">${name}</text>

  <text x="24" y="102" fill="${THEME.foreground}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="28" font-weight="700">${priceStr}</text>
  <rect x="${pillX}" y="78" width="${changePillW}" height="30" rx="8" fill="${palette.pill}"/>
  <text x="${pillX + 14}" y="99" fill="${palette.line}" font-family="ui-monospace, monospace" font-size="14" font-weight="700">${changeArrow} ${pctStr}</text>

  ${statsSvg}

  <!-- Chart area -->
  <g clip-path="url(#chartClip)">
    ${gridSvg}
    <line x1="${chartLeft}" y1="${openY.toFixed(1)}" x2="${chartRight}" y2="${openY.toFixed(1)}" stroke="${THEME.openLine}" stroke-width="1" stroke-dasharray="5 4"/>
    <path d="${areaPath}" fill="url(#areaGrad)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="${palette.line}" stroke-width="2.75" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)"/>
    <line x1="${chartLeft}" y1="${last.y.toFixed(1)}" x2="${chartRight}" y2="${last.y.toFixed(1)}" stroke="${palette.line}" stroke-width="1" stroke-dasharray="4 4" opacity="0.35"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="7" fill="${THEME.card}" stroke="${palette.line}" stroke-width="2.5"/>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.5" fill="${palette.line}"/>
  </g>

  ${yAxisSvg}
  ${xAxisSvg}

  <rect x="${chartLeft}" y="${chartBottom - 48}" width="${chartW}" height="48" fill="url(#bottomFade)"/>

  <text x="${width - 24}" y="${height - 16}" fill="${THEME.mutedSoft}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="10" text-anchor="end">Syra</text>
</svg>`;
}

/**
 * @param {TelegramChartMeta} meta
 * @returns {string}
 */
function chartDetailUrl(meta) {
  const base = getSyraSocialLinks().website.replace(/\/$/, '');
  if (meta.coinId) return `${base}/assets/${encodeURIComponent(meta.coinId)}`;
  if (meta.mint) return `${base}/assets/${encodeURIComponent(meta.mint)}`;
  return base;
}

/**
 * @param {string} toolId
 * @param {Record<string, string>} params
 * @param {unknown} toolData
 * @returns {Promise<{ png: Buffer; caption: string; detailUrl: string } | null>}
 */
export async function buildTelegramChartAttachment(toolId, params, toolData) {
  const meta = resolveTelegramChartMeta(toolId, params, toolData);
  if (!meta) return null;

  const points = await fetchChartPoints(meta);
  if (points.length < 2) return null;

  const svg = buildChartSvg(points, meta);
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(CHART_WIDTH, CHART_HEIGHT, { fit: 'fill' })
    .png({ compressionLevel: 6 })
    .toBuffer();

  const last = points[points.length - 1].value;
  const first = points[0].value;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  const rangeLabel = String(meta.range || DEFAULT_RANGE).toUpperCase();
  const caption = `${meta.symbol} · $${formatPrice(last)} · ${formatPct(changePct)} (${rangeLabel})`;

  return {
    png,
    caption,
    detailUrl: chartDetailUrl(meta),
  };
}
