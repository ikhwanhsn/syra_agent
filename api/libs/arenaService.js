/**
 * Syra Alpha Arena — orchestration (compile, overlay, playbook, paper loop, publish, 8004).
 */
import mongoose from "mongoose";
import crypto from "node:crypto";
import ArenaAgent from "../models/ArenaAgent.js";
import BitgetVibeSession from "../models/BitgetVibeSession.js";
import {
  compileArenaStrategy,
  buildPlaybookPackage,
} from "./playbookStrategyCompiler.js";
import {
  computeSyraAlphaOverlay,
  overlayAllowsEntry,
} from "./syraAlphaOverlay.js";
import {
  hasPlaybookCredentials,
  uploadPlaybookPackage,
  runPlaybookBacktest,
  publishPlaybookDraft,
  enablePlaybookSubscription,
  extractBacktestMetrics,
} from "./integrations/bitget/getagentClient.js";
import { createVibeSession, getVibeSession, runVibeLoopTick } from "./bitgetVibeService.js";
import { registerAgentAndAttachToCollection } from "./register8004Agent.js";

/**
 * @param {import("../models/ArenaAgent.js").default | Record<string, unknown>} doc
 */
function computeRankScore(doc) {
  const metrics = doc.playbook?.metrics;
  const backtestReturn = Number(metrics?.totalReturnPct) || 0;
  const sharpe = Number(metrics?.sharpeRatio) || 0;
  const paperReturn = Number(doc.paperReturnPct) || 0;
  const subs = Number(doc.subscriberCount) || 0;
  const overlayBonus = doc.alphaOverlay?.gatePass ? 2 : 0;
  return (
    backtestReturn * 0.4 +
    sharpe * 5 +
    paperReturn * 0.3 +
    subs * 3 +
    overlayBonus
  );
}

/**
 * @param {import("mongoose").Document} agent
 */
async function refreshAgentRank(agent) {
  agent.rankScore = computeRankScore(agent);
  await agent.save();
  return agent;
}

/**
 * @param {string} agentId
 */
export async function getArenaAgent(agentId) {
  if (!mongoose.Types.ObjectId.isValid(agentId)) throw new Error("Invalid agent id");
  const agent = await ArenaAgent.findById(agentId).lean();
  if (!agent) throw new Error("Arena agent not found");

  let vibeSession = null;
  if (agent.bitgetVibeSessionId) {
    try {
      vibeSession = await getVibeSession(String(agent.bitgetVibeSessionId));
    } catch {
      vibeSession = null;
    }
  }

  return {
    agent: formatAgentRow(agent),
    vibeSession,
    playbookCapable: hasPlaybookCredentials(),
  };
}

/**
 * @param {Record<string, unknown>} row
 */
function formatAgentRow(row) {
  return {
    id: String(row._id),
    name: row.name,
    prompt: row.prompt,
    strategySpec: row.strategySpec,
    bitgetVibeSessionId: row.bitgetVibeSessionId ? String(row.bitgetVibeSessionId) : null,
    playbook: row.playbook || {},
    alphaOverlay: row.alphaOverlay || {},
    publishStatus: row.publishStatus,
    asset8004: row.asset8004 || {},
    subscriberCount: row.subscriberCount || 0,
    shareSlug: row.shareSlug,
    rankScore: row.rankScore,
    paperReturnPct: row.paperReturnPct,
    paperWinRatePct: row.paperWinRatePct,
    isSeed: Boolean(row.isSeed),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * @param {{ limit?: number }} [opts]
 */
export async function getArenaLeaderboard(opts = {}) {
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 20));
  const rows = await ArenaAgent.find({ status: "active" })
    .sort({ rankScore: -1, updatedAt: -1 })
    .limit(limit)
    .lean();

  return {
    agents: rows.map((r, i) => ({
      rank: i + 1,
      ...formatAgentRow(r),
      backtestReturnPct: r.playbook?.metrics?.totalReturnPct ?? null,
      sharpeRatio: r.playbook?.metrics?.sharpeRatio ?? null,
      maxDrawdownPct: r.playbook?.metrics?.maxDrawdownPct ?? null,
      winRate: r.playbook?.metrics?.winRate ?? null,
    })),
    playbookCapable: hasPlaybookCredentials(),
  };
}

