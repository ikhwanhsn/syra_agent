import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for S3Labs Points launch — 15 distinct voices. */
export const S3LABS_POINTS_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `S3Labs Points are live.

Every KOL campaign participant earns points when a campaign ends — +1 participation point plus up to +3 early-bird points split by submission order.

s3labs.xyz/profile`,

  thesis: `Participation should compound.

KOL Marketplace pays SOL by engagement. S3Labs Points add a persistent wallet score for showing up early and often across every campaign.`,

  quote: `"Join early. Score higher."

Earlier submissions earn a larger share of the 3-point early-bird pool. Connect your wallet and track points on your profile.`,

  flow: `S3Labs Points — four steps:

1. Connect your Solana wallet on S3 Labs
2. Submit a reply or quote to a live KOL campaign
3. Campaign ends — points credit automatically
4. View totals and history on s3labs.xyz/profile`,

  timeline: `Point streams per campaign:

• +1 participation point for every verified participant
• +3 early-bird points split by submission order
• Linear weights — earliest submitter gets the largest share
• Wallet-keyed aggregate on your profile`,

  pillars: `Participation — +1 pt per campaign for every participant
Early bird — 3 pts split linearly by submit order
Example — 3 KOLs earn 2.5 / 2.0 / 1.5 total
Profile — persistent score at s3labs.xyz/profile`,

  checklist: `What's live today:
— S3Labs Points on campaign finalization
— +1 participation + up to +3 early-bird per campaign
— Wallet profile at s3labs.xyz/profile
— Navbar points badge when connected
— Per-campaign points history table`,

  metrics: `+1 participation point
+3 early-bird pool
Auto-credited at campaign end

Earlier submissions earn more of the bonus pool.`,

  featured: `Linear early-bird split.

With N participants, weights run N, N−1, …, 1. First submitter always gets the largest early-bird share.

s3labs.xyz/profile`,

  comparison: `SOL rewards only:
Paid at snapshot by engagement score — no persistent cross-campaign score.

S3Labs Points:
+1 every campaign + early-bird bonus for fast submitters. Wallet profile tracks it all.`,

  launch: `LIVE — S3Labs Points on S3 Labs.

Earn points for every KOL campaign you join. Early submitters get more.

→ s3labs.xyz/profile`,

  deepDive: `Who earns points:
— KOLs who submit reply or quote tweets to live campaigns
— Anyone with a connected Solana wallet on S3 Labs
— Participants verified at campaign finalization
— Early submitters who rank higher in the bonus pool`,

  split: `Two streams per campaign:

Participation: +1 point for every participant.
Early bird: +3 points split by submission order.

Up to ~4 points per campaign.`,

  terminal: `$ kol submit --campaign active --tweet <quote-url>
> verified · rank #1 recorded
$ kol finalize --campaign ended
> +1 participation · +1.5 early-bird credited
$ points profile --wallet <solana>
> total: 2.5 pts · view s3labs.xyz/profile`,

  cta: `S3Labs Points are live.

Join KOL campaigns, submit early, track your score.

s3labs.xyz/profile`,
};

export const S3LABS_POINTS_PHOTO_SHARE_FOOTERS: Partial<Record<PostPhotoCardRole, string>> = {
  thesis: "s3labs.xyz/profile",
  quote: "Join early · Score higher",
  pillars: "Participation · Early bird · Profile",
  checklist: "S3Labs Points · Live",
  metrics: "+1 · +3 · Auto",
  featured: "S3 Labs · Points",
  comparison: "Persistent > one-off",
  deepDive: "Wallet-keyed score",
  split: "Up to ~4 pts per campaign",
  terminal: "s3labs.xyz/profile",
};
