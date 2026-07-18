import { S3LABS_POINTS_POST } from "../s3labsPointsUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import {
  S3LABS_POINTS_PHOTO_SHARE_COPIES,
  S3LABS_POINTS_PHOTO_SHARE_FOOTERS,
} from "./shareCopies/s3labsPointsShareCopies";

const copies = S3LABS_POINTS_PHOTO_SHARE_COPIES;
const footers = S3LABS_POINTS_PHOTO_SHARE_FOOTERS;

/** S3Labs Points launch — 15 photo cards for wallet-keyed participation rewards. */
export const S3LABS_POINTS_PHOTO = definePhotoUpdate(S3LABS_POINTS_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-aurora",
    shareCopy: copies.cover,
    content: photoContent({
      badge: "KOL Marketplace · Wallet Profile",
      title: "S3Labs Points",
      subtitle:
        "Earn points every campaign. +1 participation plus up to +3 early-bird points split by submission order.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-beam",
    shareCopy: copies.thesis,
    shareCopyFooter: footers.thesis,
    content: photoContent({
      headline: "Participation should compound.",
      body: "SOL rewards pay by engagement at snapshot. S3Labs Points add a persistent wallet score for showing up early and often.",
      kicker: "Beyond SOL rewards",
    }),
  },
  {
    role: "quote",
    layout: "photo-statement-serif",
    shareCopy: copies.quote,
    shareCopyFooter: footers.quote,
    content: photoContent({
      quote: "Join early. Score higher.",
      narrative: "Earlier submissions earn a larger share of the 3-point early-bird pool on every campaign.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-ledger",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How you earn",
      headline: "Four steps to points.",
      steps: [
        { step: "01", title: "Connect", description: "Link your Solana wallet on S3 Labs." },
        { step: "02", title: "Submit", description: "Reply or quote a live KOL campaign post." },
        { step: "03", title: "Finalize", description: "Points credit when the campaign ends." },
        { step: "04", title: "Profile", description: "Track totals at s3labs.xyz/profile." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-statement-lattice",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Per campaign",
      headline: "Two point streams.",
      steps: [
        { step: "01", title: "Participation", description: "+1 point for every verified participant." },
        { step: "02", title: "Early bird", description: "+3 points split by submission order." },
        { step: "03", title: "Linear split", description: "Earliest submitter gets the largest share." },
        { step: "04", title: "Aggregate", description: "Wallet profile tracks cross-campaign totals." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-glass-quad",
    shareCopy: copies.pillars,
    shareCopyFooter: footers.pillars,
    content: photoContent({
      kicker: "Point model",
      headline: "Up to ~4 per campaign.",
      cards: [
        { title: "Participation", subtitle: "+1 pt", detail: "Every participant at campaign end.", accent: "gold" },
        { title: "Early bird", subtitle: "3 pt pool", detail: "Split linearly by submit order.", accent: "gold" },
        { title: "Example", subtitle: "3 KOLs", detail: "Totals: 2.5 / 2.0 / 1.5 points each." },
        { title: "Profile", subtitle: "Wallet", detail: "Persistent score on s3labs.xyz/profile." },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-numbered",
    shareCopy: copies.checklist,
    shareCopyFooter: footers.checklist,
    content: photoContent({
      kicker: "Live now",
      headline: "S3Labs Points shipped.",
      highlights: [
        "Automatic credit at campaign finalization",
        "+1 participation + up to +3 early-bird per campaign",
        "Wallet profile with full points history",
        "Navbar badge when wallet connected",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-facet",
    shareCopy: copies.metrics,
    shareCopyFooter: footers.metrics,
    content: photoContent({
      kicker: "Point streams",
      headline: "Simple math.",
      stats: [
        { value: "+1", label: "Participation per campaign" },
        { value: "+3", label: "Early-bird pool per campaign" },
        { value: "Auto", label: "Credited at campaign end" },
      ],
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-gradient-bar",
    shareCopy: copies.featured,
    shareCopyFooter: footers.featured,
    content: photoContent({
      kicker: "Linear split",
      headline: "Earlier = more points.",
      stats: [{ value: "N…1", label: "Rank weights for early-bird pool" }],
      narrative: "First submitter always captures the largest early-bird share. Points are wallet-keyed and idempotent.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-compare-gradient",
    shareCopy: copies.comparison,
    shareCopyFooter: footers.comparison,
    content: photoContent({
      kicker: "SOL vs Points",
      headline: "Two reward layers.",
      compareLeft: {
        title: "SOL rewards",
        body: "Pro-rata by engagement score at snapshot — paid in SOL to your wallet.",
      },
      compareRight: {
        title: "S3Labs Points",
        body: "Persistent wallet score — participation + early-bird bonus every campaign.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-cover-whisper",
    shareCopy: copies.launch,
    content: photoContent({
      badge: "Now live · Points",
      headline: "S3Labs Points",
      body: "Earn for every campaign. Early submitters get more of the bonus pool.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-statement-inverted",
    shareCopy: copies.deepDive,
    shareCopyFooter: footers.deepDive,
    content: photoContent({
      kicker: "Who earns",
      headline: "Every participant scores.",
      steps: [
        { step: "01", title: "KOLs", description: "Verify X and submit reply/quote links to live campaigns." },
        { step: "02", title: "Wallets", description: "Points keyed to your connected Solana address." },
        { step: "03", title: "Early birds", description: "Rank higher by submitting sooner." },
        { step: "04", title: "Profile", description: "Full history at s3labs.xyz/profile." },
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-cards-stack",
    shareCopy: copies.split,
    shareCopyFooter: footers.split,
    content: photoContent({
      badge: "Two streams",
      headline: "Participation + early bird.",
      highlights: [
        "+1 point — every participant at campaign end",
        "+3 points — early-bird pool split by rank",
        "Profile — wallet aggregate across all campaigns",
      ],
      body: "Join KOL campaigns. Submit early. Climb your score.",
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    shareCopyFooter: footers.terminal,
    content: photoContent({
      headline: "Points pipeline.",
      terminalLines: [
        "$ kol verify --x <handle>",
        "$ kol submit --campaign active --tweet <url>",
        "> verified · rank #1 recorded",
        "$ kol finalize --campaign ended",
        "> +1 participation · +1.5 early-bird",
        "$ points profile --wallet <solana>",
        "> total: 2.5 pts · s3labs.xyz/profile",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-cta",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Connect. Compete. Climb.",
      subtitle: "S3Labs Points are live on S3 Labs.",
      links: [
        { label: "Your profile", value: "s3labs.xyz/profile", href: "https://s3labs.xyz/profile" },
        { label: "KOL Marketplace", value: "s3labs.xyz/kol", href: "https://s3labs.xyz/kol" },
        { label: "Community", value: "t.me/s3labs", href: "https://t.me/s3labs" },
      ],
    }),
  },
]);