/**
 * @param {string} slug
 */
export async function getArenaAgentByShareSlug(slug) {
  const s = String(slug || "").trim();
  if (!s) throw new Error("slug required");
  const agent = await ArenaAgent.findOne({ shareSlug: s }).lean();
  if (!agent) throw new Error("Arena agent not found");
  return getArenaAgent(String(agent._id));
}

/**
 * Run Playbook upload + backtest when credentials exist.
 * @param {import("../models/ArenaAgent.js").default} agent
 * @param {import("./playbookStrategyCompiler.js").ArenaStrategySpec} spec
 */
async function runPlaybookPipeline(agent, spec) {
  if (!hasPlaybookCredentials()) {
    agent.playbook = {
      ...(agent.playbook?.toObject?.() || agent.playbook || {}),
      uploadStatus: "skipped_no_credentials",
      error: "Set PLAYBOOK_API_KEY (Bitget Playbook ACCESS-KEY)",
    };
    await agent.save();
    return null;
  }

  try {
    const { buffer, slug } = await buildPlaybookPackage(spec);
    const uploaded = await uploadPlaybookPackage(buffer, `${slug}.tar.gz`);
    agent.playbook = {
      strategyId: uploaded.strategy_id,
      draftId: uploaded.draft_id,
      slug,
      uploadStatus: "uploaded",
      version: uploaded.suggested_version || null,
    };
    await agent.save();

    const versionId = uploaded.draft_id;
    if (!versionId) throw new Error("Upload missing draft_id");

    agent.playbook.backtestStatus = "running";
    await agent.save();

    const runRow = await runPlaybookBacktest(String(versionId));
    const metrics = extractBacktestMetrics(runRow);
    agent.playbook.backtestRunId = runRow.run_id ? String(runRow.run_id) : null;
    agent.playbook.backtestStatus = metrics.status;
    agent.playbook.metrics = metrics;
    agent.playbook.error = metrics.failureReason;

    if (metrics.status === "completed") {
      agent.publishStatus = "backtested";
    } else if (metrics.status === "failed") {
      agent.publishStatus = "failed";
    }
    await refreshAgentRank(agent);
    return metrics;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    agent.playbook = {
      ...(agent.playbook?.toObject?.() || agent.playbook || {}),
      uploadStatus: agent.playbook?.uploadStatus || "error",
      error: msg,
    };
    agent.publishStatus = "failed";
    await agent.save();
    return null;
  }
}

/**
 * @param {{
 *   prompt: string;
 *   name?: string;
 *   ownerWalletAddress?: string;
 *   runPlaybook?: boolean;
 *   runPaperTick?: boolean;
 *   isSeed?: boolean;
 * }} body
 */
export async function createArenaAgent(body) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) throw new Error("prompt is required");

  const spec = await compileArenaStrategy(prompt);
  const name = String(body.name || spec.name || "Arena Agent").trim().slice(0, 80);

  const overlay = await computeSyraAlphaOverlay({
    token: spec.token,
    bar: spec.bar,
    limit: spec.limit,
  });

  const shareSlug = `arena-${crypto.randomBytes(4).toString("hex")}`;
  const agent = await ArenaAgent.create({
    name,
    prompt,
    strategySpec: spec,
    alphaOverlay: {
      bias: overlay.bias,
      biasLabel: overlay.biasLabel,
      gatePass: overlayAllowsEntry(overlay.bias, spec.overlayMinBias),
      components: overlay.components,
      computedAt: new Date(),
    },
    shareSlug,
    ownerWalletAddress: body.ownerWalletAddress || null,
    isSeed: Boolean(body.isSeed),
    publishStatus: "draft",
  });

  const vibe = await createVibeSession({
    prompt,
    name: `${name} (paper)`,
    mode: "paper",
    runFirstTick: body.runPaperTick !== false,
  });

  agent.bitgetVibeSessionId = vibe.session.id;
  if (vibe.metrics?.returnPct != null) {
    agent.paperReturnPct = vibe.metrics.returnPct;
    agent.paperWinRatePct = vibe.metrics.winRatePct;
  }
  await agent.save();

  if (body.runPlaybook !== false) {
    await runPlaybookPipeline(agent, spec);
  }

  await refreshAgentRank(agent);
  return getArenaAgent(String(agent._id));
}

