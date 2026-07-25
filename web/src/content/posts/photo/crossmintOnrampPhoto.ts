import { CROSSMINT_ONRAMP_POST } from "../crossmintOnrampUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { CROSSMINT_ONRAMP_PHOTO_SHARE_COPIES } from "./shareCopies/crossmintOnrampShareCopies";

const copies = CROSSMINT_ONRAMP_PHOTO_SHARE_COPIES;

/** Photo-format content for Crossmint onramp ship log. */
export const CROSSMINT_ONRAMP_PHOTO = definePhotoUpdate(CROSSMINT_ONRAMP_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Onramp · Wallet · x402",
      title: "Syra × Crossmint",
      subtitle: "Buy USDC with a card. Fund your agent. Start in minutes.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The bottleneck",
      headline: "Getting USDC was harder than calling the API.",
      body: "Crossmint buys USDC with a card and sends it to your Syra agent wallet. Custody stays Privy. Paid calls stay x402.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Card in. USDC on your agent. Pay per call.",
      narrative:
        "Top up the treasury with a card. Agents still micropay Syra APIs in USDC with x402.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Activation loop",
      headline: "From card to first paid call.",
      steps: [
        { step: "01", title: "Open wallet", description: "syraa.fun/wallet · pick Spend." },
        { step: "02", title: "Buy USDC", description: "Card checkout from $10." },
        { step: "03", title: "Refresh", description: "Balance lands on agent address." },
        { step: "04", title: "Call API", description: "MCP, SDK, or marketplace." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "Funding without a crypto scavenger hunt.",
      steps: [
        { step: "01", title: "Buy USDC CTA", description: "On the agent wallet page." },
        { step: "02", title: "Server orders", description: "Crossmint order for your address." },
        { step: "03", title: "Embedded checkout", description: "Card pay + delivery." },
        { step: "04", title: "Deposit kept", description: "Manual transfer still works." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four roles. One clear path.",
      cards: [
        { title: "You", subtitle: "Fund", detail: "Buy USDC when you need it.", accent: "gold" },
        { title: "Crossmint", subtitle: "Onramp", detail: "Card to USDC delivery.", accent: "gold" },
        { title: "Syra", subtitle: "Wallet", detail: "Same agent treasury." },
        { title: "x402", subtitle: "Spend", detail: "Pay per API call." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Try it in five steps.",
      highlights: [
        "Open Spend agent wallet",
        "Buy USDC with card ($10+)",
        "Or Deposit USDC yourself",
        "Refresh balance",
        "Run a paid marketplace call",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Built for activation.",
      stats: [
        { value: "$10+", label: "Card pack" },
        { value: "1 tap", label: "Buy USDC" },
        { value: "0", label: "Custody rewrite" },
      ],
      narrative: "Faster funding. Same Syra wallet. Same x402 spend path.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Buy USDC lives on /wallet.",
      stats: [{ value: "Card", label: "Next to Deposit" }],
      narrative:
        "One treasury. Two ways to fund: card via Crossmint, or send USDC yourself.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Funding before vs now.",
      compareLeft: {
        title: "Before",
        body: "Exchange, buy USDC, copy address, wait, then first paid call.",
      },
      compareRight: {
        title: "Now",
        body: "Buy USDC with card into the agent wallet, or keep manual Deposit.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Partnership",
      badge: "Crossmint · Onramp",
      partnerName: "Crossmint",
      partnerLogo: "/images/partners/crossmint.png",
      partnerLogoSolidBg: true,
      headline: "Syra × Crossmint",
      subtitle: "Card to USDC for agent treasuries. Syra keeps x402 merchant APIs.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Clear boundaries",
      headline: "What Crossmint does here.",
      items: [
        "Fiat onramp into your agent address",
        "Not a new Syra login or custody mode",
        "Not card payment per API call",
        "Per-call spend stays x402 USDC",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Human fund · Agent spend",
      headline: "Cards fund. Stablecoins spend.",
      body: "Humans top up with a card when needed. Agents pay Syra APIs with USDC micropayments.",
      highlights: [
        "Card checkout for humans",
        "USDC treasury for agents",
        "x402 for every paid call",
        "Deposit path stays open",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Happy path.",
      terminalLines: [
        "$ open syraa.fun/wallet",
        "> Buy USDC with card",
        "> checkout · KYC if needed",
        "> refresh USDC balance",
        "$ call paid Spend tool",
        "< HTTP/200 · intelligence payload",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Fund with a card. Call an API.",
      subtitle: "Top up once. Pay per call after that.",
      links: [
        { label: "Wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
        {
          label: "Docs",
          value: "Crossmint → Syra",
          href: "https://docs.syraa.fun/docs/build/crossmint-x402",
        },
      ],
    }),
  },
]);
