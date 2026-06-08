/**
 * Telegram digest formatter for Syra Growth Scout.
 */

/**
 * @typedef {import("../agents/syra-growth-scout-agent.js").SyraGrowthScoutOutput} SyraGrowthScoutOutput
 * @typedef {import("../agents/syra-growth-scout-agent.js").GrowthAction} GrowthAction
 */

/**
 * @param {GrowthAction[]} actions
 * @param {string} heading
 * @param {string[]} lines
 */
function appendActions(actions, heading, lines) {
  if (!actions?.length) return;
  lines.push(heading);
  for (const a of actions.slice(0, 5)) {
    lines.push(`• [${a.priority}] ${a.title} (${a.channel}, ${a.effort} effort)`);
    if (a.why) lines.push(`  Why: ${a.why}`);
    if (a.expectedImpact) lines.push(`  Impact: ${a.expectedImpact}`);
  }
  lines.push("");
}

/**
 * @param {SyraGrowthScoutOutput} data
 * @returns {string}
 */
export function formatSyraGrowthScoutTelegram(data) {
  const lines = ["Syra · Growth Scout — users & TVL", "", `Summary: ${data.growthSummary}`, ""];

  if (data.metricHighlights?.length) {
    lines.push("Key metrics:");
    for (const m of data.metricHighlights.slice(0, 6)) {
      const trend = m.trend ? ` (${m.trend})` : "";
      lines.push(`• ${m.label}: ${m.value}${trend}`);
    }
    lines.push("");
  }

  appendActions(data.userAcquisitionActions, "Grow users:", lines);
  appendActions(data.tvlGrowthActions, "Grow TVL:", lines);
  appendActions(data.productPriorities, "Ship next:", lines);

  if (data.risksOrCaveats?.length) {
    lines.push("Notes:");
    for (const r of data.risksOrCaveats.slice(0, 5)) {
      lines.push(`• ${r}`);
    }
    lines.push("");
  }

  const s = data.sourceStats;
  if (s) {
    lines.push(
      `Sources: ${s.metricCount} metrics · ${s.socialTweetCount} Syra social · ${s.sectorTweetCount} sector tweets`,
    );
  }
  if (data.generatedAt) {
    lines.push(`Generated: ${data.generatedAt}`);
  }

  return lines.join("\n").trim();
}
