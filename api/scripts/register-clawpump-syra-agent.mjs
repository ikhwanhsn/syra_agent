#!/usr/bin/env node
/**
 * Register the Syra agent on ClawPump (agents.clawpump.tech).
 *
 * Usage:
 *   set CLAWPUMP_API_KEY=cpk_...
 *   (optional) set CLAWPUMP_EXTERNAL_WALLET=<solana-base58>
 *   node api/scripts/register-clawpump-syra-agent.mjs
 *
 * Notes:
 * - Existing $SYRA pump.fun mint is referenced in persona only (not fee-linked).
 * - Mint: 8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump
 */

const API_BASE =
  process.env.CLAWPUMP_API_URL ||
  "https://ai-agents-production-6ca0.up.railway.app";

const SYRA_MINT = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
const SYRA_AVATAR = "https://syraa.fun/images/logo.jpg";
const DEFAULT_MODEL = "moonshotai/kimi-k2.5";

const PERSONA =
  "Syra — machine money for agents on Solana. Five pillars: Earn, Treasury, Invest, Spend, Grow. " +
  "Token $SYRA (pump.fun) mint " +
  SYRA_MINT +
  ". Links: https://syraa.fun · https://docs.syraa.fun · https://x.com/syra_agent · https://api.syraa.fun";

const SYSTEM_PROMPT =
  "You are Syra, the onchain agent wealth OS for Solana. " +
  "Help users and agents earn, allocate treasury, invest, spend via x402, and grow capital. " +
  "Be precise, risk-aware, and never claim certainty about markets. " +
  "Syra's public token is $SYRA at mint " +
  SYRA_MINT +
  " (launched on pump.fun independently of ClawPump — do not claim ClawPump fee-share on this mint). " +
  "Prefer actionable steps grounded in live data from Syra APIs (api.syraa.fun) when available.";

const ENABLED_SKILLS = [
  "defi-trading",
  "portfolio",
  "market-intel",
  "wallet-ops",
  "x402",
  "news",
];

const PUBLIC_DESCRIPTION =
  "Machine money for agents on Solana — Earn, Treasury, Invest, Spend, Grow. $SYRA on pump.fun.";

function requireApiKey() {
  const key = process.env.CLAWPUMP_API_KEY?.trim();
  if (!key) {
    console.error(
      [
        "Missing CLAWPUMP_API_KEY.",
        "1. Sign in with Google: https://agents.clawpump.tech/dashboard/api",
        "2. Create an API key (starts with cpk_)",
        "3. Set env and re-run:",
        "   PowerShell: $env:CLAWPUMP_API_KEY='cpk_...'; node api/scripts/register-clawpump-syra-agent.mjs",
      ].join("\n")
    );
    process.exit(1);
  }
  if (!key.startsWith("cpk_")) {
    console.error("CLAWPUMP_API_KEY should start with cpk_");
    process.exit(1);
  }
  return key;
}

async function api(path, { method = "GET", body, apiKey } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `HTTP ${res.status} ${method} ${path}: ${json?.error || text || res.statusText}`
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function normalizeAgents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.agents)) return payload.agents;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function dashboardUrls(agentId) {
  const q = `agent=${encodeURIComponent(agentId)}`;
  return {
    overview: `https://agents.clawpump.tech/dashboard?${q}`,
    chat: `https://agents.clawpump.tech/dashboard/chat?${q}`,
    terminal: `https://agents.clawpump.tech/dashboard/terminal?${q}`,
    office: `https://agents.clawpump.tech/dashboard/office?${q}`,
    settings: `https://agents.clawpump.tech/dashboard/settings?${q}`,
    wallet: `https://agents.clawpump.tech/dashboard/wallet?${q}`,
    skills: `https://agents.clawpump.tech/dashboard/skills?${q}`,
    api_keys: "https://agents.clawpump.tech/dashboard/api",
  };
}