/**
 * @param {string} agentId
 */
export async function tickArenaAgent(agentId) {
  if (!mongoose.Types.ObjectId.isValid(agentId)) throw new Error("Invalid agent id");
  const agent = await ArenaAgent.findById(agentId);
  if (!agent) throw new Error("Arena agent not found");
  if (!agent.bitgetVibeSessionId) throw new Error("No paper session linked");

  const overlay = await computeSyraAlphaOverlay({
    token: agent.strategySpec.token,
    bar: agent.strategySpec.bar,
    limit: agent.strategySpec.limit,
  });
  agent.alphaOverlay = {
    bias: overlay.bias,
    biasLabel: overlay.biasLabel,
    gatePass: overlayAllowsEntry(overlay.bias, agent.strategySpec.overlayMinBias ?? -0.35),
    components: overlay.components,
    computedAt: new Date(),
  };
  await agent.save();

  let tickResult = null;
  if (agent.alphaOverlay.gatePass) {
    tickResult = await runVibeLoopTick(String(agent.bitgetVibeSessionId));
  } else {
    tickResult = { skipped: true, reason: "alpha_overlay_gate", bias: overlay.bias };
  }

  const vibe = await getVibeSession(String(agent.bitgetVibeSessionId));
  if (vibe.metrics?.returnPct != null) {
    agent.paperReturnPct = vibe.metrics.returnPct;
    agent.paperWinRatePct = vibe.metrics.winRatePct;
  }
  await refreshAgentRank(agent);

  return { ...(await getArenaAgent(String(agent._id))), tickResult };
}

/**
 * @param {string} agentId
 */
export async function publishArenaAgent(agentId) {
  const agent = await ArenaAgent.findById(agentId);
  if (!agent) throw new Error("Arena agent not found");

  if (!hasPlaybookCredentials()) {
    throw new Error("PLAYBOOK_API_KEY required to publish Playbook");
  }
  const draftId = agent.playbook?.draftId;
  if (!draftId) throw new Error("No playbook draft — run create with Playbook credentials first");

  const published = await publishPlaybookDraft(String(draftId), "patch");
  agent.playbook.versionId = published.version_id;
  agent.playbook.version = published.version;
  agent.publishStatus = "published";
  await agent.save();

  return getArenaAgent(String(agent._id));
}

/**
 * @param {string} agentId
 * @param {{ subscriberId?: string; chatId?: string }} [opts]
 */
export async function subscribeArenaAgent(agentId, opts = {}) {
  const agent = await ArenaAgent.findById(agentId);
  if (!agent) throw new Error("Arena agent not found");

  const versionId = agent.playbook?.versionId;
  if (!versionId) {
    throw new Error("Agent must be published before subscribe (playbook version_id missing)");
  }
  if (!hasPlaybookCredentials()) {
    throw new Error("PLAYBOOK_API_KEY required to enable subscription");
  }

  const subId = opts.subscriberId || crypto.randomBytes(8).toString("hex");
  const enabled = await enablePlaybookSubscription(String(versionId), {
    chatId: opts.chatId,
  });

  agent.subscribers.push({
    subscriberId: subId,
    instanceId: enabled.instance_id ? String(enabled.instance_id) : null,
    subscribedAt: new Date(),
  });
  agent.subscriberCount = (agent.subscriberCount || 0) + 1;
  if (!agent.playbook.instanceId && enabled.instance_id) {
    agent.playbook.instanceId = String(enabled.instance_id);
  }
  await refreshAgentRank(agent);

  return {
    ...(await getArenaAgent(String(agent._id))),
    subscription: { subscriberId: subId, ...enabled },
  };
}

