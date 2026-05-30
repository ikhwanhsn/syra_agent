import { isAgentInlineUiPayload, type AgentInlineUiPayload } from "@/lib/chatApi";
import {
  USDC_MINT,
  WSOL_MINT,
  isValidBase58Mint,
  normalizeCommonPresetMints,
} from "@/lib/swapPresets";

/**
 * Detects a simple SOL → USDC or SOL → mint swap from a single user line, e.g.
 * `swap 0.001 sol to usdc` or `swap 0.001 sol to 7gUWA…`
 */
export function parseJupiterSwapIntent(content: string): { amount: string; outputMint: string } | null {
  const t = content.trim();
  const sym = t.match(
    /^\s*swap\s+([\d.,]+)\s*sol\b\s+(?:to|for|into)\s+(usdc|wsol|sol)\s*$/i,
  );
  if (sym) {
    const amount = sym[1].replace(/,/g, "");
    if (!/^\d*\.?\d+$/.test(amount)) return null;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return null;
    const raw = sym[2].toLowerCase();
    const outputMint =
      raw === "usdc" ? USDC_MINT : WSOL_MINT;
    return { amount, outputMint };
  }
  const m = t.match(
    /^\s*swap\s+([\d.,]+)\s*sol\b(?:\s+(?:to|for|into))?\s+([1-9A-HJ-NP-Za-km-z]{32,44})\s*$/i,
  );
  if (!m) return null;
  const amount = m[1].replace(/,/g, "");
  const outputMint = normalizeCommonPresetMints(m[2]);
  if (!isValidBase58Mint(outputMint)) return null;
  if (!/^\d*\.?\d+$/.test(amount)) return null;
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return { amount, outputMint };
}

/**
 * Prefer API `inlineUi`; otherwise infer a pump.fun swap card from the last user message in this turn.
 */
export function resolveAssistantSwapInlineUi(
  apiInlineUi: unknown,
  messages: Array<{ role: string; content: string }>,
): AgentInlineUiPayload | undefined {
  if (isAgentInlineUiPayload(apiInlineUi)) return apiInlineUi;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return undefined;
  const parsed = parseJupiterSwapIntent(lastUser.content);
  if (!parsed) return undefined;
  return {
    type: "pumpfun-swap",
    suggestedMints: [parsed.outputMint, WSOL_MINT],
    suggestedAmount: parsed.amount,
  };
}
