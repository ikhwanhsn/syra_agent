import { Bot, Cpu, Layers, Lock, ShieldCheck, Terminal } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Covenant agent-native operating layer �- Syra machine money.
 */
export const COVENANT_POST: PostUpdate = {
  meta: {
    updateNumber: 15,
    id: "covenant-integration",
    title: "Covenant Integration",
    published: "June 2026",
    tagline: "Agent-native OS primitives meet Syra x402 machine money",
    shareCopyVideo: `SHIP LOG · Syra just integrated with Covenant.

Open infrastructure for agent-native computing: signed grants, append-only audit, sandboxed runtime, and eight host-level primitives. Syra is now the machine-money layer Covenant agents can call over x402.

→ Syra MCP + skill.md for covenantd-run agents
→ x402 intelligence APIs under capability-scoped grants
→ Settlement + audit receipts align with Covenant ledger
→ Identity stack: Covenant permissions + Syra wallets + SAID

402 for price. Covenant for authority. Same Syra agent brain.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra �- Covenant is live.

Covenant is the agent-native OS layer: identity, permissions, memory, runtime, and settlement as host-level services. Syra is the machine-money rail: pay-per-call intelligence over x402 from agents running under signed grants.

Install covenantd. Point agents at Syra MCP. Pay USDC per call. Every action leaves a receipt.

→ opencovenant.org
→ docs.opencovenant.org
→ api.syraa.fun/skill.md`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Covenant �- Syra",
      subtitle: "Open agent-native OS infrastructure meets Syra machine money. Signed grants, audit receipts, and x402 intelligence in one stack.",
      badge: "OS layer · x402 · Audit",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Agents need an OS, not just APIs.",
      body: "Every agent framework reinvents identity, permissions, memory, and settlement. Covenant provides these as host-level primitives via covenantd. Syra already sells intelligence over x402. Together: governed agents that pay per call and leave verifiable receipts.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Syra as Covenant's commerce layer",
      body: "Covenant agents dispatch intents under signed capability grants. Syra exposes 100+ x402 tools via MCP and skill.md: Nansen, Birdeye, signals, swaps. Callable from any Covenant runtime without reinventing payment rails.",
      highlights: [
        "Syra MCP server for covenantd-run agents",
        "skill.md + x402 checkout under capability scope",
        "Audit receipts align with Covenant ledger",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Grant. Pay. Receipt.",
      steps: [
        {
          step: "01",
          title: "Covenant grant",
          description: "covenantd issues a signed capability grant: scoped permissions for tools, budget, and runtime.",
        },
        {
          step: "02",
          title: "Agent calls Syra",
          description: "Intent dispatches to Syra MCP or x402 API. Agent wallet settles USDC per call via @x402/fetch.",
        },
        {
          step: "03",
          title: "Intelligence returns",
          description: "Sentiment, market data, signals, or swap routes return to the Covenant agent process.",
        },
        {
          step: "04",
          title: "Receipt logged",
          description: "Covenant append-only audit records the action. Syra leaves an x402 settlement trace.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Eight primitives, one money rail",
      cards: [
        {
          title: "covenantd",
          subtitle: "Host daemon",
          detail: "Rust daemon owning identity, permissions, memory, runtime, and settlement on the host.",
          accent: "gold",
        },
        {
          title: "Syra MCP",
          subtitle: "Agent tools",
          detail: "100+ x402 tools exposed via MCP: intelligence, market data, swaps, and enrichment.",
          accent: "gold",
        },
        {
          title: "x402 + audit",
          subtitle: "Dual ledger",
          detail: "USDC per call on Solana. Covenant audit log + Syra settlement receipts for every action.",
        },
      ],
    },
    {
      id: "primitives",
      kind: "cards",
      layout: "cards-bento",
      label: "Primitives",
      kicker: "Covenant OS layer",
      headline: "Where Syra plugs in",
      cards: [
        {
          title: "Settlement",
          subtitle: "x402 USDC",
          detail: "Syra handles micropayment settlement. Covenant tracks budget and capability scope.",
        },
        {
          title: "Identity",
          subtitle: "Shared trust",
          detail: "Covenant identity primitive + Syra SAID verification + 8004 registry.",
        },
        {
          title: "Permissions",
          subtitle: "Signed grants",
          detail: "Capability-scoped tool access gates which Syra routes an agent can call.",
        },
        {
          title: "Memory",
          subtitle: "Durable state",
          detail: "Covenant drift-aware memory persists context. Syra serves fresh intelligence per call.",
        },
      ],
    },
    {
      id: "compare",
      kind: "statement",
      layout: "compare-columns",
      label: "Compare",
      kicker: "Before vs now",
      headline: "Framework-only vs OS + rail",
      body: "Before: each agent app rebuilt identity, permissions, and payment. Now: Covenant owns the OS layer. Syra owns machine money. Agents integrate once.",
      highlights: [
        "Before: siloed agent frameworks",
        "Now: shared host-level primitives",
        "One x402 rail for all Covenant agents",
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across the stack",
      items: [
        {
          icon: Cpu,
          title: "covenantd",
          description: "Install the Covenant daemon locally. Dispatch intents to Syra-backed agents under signed grants.",
          href: "https://docs.opencovenant.org/",
        },
        {
          icon: Terminal,
          title: "Syra MCP",
          description: "Connect Covenant agents to Syra's MCP server for x402 intelligence tools.",
          href: "https://api.syraa.fun/skill.md",
        },
        {
          icon: Lock,
          title: "Capability grants",
          description: "Covenant permissions primitive scopes which Syra routes each agent can access.",
        },
        {
          icon: ShieldCheck,
          title: "Audit trail",
          description: "Append-only Covenant audit + x402 settlement receipts for every paid call.",
        },
        {
          icon: Bot,
          title: "Agent chat",
          description: "Same Syra intelligence surface, now callable from Covenant-managed agent processes.",
          href: "https://www.syraa.fun/chat",
        },
        {
          icon: Layers,
          title: "Full stack",
          description: "Covenant OS + Syra x402 + SAID identity + Pact refunds + AgentScore gates.",
          href: "https://opencovenant.org/",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "Stop reinventing the OS",
      stats: [
        { value: "8", label: "OS primitives" },
        { value: "100+", label: "Syra x402 tools" },
        { value: "402", label: "Pay per call" },
      ],
      narrative:
        "Covenant gives agents a governed operating layer. Syra gives them machine money. Build agent apps on Covenant, pay for intelligence on Syra, without rebuilding identity, permissions, or settlement from scratch.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Agent-native OS meets machine money.",
      subline: "Install covenantd, connect Syra MCP, and pay per call under signed capability grants.",
      links: [
        { label: "Covenant", value: "opencovenant.org", href: "https://opencovenant.org/" },
        { label: "Covenant docs", value: "docs.opencovenant.org", href: "https://docs.opencovenant.org/" },
        { label: "Syra skill.md", value: "api.syraa.fun/skill.md", href: "https://api.syraa.fun/skill.md" },
      ],
    },
  ],
};
