/**
 * Telegram digest for Syra Partnership Scout.
 */

/**
 * @typedef {import("../agents/syra-partnership-scout-agent.js").SyraPartnershipScoutOutput} SyraPartnershipScoutOutput
 */

/**
 * @param {SyraPartnershipScoutOutput} data
 * @returns {string}
 */
export function formatSyraPartnershipScoutTelegram(data) {
  const lines = [
    "Syra · Partnership Scout — on-chain AI & utility",
    "",
    `Summary: ${data.ecosystemSummary}`,
    "",
  ];

  if (data.onchainThemes?.length) {
    lines.push("On-chain themes:");
    for (const t of data.onchainThemes.slice(0, 8)) {
      lines.push(`• ${t}`);
    }
    lines.push("");
  }

  if (data.partnershipTargets?.length) {
    lines.push("Partnership targets:");
    for (const p of data.partnershipTargets.slice(0, 8)) {
      lines.push(`• [${p.priority}] ${p.name} (${p.projectType})`);
      if (p.utility) lines.push(`  Utility: ${p.utility}`);
      if (p.whyFitForSyra) lines.push(`  Fit: ${p.whyFitForSyra}`);
      if (p.collaborationIdea) lines.push(`  Idea: ${p.collaborationIdea}`);
      if (p.onchainSignals?.length) {
        lines.push(`  Signals: ${p.onchainSignals.slice(0, 4).join("; ")}`);
      }
      if (p.link) lines.push(`  Link: ${p.link}`);
    }
    lines.push("");
  }

  if (data.quickIntegrations?.length) {
    lines.push("Quick integrations:");
    for (const q of data.quickIntegrations.slice(0, 5)) {
      lines.push(`• ${q}`);
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
  if (s && Object.keys(s).length) {
    const parts = Object.entries(s)
      .map(([k, v]) => `${k}:${v}`)
      .join(" · ");
    lines.push(`Sources: ${parts}`);
  }
  if (data.generatedAt) {
    lines.push(`Generated: ${data.generatedAt}`);
  }

  return lines.join("\n").trim();
}
