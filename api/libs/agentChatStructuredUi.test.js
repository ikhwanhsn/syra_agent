import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractRecommendationFromToolData,
  extractSourcesFromToolData,
  splitFollowUpsFromResponse,
} from './agentChatStructuredUi.js';

describe('splitFollowUpsFromResponse', () => {
  it('strips a trailing FOLLOWUPS block', () => {
    const raw = 'Mint chip is up 12%.\n\nFOLLOWUPS:\n- Compare to last summer\n- Check weekend peaks';
    const { response, followUps } = splitFollowUpsFromResponse(raw);
    assert.equal(response, 'Mint chip is up 12%.');
    assert.deepEqual(followUps, ['Compare to last summer', 'Check weekend peaks']);
  });

  it('returns original text when no block', () => {
    const { response, followUps } = splitFollowUpsFromResponse('Hello');
    assert.equal(response, 'Hello');
    assert.deepEqual(followUps, []);
  });
});

describe('extractSourcesFromToolData', () => {
  it('reads news_url from articles', () => {
    const sources = extractSourcesFromToolData('news', {
      articles: [
        { title: 'Solana rally', news_url: 'https://example.com/sol' },
        { title: 'Dup', news_url: 'https://example.com/sol/' },
      ],
    });
    assert.equal(sources.length, 1);
    assert.equal(sources[0].title, 'Solana rally');
    assert.equal(sources[0].origin, 'example.com');
  });
});

describe('extractRecommendationFromToolData', () => {
  it('maps asset-research nextActions', () => {
    const rec = extractRecommendationFromToolData('asset-research', {
      nextActions: ['Review Tokens risk summary before sizing any trade.', 'Verify mint liquidity'],
    });
    assert.ok(rec);
    assert.equal(rec.actions.length, 2);
  });
});
