import { AGENT402_MARKETPLACE_POST } from "../agent402MarketplaceUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { AGENT402_MARKETPLACE_PHOTO_SHARE_COPIES } from "./shareCopies/agent402MarketplaceShareCopies";

const copies = AGENT402_MARKETPLACE_PHOTO_SHARE_COPIES;

/** Photo-format content for the Agent402 marketplace ship log. */
export const AGENT402_MARKETPLACE_PHOTO = definePhotoUpdate(AGENT402_MARKETPLACE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Live · 83 tools · Pay as you go",
      title: "Syra × Agent402",
      subtitle:
        "Syra just landed on Agent402. Find paid crypto intelligence in the 402 hub, then pay only when you call.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-gold-frame",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Agents should not hunt for hidden links.",
      body: "Great tools stay invisible when discovery is messy. Agent402 is where agents browse what they can buy. Syra is now in that marketplace.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Find Syra. Call once. Pay as you go.",
      narrative:
        "Discovery stays simple. Spending stays flexible. Agents get crypto signal when they need it.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How users win",
      headline: "Find → call → pay → win.",
      steps: [
        { step: "01", title: "Open Agent402", description: "Browse the marketplace where agents shop." },
        { step: "02", title: "Find Syra", description: "Listed by name with a full tool shelf." },
        { step: "03", title: "Call what you need", description: "Signal, news, research on demand." },
        { step: "04", title: "Pay as you go", description: "Spend only on the calls that matter." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Ship sequence",
      headline: "From listing to agent payoff.",
      steps: [
        { step: "01", title: "Land", description: "Syra joins Agent402 under its real brand." },
        { step: "02", title: "Ready", description: "Healthy listing. Ready to route." },
        { step: "03", title: "Shelf", description: "83 tools waiting for on-demand calls." },
        { step: "04", title: "Spend", description: "Agents pay only for calls they make." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-stack",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four reasons this listing hits different.",
      cards: [
        {
          title: "Discovery",
          subtitle: "One hub",
          detail: "Agents find Syra without digging through random links.",
          accent: "gold",
        },
        {
          title: "Depth",
          subtitle: "83 tools",
          detail: "A full shelf of crypto intelligence, not a single demo.",
          accent: "gold",
        },
        {
          title: "Freedom",
          subtitle: "Pay per use",
          detail: "Spend when the call is worth it. Skip when it is not.",
          accent: "gold",
        },
        {
          title: "Momentum",
          subtitle: "Syra energy",
          detail: "More doors into Syra for agents that move with the market.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What you can do today.",
      highlights: [
        "Open agent402.tools and find Syra",
        "Browse the tool shelf before you spend",
        "Call the intelligence you need on demand",
        "Pay only for the calls that matter",
        "Keep going on syraa.fun for the full product",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Proof on Agent402.",
      stats: [
        { value: "LIVE", label: "On Agent402" },
        { value: "83", label: "Tools" },
        { value: "1", label: "Name: Syra" },
      ],
      narrative:
        "Syra is indexed under its real brand name with a healthy listing. Agents can find the shelf and start calling.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Tools ready to call.",
      stats: [{ value: "83", label: "Syra tools on Agent402" }],
      narrative: "Signal, news, research, and market reads behind pay-as-you-go calls.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Hidden links vs a marketplace door.",
      compareLeft: {
        title: "Before",
        body: "Agents had to already know where Syra lived.",
      },
      compareRight: {
        title: "Now",
        body: "Browse Agent402, find Syra by name, and start calling.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-beacon",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now live",
      badge: "Syra × Agent402",
      partnerName: "Agent402",
      partnerLogo: "/images/partners/agent402.png",
      partnerLogoSolidBg: true,
      headline: "Syra is on Agent402",
      subtitle: "Listed under the Syra name. 83 tools on the shelf. Pay as you go.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Next stops",
      headline: "Where to go after you find Syra.",
      items: [
        "Agent402: browse and call from the marketplace",
        "Syra home: see the full product beyond the listing",
        "Chat: talk to Syra with a ready agent wallet",
        "Playground: try a guided paid intelligence call",
        "Marketplace: browse Syra Spend when you already know the brand",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Discovery · Intelligence",
      headline: "Agent402 finds. Syra delivers.",
      body: "Agent402 helps agents discover Syra. Syra still delivers the intelligence and the pay-as-you-go experience. One marketplace door. Same Syra power on the other side.",
      highlights: [
        "Agent402: marketplace discovery",
        "Syra: crypto intelligence shelf",
        "83 tools ready to call",
        "Pay only when you use them",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Browse to payoff.",
      terminalLines: [
        "$ open agent402.tools",
        "→ find Syra",
        "$ call tool",
        "→ intelligence unlocked",
        "$ pay as you go",
        "< ready for the next move",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Go find Syra on Agent402.",
      subtitle:
        "Open the marketplace, call a tool, and feel how fast paid crypto intelligence should move.",
      links: [
        { label: "Agent402", value: "agent402.tools", href: "https://agent402.tools" },
        { label: "Syra", value: "syraa.fun", href: "https://www.syraa.fun" },
        {
          label: "Playground",
          value: "syraa.fun/playground",
          href: "https://www.syraa.fun/playground",
        },
      ],
    }),
  },
]);
