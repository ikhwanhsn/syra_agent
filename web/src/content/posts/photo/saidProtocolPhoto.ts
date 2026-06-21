import { SAID_PROTOCOL_POST } from "../saidProtocolUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { SAID_PROTOCOL_PHOTO_SHARE_COPIES } from "./shareCopies/saidProtocolShareCopies";

const copies = SAID_PROTOCOL_PHOTO_SHARE_COPIES;

/** Photo-format content for the SAID Protocol ship log — 15 cards, 15 X posts. */
export const SAID_PROTOCOL_PHOTO = definePhotoUpdate(SAID_PROTOCOL_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Identity · Verified · Solana",
      title: "SAID × Syra",
      subtitle: "Verified on-chain agent identity. Register once. Build reputation. Prove who you are across platforms.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Wallets are not identity.",
      body: "Syra agents pay per call over x402 and register on 8004. Platforms still ask: is this agent real? SAID adds persistent on-chain identity with a permanent verification badge — the trust layer the agent economy was missing.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "402 for commerce. SAID for trust.",
      narrative: "Same machine money stack. Same agent wallets. New verifiable identity surface — registered, verified, and queryable from Syra API routes.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Identity flow",
      headline: "Register. Verify. Query.",
      steps: [
        { step: "01", title: "On-chain register", description: "AgentCard on IPFS. SAID program creates identity PDA." },
        { step: "02", title: "Verification badge", description: "0.01 SOL one-time. Permanent verified status." },
        { step: "03", title: "Directory sync", description: "Profile on saidprotocol.com with trust tier." },
        { step: "04", title: "Runtime API", description: "GET /said/status · /said/verify · /said/trust." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Full SAID integration in one pass.",
      steps: [
        { step: "01", title: "said-sdk adapter", description: "On-chain register + verify via saidClient.js." },
        { step: "02", title: "register-said script", description: "npm run register-said — idempotent setup." },
        { step: "03", title: "Runtime routes", description: "/said mounted on Syra API gateway." },
        { step: "04", title: "Verified live", description: "Syra profile on SAID Protocol mainnet." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One identity stack.",
      cards: [
        { title: "On-chain", subtitle: "SAID program", detail: "Persistent PDA on Solana mainnet.", accent: "gold" },
        { title: "Metadata", subtitle: "AgentCard IPFS", detail: "Name, skills, MCP endpoint pinned via Pinata.", accent: "gold" },
        { title: "Runtime", subtitle: "/said routes", detail: "status · verify · trust · agent on Syra API." },
        { title: "Discovery", subtitle: "SAID directory", detail: "Trust tier + reputation on saidprotocol.com." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "SAID is live on Syra today.",
      highlights: [
        "Syra agent registered + verified on-chain",
        "saidClient adapter (register, verify, lookup)",
        "GET /said/status for Syra's own identity",
        "GET /said/verify/:wallet for full reputation",
        "npm run register-said for idempotent setup",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Identity by the numbers.",
      stats: [
        { value: "✓", label: "Verified badge" },
        { value: "4", label: "Runtime endpoints" },
        { value: "∞", label: "Reputation accrues" },
      ],
      narrative: "One-time 0.01 SOL verification fee. Permanent on-chain badge. Runtime trust checks without x402 or API keys for identity reads.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Verified forever.",
      stats: [{ value: "0.01", label: "SOL one-time verify" }],
      narrative: "Syra paid once for the SAID verification badge. On-chain permanently. No subscription. No recurring identity fees.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Wallet only vs SAID-verified.",
      compareLeft: {
        title: "Before",
        body: "Wallet address only. No verifiable agent identity. Platforms guess trust.",
      },
      compareRight: {
        title: "Now",
        body: "On-chain identity + verified badge + /said/trust gating. Same Syra brain.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · Verified · Solana",
      partnerName: "SAID Protocol",
      partnerLogo: "/images/partners/said-protocol.png",
      partnerLogoSolidBg: true,
      headline: "Syra × SAID Protocol",
      subtitle: "Verified on-chain agent identity. Register once. Build reputation. Query trust from Syra API.",
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
        "api/libs/saidClient.js — said-sdk + HTTP adapter",
        "scripts/register-said-agent.js — one-time setup",
        "routes/said/index.js — status, verify, trust, agent",
        "Flexible on-chain account parser (342-byte layout)",
        "SAID_AGENT_WALLET env for /said/status",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Identity stack",
      headline: "Commerce + compliance + trust.",
      body: "8004 for discoverable agent NFTs. AgentScore for Passport gates. SAID for verified on-chain identity. x402 for pay-per-call commerce.",
      highlights: [
        "8004: agent registry + collection",
        "AgentScore: KYC + compliance gates",
        "SAID: verified identity + reputation",
        "x402: USDC pay-per-call rail",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Query Syra's SAID identity.",
      terminalLines: [
        "$ curl api.syraa.fun/said/status \\",
        '  -H "X-API-Key: …"',
        '{ "verified": true, "wallet": "53Jhu…" }',
        "$ curl api.syraa.fun/said/trust/53Jhu…",
        '{ "trustTier": "medium", "badges": ["verified"] }',
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Syra is SAID-verified.",
      subtitle: "Check our profile. Query trust. Gate your integrations on verified agent identity.",
      links: [
        { label: "SAID profile", value: "saidprotocol.com/agents", href: "https://www.saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t" },
        { label: "SAID docs", value: "saidprotocol.com/docs", href: "https://www.saidprotocol.com/docs" },
        { label: "Syra API", value: "/said/status", href: "https://api.syraa.fun/said/status" },
      ],
    }),
  },
]);
