import { BadgeCheck, Coins, Fingerprint, ShieldCheck, Terminal, Wallet } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Earn Tokens. One launch per wallet + owner SAID verify on token detail.
 */
export const EARN_TOKEN_SAID_VERIFY_POST = defineVideoUpdate(
  {
    updateNumber: 27,
    id: "earn-token-said-verify",
    title: "Earn Token SAID Verify",
    published: "July 2026",
    tagline:
      "One token per wallet on Earn. Owner-only Verify on SAID so launches build on-chain reputation.",
    shareCopyVideo: `SHIP LOG · Earn Tokens just got identity.

One launch per connected wallet.
Then Verify on SAID from the token detail page.

→ Earn wallet registers as its own SAID agent
→ On-chain register + verify (~0.012 SOL)
→ Verified badge + saidprotocol.com profile

Same trust stack Syra uses at #1. Now for your token.

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Earn Tokens × SAID Protocol.

One token per wallet. Owner Verify on SAID.
Build rank the same way Syra did.

Try it → syraa.fun/earn`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Earn × SAID",
      subtitle:
        "One token per wallet. Owner Verify on SAID. Reputation that sticks on Solana.",
      badge: "Tokens · Identity · Verified",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Launches need trust, not just a mint.",
      body: "Anyone can spam pump.fun. Earn now caps one token per wallet, then lets owners register that token's earn wallet on SAID Protocol. Same on-chain verify path that put Syra at the top of the leaderboard.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What we built",
      headline: "Limit + verify, wired end to end",
      body: "Backend rejects a second launch per earn wallet. Token detail adds owner-only Verify on SAID. Earn keypair signs register + verify via said-sdk.",
      highlights: [
        "One token per earnAnonymousId (409 on repeat)",
        "POST /earn/token/:mint/verify-said",
        "Verified badge → saidprotocol.com profile",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How it works",
      headline: "Launch once. Verify when ready.",
      steps: [
        {
          step: "01",
          title: "Launch on Earn",
          description: "Create your pump.fun token from the Earn wallet. One per connected wallet.",
        },
        {
          step: "02",
          title: "Open token detail",
          description: "Owner sees Claim fees and Verify on SAID next to trade links.",
        },
        {
          step: "03",
          title: "Register + verify",
          description: "Earn wallet pays ~0.012 SOL. SAID PDA + verified badge on-chain.",
        },
        {
          step: "04",
          title: "Build reputation",
          description: "Profile lands on saidprotocol.com. Same identity rails Syra uses.",
        },
      ],
    },
    {
      id: "stack",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Stack",
      kicker: "Under the hood",
      headline: "Identity for every Earn launch",
      cards: [
        {
          title: "One token",
          subtitle: "Per wallet",
          detail: "earnAnonymousId guard. Frontend shows View your token when capped.",
          accent: "gold",
        },
        {
          title: "said-sdk",
          subtitle: "On-chain",
          detail: "registerAgent + verifyAgent signed by the earn custodial keypair.",
          accent: "gold",
        },
        {
          title: "AgentCard",
          subtitle: "Token metadata",
          detail: "Name, symbol, mint, image pinned for SAID directory sync.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where you'll see it",
      headline: "Live on Earn Tokens",
      items: [
        {
          icon: Coins,
          title: "Tokens tab",
          description: "Launch once. After that, View your token instead of another mint.",
          href: "https://www.syraa.fun/earn",
        },
        {
          icon: ShieldCheck,
          title: "Verify on SAID",
          description: "Owner-only button on token detail. Pays from the Earn wallet.",
        },
        {
          icon: BadgeCheck,
          title: "Verified badge",
          description: "After success, badge links to the token earn wallet on SAID.",
        },
        {
          icon: Wallet,
          title: "Earn wallet",
          description: "Same custodial signer that funds pump.fun create + initial buy.",
        },
        {
          icon: Terminal,
          title: "API route",
          description: "POST /earn/token/:mint/verify-said. Session + owner checks.",
        },
        {
          icon: Fingerprint,
          title: "Syra rank path",
          description: "Same SAID stack Syra used to hit #1. Now available per token.",
          href: "https://www.saidprotocol.com/",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "For creators",
      headline: "Scarcer launches. Verifiable trust.",
      stats: [
        { value: "1", label: "Token / wallet" },
        { value: "~0.012", label: "SOL to verify" },
        { value: "#1", label: "Syra SAID rank*" },
      ],
      narrative:
        "*Syra already leads SAID reputation. Earn tokens now reuse that register + verify path so creators can climb the same ladder from day one.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Launch once. Verify on SAID.",
      subline: "Open Earn Tokens, ship your mint, then verify from the detail page.",
      links: [
        { label: "Earn Tokens", value: "syraa.fun/earn", href: "https://www.syraa.fun/earn" },
        { label: "SAID Protocol", value: "saidprotocol.com", href: "https://www.saidprotocol.com/" },
        {
          label: "Syra on SAID",
          value: "saidprotocol.com/agents",
          href: "https://www.saidprotocol.com/agents/53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
        },
      ],
    },
  ],
);
