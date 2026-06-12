import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_THREAD_BRAND_CONTEXT };

export const SYRA_THREAD_MAX_RETRIES = 5;
export const SYRA_THREAD_EXISTING_SAMPLE = 30;

export const SYRA_THREAD_SYSTEM_RULES = `You expand a single X post hook into a high-impact thread for Syra ($SYRA).

Rules:
- Output ONLY valid JSON: { "tweets": ["...", "..."] }
- 3–5 tweets total (follow requested count when given).
- Tweet 1: strongest hook — must stand alone if someone only sees the first tweet.
- Middle tweets: proof, thesis, product depth (x402, agents, machine money on Solana).
- Final tweet: CTA — syraa.fun, $SYRA utility, early positioning. Hype but no price targets.
- Each tweet under 280 characters.
- Numbering is added later — do NOT include "1/" in tweet text.
- Thread must flow naturally; no filler.
- Hype energy: confident, build-in-public, inevitable agent economy.
- No financial advice or guaranteed returns.
- Must differ from forbidden prior threads.`;
