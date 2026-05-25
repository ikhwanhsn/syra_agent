/**
 * Telegram digest when new hackathon leads are discovered.
 */

/**
 * @param {Array<{ title: string; organizer?: string; relevanceScore?: number; tweetUrl?: string }>} leads
 * @param {{ query: string; newCount: number; fromCache: boolean }} meta
 * @returns {string}
 */
export function formatHackathonScoutNewLeadsTelegram(leads, meta) {
  const lines = [
    `Syra · Hackathon Scout — ${meta.newCount} new lead${meta.newCount === 1 ? "" : "s"}`,
    meta.fromCache ? "(X search cache hit)" : "(fresh X search)",
    "",
  ];
  for (const l of leads.slice(0, 8)) {
    lines.push(`• ${l.title}${l.organizer ? ` — ${l.organizer}` : ""}`);
    if (l.relevanceScore != null) lines.push(`  Relevance: ${l.relevanceScore}/100`);
    if (l.tweetUrl) lines.push(`  ${l.tweetUrl}`);
    lines.push("");
  }
  lines.push(`Review: agent dashboard → Internal → Hackathons`);
  lines.push(`Query: ${meta.query.slice(0, 200)}`);
  return lines.join("\n").trim();
}
