import { AIP_INTEGRATION_POST } from "../aipIntegrationUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AIP_INTEGRATION_PHOTO_SHARE_COPIES } from "./shareCopies/aipIntegrationShareCopies";

const copies = AIP_INTEGRATION_PHOTO_SHARE_COPIES;

/** Photo-format content for the AIP integration ship log - 15 cards, 15 X posts. */
export const AIP_INTEGRATION_PHOTO = definePhotoUpdate(AIP_INTEGRATION_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "AIP-01 · AIP-02 · AIP-04",
      title: "AIP × Syra",
      subtitle: "Agent Card. A2A tasks. did:aip identity. x402 commerce unchanged.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Agents need a handshake.",
      body: "Syra runs x402, 8004, SAID, and Ampersend. AIP standardizes discovery, task lifecycle, and did:aip identity: the open protocol layer for autonomous agents on Solana.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Discover. Task. Pay. Verify.",
      narrative: "Agent Card for discovery. A2A JSON-RPC for tasks. x402 for settlement. did:aip for identity: four standards, one Syra gateway.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "AIP flow",
      headline: "Discover. Task. Pay. Settle.",
      steps: [
        { step: "01", title: "Agent Card", description: "GET /.well-known/agent.json: capabilities + pricing." },
        { step: "02", title: "A2A task", description: "POST /a2a: task/create with x402 payment." },
        { step: "03", title: "did:aip verify", description: "GET /aip/verify/:did: on-chain counterparty check." },
        { step: "04", title: "Registry", description: "npm run register-aip: AgentRecord on Solana." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Full AIP stack in one pass.",
      steps: [
        { step: "01", title: "Agent Card", description: "AIP-01 JSON from x402 catalog." },
        { step: "02", title: "A2A server", description: "POST /a2a JSON-RPC 2.0 endpoint." },
        { step: "03", title: "did:aip adapter", description: "@aipagents/did-resolver + /aip routes." },
        { step: "04", title: "Buy-side tools", description: "aip-discover · resolve · delegate + Brain." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four standards. Three wired.",
      cards: [
        { title: "AIP-01", subtitle: "Agent Card", detail: "/.well-known/agent.json discovery.", accent: "gold" },
        { title: "AIP-02", subtitle: "A2A JSON-RPC", detail: "POST /a2a task lifecycle.", accent: "gold" },
        { title: "AIP-03", subtitle: "x402 payment", detail: "Already live: multi-chain Syra rail." },
        { title: "AIP-04", subtitle: "did:aip", detail: "On-chain identity + W3C DID Document." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "AIP is live on Syra today.",
      highlights: [
        "GET /.well-known/agent.json: 7 A2A capabilities",
        "POST /a2a: task/create + task/status",
        "GET /aip/status · /aip/resolve · /aip/verify",
        "aip-discover · aip-resolve · aip-delegate tools",
        "npm run register-aip for on-chain registry",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "AIP by the numbers.",
      stats: [
        { value: "7", label: "A2A capabilities" },
        { value: "4", label: "AIP standards" },
        { value: "402", label: "Commerce unchanged" },
      ],
      narrative: "Agent Card generated from 26+ x402 resources. A2A server reuses agent tool executor. did:aip verify before payment.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "One catalog. Two protocols.",
      stats: [{ value: "26+", label: "x402 resources" }],
      narrative: "Agent Card and x402 discovery share the same catalog: one source of truth for capabilities and pricing.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Custom tools vs AIP handshake.",
      compareLeft: {
        title: "Before",
        body: "POST /agent/tools/call only. No standard agent-to-agent protocol.",
      },
      compareRight: {
        title: "Now",
        body: "Agent Card + A2A JSON-RPC + did:aip verify. Same Syra brain.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · AIP · Solana",
      partnerName: "Agent Internet Protocol",
      partnerLogo: "/images/partners/aip-agents.png",
      partnerLogoSolidBg: true,
      headline: "Syra × AIP",
      subtitle: "Agent Card. A2A tasks. did:aip identity. Open standards for the agentic web.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Syra API.",
      items: [
        "api/libs/aipAgentCard.js: Agent Card from x402 catalog",
        "api/routes/a2a/index.js: JSON-RPC 2.0 server",
        "api/libs/aipDidClient.js: did:aip resolver adapter",
        "api/libs/aipClient.js: discover, resolve, delegate",
        "scripts/register-aip-agent.js: on-chain registry",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Agent stack",
      headline: "Commerce + identity + handshake.",
      body: "x402 for pay-per-call. 8004 + SAID for registries. AIP for Agent Card, A2A, and did:aip. Brain delegates to AIP specialists.",
      highlights: [
        "x402: multi-chain USDC commerce",
        "8004 + SAID: agent identity",
        "AIP: discovery + tasks + did:aip",
        "Brain: orchestrator delegation",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Fetch Syra's Agent Card.",
      terminalLines: [
        "$ curl api.syraa.fun/.well-known/agent.json",
        '{ "did": "did:aip:…:syra",',
        '  "endpoint": "https://api.syraa.fun/a2a",',
        '  "capabilities": [ … ] }',
        "$ curl api.syraa.fun/aip/status",
        '{ "registered": true, "did": "did:aip:…" }',
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Syra speaks AIP.",
      subtitle: "Fetch the Agent Card. Resolve a did:aip. Submit an A2A task from the playground.",
      links: [
        { label: "Agent Card", value: "/.well-known/agent.json", href: "https://api.syraa.fun/.well-known/agent.json" },
        { label: "AIP protocol", value: "aipagents.xyz", href: "https://aipagents.xyz" },
        { label: "Syra API", value: "/aip/status", href: "https://api.syraa.fun/aip/status" },
      ],
    }),
  },
]);
