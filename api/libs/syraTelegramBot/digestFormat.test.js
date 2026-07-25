/**
 * Syra Daily digest formatters + assembly.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDigestSentimentHtml,
  formatDigestNewsBulletsHtml,
  formatDigestEventBulletsHtml,
  formatDigestSignalHtml,
  assembleDigestSections,
  buildDigestReplyMarkup,
  buildDigestPhotoCaption,
  pickLatestSentimentRow,
} from './digestFormat.js';

test('formatDigestSentimentHtml uses human lean, not JSON', () => {
  const html = formatDigestSentimentHtml({
    sentimentAnalysis: [
      {
        date: '2026-06-24',
        ticker: { Positive: 2, Negative: 0, Neutral: 1 },
      },
      {
        date: '2026-06-25',
        ticker: { Positive: 0, Negative: 1, Neutral: 0 },
      },
    ],
  });
  assert.ok(html);
  assert.match(html, /BTC pulse/);
  assert.match(html, /Negative lean/);
  assert.match(html, /0 pos \/ 1 neg/);
  assert.equal(html.includes('{'), false);
  assert.equal(html.includes('sentimentAnalysis'), false);
});

test('pickLatestSentimentRow sorts by date', () => {
  const row = pickLatestSentimentRow({
    sentimentAnalysis: [
      { date: '2026-01-02', ticker: { Positive: 1, Negative: 0, Neutral: 0 } },
      { date: '2026-01-10', ticker: { Positive: 0, Negative: 3, Neutral: 0 } },
      { date: '2026-01-05', ticker: { Positive: 9, Negative: 0, Neutral: 0 } },
    ],
  });
  assert.equal(row?.date, '2026-01-10');
});

test('formatDigestSentimentHtml returns null for empty analysis', () => {
  assert.equal(formatDigestSentimentHtml({ sentimentAnalysis: [] }), null);
  assert.equal(formatDigestSentimentHtml({}), null);
});

test('formatDigestNewsBulletsHtml takes top titles', () => {
  const bullets = formatDigestNewsBulletsHtml({
    news: [
      { title: 'Bitcoin ETF inflows rise' },
      { title: 'Solana DeFi TVL jumps' },
      { title: 'Ignored third' },
    ],
  });
  assert.equal(bullets.length, 2);
  assert.match(bullets[0], /Bitcoin ETF/);
  assert.match(bullets[1], /Solana DeFi/);
});

test('formatDigestEventBulletsHtml extracts event names', () => {
  const bullets = formatDigestEventBulletsHtml({
    event: [
      {
        date: '2026-07-26',
        general: [{ event_name: 'FOMC decision', event_text: 'Rates' }],
        ticker: [{ event_name: 'BTC options expiry' }],
      },
    ],
  });
  assert.ok(bullets.length >= 1);
  assert.match(bullets[0], /FOMC|BTC options/);
  assert.equal(bullets.length <= 2, true);
});

test('formatDigestSignalHtml reads quickSummary signal', () => {
  const html = formatDigestSignalHtml({
    signal: {
      quickSummary: { signal: 'BUY', confidence: 'High', entry: '100' },
      technicalIndicators: { rsi: 54.2 },
      marketOverview: { currentPrice: '100' },
    },
  });
  assert.ok(html);
  assert.match(html, /BTC signal/);
  assert.match(html, /BUY/);
  assert.match(html, /RSI 54/);
});

test('formatDigestSignalHtml skips empty payload', () => {
  assert.equal(formatDigestSignalHtml({}), null);
  assert.equal(formatDigestSignalHtml({ signal: {} }), null);
});

test('assembleDigestSections builds labeled sections and omits empty', () => {
  const assembled = assembleDigestSections({
    newsData: { news: [{ title: 'Headline one' }] },
    sentimentData: {
      sentimentAnalysis: [{ date: '2026-06-25', ticker: { Positive: 3, Negative: 1, Neutral: 0 } }],
    },
    eventData: { event: [] },
    signalData: {
      signal: {
        quickSummary: { signal: 'HOLD', confidence: 'Medium' },
        technicalIndicators: { rsi: 50 },
        marketOverview: {},
      },
    },
  });
  assert.equal(assembled.hasNews, true);
  assert.equal(assembled.hasSentiment, true);
  assert.equal(assembled.hasEvents, false);
  assert.equal(assembled.hasSignal, true);
  const joined = assembled.sectionLines.join('\n');
  assert.match(joined, /<b>News<\/b>/);
  assert.match(joined, /<b>BTC pulse<\/b>/);
  assert.match(joined, /<b>BTC signal<\/b>/);
  assert.equal(joined.includes('<b>Events</b>'), false);
  assert.equal(joined.includes('{'), false);
});

test('assembleDigestSections empty payloads yields no sections', () => {
  const assembled = assembleDigestSections({});
  assert.deepEqual(assembled.sectionLines, []);
  assert.equal(assembled.hasNews, false);
  assert.equal(assembled.hasSentiment, false);
  assert.equal(assembled.hasEvents, false);
  assert.equal(assembled.hasSignal, false);
});

test('buildDigestReplyMarkup prefers signal and events when present', () => {
  const withBoth = buildDigestReplyMarkup({ hasEvents: true, hasSignal: true });
  const flat = withBoth.inline_keyboard.flat().map((b) => b.text);
  assert.ok(flat.includes('BTC signal'));
  assert.ok(flat.includes('Events'));
  assert.ok(flat.includes('Ask Syra'));
  assert.equal(flat.includes('SOL signal'), false);

  const thin = buildDigestReplyMarkup({ hasEvents: false, hasSignal: false });
  const thinFlat = thin.inline_keyboard.flat().map((b) => b.text);
  assert.ok(thinFlat.includes('SOL signal'));
  assert.ok(thinFlat.includes('Smart money today'));
});

test('buildDigestPhotoCaption keeps short digest intact', () => {
  const caption = buildDigestPhotoCaption('BTC · $100 · +1.2% (1W)', '<b>☀️ Syra Daily</b>\n• Hello');
  assert.match(caption, /BTC · \$100/);
  assert.match(caption, /Syra Daily/);
});

test('buildDigestPhotoCaption truncates long body under 1024', () => {
  const longBody = `<b>x</b>\n${'a'.repeat(2000)}`;
  const caption = buildDigestPhotoCaption('BTC · $1', longBody);
  assert.ok(caption.length <= 1024);
  assert.ok(caption.endsWith('…'));
});
