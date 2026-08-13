/**
 * Run: node --test api/libs/llmRouter.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRoutePolicy,
  rankProviders,
  scoreProvider,
  getSystemFallbackProvider,
} from './llmRouter.js';
import { splitLlmExchangeRevenue, applyLlmExchangeMargin } from './llmService.js';
import {
  getLlmAdapter,
  normalizeLlmProtocol,
  resolveProtocolBaseUrl,
} from './llmAdapters.js';

describe('llmRouter', () => {
  it('parses route policies with cheapest default', () => {
    assert.equal(parseRoutePolicy('reliable'), 'reliable');
    assert.equal(parseRoutePolicy('nope'), 'cheapest');
    assert.equal(parseRoutePolicy(null), 'cheapest');
  });

  it('ranks cheaper providers higher under cheapest policy', () => {
    const cheap = {
      ...getSystemFallbackProvider(),
      _id: 'cheap',
      isSystemFallback: false,
      slug: 'cheap',
      pricing: { mode: 'flat', flatUsdPerCall: 0.001 },
      health: { callabilityScore: 0.9, successRate: 0.9, p50LatencyMs: 500 },
    };
    const pricey = {
      ...cheap,
      _id: 'pricey',
      slug: 'pricey',
      pricing: { mode: 'flat', flatUsdPerCall: 0.05 },
    };
    const ranked = rankProviders([pricey, cheap], { messages: [{ role: 'user', content: 'hi' }] }, 'cheapest');
    assert.equal(ranked[0].provider.slug, 'cheap');
  });

  it('scores reliable policy by callability', () => {
    const healthy = {
      health: { callabilityScore: 0.99, p50LatencyMs: 800 },
      featured: false,
    };
    const flaky = {
      health: { callabilityScore: 0.2, p50LatencyMs: 100 },
      featured: false,
    };
    assert.ok(scoreProvider(healthy, 'reliable', 0.01) > scoreProvider(flaky, 'reliable', 0.01));
  });
});

describe('llmService fee split', () => {
  it('splits 20% platform / 80% seller by default', () => {
    const split = splitLlmExchangeRevenue(1, 2000);
    assert.equal(split.platformFeeUsd, 0.2);
    assert.equal(split.sellerShareUsd, 0.8);
  });

  it('applies exchange margin with floor', () => {
    const priced = applyLlmExchangeMargin(0.001);
    assert.ok(priced >= 0.004);
  });
});

describe('llmAdapters', () => {
  const openAiBody = {
    messages: [
      { role: 'system', content: 'Be brief.' },
      { role: 'user', content: 'Hello' },
    ],
    max_tokens: 32,
    temperature: 0.2,
  };

  it('normalizes unknown protocol to openai', () => {
    assert.equal(normalizeLlmProtocol('claude'), 'openai');
    assert.equal(normalizeLlmProtocol('anthropic'), 'anthropic');
  });

  it('openai adapter posts chat/completions with Bearer', () => {
    const adapter = getLlmAdapter('openai');
    const built = adapter.buildRequest({
      base: 'https://api.deepseek.com/v1',
      modelId: 'deepseek-chat',
      apiKey: 'sk-test',
      body: openAiBody,
      authConfig: {},
    });
    assert.equal(built.url, 'https://api.deepseek.com/v1/chat/completions');
    assert.equal(built.headers.Authorization, 'Bearer sk-test');
    assert.equal(built.body.model, 'deepseek-chat');
    assert.deepEqual(built.body.messages, openAiBody.messages);

    const parsed = adapter.parseResponse(
      {
        id: 'x',
        object: 'chat.completion',
        model: 'deepseek-chat',
        choices: [{ index: 0, message: { role: 'assistant', content: 'hi' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
      { modelId: 'deepseek-chat' },
    );
    assert.equal(parsed.choices[0].message.content, 'hi');
  });

  it('anthropic adapter translates messages and response', () => {
    const adapter = getLlmAdapter('anthropic');
    assert.equal(
      resolveProtocolBaseUrl('anthropic', ''),
      'https://api.anthropic.com',
    );
    const built = adapter.buildRequest({
      base: adapter.resolveBaseUrl(''),
      modelId: 'claude-3-5-sonnet-latest',
      apiKey: 'sk-ant-test',
      body: openAiBody,
      authConfig: { apiVersion: '2023-06-01' },
    });
    assert.equal(built.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(built.headers['x-api-key'], 'sk-ant-test');
    assert.equal(built.headers['anthropic-version'], '2023-06-01');
    assert.equal(built.body.system, 'Be brief.');
    assert.deepEqual(built.body.messages, [{ role: 'user', content: 'Hello' }]);
    assert.equal(built.body.max_tokens, 32);

    const parsed = adapter.parseResponse(
      {
        model: 'claude-3-5-sonnet-latest',
        content: [{ type: 'text', text: 'Claude says hi' }],
        usage: { input_tokens: 10, output_tokens: 4 },
        stop_reason: 'end_turn',
      },
      { modelId: 'claude-3-5-sonnet-latest' },
    );
    assert.equal(parsed.object, 'chat.completion');
    assert.equal(parsed.choices[0].message.content, 'Claude says hi');
    assert.equal(parsed.usage.prompt_tokens, 10);
    assert.equal(parsed.usage.completion_tokens, 4);
  });

  it('google adapter builds generateContent URL and normalizes', () => {
    const adapter = getLlmAdapter('google');
    const built = adapter.buildRequest({
      base: adapter.resolveBaseUrl(''),
      modelId: 'gemini-1.5-pro',
      apiKey: 'AIza-test',
      body: openAiBody,
      authConfig: {},
    });
    assert.match(built.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-1\.5-pro:generateContent/);
    assert.match(built.url, /key=AIza-test/);
    assert.equal(built.body.systemInstruction.parts[0].text, 'Be brief.');
    assert.equal(built.body.contents[0].role, 'user');
    assert.equal(built.body.generationConfig.maxOutputTokens, 32);

    const parsed = adapter.parseResponse(
      {
        candidates: [
          {
            content: { parts: [{ text: 'Gemini hi' }] },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 3 },
      },
      { modelId: 'gemini-1.5-pro' },
    );
    assert.equal(parsed.choices[0].message.content, 'Gemini hi');
    assert.equal(parsed.usage.prompt_tokens, 8);
    assert.equal(parsed.usage.completion_tokens, 3);
  });

  it('openai_custom adapter uses configurable path and raw auth', () => {
    const adapter = getLlmAdapter('openai_custom');
    const built = adapter.buildRequest({
      base: 'https://gateway.example.com',
      modelId: 'my-model',
      apiKey: 'secret',
      body: openAiBody,
      authConfig: {
        chatPath: '/v1/custom/chat',
        authHeader: 'X-Api-Key',
        authScheme: 'raw',
      },
    });
    assert.equal(built.url, 'https://gateway.example.com/v1/custom/chat');
    assert.equal(built.headers['X-Api-Key'], 'secret');
    assert.equal(built.headers.Authorization, undefined);
    assert.equal(built.body.model, 'my-model');
  });
});
