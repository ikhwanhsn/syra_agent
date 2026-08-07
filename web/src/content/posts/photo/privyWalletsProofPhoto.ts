import { PRIVY_WALLETS_PROOF_POST } from "../privyWalletsProofUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { PRIVY_WALLETS_PROOF_PHOTO_SHARE_COPIES } from "./shareCopies/privyWalletsProofShareCopies";

const copies = PRIVY_WALLETS_PROOF_PHOTO_SHARE_COPIES;

/** Photo-format content for the Privy wallets proof ship log. */
export const PRIVY_WALLETS_PROOF_PHOTO = definePhotoUpdate(PRIVY_WALLETS_PROOF_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Privy · Wallets · Live",
      title: "Agent wallets on Privy",
      subtitle:
        "Syra provisions ready-to-spend agent wallets on Privy. Login once. Fund. Pay per call with x402.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-gold-frame",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Agents need a wallet before they can pay.",
      body: "Paid intelligence is useless without an address. Syra uses Privy so every user gets an agent wallet that can hold USDC and settle x402.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Ready-to-spend wallets beat empty login screens.",
      narrative:
        "Connect once. Get an agent address under Privy. Fund it. Settle paid calls with x402.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "Login → wallet → fund → pay.",
      steps: [
        { step: "01", title: "Connect", description: "Privy login on web or /start on Telegram." },
        { step: "02", title: "Wallet ready", description: "Syra provisions the agent address." },
        { step: "03", title: "Fund", description: "Deposit USDC into the agent treasury." },
        { step: "04", title: "Pay per call", description: "x402 settles Spend from that wallet." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Privy Overview",
      headline: "Growth through early August.",
      steps: [
        { step: "01", title: "Provision", description: "Wallets scaled across Syra surfaces." },
        { step: "02", title: "Assets", description: "Balances ramped from late July." },
        { step: "03", title: "Volume", description: "Tx volume spiked in early August." },
        { step: "04", title: "Stack", description: "Privy custody. x402 settlement." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-stack",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Three pillars of the wallet stack.",
      cards: [
        {
          title: "Custody",
          subtitle: "Privy",
          detail: "Embedded agent wallets. No DIY key dump per surface.",
          accent: "gold",
        },
        {
          title: "Surfaces",
          subtitle: "Multi",
          detail: "Chat, Telegram, and Spend share one address path.",
          accent: "gold",
        },
        {
          title: "Settlement",
          subtitle: "x402",
          detail: "Fund once. Agents micropay USDC per call.",
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
        "Connect on syraa.fun/chat",
        "Open /wallet for your agent address",
        "Fund USDC into the treasury",
        "Run a paid Spend call",
        "Telegram /start for the same walleted agent",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Privy Overview proof.",
      stats: [
        { value: "4,333", label: "Wallets" },
        { value: "150", label: "Users" },
        { value: "$501", label: "Assets" },
      ],
      narrative:
        "Agent wallets scale faster than human logins. Syra provisions wallets for the surfaces that need them.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-monolith",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "Wallets ready to spend.",
      stats: [{ value: "4,333", label: "Syra agent wallets on Privy" }],
      narrative: "Privy Overview, early August 2026. Login provisions. Fund. Settle with x402.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Friction vs a ready agent wallet.",
      compareLeft: {
        title: "Before",
        body: "Separate connect flows and empty addresses before the first paid call.",
      },
      compareRight: {
        title: "Now",
        body: "Login provisions a Syra agent wallet on Privy. Fund once. Spend with x402.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-announcement",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now live",
      badge: "Syra × Privy",
      title: "Agent wallets on Privy",
      subtitle: "4,333 wallets provisioned. Same custody for chat, Telegram, and Spend.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Surfaces",
      headline: "Where agent wallets show up.",
      items: [
        "Chat: connect and paid asks on syraa.fun/chat",
        "Telegram: /start for a walleted bot session",
        "Wallet page: address, balances, funding",
        "Marketplace / Spend: x402 against the same treasury",
        "Privy: custody and wallet dashboard proof",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Custody · Settlement",
      headline: "Privy holds. x402 settles.",
      body: "Privy custody for the agent wallet. Syra settles paid intelligence with x402 USDC. Funding can be manual or card onramp. Neither replaces login or per-call payment.",
      highlights: [
        "Privy: login and custody",
        "Syra: agent wallet surfaces",
        "x402: per-call USDC settle",
        "Fund: deposit or card onramp",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Activation path.",
      terminalLines: [
        "$ connect privy",
        "→ agent wallet ready",
        "$ fund usdc",
        "→ treasury balance updated",
        "$ paid spend call",
        "< HTTP/200 · x402 settled",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Get an agent wallet. Then spend.",
      subtitle: "Connect on chat, fund USDC, and run a paid call. Custody stays Privy. Settlement stays x402.",
      links: [
        { label: "Chat", value: "syraa.fun/chat", href: "https://www.syraa.fun/chat" },
        { label: "Wallet", value: "syraa.fun/wallet", href: "https://www.syraa.fun/wallet" },
        {
          label: "Marketplace",
          value: "syraa.fun/marketplace",
          href: "https://www.syraa.fun/marketplace",
        },
      ],
    }),
  },
]);
