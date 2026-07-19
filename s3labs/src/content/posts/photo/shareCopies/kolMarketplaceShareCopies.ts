import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for KOL Marketplace launch — 15 distinct voices. */
export const KOL_MARKETPLACE_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `KOL Marketplace is live on S3 Labs.

Projects fund SOL rewards for posts they want amplified. KOLs earn pro-rata by engagement on reply and quote tweets.

s3labs.xyz/kol`,

  thesis: `Distribution shouldn't be a black box.

Projects need real X amplification. KOLs need transparent, performance-based rewards.

S3 Labs KOL Marketplace — on-chain SOL, verified tweets, engagement-weighted payouts.`,

  quote: `"Fund posts. Earn by impact."

Verify your X. Reply or quote the campaign post. Submit your link. Climb the leaderboard. Get paid on Solana.`,

  flow: `KOL Marketplace — four steps:

1. Project launches campaign and funds SOL rewards
2. KOLs verify X, then submit one reply or quote link
3. Engagement scored about every 6 hours on the leaderboard
4. Pro-rata SOL payout when the campaign ends`,

  timeline: `Campaign lifecycle:

• Project posts X URL and funds KOL reward pool
• KOLs verify X and submit reply or quote tweet URLs (1 per campaign)
• Metrics refresh about every 6 hours — likes, RTs, replies, quotes, views
• Automatic SOL payout when the campaign ends`,

  pillars: `For projects — launch campaigns, fund SOL, track KOLs
For KOLs — verify X, submit one post, earn by engagement
Pro-rata pool — fair share by score at snapshot
On-chain SOL — transparent funding and payouts`,

  checklist: `What's live today:
— KOL Marketplace at s3labs.xyz/kol
— Project campaign creation with Solana wallet
— Verified X required to submit reply/quote links
— Engagement scoring every ~6h and live leaderboard
— Automatic SOL payout at campaign end`,

  metrics: `Pro-rata reward split
~6h metric refresh
Automatic SOL payout

Performance drives payout — not flat rates.`,

  featured: `Engagement-weighted rewards.

KOLs earn in proportion to verified engagement at snapshot. Likes, retweets, replies, quotes, and views all count.

s3labs.xyz/kol`,

  comparison: `Typical KOL deals:
DMs, spreadsheets, opaque rates, manual payouts.

KOL Marketplace:
Verified X, manual post submit, live leaderboard, pro-rata SOL, automatic on-chain payout.`,

  launch: `LIVE — S3 Labs KOL Marketplace.

Projects fund SOL for X amplification. Verified KOLs submit reply/quote links and earn by engagement.

→ s3labs.xyz/kol`,

  deepDive: `Who it's for:
— Projects that need real X distribution
— KOLs who want performance-based SOL rewards
— Teams tired of manual campaign tracking
— Anyone who wants on-chain transparency`,

  split: `Projects vs KOLs:

Projects fund the reward pool and pick the source post.
KOLs verify X, submit one reply or quote link, and compete on engagement.

One marketplace. On-chain SOL.`,

  terminal: `$ kol campaign create --post <x-url> --reward 1.5SOL
> pool funded · campaign active
$ kol verify --x <handle> --wallet <solana>
> x verified
$ kol submit --tweet <quote-url> --wallet <solana>
> submission saved · score updates every 6h
$ kol snapshot --campaign active
> pro-rata payout sent on Solana`,

  cta: `KOL Marketplace is live.

Launch a campaign or verify X and start earning on reply and quote posts.

s3labs.xyz/kol`,
};

export const KOL_MARKETPLACE_PHOTO_SHARE_FOOTERS: Partial<Record<PostPhotoCardRole, string>> = {
  thesis: "s3labs.xyz/kol",
  quote: "Fund posts · Earn by impact",
  pillars: "Projects · KOLs · On-chain SOL",
  checklist: "KOL Marketplace · Live",
  metrics: "Pro-rata · Daily · Auto payout",
  featured: "S3 Labs · KOL Marketplace",
  comparison: "Transparent > opaque",
  deepDive: "Reply & quote tweets",
  split: "SOL rewards on Solana",
  terminal: "s3labs.xyz/kol",
};
