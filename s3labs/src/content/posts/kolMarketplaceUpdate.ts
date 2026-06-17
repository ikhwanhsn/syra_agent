import { Coins, TrendingUp, Users, Wallet, Zap } from "lucide-react";
import type { PostUpdate } from "./types";

/** KOL Marketplace launch — on-chain SOL rewards for X amplification. */
export const KOL_MARKETPLACE_POST: PostUpdate = {
  meta: {
    updateNumber: 2,
    id: "kol-marketplace",
    title: "KOL Marketplace",
    published: "June 2026",
    tagline: "Fund X posts. KOLs earn by engagement. Payouts on Solana.",
    shareCopyVideo: `KOL MARKETPLACE · Now live on S3 Labs.

Projects fund SOL rewards for posts they want amplified. KOLs submit reply or quote tweets and earn pro-rata by engagement — tracked daily, paid automatically at snapshot.

→ Projects: connect wallet, post X URL, fund rewards
→ KOLs: reply or quote, climb the leaderboard
→ Pro-rata distribution by engagement score
→ Automatic SOL payout on Solana at campaign end

Launch a campaign or start earning.

s3labs.io/kol ↓`,
    shareCopyPhoto: `KOL MARKETPLACE · Live on S3 Labs.

Projects fund SOL for X amplification. KOLs earn pro-rata by engagement on reply and quote posts. Daily tracking. Automatic on-chain payout.

s3labs.io/kol`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-spotlight",
      label: "Cover",
      eyebrow: "Product launch",
      title: "KOL Marketplace",
      subtitle:
        "Projects fund SOL rewards for posts they want amplified. KOLs earn pro-rata by engagement — tracked daily, paid on Solana at snapshot.",
      badge: "Solana · On-Chain Rewards",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-centered",
      label: "Problem",
      kicker: "Why this exists",
      headline: "Distribution shouldn't be a black box.",
      body: "Projects need real amplification on X. KOLs need transparent, performance-based rewards. S3 Labs KOL Marketplace connects both with on-chain SOL, verified tweets, and engagement-weighted payouts.",
    },
    {
      id: "mandate",
      kind: "hero",
      layout: "hero-checklist",
      label: "How it works",
      kicker: "Two sides, one pool",
      headline: "Fund posts. Earn by impact.",
      body: "Projects deposit SOL to fund a campaign. KOLs submit reply or quote tweets tied to the source post. Rewards split pro-rata by engagement score at snapshot.",
      highlights: [
        "Projects connect a Solana wallet and fund the KOL reward pool",
        "KOLs submit verified reply or quote tweet URLs",
        "Engagement scored daily: likes, retweets, replies, quotes, views",
        "Automatic SOL payout to KOL wallets when the campaign ends",
      ],
    },
    {
      id: "process",
      kind: "flow",
      layout: "flow-timeline",
      label: "Flow",
      kicker: "Campaign lifecycle",
      headline: "From launch to payout",
      steps: [
        {
          step: "01",
          title: "Project launches",
          description: "Post the X URL to amplify, set KOL reward in SOL, and fund on-chain.",
        },
        {
          step: "02",
          title: "KOLs participate",
          description: "Submit a reply or quote tweet. Only verified posts tied to the campaign count.",
        },
        {
          step: "03",
          title: "Daily scoring",
          description: "Engagement metrics refresh every day. Leaderboard updates in real time.",
        },
        {
          step: "04",
          title: "Snapshot payout",
          description: "At campaign end, rewards distribute pro-rata and pay out automatically on Solana.",
        },
      ],
    },
    {
      id: "sleeves",
      kind: "cards",
      layout: "cards-bento",
      label: "Features",
      kicker: "Built for both sides",
      headline: "What you get",
      cards: [
        {
          title: "For projects",
          subtitle: "Launch campaigns",
          detail: "Connect wallet, paste source post URL, fund SOL rewards, and track KOL performance.",
          accent: "gold",
        },
        {
          title: "For KOLs",
          subtitle: "Earn by engagement",
          detail: "Submit reply or quote tweets. Climb the leaderboard. Get paid automatically.",
          accent: "gold",
        },
        {
          title: "Pro-rata pool",
          subtitle: "Fair distribution",
          detail: "Your share scales with engagement score relative to other verified submissions.",
        },
        {
          title: "On-chain SOL",
          subtitle: "Transparent payouts",
          detail: "Rewards funded and distributed on Solana with verifiable transactions.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-tiles",
      label: "Product",
      kicker: "Live now",
      headline: "KOL Marketplace surfaces",
      items: [
        {
          icon: Wallet,
          title: "For Projects",
          description: "Create campaigns, fund SOL rewards, and monitor submissions from one tab.",
          href: "https://s3labs.io/kol",
        },
        {
          icon: Users,
          title: "For KOLs",
          description: "Browse active campaigns, submit tweets, and track projected earnings.",
          href: "https://s3labs.io/kol",
        },
        {
          icon: TrendingUp,
          title: "Leaderboard",
          description: "Live engagement rankings and pro-rata payout projections per campaign.",
          href: "https://s3labs.io/kol",
        },
        {
          icon: Zap,
          title: "Daily refresh",
          description: "Metrics update automatically so scores reflect real performance.",
          href: "https://s3labs.io/kol",
        },
        {
          icon: Coins,
          title: "My Earnings",
          description: "Wallet-linked dashboard for projected and paid SOL rewards.",
          href: "https://s3labs.io/kol",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-featured-stat",
      label: "Model",
      kicker: "Engagement-weighted",
      headline: "Performance drives payout",
      stats: [
        { value: "Pro-rata", label: "Reward split by engagement score" },
        { value: "Daily", label: "Metric refresh on all submissions" },
        { value: "Auto", label: "SOL payout at campaign snapshot" },
      ],
      narrative:
        "No flat rates. No manual spreadsheets. KOLs earn in proportion to verified engagement at snapshot — likes, retweets, replies, quotes, and views all count.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-minimal",
      label: "Start",
      headline: "Launch a campaign. Start earning.",
      subline: "KOL Marketplace is live on S3 Labs — fund X amplification or submit your best reply and quote posts.",
      links: [
        { label: "KOL Marketplace", value: "s3labs.io/kol", href: "https://s3labs.io/kol" },
        { label: "Website", value: "s3labs.io", href: "https://s3labs.io" },
        { label: "Community", value: "t.me/s3labs", href: "https://t.me/s3labs" },
      ],
    },
  ],
};
