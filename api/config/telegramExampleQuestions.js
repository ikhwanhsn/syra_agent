/**
 * Example prompts answerable from general knowledge — no live data or tool calls.
 * Mirrors web/src/lib/exampleQuestions.ts (keep in sync for UX parity).
 */
export const TELEGRAM_NO_TOOL_EXAMPLE_QUESTIONS = Object.freeze([
  'What is slippage in crypto trading?',
  'Explain impermanent loss simply',
  'What is MEV on Solana?',
  'How do DEXs differ from CEXs?',
  'What is TVL in DeFi?',
  'How does Solana differ from Ethereum?',
  'What is a smart contract?',
  'Explain staking vs providing LP',
  'What can Syra Agent help me with?',
]);

/** Medium-length labels for Telegram inline buttons (fits fully, max ~58 chars). */
export const TELEGRAM_SHORT_EXAMPLE_QUESTIONS = Object.freeze([
  'What is slippage in trading?',
  'How does impermanent loss work?',
  'What is MEV on Solana?',
  'How do DEXs differ from CEXs?',
  'What is TVL in DeFi?',
  'Solana vs Ethereum — key diffs?',
  'What is a smart contract?',
  'Staking vs providing LP?',
  'What can Syra Agent help with?',
]);

/**
 * @param {number} [count]
 * @returns {string[]}
 */
export function pickTelegramNoToolExamples(count = 3) {
  const n = Math.max(1, Math.min(count, TELEGRAM_NO_TOOL_EXAMPLE_QUESTIONS.length));
  const shuffled = [...TELEGRAM_NO_TOOL_EXAMPLE_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * @param {number} [count]
 * @returns {string[]}
 */
export function pickTelegramShortExamples(count = 3) {
  const n = Math.max(1, Math.min(count, TELEGRAM_SHORT_EXAMPLE_QUESTIONS.length));
  const shuffled = [...TELEGRAM_SHORT_EXAMPLE_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * @param {number} [count]
 * @returns {string}
 */
export function formatTelegramNoToolExampleBullets(count = 3) {
  return pickTelegramNoToolExamples(count)
    .map((q) => `• ${q}`)
    .join('\n');
}
