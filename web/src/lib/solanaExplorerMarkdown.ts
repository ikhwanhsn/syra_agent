/**
 * Injects Solscan markdown links for bare Solana transaction signatures and addresses
 * in markdown, without touching code fences, inline code, existing links, or raw http(s)
 * URLs. Newly inserted solscan.io URLs are shielded so regex passes do not nest links.
 */

const PLACEHOLDER = (i: number) => `\uE000\u200BSC${i}\u200B\uE001`;

/** Ed25519 signature as base58 (typical ~87–88 chars; allow a small range). */
const SIG_LEN = { min: 80, max: 92 };
/** Solana pubkeys / mints in base58 (common 32–44). */
const ADDR_LEN = { min: 32, max: 44 };

/** Fresh instance each use — avoids `lastIndex` issues with global regex across `.replace()` calls. */
function solscanUrlRe(): RegExp {
  return /https:\/\/solscan\.io\/[^\s)>[\]]+/gi;
}

/**
 * Returns markdown with `[addr](https://solscan.io/account/addr)` and
 * `[sig](https://solscan.io/tx/sig)` for bare tokens not inside protected regions.
 */
export function injectSolscanLinksInMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return markdown;

  const slots: string[] = [];
  const push = (fragment: string): string => {
    const i = slots.length;
    slots.push(fragment);
    return PLACEHOLDER(i);
  };

  let s = markdown;

  s = s.replace(/```[\s\S]*?```/g, (m) => push(m));
  s = s.replace(/`[^`\n]+`/g, (m) => push(m));
  s = s.replace(/!?\[[^\]]*]\([^)]+\)/g, (m) => push(m));
  /** GFM autolink literals — keep intact before bare-URL pass (otherwise `https://` inside is re-stripped). */
  s = s.replace(/<https?:\/\/[^>\s]+>/gi, (m) => push(m));
  s = s.replace(/https?:\/\/[^\s)>[\]]+/gi, (m) => push(m));

  const replaceLenRange = (text: string, min: number, max: number, url: (token: string) => string): string => {
    const re = new RegExp(`\\b([1-9A-HJ-NP-Za-km-z]{${min},${max}})\\b`, "g");
    return text.replace(re, (full) => `[${full}](${url(full)})`);
  };

  // Longer runs first (signatures), then pubkeys / mints.
  s = replaceLenRange(s, SIG_LEN.min, SIG_LEN.max, (sig) => `https://solscan.io/tx/${encodeURIComponent(sig)}`);
  s = s.replace(solscanUrlRe(), (m) => push(m));

  s = replaceLenRange(s, ADDR_LEN.min, ADDR_LEN.max, (addr) => `https://solscan.io/account/${encodeURIComponent(addr)}`);
  s = s.replace(solscanUrlRe(), (m) => push(m));

  for (let i = slots.length - 1; i >= 0; i--) {
    s = s.split(PLACEHOLDER(i)).join(slots[i]!);
  }

  return s;
}
