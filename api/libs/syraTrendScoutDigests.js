/**
 * Telegram digest formatter for Syra Trend Scout (single daily message).
 */

/**
 * @typedef {import("../agents/syra-trend-scout-agent.js").SyraTrendScoutOutput} SyraTrendScoutOutput
 */

/**
 * @param {SyraTrendScoutOutput} data
 * @returns {string}
 */
export function formatSyraTrendScoutTelegram(data) {
  const lines = [
    "Syra · Trend Scout — daily market brief",
    "",
    `Summary: ${data.marketSummary}`,
    "",
  ];

  if (data.trendingTopics?.length) {
    lines.push("Trending themes:");
    for (const t of data.trendingTopics.slice(0, 10)) {
      lines.push(`• ${t}`);
    }
    lines.push("");
  }

  if (data.contentSuggestions?.length) {
    lines.push("Content to post:");
    for (const c of data.contentSuggestions.slice(0, 6)) {
      const plats = (c.platforms || []).join(", ") || "X";
      lines.push(`• [${c.priority}] ${c.title}`);
      lines.push(`  Angle: ${c.angle}`);
      if (c.hook) lines.push(`  Hook: ${c.hook}`);
      lines.push(`  Platforms: ${plats}`);
    }
    lines.push("");
  }

  if (data.featureSuggestions?.length) {
    lines.push("Features to build:");
    for (const f of data.featureSuggestions.slice(0, 6)) {
      lines.push(`• [${f.priority}] ${f.title} (${f.surface})`);
      if (f.why) lines.push(`  Why: ${f.why}`);
    }
    lines.push("");
  }

  if (data.risksOrCaveats?.length) {
    lines.push("Caveats:");
    for (const r of data.risksOrCaveats.slice(0, 5)) {
      lines.push(`• ${r}`);
    }
    lines.push("");
  }

  const s = data.sourceStats;
  if (s) {
    lines.push(
      `Sources: ${s.headlineCount} headlines · ${s.articleCount} articles · ${s.eventDayCount} event days`,
    );
  }
  if (data.generatedAt) {
    lines.push(`Generated: ${data.generatedAt}`);
  }

  return lines.join("\n").trim();
}
