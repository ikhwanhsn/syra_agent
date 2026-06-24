import { Bot, Globe, Layers, Network, Radio, Terminal } from "lucide-react";
import type { PostUpdate } from "./types";

/**
 * Ship log: Agent Internet Protocol (AIP) integration for Syra.
 */
export const AIP_INTEGRATION_POST: PostUpdate = {
  meta: {
    updateNumber: 19,
    id: "aip-integration",
    title: "AIP Integration",
    published: "June 2026",
    tagline: "Syra joins the Agent Internet Protocol — Agent Card, A2A tasks, did:aip identity",
    shareCopyVideo: `SHIP LOG · Syra × Agent Internet Protocol is live.

Four open standards for the agentic web — Agent Card discovery, A2A JSON-RPC tasks, x402 payment, and did:aip identity. Syra ships all four layers on one API gateway.

→ GET /.well-known/agent.json — AIP-01 Agent Card
→ POST /a2a — task/create + task/status (JSON-RPC 2.0)
→ GET /aip/resolve · /aip/verify — did:aip on-chain
→ npm run register-aip for on-chain registry

x402 already handled commerce. AIP adds the agent handshake.

Full breakdown in the video ↓`,
    shareCopyPhoto: `MAJOR SHIP · Syra × AIP is live.

Agent Card at /.well-known/agent.json. A2A server at POST /a2a. did:aip identity via @aipagents/did-resolver. Brain can delegate to AIP specialists.

Discover → task → pay → settle. Same Syra stack.

Agent Card → api.syraa.fun/.well-known/agent.json`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "AIP × Syra",
      subtitle: "Agent Card. A2A tasks. did:aip identity. x402 commerce unchanged.",
      badge: "AIP-01 · AIP-02 · AIP-04",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "The agentic web needs a handshake.",
      body: "Syra already runs machine money over x402, registers on 8004 and SAID, and lists on Ampersend. AIP standardizes how agents discover each other, submit tasks, and verify identity — four open standards on Solana that Syra now speaks natively.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Full AIP stack in one pass",
      body: "Agent Card generated from our x402 catalog, A2A JSON-RPC server reusing the agent tool executor, did:aip resolver adapter, and buy-side tools for Brain delegation to AIP specialists.",
      highlights: [
        "GET /.well-known/agent.json",
        "POST /a2a · task/create + task/status",
        "aip-discover · aip-resolve · aip-delegate tools",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Discover. Task. Pay. Settle.",
      steps: [
        {
          step: "01",
          title: "Agent Card",
          description: "AIP-01 JSON at /.well-known/agent.json — capabilities + pricing from x402 catalog.",
        },
        {
          step: "02",
          title: "A2A task",
          description: "POST /a2a JSON-RPC 2.0 — task/create with capability id + input, x402-gated.",
        },
        {
          step: "03",
          title: "did:aip verify",
          description: "GET /aip/verify/:did resolves on-chain AgentRecord via did-resolver.",
        },
        {
          step: "04",
          title: "On-chain register",
          description: "npm run register-aip writes AgentRecord PDA to AIP registry on Solana.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Four AIP standards",
      headline: "What Syra implements",
      cards: [
        {
          title: "AIP-01",
          subtitle: "Agent Card",
          detail: "7 A2A capabilities + full x402 resource list. Canonical discovery JSON.",
          accent: "gold",
        },
        {
          title: "AIP-02",
          subtitle: "A2A JSON-RPC",
          detail: "POST /a2a — crypto.brain, crypto.signal, crypto.news, and more.",
          accent: "gold",
        },
        {
          title: "AIP-04",
          subtitle: "did:aip",
          detail: "On-chain identity + W3C DID Document. Counterparty verify before payment.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live across Syra stack",
      items: [
        {
          icon: Globe,
          title: "Agent Card",
          description: "Machine-readable discovery at /.well-known/agent.json.",
          href: "https://api.syraa.fun/.well-known/agent.json",
        },
        {
          icon: Radio,
          title: "A2A server",
          description: "JSON-RPC 2.0 task lifecycle at POST /a2a with x402 gating.",
          href: "https://api.syraa.fun/a2a",
        },
        {
          icon: Network,
          title: "/aip routes",
          description: "status · resolve · verify · identity — did:aip reads and counterparty checks.",
          href: "https://api.syraa.fun/aip/status",
        },
        {
          icon: Bot,
          title: "Agent tools",
          description: "aip-discover, aip-resolve, aip-delegate via POST /agent/tools/call.",
        },
        {
          icon: Layers,
          title: "Brain delegation",
          description: "Orchestrator auto-delegates summarize/translate/audit to AIP specialists.",
        },
        {
          icon: Terminal,
          title: "register-aip",
          description: "On-chain registry script — npm run register-aip on Solana devnet.",
          href: "https://aipagents.xyz",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For builders",
      headline: "Interoperable by default",
      stats: [
        { value: "7", label: "A2A capabilities" },
        { value: "4", label: "AIP standards" },
        { value: "402", label: "Commerce unchanged" },
      ],
      narrative:
        "External AIP agents can discover Syra, submit paid tasks, and verify our did:aip on-chain. Syra agents can discover, resolve, and delegate to AIP specialists with wallet-funded x402 — same treasury, new handshake.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Syra speaks AIP.",
      subline: "Fetch the Agent Card, resolve a did:aip, or submit an A2A task from the playground.",
      links: [
        { label: "Agent Card", value: "api.syraa.fun/.well-known/agent.json", href: "https://api.syraa.fun/.well-known/agent.json" },
        { label: "AIP protocol", value: "aipagents.xyz", href: "https://aipagents.xyz" },
        { label: "Syra API", value: "api.syraa.fun/aip/status", href: "https://api.syraa.fun/aip/status" },
      ],
    },
  ],
};
