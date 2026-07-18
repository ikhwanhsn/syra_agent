import { EARN_TOKEN_SAID_VERIFY_POST } from "../earnTokenSaidVerifyUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { EARN_TOKEN_SAID_VERIFY_PHOTO_SHARE_COPIES } from "./shareCopies/earnTokenSaidVerifyShareCopies";

const copies = EARN_TOKEN_SAID_VERIFY_PHOTO_SHARE_COPIES;

/** Photo-format content for Earn Token SAID Verify ship log. 15 cards, 15 X posts. */
export const EARN_TOKEN_SAID_VERIFY_PHOTO = definePhotoUpdate(EARN_TOKEN_SAID_VERIFY_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-spotlight",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Tokens · Identity · Verified",
      title: "Earn × SAID",
      subtitle:
        "One token per wallet. Owner Verify on SAID. Reputation that sticks on Solana.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-large",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The rule",
      headline: "Launches need trust, not just a mint.",
      body: "Earn caps one token per wallet, then lets owners register that earn wallet on SAID Protocol.",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Launch once. Verify when ready.",
      narrative: "Owner-only Verify on SAID. Same rails Syra used to hit #1.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "Identity loop",
      headline: "Launch. Open. Verify. Rank.",
      steps: [
        { step: "01", title: "Launch", description: "One mint per Earn wallet." },
        { step: "02", title: "Detail", description: "Owner sees Verify on SAID." },
        { step: "03", title: "Verify", description: "~0.012 SOL on-chain." },
        { step: "04", title: "Profile", description: "Badge on saidprotocol.com." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "What shipped",
      headline: "From open launches to verified identity.",
      steps: [
        { step: "01", title: "Limit", description: "409 on second launch." },
        { step: "02", title: "UI", description: "View your token when capped." },
        { step: "03", title: "Route", description: "POST …/verify-said." },
        { step: "04", title: "Badge", description: "SAID profile after verify." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-quad",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Four layers. One Earn identity stack.",
      cards: [
        { title: "Limit", subtitle: "1×", detail: "One mint per wallet.", accent: "gold" },
        { title: "Sign", subtitle: "Earn", detail: "Custodial keypair.", accent: "gold" },
        { title: "SAID", subtitle: "On-chain", detail: "Register + verify." },
        { title: "Badge", subtitle: "Live", detail: "Profile + trust." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-compact",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "Earn × SAID checklist. Live now.",
      highlights: [
        "One token per connected wallet",
        "Owner Verify on SAID on detail",
        "~0.012 SOL from Earn wallet",
        "Verified badge after success",
        "Profile on saidprotocol.com",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-trio",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Scarcer launches. Verifiable trust.",
      stats: [
        { value: "1", label: "Token / wallet" },
        { value: "~0.012", label: "SOL verify" },
        { value: "#1", label: "Syra SAID*" },
      ],
      narrative: "*Syra already leads SAID. Tokens reuse that path.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-featured",
    shareCopy: copies.featured,
    content: photoContent({
      headline: "The protocol behind the badge.",
      stats: [{ value: "SAID", label: "Identity" }],
      narrative: "On-chain agent identity + verified badge. Wired to Earn token owners.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Open launches vs verified Earn.",
      compareLeft: {
        title: "Before",
        body: "Unlimited Earn launches. No token-level SAID identity.",
      },
      compareRight: {
        title: "Now",
        body: "One mint per wallet. Owner Verify on SAID from detail.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-partnership-union",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Earn × SAID",
      partnerName: "SAID Protocol",
      partnerLogo: "/images/partners/said-protocol.png",
      partnerLogoSolidBg: true,
      headline: "Syra × SAID",
      subtitle:
        "One launch. One identity. Syra's #1 path, applied to your Earn token.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-numbered-list",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Technical surface",
      headline: "Wired into Earn + SAID clients.",
      items: [
        "earnPumpfunService: limit + verify",
        "saidClient: token AgentCard flow",
        "POST /earn/token/:mint/verify-said",
        "Launch doc stores saidVerified + PDA",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-split",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Two moves",
      headline: "Scarcer mints. Verifiable agents.",
      body: "Creators get one serious launch. Trust comes from owner Verify on SAID when ready.",
      highlights: [
        "API 409 on repeat launch",
        "Earn keypair signs SAID txs",
        "~0.012 SOL verify fee",
        "Badge links SAID profile",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "Verify in the stack.",
      terminalLines: [
        "$ POST /earn/token/:mint/verify-said",
        "> resolve earn · owner check",
        "> getSolanaAgentKeypair(earn)",
        "> said-sdk register + verify",
        "> persist saidVerified",
        "< badge → saidprotocol.com",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Launch once. Verify on SAID.",
      subtitle: "Open Earn Tokens, ship your mint, then verify from detail.",
      links: [
        { label: "Earn", value: "syraa.fun/earn", href: "https://www.syraa.fun/earn" },
        { label: "SAID", value: "saidprotocol.com", href: "https://www.saidprotocol.com/" },
        {
          label: "Syra",
          value: "SAID profile",
          href: "https://www.saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
        },
      ],
    }),
  },
]);
