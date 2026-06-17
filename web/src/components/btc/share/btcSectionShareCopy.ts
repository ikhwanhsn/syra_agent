export interface BtcSectionShareCopyInput {
  kicker: string;
  title: string;
  description?: string;
  lines?: string[];
}

export function buildBtcSectionShareText(input: BtcSectionShareCopyInput): string {
  const body = [
    `${input.title} · Syra BTC Intelligence`,
    input.description?.trim(),
    "",
    ...(input.lines ?? []).filter((l) => l.trim().length > 0),
    "",
    "syra.ai/btc",
  ].filter((line, i, arr) => !(line === "" && arr[i - 1] === ""));

  return body.join("\n").trim();
}

export function buildBtcSectionShareOnXUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function buildBtcSectionShareFilename(slug: string): string {
  const safe = slug.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
  return `syra-btc-${safe}.png`;
}
