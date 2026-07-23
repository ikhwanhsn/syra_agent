/**
 * Answer button planning — heuristic + fallback only (no OpenRouter).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  planTelegramAnswerButtons,
  buildFallbackFollowUps,
} from './answerButtonsService.js';

test('greeting skips follow-ups', async () => {
  const plan = await planTelegramAnswerButtons({
    userQuestion: 'hi',
    assistantAnswer: 'Hello! How can I help with crypto today?',
  });
  assert.equal(plan.showFollowUps, false);
  assert.equal(plan.showMainMenu, false);
});

test('tool answers get fallback follow-ups without LLM', async () => {
  const plan = await planTelegramAnswerButtons({
    userQuestion: "What's SOL trading at?",
    assistantAnswer: 'SOL is around $140 right now with solid volume on Solana DEXes today.',
    toolsUsed: ['Price'],
  });
  assert.equal(plan.showFollowUps, true);
  assert.equal(plan.followUpQuestions.length, 3);
  assert.ok(plan.followUpExpiresAt instanceof Date);
});

test('deposit hint shows main menu', async () => {
  const plan = await planTelegramAnswerButtons({
    userQuestion: 'BTC news',
    assistantAnswer: 'Deposit USDC to your Syra agent wallet (Wallet button) to fetch live data.',
  });
  assert.equal(plan.showFollowUps, false);
  assert.equal(plan.showMainMenu, true);
});

test('buildFallbackFollowUps returns three questions', () => {
  const qs = buildFallbackFollowUps('SOL price?');
  assert.equal(qs.length, 3);
  for (const q of qs) {
    assert.ok(q.endsWith('?'));
    assert.ok(q.length >= 16);
  }
});

test('substantive Q&A without tools still gets follow-ups', async () => {
  const plan = await planTelegramAnswerButtons({
    userQuestion: 'What is impermanent loss?',
    assistantAnswer:
      'Impermanent loss happens when the price of tokens in a liquidity pool diverges from when you deposited. The larger the divergence, the more IL you may see versus simply holding. It is a core DeFi risk for LPs on AMMs.',
  });
  assert.equal(plan.showFollowUps, true);
  assert.equal(plan.followUpQuestions.length, 3);
});
