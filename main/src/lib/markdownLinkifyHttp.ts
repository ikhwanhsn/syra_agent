/**
 * Turn bare `http://` / `https://` URLs into markdown links so they always render as clickable anchors.
 * Skips fenced code, inline code, markdown links/images, and existing `<https://...>` autolinks.
 *
 * Uses `[url](<url>)` (angle destination) so `)`, `]`, etc. in paths stay valid, and replaces via
 * `matchAll` on the protected string so we never re-match inside inserted markdown.
 */

const PLACEHOLDER = (i: number) => `\uE000\u200B_LK_${i}_\u200B\uE001`;

/** Match `http://` / `https://` URLs until whitespace or delimiters that usually end a URL in prose. */
const BARE_HTTP_URL = /https?:\/\/[^\s)>[\]|]+/gi;

function escapeMarkdownLinkLabel(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

export function linkifyBareHttpUrlsInMarkdown(markdown: string): string {
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
  s = s.replace(/<https?:\/\/[^>\s]+>/gi, (m) => push(m));

  const re = new RegExp(BARE_HTTP_URL.source, BARE_HTTP_URL.flags);
  const matches = Array.from(s.matchAll(re));
  let rebuilt = "";
  let last = 0;
  for (const m of matches) {
    if (m.index === undefined) continue;
    rebuilt += s.slice(last, m.index);
    const url = m[0];
    rebuilt += `[${escapeMarkdownLinkLabel(url)}](<${url}>)`;
    last = m.index + url.length;
  }
  rebuilt += s.slice(last);
  s = rebuilt;

  for (let i = slots.length - 1; i >= 0; i--) {
    s = s.split(PLACEHOLDER(i)).join(slots[i]!);
  }

  return s;
}
