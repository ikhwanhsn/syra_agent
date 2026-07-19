import { KOL_MARKETPLACE_POST } from "../kolMarketplaceUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import {
  KOL_MARKETPLACE_PHOTO_SHARE_COPIES,
  KOL_MARKETPLACE_PHOTO_SHARE_FOOTERS,
} from "./shareCopies/kolMarketplaceShareCopies";

const copies = KOL_MARKETPLACE_PHOTO_SHARE_COPIES;
const footers = KOL_MARKETPLACE_PHOTO_SHARE_FOOTERS;

/** KOL Marketplace launch — 15 photo cards with layouts distinct from growth brief deck. */
export const KOL_MARKETPLACE_PHOTO = definePhotoUpdate(KOL_MARKETPLACE_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-gradient",
    shareCopy: copies.cover,
    content: photoContent({
      badge: "Solana · On-Chain Rewards",
      title: "KOL Marketplace",
      subtitle:
        "Projects fund SOL for X amplification. KOLs earn pro-rata by engagement on reply and quote posts.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-underline",
    shareCopy: copies.thesis,
    shareCopyFooter: footers.thesis,
    content: photoContent({
      headline: "Distribution shouldn't be a black box.",
      body: "Projects need real amplification. KOLs need transparent, performance-based rewards. On-chain SOL, verified tweets, engagement-weighted payouts.",
      kicker: "Why this exists",
    }),
  },
  {
    role: "quote",
    layout: "photo-quote",
    shareCopy: copies.quote,
    shareCopyFooter: footers.quote,
    content: photoContent({
      quote: "Fund posts. Earn by impact.",
      narrative: "Verify X. Reply or quote. Submit your link. Climb the leaderboard. Get paid on Solana.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-arrow-chain",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How it works",
      headline: "From launch to payout.",
      steps: [
        { step: "01", title: "Launch", description: "Project funds SOL reward pool for a source post." },
        { step: "02", title: "Submit", description: "Verified KOLs paste one reply or quote link." },
        { step: "03", title: "Score", description: "Engagement refreshes about every 6 hours." },
        { step: "04", title: "Payout", description: "Pro-rata SOL sent automatically when it ends." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-flow-pipeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Campaign lifecycle",
      headline: "Four phases.",
      steps: [
        { step: "01", title: "Fund pool", description: "Connect wallet and deposit SOL rewards." },
        { step: "02", title: "KOL submissions", description: "Verify X, then submit one reply/quote URL." },
        { step: "03", title: "6h refresh", description: "Likes, RTs, replies, quotes, views scored." },
        { step: "04", title: "Payout", description: "Automatic on-chain payout to KOL wallets." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-bento",
    shareCopy: copies.pillars,
    shareCopyFooter: footers.pillars,
    content: photoContent({
      kicker: "Built for both sides",
      headline: "Marketplace stack.",
      cards: [
        { title: "Projects", subtitle: "Launch", detail: "Fund SOL rewards and track KOL performance.", accent: "gold" },
        { title: "KOLs", subtitle: "Earn", detail: "Verify X, submit one post, compete on engagement.", accent: "gold" },
        { title: "Pro-rata", subtitle: "Fair split", detail: "Share scales with score at snapshot." },
        { title: "On-chain", subtitle: "SOL", detail: "Transparent funding and payouts on Solana." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-masonry",
    shareCopy: copies.checklist,
    shareCopyFooter: footers.checklist,
    content: photoContent({
      kicker: "Now live",
      headline: "KOL Marketplace is live.",
      highlights: [
        "Campaign creation with Solana wallet",
        "Verified X required to submit posts",
        "Engagement scoring every ~6 hours",
        "Live leaderboard and earnings dashboard",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-counter-row",
    shareCopy: copies.metrics,
    shareCopyFooter: footers.metrics,
    content: photoContent({
      kicker: "Reward model",
      headline: "Performance drives payout.",
      stats: [
        { value: "Pro-rata", label: "Engagement-weighted split" },
        { value: "~6h", label: "Metric refresh" },
        { value: "Auto", label: "SOL at campaign end" },
      ],
      narrative: "No flat rates. No manual spreadsheets.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-narrative-first",
    shareCopy: copies.featured,
    shareCopyFooter: footers.featured,
    content: photoContent({
      kicker: "Engagement score",
      headline: "Every interaction counts.",
      stats: [{ value: "Pro-rata", label: "Rewards by verified engagement at snapshot" }],
      narrative: "Likes, retweets, replies, quotes, and views — all weighted into your payout share.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-editorial",
    shareCopy: copies.comparison,
    shareCopyFooter: footers.comparison,
    content: photoContent({
      kicker: "Old way vs S3",
      headline: "Opaque deals vs on-chain marketplace.",
      compareLeft: {
        title: "Typical KOL deals",
        body: "DMs, spreadsheets, flat rates, and manual payouts with no verification.",
      },
      compareRight: {
        title: "KOL Marketplace",
        body: "Verified tweets, live leaderboard, pro-rata SOL, automatic payout at snapshot.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-cover-type-hero",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live · Solana · KOL",
      headline: "KOL Marketplace",
      body: "Fund X amplification or earn by engagement on reply and quote posts.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-items-grid",
    shareCopy: copies.deepDive,
    shareCopyFooter: footers.deepDive,
    content: photoContent({
      kicker: "Who it's for",
      headline: "Two sides, one pool.",
      steps: [
        { step: "01", title: "Projects", description: "Need real X distribution with measurable ROI." },
        { step: "02", title: "KOLs", description: "Want performance-based SOL, not opaque flat fees." },
        { step: "03", title: "Builders", description: "Launching on Solana and need amplification fast." },
        { step: "04", title: "Communities", description: "Want transparent, on-chain reward mechanics." },
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-quote",
    shareCopy: copies.split,
    shareCopyFooter: footers.split,
    content: photoContent({
      badge: "Two modes",
      headline: "Projects fund. KOLs earn.",
      highlights: [
        "Projects: source post + SOL reward pool",
        "KOLs: verify X, submit one reply/quote link",
        "Leaderboard: live engagement rankings",
      ],
      body: "One marketplace. On-chain SOL. Automatic payout.",
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    shareCopyFooter: footers.terminal,
    content: photoContent({
      headline: "Campaign pipeline.",
      terminalLines: [
        "$ kol create --post <x-url> --reward 1.5SOL",
        "> pool funded · campaign active",
        "$ kol verify --x <handle>",
        "$ kol submit --tweet <quote-url>",
        "> submission saved · score updates every 6h",
        "$ kol snapshot",
        "> pro-rata payout sent on Solana",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Launch a campaign. Verify X. Start earning.",
      subtitle: "KOL Marketplace is live on S3 Labs.",
      links: [
        { label: "KOL Marketplace", value: "s3labs.xyz/kol", href: "https://s3labs.xyz/kol" },
        { label: "Website", value: "s3labs.xyz", href: "https://s3labs.xyz" },
        { label: "Community", value: "t.me/s3labs", href: "https://t.me/s3labs" },
      ],
    }),
  },
]);
