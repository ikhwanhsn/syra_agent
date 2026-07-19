/** Shared copy for campaigns that require KOLs to run their own live campaign. */

/** Short line for badges / tight UI (hover InfoHint for full detail). */
export const KOL_CREATE_CAMPAIGN_SHORT =
  "Only pays KOLs who also run their own live campaign";

export const KOL_CREATE_CAMPAIGN_HINT = (
  "What this means: a KOL who joins your campaign only receives SOL if they also create " +
  "their own campaign and deposit SOL so it goes live (not just a draft). " +
  "They must do that before your campaign ends, or their share is forfeited."
);

export const KOL_CREATE_CAMPAIGN_TOOLTIP = KOL_CREATE_CAMPAIGN_HINT;

export const KOL_CREATE_CAMPAIGN_OWN_NOTE =
  "Open your own live campaign (create + deposit SOL) before this one ends — or you won’t get paid. A saved draft without deposit does not count.";

export const KOL_CREATE_CAMPAIGN_GATE_TITLE =
  "Almost there — open your own live campaign to unlock pay";

export const KOL_CREATE_CAMPAIGN_GATE_BODY =
  "Go to Create campaign, set a reward, then deposit SOL so it goes live. Only a live campaign unlocks your reward here. Finish before this campaign ends.";

export const KOL_CREATE_CAMPAIGN_LEADERBOARD_INTRO =
  "Verify X and submit your post to appear here. Rankings refresh about every 6 hours. This campaign only pays KOLs who also open their own live campaign (create + deposit SOL) before it ends.";

export const KOL_CREATE_CAMPAIGN_FORFEITED =
  "This campaign ended before you opened a live campaign (create + deposit SOL) — your reward was forfeited.";

export const KOL_CREATE_CAMPAIGN_NEXT_TIME_NOTE =
  "Next time: create a campaign and deposit SOL so it goes live before a gated campaign ends.";

export const KOL_CREATE_CAMPAIGN_CTA = "Create & deposit SOL";

export const KOL_CREATE_CAMPAIGN_DETAIL_RULE =
  "To get SOL from this campaign, you must also create your own campaign and deposit SOL so it goes live — before this one ends. Saving a draft without depositing does not count.";

/** Create-form control labels + hints */
export const CREATE_FORM_REQUIRE_LIVE_LABEL =
  "Only pay KOLs who also run a live campaign";

export const CREATE_FORM_REQUIRE_LIVE_HINT =
  "When ON: KOLs on your leaderboard only receive SOL if they also create and fund their own campaign (deposit SOL so it goes live). " +
  "A draft they never funded does not qualify. Use this to grow the marketplace — KOLs must become creators too.";

export const CREATE_FORM_ALLOWLIST_HINT =
  "Optional: only the X handles you list can earn SOL from this pool. Everyone else can still appear on the leaderboard, but they get $0. Leave empty to pay any eligible KOL.";

export const CREATE_FORM_TOP_N_HINT =
  "When ON: only the top N KOLs by score share the reward pool. Everyone below that rank gets $0 from this campaign (they can still earn points).";

export const CREATE_FORM_POOL_SPLIT_HINT =
  "100% top N: the whole pool goes to the top ranks. 70% top N: 70% to the top ranks, 30% shared among everyone else on the board who is eligible.";

export const HOW_IT_WORKS_SCORE_HINT =
  "Your payout share = (your fair engagement score ÷ sum of all scores) × the SOL reward pool. Higher score usually means a larger share.";

export const HOW_IT_WORKS_CREATOR_BONUS_HINT =
  "If the same wallet creates and funds (deposits SOL for) a campaign, their engagement score on other campaigns gets a 1.15× multiplier at payout — a bonus for being a creator, not only a KOL.";

export const POINTS_EARLY_BIRD_HINT =
  "Up to +3 early-bird points are split among KOLs by who submitted first (not by engagement). Submitting sooner usually means a larger early-bird share. Points credit when the campaign ends.";

export const POINTS_CREATED_HINT =
  "+5 points go to the project wallet when the campaign goes live — that means after you deposit SOL, not when you only save a draft.";

export const REFERRAL_POINTS_HINT =
  "You earn referral points when someone who used your invite link: joins a campaign that ends (+0.1), finishes top 3 by score (+0.3), or deposits SOL to open their own live campaign (+0.5).";
