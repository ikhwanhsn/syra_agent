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

Reply or quote the campaign post. Climb the leaderboard. Get paid automatically on Solana at snapshot.`,

  flow: `KOL Marketplace — four steps:

1. Project launches campaign and funds SOL rewards
2. KOLs submit verified reply or quote tweets
3. Engagement scored daily on the leaderboard
4. Pro-rata SOL payout at campaign snapshot`,

  timeline: `Campaign lifecycle:

• Project posts X URL and funds KOL reward pool
• KOLs submit reply or quote tweet URLs
• Metrics refresh daily — likes, RTs, replies, quotes, views
• Automatic SOL payout when the campaign ends`,

  pillars: `For projects — launch campaigns, fund SOL, track KOLs
For KOLs — submit tweets, earn by engagement
Pro-rata pool — fair share by score at snapshot
On-chain SOL — transparent funding and payouts`,

  checklist: `What's live today:
— KOL Marketplace at s3labs.xyz/kol
— Project campaign creation with Solana wallet
— KOL reply and quote tweet submissions
— Daily engagement scoring and leaderboard
— Automatic SOL payout at campaign end`,

  metrics: `Pro-rata reward split
Daily metric refresh
Automatic SOL payout

Performance drives payout — not flat rates.`,

  featured: `Engagement-weighted rewards.

KOLs earn in proportion to verified engagement at snapshot. Likes, retweets, replies, quotes, and views all count.

s3labs.xyz/kol`,

  comparison: `Typical KOL deals:
DMs, spreadsheets, opaque rates, manual payouts.

KOL Marketplace:
Verified tweets, live leaderboard, pro-rata SOL, automatic on-chain payout at snapshot.`,

  launch: `LIVE — S3 Labs KOL Marketplace.

Projects fund SOL for X amplification. KOLs earn by engagement on reply and quote posts.

→ s3labs.xyz/kol`,

  deepDive: `Who it's for:
— Projects that need real X distribution
— KOLs who want performance-based SOL rewards
— Teams tired of manual campaign tracking
— Anyone who wants on-chain transparency`,

  split: `Projects vs KOLs:

Projects fund the reward pool and pick the source post.
KOLs submit reply or quote tweets and compete on engagement.

One marketplace. On-chain SOL.`,

  terminal: `$ kol campaign create --post <x-url> --reward 1.5SOL
> pool funded · campaign active
$ kol submit --tweet <quote-url> --wallet <solana>
> verified quote · score tracking started
$ kol snapshot --campaign active
> pro-rata payout sent on Solana`,

  cta: `KOL Marketplace is live.

Launch a campaign or start earning on reply and quote posts.

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
