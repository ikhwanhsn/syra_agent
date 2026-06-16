import type { PostPhotoCardRole } from "../photoCardSlots";

/** Per-card X copy for S3 Labs growth brief — 15 distinct voices. */
export const S3_GROWTH_BRIEF_PHOTO_SHARE_COPIES: Record<PostPhotoCardRole, string> = {
  cover: `Results over hype.

S3 Labs — growth partner for Solana developers. Hackathon winners and MVP builders: revenue support, adoption playbooks, founder network.

Apply at s3labs.io`,

  thesis: `Honest question for Solana builders:

How many programs actually help you ship revenue — not just demo day applause?

S3 Labs pairs traction support with distribution. Proof required. Hype optional.`,

  quote: `"Results over hype."

That's the filter. We work with teams that have hackathon wins, live MVPs, or early revenue — then help them scale on Solana.`,

  flow: `How S3 Labs partners — four steps:

1. Apply with proof (hackathon win, MVP, traction)
2. Fit assessment on product-market signal
3. Program match: revenue, Arena, events, or GTM
4. Ship outcomes — measured publicly`,

  timeline: `Growth partner programs:

• Revenue support for builders with working products
• Adoption playbooks and GTM sprints
• Arena listings for qualified projects
• 500+ founder network across Solana`,

  pillars: `Revenue — monetization for products with real users
Distribution — GTM, community, ecosystem positioning
Arena — visibility for qualified Solana projects
Network — 500+ founders and operators

Four pillars. One conviction: results over hype.`,

  checklist: `What's live today:
— Growth partner applications for Solana builders
— S3 Arena with traction data and founder profiles
— Events and hackathon programs
— 500+ founder Telegram community
— $65K+ revenue generated across portfolio`,

  metrics: `$65K+ revenue generated
95% program success rate
500+ founder network

We measure traction, not vanity metrics.`,

  featured: `$65K+. Real revenue. Real builders.

S3 Labs helps Solana developers with hackathon wins or live MVPs generate revenue and scale — with programs matched to proof, not hype.`,

  comparison: `Typical accelerator:
Demo day hype. Vanity metrics. No revenue support.

S3 Labs:
Proof required. Revenue programs. Arena + founder network. Results over hype.`,

  launch: `LIVE — S3 Labs growth partner programs.

For hackathon winners and MVP builders on Solana. Revenue support, adoption playbooks, founder network.

Apply → s3labs.io`,

  deepDive: `Who we help — plain English:
— Hackathon winners with working prototypes
— MVP builders with early traction on Solana
— Teams ready for revenue and distribution support
— Founders who want outcomes, not hype cycles`,

  split: `Builders vs hype:

We don't chase narratives. We match programs to proof — revenue for products with users, Arena for qualified traction, GTM for teams ready to scale.

Results over hype. Always.`,

  terminal: `$ s3 apply --proof hackathon-win --chain solana
> MVP detected · traction signal present
$ s3 match --program revenue,growth
> program assigned · founder network unlocked
$ s3 ship --metric revenue,adoption
> outcomes tracked · results over hype`,

  cta: `Build on Solana. Scale with S3.

Apply for growth partner programs. Join the founder network. Explore Arena.

s3labs.io`,
};

export const S3_GROWTH_BRIEF_PHOTO_SHARE_FOOTERS: Partial<Record<PostPhotoCardRole, string>> = {
  thesis: "s3labs.io",
  quote: "Results over hype · S3 Labs",
  pillars: "Apply → s3labs.io",
  checklist: "Growth partner · Solana",
  metrics: "$65K+ generated · 95% success",
  featured: "S3 Labs · Growth partner",
  comparison: "Proof > hype",
  deepDive: "Hackathon winners · MVPs",
  split: "Revenue · Distribution · Arena",
  terminal: "s3labs.io/arenass",
};