/**
 * Register arena agent on 8004 (server signer). Optional — requires PINATA_JWT + SOLANA_PRIVATE_KEY.
 * @param {string} agentId
 */
export async function registerArenaAgent8004(agentId) {
  const agent = await ArenaAgent.findById(agentId);
  if (!agent) throw new Error("Arena agent not found");
  if (agent.asset8004?.asset) {
    return getArenaAgent(String(agent._id));
  }

  const metrics = agent.playbook?.metrics;
  const desc = [
    agent.prompt.slice(0, 200),
    metrics?.totalReturnPct != null ? `Backtest return ${metrics.totalReturnPct}%` : "",
    agent.paperReturnPct != null ? `Paper return ${agent.paperReturnPct}%` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const result = await registerAgentAndAttachToCollection({
    name: agent.name.slice(0, 64),
    description: desc.slice(0, 500) || "Syra Alpha Arena trading agent",
    image: process.env.SYRA_ARENA_AGENT_IMAGE || "https://syraa.fun/images/logo.jpg",
    services: [
      { type: "MCP", value: "https://api.syraa.fun" },
      {
        type: "A2A",
        value: `https://agent.syraa.fun/arena/share/${agent.shareSlug}`,
      },
    ],
    skills: [
      "natural_language_processing/text_classification/sentiment_analysis",
      "tool_interaction/tool_use_planning",
      "finance_and_business/trading",
    ],
    domains: ["finance_and_business/finance"],
    x402Support: true,
  });

  agent.asset8004 = {
    asset: result.asset,
    tokenUri: result.tokenUri,
    registerSignature: result.registerSignature || null,
    registeredAt: new Date(),
  };
  await agent.save();
  return getArenaAgent(String(agent._id));
}

/**
 * Publish + optional 8004 in one call.
 * @param {string} agentId
 * @param {{ register8004?: boolean }} [opts]
 */
export async function publishArenaAgentFull(agentId, opts = {}) {
  await publishArenaAgent(agentId);
  if (opts.register8004 !== false && process.env.PINATA_JWT) {
    try {
      await registerArenaAgent8004(agentId);
    } catch (e) {
      const data = await getArenaAgent(agentId);
      return {
        ...data,
        register8004Error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return getArenaAgent(agentId);
}

/**
 * Seed demo agents for hackathon leaderboard.
 */
export async function seedArenaAgents() {
  const demos = [
    {
      name: "BTC Adaptive Regime",
      prompt:
        "Adaptive BTC perpetual on Bitget: trend-follow when ADX strong, mean-revert when ranging, stay flat when unclear. 2% TP, 1% SL on 1h.",
    },
    {
      name: "ETH Momentum Rider",
      prompt:
        "ETHUSDT contract momentum: enter long when EMA stack bullish and RSI below 65, short when bearish stack above 35. 1h bars, 2.5% TP, 1.2% SL.",
    },
    {
      name: "SOL Mean Reversion",
      prompt:
        "SOL mean reversion on 15m: buy dips when RSI under 32, sell rips when RSI over 68. Regime mean_reversion, 1.5% TP, 0.8% SL.",
    },
    {
      name: "Meme On-Chain Copy",
      prompt:
        "Adaptive regime on BTC with tight risk: follow smart-money bias, 1% stop, 1.5% target, overlay gate -0.2 minimum bias.",
    },
  ];

  const created = [];
  for (const d of demos) {
    const existing = await ArenaAgent.findOne({ name: d.name, isSeed: true }).lean();
    if (existing) {
      created.push(formatAgentRow(existing));
      continue;
    }
    const out = await createArenaAgent({
      prompt: d.prompt,
      name: d.name,
      isSeed: true,
      runPlaybook: hasPlaybookCredentials(),
      runPaperTick: true,
    });
    created.push(out.agent);
  }
  return { seeded: created.length, agents: created };
}
