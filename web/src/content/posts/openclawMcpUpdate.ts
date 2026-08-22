import { BookOpen, Bot, Code2, Shield, Terminal, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: OpenClaw agents run Syra MCP with x402 auto-pay (Solana USDC).
 */
export const OPENCLAW_MCP_POST = defineVideoUpdate(
  {
    updateNumber: 51,
    id: "openclaw-mcp",
    title: "OpenClaw × Syra MCP",
    published: "August 2026",
    tagline:
      "OpenClaw hosts Syra MCP. Fund Solana USDC. syra_consult then syra_spend_news. Syra stays the merchant.",
    shareCopyVideo: `SHIP LOG · OpenClaw can run Syra MCP with x402 auto-pay.

Register @syra-ai/mcp-server with openclaw mcp set, fund Solana USDC, call syra_consult then syra_spend_news from your agent wallet.

→ Quickstart: docs.syraa.fun/docs/build/openclaw
→ Skill: set up https://api.syraa.fun/skill.md
→ Syra stays merchant. OpenClaw is the host.

Full breakdown in the video.`,
    shareCopyPhoto: `SHIP LOG · OpenClaw → Syra MCP.

openclaw mcp set syra, fund USDC, ask Get BTC news. Consult is free. Paid tools settle on api.syraa.fun.

docs.syraa.fun/docs/build/openclaw`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-brand-lockup",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra × OpenClaw",
      subtitle:
        "Self-hosted agents get pay-per-call crypto intel. MCP + x402. No vendor API keys.",
      badge: "OpenClaw · MCP · x402",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-large-type",
      label: "Context",
      kicker: "Why this matters",
      headline: "OpenClaw agents needed a machine-money tool path.",
      body: "OpenClaw runs MCP servers on your hardware with openclaw mcp set. Syra sells pay-per-call crypto intel over HTTP 402. Together: register @syra-ai/mcp-server, fund Solana USDC, and let the agent pay per tool call without API keys.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-compact",
      label: "Shipped",
      kicker: "What we built",
      headline: "OpenClaw install path for Syra",
      body: "Repo quickstart, docs page at /docs/build/openclaw, skill.md OpenClaw section, and MCP README install snippet. Same payer env as Cursor and Claude. Consult-first via syra skill install.",
      highlights: [
        "docs/OPENCLAW_MCP_QUICKSTART.md",
        "docs.syraa.fun/docs/build/openclaw",
        "openclaw mcp set + doctor --probe",
        "openclaw skills install ./.agents/skills/syra",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-numbered",
      label: "Flow",
      kicker: "How it works",
      headline: "Register → fund → consult → spend",
      steps: [
        {
          step: "01",
          title: "openclaw mcp set syra",
          description: "stdio npx @syra-ai/mcp-server with SYRA_PAYER_KEYPAIR env.",
        },
        {
          step: "02",
          title: "Fund Solana USDC",
          description: "≥ $1 USDC + SOL on the payer wallet. Or syraa.fun/wallet.",
        },
        {
          step: "03",
          title: "syra_consult",
          description: "Free intent routing. Ask Get BTC news.",
        },
        {
          step: "04",
          title: "syra_spend_news",
          description: "Paid tool settles on 402. JSON news payload returns.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-row",
      label: "Stack",
      kicker: "Who does what",
      headline: "Four roles. One MCP path.",
      cards: [
        {
          title: "OpenClaw",
          subtitle: "Host",
          detail: "Runs MCP stdio process and exposes tools to your agent.",
          accent: "gold",
        },
        {
          title: "Syra MCP",
          subtitle: "Bridge",
          detail: "@syra-ai/mcp-server maps tools to api.syraa.fun.",
          accent: "gold",
        },
        {
          title: "Syra API",
          subtitle: "Merchant",
          detail: "402 pricing + crypto intel JSON after settle.",
        },
        {
          title: "Agent wallet",
          subtitle: "Payer",
          detail: "Solana USDC signs each paid tool call.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Surfaces",
      kicker: "Where to start",
      headline: "Docs and studio paths",
      items: [
        {
          icon: BookOpen,
          title: "OpenClaw quickstart",
          description: "Install MCP and skill on docs.syraa.fun.",
          href: "https://docs.syraa.fun/docs/build/openclaw",
        },
        {
          icon: Terminal,
          title: "openclaw mcp doctor",
          description: "Probe syra after mcp set. Lists curated tools.",
        },
        {
          icon: Bot,
          title: "skill.md",
          description: "Agents paste set up https://api.syraa.fun/skill.md",
          href: "https://api.syraa.fun/skill.md",
        },
        {
          icon: Zap,
          title: "Marketplace",
          description: "Browse Spend routes after first paid call.",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          icon: Code2,
          title: "Install MCP",
          description: "Shared env vars with Cursor and Claude.",
          href: "https://docs.syraa.fun/docs/build/mcp",
        },
        {
          icon: Shield,
          title: "Do not",
          description: "Never commit payer secrets into OpenClaw config or git.",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "metric-strip",
      label: "Impact",
      kicker: "Distribution",
      headline: "Organic agent traffic meets live x402 merchant.",
      stats: [
        { value: "47", label: "Curated MCP tools" },
        { value: "1", label: "Paid call to prove" },
        { value: "0", label: "Vendor API keys" },
      ],
      narrative:
        "OpenClaw is trending for self-hosted agents. This path gives those builders a copy-paste MCP install and consult-first crypto intel without rewiring Syra settlement.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-links",
      label: "Try it",
      headline: "mcp set. Fund USDC. Get BTC news.",
      subline:
        "Register Syra in OpenClaw, install the skill, and settle one syra_spend_news call from your agent wallet.",
      links: [
        {
          label: "Docs",
          value: "OpenClaw → Syra",
          href: "https://docs.syraa.fun/docs/build/openclaw",
        },
        {
          label: "Skill",
          value: "api.syraa.fun/skill.md",
          href: "https://api.syraa.fun/skill.md",
        },
        {
          label: "Studio",
          value: "syraa.fun/post",
          href: "https://www.syraa.fun/post",
        },
      ],
    },
  ],
);
