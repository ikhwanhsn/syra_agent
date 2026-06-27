import { Award, Clock, Star, Trophy, User, Wallet } from "lucide-react";
import type { PostUpdate } from "./types";

/** S3Labs Points — global participation rewards for KOL campaign participants. */
export const S3LABS_POINTS_POST: PostUpdate = {
  meta: {
    updateNumber: 3,
    id: "s3labs-points",
    title: "S3Labs Points",
    published: "June 2026",
    tagline: "Earn points for every campaign. Early submitters get more.",
    shareCopyVideo: `S3LABS POINTS · Now live on S3 Labs.

Every KOL campaign participant earns points when a campaign ends:
→ +1 participation point per campaign
→ Up to +3 early-bird points split by submit order
→ Earlier submissions earn a larger share of the bonus pool

Connect your wallet. Join campaigns. Track points on your profile.

s3labs.io/profile ↓`,
    shareCopyPhoto: `S3LABS POINTS · Live on S3 Labs.

+1 point for every campaign you join. Up to +3 early-bird points split by submission order — earlier = more.

Track your score at s3labs.io/profile`,
  },
  slides: [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-gradient-ring",
      label: "Cover",
      eyebrow: "Product update",
      title: "S3Labs Points",
      subtitle:
        "A global rewards layer for KOL Marketplace participants. Earn points every campaign — early submitters get a bigger share of the bonus pool.",
      badge: "KOL Marketplace · Wallet Profile",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-inverted-panel",
      label: "Why",
      kicker: "Beyond SOL rewards",
      headline: "Participation should compound.",
      body: "KOL Marketplace pays SOL by engagement at snapshot. S3Labs Points add a persistent score for showing up early and often — visible on your wallet profile across every campaign.",
    },
    {
      id: "mandate",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Model",
      kicker: "Two point streams",
      headline: "Participation + early bird.",
      body: "When a campaign ends, every verified participant earns points automatically. No extra steps — wallet-linked, idempotent, and tracked on-chain activity you already do.",
      highlights: [
        "+1 participation point for every campaign you join",
        "Up to +3 early-bird points split by submission order",
        "Earlier submissions earn a larger share of the bonus pool",
        "Points aggregate on your wallet profile at s3labs.io/profile",
      ],
    },
    {
      id: "process",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How you earn",
      headline: "Join early. Score higher.",
      steps: [
        {
          step: "01",
          title: "Connect wallet",
          description: "Link your Solana wallet on S3 Labs — points are keyed to your address.",
        },
        {
          step: "02",
          title: "Submit to a campaign",
          description: "Reply or quote the source post. Your submission timestamp sets your rank.",
        },
        {
          step: "03",
          title: "Campaign ends",
          description: "Points award automatically alongside SOL payouts at finalization.",
        },
        {
          step: "04",
          title: "Profile updates",
          description: "View total points, breakdown, and per-campaign history on your profile.",
        },
      ],
    },
    {
      id: "sleeves",
      kind: "cards",
      layout: "cards-glass-row",
      label: "Breakdown",
      kicker: "Per campaign",
      headline: "Up to 4 points each.",
      cards: [
        {
          title: "Participation",
          subtitle: "+1 point",
          detail: "Every verified participant earns 1 point when the campaign finalizes.",
          accent: "gold",
        },
        {
          title: "Early bird pool",
          subtitle: "3 points total",
          detail: "Split linearly by submission order — first submitter gets the largest share.",
          accent: "gold",
        },
        {
          title: "Example (3 KOLs)",
          subtitle: "2.5 / 2.0 / 1.5",
          detail: "Earliest earns 1 + 1.5 early = 2.5 total. Last earns 1 + 0.5 = 1.5 total.",
        },
        {
          title: "Wallet profile",
          subtitle: "Persistent score",
          detail: "Points accumulate across campaigns. View history and totals on /profile.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Live now",
      headline: "Where to see your points",
      items: [
        {
          icon: User,
          title: "Profile page",
          description: "Full breakdown — participation vs early-bird, campaigns joined, history table.",
          href: "https://s3labs.io/profile",
        },
        {
          icon: Wallet,
          title: "Wallet dropdown",
          description: "Navbar shows your total points badge when connected.",
          href: "https://s3labs.io/profile",
        },
        {
          icon: Trophy,
          title: "KOL Marketplace",
          description: "Join campaigns to start earning — points credit at campaign end.",
          href: "https://s3labs.io/kol",
        },
        {
          icon: Clock,
          title: "Early bird bonus",
          description: "Submit sooner to rank higher and capture more of the 3-point pool.",
          href: "https://s3labs.io/kol",
        },
        {
          icon: Star,
          title: "Leaderboard ready",
          description: "Global points leaderboard API live for future rankings.",
          href: "https://s3labs.io/profile",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-orbit-stats",
      label: "Math",
      kicker: "Linear early-bird split",
      headline: "Earlier = more points.",
      stats: [
        { value: "+1", label: "Participation per campaign" },
        { value: "+3", label: "Early-bird pool per campaign" },
        { value: "Auto", label: "Credited at campaign end" },
      ],
      narrative:
        "With N participants, weights run N, N−1, …, 1. The earliest submitter always gets the largest early-bird share. Points are wallet-keyed and idempotent — safe to finalize once, track forever.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Start",
      headline: "Connect. Compete. Climb.",
      subline: "S3Labs Points are live — join KOL campaigns, submit early, and track your score on your wallet profile.",
      links: [
        { label: "Your profile", value: "s3labs.io/profile", href: "https://s3labs.io/profile" },
        { label: "KOL Marketplace", value: "s3labs.io/kol", href: "https://s3labs.io/kol" },
        { label: "Community", value: "t.me/s3labs", href: "https://t.me/s3labs" },
      ],
    },
  ],
};
