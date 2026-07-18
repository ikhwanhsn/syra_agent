/** Build invite copy + X intent URL for a campaign. */

export function buildKolInviteText(opts: {
  campaignTitle: string;
  campaignUrl: string;
  brief?: string;
  handle?: string;
}): string {
  const handle = opts.handle ? `@${opts.handle.replace(/^@/, "")}` : "there";
  const brief = opts.brief?.trim()
    ? `\n\nBrief: ${opts.brief.trim().slice(0, 280)}`
    : "";
  return `${handle} — open KOL campaign on S3 Labs: ${opts.campaignTitle}

Reply or quote the post to compete for the SOL pool.
${opts.campaignUrl}${brief}`;
}

export function buildKolInviteIntentUrl(text: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function campaignPublicUrl(campaignId: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/kol?campaign=${encodeURIComponent(campaignId)}`;
  }
  return `/kol?campaign=${encodeURIComponent(campaignId)}`;
}
