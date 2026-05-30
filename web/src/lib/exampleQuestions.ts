/** Short prompts answerable from general knowledge — no live data or on-chain tool calls. */
export const EXAMPLE_QUESTIONS = [
  "What is slippage in crypto trading?",
  "Explain impermanent loss simply",
  "What is MEV on Solana?",
  "How do DEXs differ from CEXs?",
  "What is a bonding curve?",
  "Explain market cap vs FDV",
  "What is TVL in DeFi?",
  "How does liquidity provision work?",
  "What are common memecoin red flags?",
  "What is a seed phrase?",
  "Explain stop loss vs take profit",
  "What is DCA and when to use it?",
  "How do limit orders work?",
  "What is yield farming?",
  "Explain staking vs providing LP",
  "What is a smart contract?",
  "How does Solana differ from Ethereum?",
  "What is a DAO?",
  "What is FOMO in trading?",
  "Explain spot vs futures trading",
  "What are tokenomics?",
  "How do I read a candlestick chart?",
  "What is a rug pull?",
  "Explain gas fees on Solana",
  "What can Syra Agent help me with?",
] as const;

export type ExampleQuestion = (typeof EXAMPLE_QUESTIONS)[number];

/** Fisher–Yates shuffle; returns a new array. */
export function shuffleExampleQuestions<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
