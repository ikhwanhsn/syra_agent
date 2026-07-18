import { COVENANT_POST } from "../covenantUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { COVENANT_PHOTO_SHARE_COPIES } from "./shareCopies/covenantShareCopies";

const copies = COVENANT_PHOTO_SHARE_COPIES;

/** Photo-format content for the Covenant ship log - 15 cards, 15 X posts. */
export const COVENANT_PHOTO = definePhotoUpdate(COVENANT_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "OS layer · x402 · Audit",
      title: "Covenant �- Syra",
      subtitle: "Open agent-native OS infrastructure meets machine money. Signed grants, audit receipts, and x402 intelligence in one stack.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-accent",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The gap",
      headline: "Agents need an OS, not just APIs.",
      body: "Every framework reinvents identity, permissions, memory, and settlement. Covenant provides eight host-level primitives via covenantd. Syra sells intelligence over x402. Pay per call, leave verifiable receipts.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "402 for price. Covenant for authority.",
      narrative: "Covenant owns the agent-native OS layer. Syra owns machine money. Agents dispatch under signed grants, settle USDC per call, and log audit receipts on both sides.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Integration flow",
      headline: "Grant. Pay. Receipt.",
      steps: [
        { step: "01", title: "Covenant grant", description: "covenantd issues signed capability grant with budget scope." },
        { step: "02", title: "Agent calls Syra", description: "MCP or x402 API. Agent wallet settles USDC per call." },
        { step: "03", title: "Intel returns", description: "Sentiment, market data, signals back to agent process." },
        { step: "04", title: "Receipt logged", description: "Covenant audit + Syra x402 settlement trace." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Syra as Covenant commerce layer.",
      steps: [
        { step: "01", title: "Syra MCP", description: "100+ x402 tools exposed for covenantd agents." },
        { step: "02", title: "skill.md", description: "Agent discovery at api.syraa.fun/skill.md." },
        { step: "03", title: "Capability scope", description: "Covenant permissions gate which routes agents call." },
        { step: "04", title: "Dual audit", description: "Append-only Covenant log + x402 receipts." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One agent-native stack.",
      cards: [
        { title: "covenantd", subtitle: "Host daemon", detail: "Eight OS primitives on the host.", accent: "gold" },
        { title: "Syra MCP", subtitle: "Agent tools", detail: "x402 intelligence, market data, swaps.", accent: "gold" },
        { title: "Settlement", subtitle: "USDC per call", detail: "Machine money on Solana via x402." },
        { title: "Audit", subtitle: "Dual ledger", detail: "Covenant log + Syra settlement receipts." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Covenant �- Syra is live today.",
      highlights: [
        "Syra MCP server for covenantd-run agents",
        "skill.md at api.syraa.fun/skill.md",
        "x402 checkout under capability grants",
        "Audit receipts align with Covenant ledger",
        "SAID identity + Pact refunds unchanged",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Agent-native by the numbers.",
      stats: [
        { value: "8", label: "OS primitives" },
        { value: "100+", label: "Syra x402 tools" },
        { value: "402", label: "Pay per call" },
      ],
      narrative: "Covenant gives agents a governed operating layer. Syra gives them machine money. Build on Covenant, pay for intelligence on Syra.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Eight primitives. One rail.",
      stats: [{ value: "8", label: "OS primitives" }],
      narrative: "Intent, runtime, memory, identity, permissions, comms, compositor, settlement. Covenant owns the host. Syra owns x402 commerce.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Framework-only vs OS + rail.",
      compareLeft: {
        title: "Before",
        body: "Each agent app rebuilt identity, permissions, and payment from scratch.",
      },
      compareRight: {
        title: "Now",
        body: "Covenant OS layer + Syra machine money. Integrate once. Pay per call.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Integration",
      badge: "Now live · OS layer · x402",
      partnerName: "Covenant",
      partnerLogo: "/images/partners/covenant.png",
      headline: "Syra �- Covenant",
      subtitle: "Open infrastructure for agent-native computing. Signed grants, sandboxed runtime, and x402 machine money.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Where Syra plugs into Covenant.",
      items: [
        "covenantd: Rust daemon, eight OS primitives",
        "Syra MCP: agent tool dispatch over x402",
        "skill.md: agent discovery at api.syraa.fun",
        "Capability grants scope which Syra routes agents call",
        "Settlement receipts align with Covenant audit log",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Full stack",
      headline: "OS + commerce + trust + recourse.",
      body: "Covenant for governed execution. Syra for machine money. SAID for identity. Pact for x402 refunds. AgentScore for compliance gates.",
      highlights: [
        "Covenant: identity, permissions, runtime",
        "Syra: x402 intelligence + agent wallets",
        "SAID: verified on-chain identity",
        "Pact: automatic refund coverage",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Dispatch a Covenant agent to Syra.",
      terminalLines: [
        "$ covenant intent dispatch syra-sentiment \\",
        '  --grant trading-research \\',
        '  --params \'{"symbol":"SOL"}\'',
        "→ x402 checkout via agent wallet",
        "→ Sentiment + signal returned",
        "→ Audit receipt in Covenant ledger",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Agent-native OS meets machine money.",
      subtitle: "Install covenantd. Connect Syra MCP. Pay per call under signed capability grants.",
      links: [
        { label: "Covenant", value: "opencovenant.org", href: "https://opencovenant.org/" },
        { label: "Covenant docs", value: "docs.opencovenant.org", href: "https://docs.opencovenant.org/" },
        { label: "Syra skill.md", value: "api.syraa.fun/skill.md", href: "https://api.syraa.fun/skill.md" },
      ],
    }),
  },
]);
