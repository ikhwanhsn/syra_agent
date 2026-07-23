/**
 * Unit tests for Telegram chat queue + answer button planning (no LLM).
 * Run: node --test api/libs/syraTelegramBot/chatQueue.test.js api/libs/syraTelegramBot/answerButtonsService.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  tryRunExclusiveForChat,
  tryAcquireBrainSlot,
  isChatBusy,
  resetChatQueueForTests,
  BRAIN_COOLDOWN_MS,
} from './chatQueue.js';

test('tryRunExclusiveForChat soft-rejects when chat is busy', async () => {
  resetChatQueueForTests();
  let release;
  const gate = new Promise((r) => {
    release = r;
  });

  const first = tryRunExclusiveForChat('chat-1', async () => {
    await gate;
    return 'ok';
  });

  await Promise.resolve();
  assert.equal(isChatBusy('chat-1'), true);

  const second = await tryRunExclusiveForChat('chat-1', async () => 'should-not-run');
  assert.equal(second.started, false);

  release();
  const firstResult = await first;
  assert.equal(firstResult.started, true);
  assert.equal(firstResult.result, 'ok');
  assert.equal(isChatBusy('chat-1'), false);
});

test('tryAcquireBrainSlot enforces cooldown', () => {
  resetChatQueueForTests();
  assert.equal(tryAcquireBrainSlot('chat-2', 1000), true);
  assert.equal(tryAcquireBrainSlot('chat-2', 1000), false);
  assert.equal(tryAcquireBrainSlot('chat-3', BRAIN_COOLDOWN_MS), true);
});

test('different chats run independently', async () => {
  resetChatQueueForTests();
  const order = [];

  const a = tryRunExclusiveForChat('a', async () => {
    order.push('a-start');
    await new Promise((r) => setTimeout(r, 20));
    order.push('a-end');
    return 1;
  });
  const b = tryRunExclusiveForChat('b', async () => {
    order.push('b-start');
    await new Promise((r) => setTimeout(r, 5));
    order.push('b-end');
    return 2;
  });

  const [ra, rb] = await Promise.all([a, b]);
  assert.equal(ra.started, true);
  assert.equal(rb.started, true);
  assert.ok(order.includes('a-start') && order.includes('b-start'));
});
