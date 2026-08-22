import { OPENCLAW_MCP_POST } from "../openclawMcpUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { OPENCLAW_MCP_PHOTO_SHARE_COPIES } from "./shareCopies/openclawMcpShareCopies";

const copies = OPENCLAW_MCP_PHOTO_SHARE_COPIES;

/** Photo-format content for OpenClaw MCP ship log. */
export const OPENCLAW_MCP_PHOTO = definePhotoUpdate(OPENCLAW_MCP_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "OpenClaw · MCP · x402",
      title: "Syra × OpenClaw",
      subtitle: "Self-hosted agents pay per call. Syra stays merchant.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "OpenClaw needed a machine-money tool path.",
      body: "OpenClaw runs MCP on your hardware. Syra sells pay-per-call crypto intel on HTTP 402. openclaw mcp set wires @syra-ai/mcp-server with Solana USDC auto-pay.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Consult first. Pay per call.",
      narrative:
        "syra_consult is free. syra_spend_news settles USDC on Solana when your agent asks for BTC news.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "MCP path",
      headline: "Register → fund → consult → spend.",
      steps: [
        { step: "01", title: "mcp set syra", description: "npx @syra-ai/mcp-server stdio." },
        { step: "02", title: "Fund USDC", description: "Solana payer wallet + SOL." },
        { step: "03", title: "syra_consult", description: "Free intent routing." },
        { step: "04", title: "syra_spend_news", description: "402 settle then JSON." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Docs for OpenClaw builders.",
      steps: [
        { step: "01", title: "Repo quickstart", description: "OPENCLAW_MCP_QUICKSTART.md." },
        { step: "02", title: "Docs site", description: "/docs/build/openclaw." },
        { step: "03", title: "skill.md", description: "OpenClaw mcp set snippet." },
        { step: "04", title: "GTM row", description: "Partner outreach in AGENT_BUILDER_GTM." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four roles. One MCP path.",
      cards: [
        { title: "OpenClaw", subtitle: "Host", detail: "Runs MCP stdio process.", accent: "gold" },
        { title: "Syra MCP", subtitle: "Bridge", detail: "Maps tools to API.", accent: "gold" },
        { title: "Syra API", subtitle: "Merchant", detail: "402 + intel JSON." },
        { title: "Agent wallet", subtitle: "Payer", detail: "Solana USDC signs." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Prove it in five steps.",
      highlights: [
        "Install OpenClaw (Node 18+)",
        "openclaw mcp set syra",
        "Fund SYRA_PAYER_KEYPAIR USDC",
        "openclaw mcp doctor syra --probe",
        "Ask Get BTC news and confirm settle",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Distribution-ready.",
      stats: [
        { value: "47", label: "Curated tools" },
        { value: "1", label: "Paid call to prove" },
        { value: "0", label: "API keys" },
      ],
      narrative: "Trending self-hosted runtime meets live x402 merchant on api.syraa.fun.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Quickstart on docs.syraa.fun.",
      stats: [{ value: "MCP", label: "stdio transport" }],
      narrative:
        "openclaw mcp set or Control UI /settings/mcp. Same env as Cursor and Claude.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Before vs now.",
      compareLeft: {
        title: "Before",
        body: "No documented Syra install path for OpenClaw MCP.",
      },
      compareRight: {
        title: "Now",
        body: "Copy mcp set, install skill, settle pay-per-call intel.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "OpenClaw · MCP",
      headline: "Syra × OpenClaw",
      subtitle: "MCP + x402 install path is live on docs.syraa.fun.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Boundaries",
      headline: "What this integration is not.",
      items: [
        "Not a second merchant on OpenClaw",
        "Not a facilitator replacement",
        "Not a custody or wallet rewrite",
        "Not committed payer secrets in git",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Host · Merchant",
      headline: "OpenClaw hosts. Syra settles.",
      body: "Fund Solana USDC once. The agent micropays every paid MCP tool call.",
      highlights: [
        "stdio @syra-ai/mcp-server",
        "syra_consult then spend tools",
        "Settled USDC on facilitators",
        "skill.md one-liner for agents",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "CLI path.",
      terminalLines: [
        "$ openclaw mcp set syra '{...}'",
        "$ openclaw mcp doctor syra --probe",
        "> syra_consult · Get BTC news",
        "> syra_spend_news · ticker BTC",
        "< HTTP/200 · news payload",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "mcp set. Fund USDC. Get BTC news.",
      subtitle: "Open the quickstart and settle one paid call from your agent wallet.",
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
          label: "MCP",
          value: "Install MCP",
          href: "https://docs.syraa.fun/docs/build/mcp",
        },
      ],
    }),
  },
]);
