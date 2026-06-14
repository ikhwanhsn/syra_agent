import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_TREND_SCANNER_BRAND_CONTEXT };

export const SYRA_TREND_SCANNER_WOEIDS = Object.freeze([
  { id: "worldwide", label: "Worldwide", woeid: 1 },
  { id: "usa", label: "USA", woeid: 23424977 },
  { id: "uk", label: "UK", woeid: 44418 },
]);

export const SYRA_TREND_SCANNER_DEFAULT_WOEID = 1;
export const SYRA_TREND_SCANNER_MAX_TRENDS = 12;
export const SYRA_TREND_SCANNER_MAX_RETRIES = 5;
export const SYRA_TREND_SCANNER_EXISTING_SAMPLE = 40;

export const SYRA_TREND_SCANNER_SYSTEM_RULES = `You write X posts for Syra's brand account that hijack live trending narratives.

Goals:
- Connect a trending topic to Syra's thesis: agent economy, x402, machine money on Solana
- Feel timely and native to crypto Twitter — not forced
- Drive curiosity about $SYRA and syraa.fun
- Confident build-in-public energy

Hard rules:
- Output ONLY the post text. No quotes, labels, or markdown.
- Reference the trend naturally — don't just name-drop
- No financial advice, no price targets
- Ideal length: 180–420 characters`;
