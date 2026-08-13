/**
 * Lightweight X thread: ride Algorand v5.0.0 (post-quantum accounts vote)
 * by pointing at Syra's already-live native AVM x402 agent payments.
 *
 * Status note: v5.0.0 is node-runner vote / "if it passes". Syra AVM x402 is live.
 * Voice: founder-plain, no em dashes, no arrow bullets, no slogan stacks.
 * If the vote passes, update tweet 1 to "v5.0.0 passed" for a second wave.
 */

export const ALGORAND_V5_QUANTUM_THREAD_META = {
  id: "algorand-v5-quantum",
  title: "Algorand v5.0.0 quantum-safe agent payments",
  published: "August 2026",
  angle: "quantum-safe agent payments",
  statusNote:
    "v5.0.0 is being voted on by node runners, not activated. Syra AVM x402 (USDC ASA via GoPlausible) is live.",
} as const;

/** Ready-to-paste tweets, in order. */
export const ALGORAND_V5_QUANTUM_THREAD: readonly string[] = [
  `Algorand just shipped v5.0.0. Node runners are voting on it now. If it passes, accounts get post-quantum signatures (Falcon-1024) baked into the protocol, plus fees that price what a transaction actually contains.`,

  `Quantum-safe accounts at the base layer matter most for the money that machines move without a human in the loop. Agent wallets sign thousands of tiny payments. That is exactly the surface you want hardened first.`,

  `Syra already runs agent micropayments natively on Algorand. Hit a paid intelligence API, get a 402, pay USDC on Algorand Mainnet via GoPlausible, unlock the data. No bridging off Algorand to pay.`,

  `Resource-based fees fit pay-per-call perfectly. Small calls stay cheap, bigger payloads pay for what they use. That is the same logic Syra prices intelligence on: you pay only when you call.`,

  `So the stack lines up. Algorand hardens the account and prices the transaction. Syra is the intelligence layer agents pay for on top, on the same chain the treasury already lives on.`,

  `Try a first paid call, or point your agent at it:
syraa.fun/playground
api.syraa.fun/x402/capabilities`,
];

/** Single paste block with 1/ … 6/ prefixes for X thread composers. */
export const ALGORAND_V5_QUANTUM_THREAD_PASTE = ALGORAND_V5_QUANTUM_THREAD.map(
  (tweet, i) => `${i + 1}/\n${tweet}`,
).join("\n\n");

/**
 * 16:9 Ship Log cards (2400×1350), one per tweet. Real Syra logo via post photo satori.
 * Alias for tweet 1: /images/threads/algorand-v5-quantum-main-post.png
 */
export const ALGORAND_V5_QUANTUM_THREAD_IMAGES = [
  "/images/threads/algorand-v5-quantum-01-cover.png",
  "/images/threads/algorand-v5-quantum-02-thesis.png",
  "/images/threads/algorand-v5-quantum-03-flow.png",
  "/images/threads/algorand-v5-quantum-04-quote.png",
  "/images/threads/algorand-v5-quantum-05-split.png",
  "/images/threads/algorand-v5-quantum-06-cta.png",
] as const;