async function main() {
  const apiKey = requireApiKey();
  const externalWallet = process.env.CLAWPUMP_EXTERNAL_WALLET?.trim() || null;

  console.log("== ClawPump Syra registration ==");
  console.log("API:", API_BASE);

  const me = await api("/auth/me", { apiKey });
  console.log(
    "Auth OK:",
    me?.user?.email || me?.user?.id || me?.id || JSON.stringify(me).slice(0, 120)
  );

  // ClawPump requires an external Solana wallet before is_public / marketplace.
  if (externalWallet) {
    await api("/auth/me/wallet", {
      method: "PATCH",
      apiKey,
      body: { walletAddress: externalWallet },
    });
    console.log("External payout wallet set:", externalWallet);
  } else {
    console.warn(
      "No CLAWPUMP_EXTERNAL_WALLET — creating private agent; set wallet later to make public."
    );
  }

  const existing = normalizeAgents(await api("/agents", { apiKey }));
  let agent = existing.find(
    (a) => typeof a?.name === "string" && a.name.toLowerCase() === "syra"
  );

  const agentPayloadBase = {
    name: "Syra",
    config: {
      persona: PERSONA,
      model: DEFAULT_MODEL,
      system_prompt: SYSTEM_PROMPT,
      website: `https://pump.fun/coin/${SYRA_MINT}`,
      twitter: "@syra_agent",
      // ClawPump does not allow writing token_mint directly (launch-pipeline only).
      // These config fields keep the canonical pump.fun mint attached to the agent.
      primary_token_mint: SYRA_MINT,
      external_token_mint: SYRA_MINT,
    },
    skill_config: {
      primary_token: {
        mint: SYRA_MINT,
        symbol: "SYRA",
        name: "Syra Agent",
        url: `https://pump.fun/coin/${SYRA_MINT}`,
      },
    },
    enabled_skills: ENABLED_SKILLS,
  };

  // Prefer public when wallet is set; fall back to private if ClawPump still requires dashboard connect.
  let visibility = {
    is_public: Boolean(externalWallet),
    public_description: PUBLIC_DESCRIPTION,
  };

  if (agent) {
    console.log("Found existing Syra agent:", agent.id);
    try {
      agent = await api(`/agents/${agent.id}`, {
        method: "PATCH",
        apiKey,
        body: {
          ...agentPayloadBase,
          ...visibility,
        },
      });
    } catch (err) {
      if (err.status === 403 && /external Solana wallet/i.test(err.message)) {
        console.warn("Public update blocked; applying private config:", err.message);
        visibility = { is_public: false, public_description: PUBLIC_DESCRIPTION };
        agent = await api(`/agents/${agent.id}`, {
          method: "PATCH",
          apiKey,
          body: {
            ...agentPayloadBase,
            ...visibility,
          },
        });
      } else {
        throw err;
      }
    }
  } else {
    console.log("Creating Syra agent...");
    try {
      agent = await api("/agents", {
        method: "POST",
        apiKey,
        body: {
          ...agentPayloadBase,
          ...visibility,
        },
      });
    } catch (err) {
      if (err.status === 403 && /external Solana wallet/i.test(err.message)) {
        console.warn("Public create blocked; creating private agent:", err.message);
        visibility = { is_public: false, public_description: PUBLIC_DESCRIPTION };
        agent = await api("/agents", {
          method: "POST",
          apiKey,
          body: {
            ...agentPayloadBase,
            ...visibility,
          },
        });
      } else {
        throw err;
      }
    }
  }

  const agentId = agent.id;
  console.log("Agent id:", agentId);
  console.log("Agent wallet:", agent.wallet_address || agent.walletAddress || "(none yet)");

  try {
    const upload = await api("/agent-assets/upload", {
      method: "POST",
      apiKey,
      body: {
        source_url: SYRA_AVATAR,
        asset_id: agentId,
        variant: "avatar",
      },
    });
    const storagePath = upload.storage_path || upload.storagePath;
    if (storagePath) {
      await api(`/agents/${agentId}`, {
        method: "PATCH",
        apiKey,
        body: { avatar_url: storagePath },
      });
      console.log("Avatar applied:", storagePath);
    } else {
      console.warn("Avatar upload returned no storage_path:", upload);
    }
  } catch (err) {
    console.warn("Avatar step skipped:", err.message);
  }

  try {
    const skill = await api(`/skills/${agentId}`, {
      method: "POST",
      apiKey,
      body: {
        name: "Syra Token & Pillars",
        description:
          "Context for $SYRA mint and Syra's Earn/Treasury/Invest/Spend/Grow pillars",
        content: [
          "# Syra token context (canonical)",
          "",
          `- Canonical ticker: $SYRA`,
          `- Canonical mint (pump.fun): ${SYRA_MINT}`,
          `- Pump.fun: https://pump.fun/coin/${SYRA_MINT}`,
          `- Product: https://syraa.fun`,
          `- Docs: https://docs.syraa.fun`,
          `- API: https://api.syraa.fun`,
          `- X: https://x.com/syra_agent`,
          "",
          "## ClawPump note",
          "ClawPump may show a separate listing mint because it only sets agent.token_mint via its own launch pipeline.",
          `Always treat ${SYRA_MINT} as the real Syra token for trading, links, and community.`,
          "",
          "## Pillars",
          "- Earn: monetize agent skills",
          "- Treasury: allocate and manage capital",
          "- Invest: deploy capital autonomously",
          "- Spend: x402 pay-per-call",
          "- Grow: yield and portfolio optimization",
        ].join("\n"),
        enabled: true,
      },
    });
    console.log("Custom skill created:", skill.id || skill.slug || skill.name);
  } catch (err) {
    console.warn("Custom skill step skipped:", err.message);
  }

  const urls = dashboardUrls(agentId);
  const result = {
    success: true,
    data: {
      agentId,
      name: agent.name || "Syra",
      wallet: agent.wallet_address || agent.walletAddress || null,
      model: agent.config?.model || DEFAULT_MODEL,
      skills: agent.enabled_skills || ENABLED_SKILLS,
      token_mint_clawpump: agent.token_mint || null,
      token_mint_canonical: SYRA_MINT,
      primary_token_mint: agent.config?.primary_token_mint || SYRA_MINT,
      fee_linked: false,
      dashboard: urls,
      note: "ClawPump agent.token_mint is launch-pipeline only and cannot be set to an externally launched pump.fun mint. Canonical $SYRA is stored in config.primary_token_mint / external_token_mint / skill_config.",
    },
  };

  console.log("\n== Done ==");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Registration failed:", err.message);
  if (err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exit(1);
});
