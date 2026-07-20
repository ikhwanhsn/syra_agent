import { Award, Building2, Coins, MessageSquare, Rocket, ShieldCheck, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { InfoHint } from "@/components/ui/info-hint";
import {
  HOW_IT_WORKS_CREATOR_BONUS_HINT,
  HOW_IT_WORKS_SCORE_HINT,
  POINTS_EARLY_BIRD_HINT,
} from "@/lib/kolRewardEligibility";

const projectSteps = [
  {
    number: "01",
    icon: Rocket,
    title: "Create & fund a campaign",
    description:
      "Paste your X post URL, set a SOL pool and end date. First campaign: platform fee waived. Unused pool is refunded when it ends.",
  },
  {
    number: "02",
    icon: Users,
    title: "Attract the best KOLs",
    description:
      "Invite top earners from the directory, or keep it open. Optional allowlist and top-N payout split give you control.",
  },
  {
    number: "03",
    icon: Trophy,
    title: "See results, auto-pay",
    description:
      "Submitted posts refresh engagement about every 6 hours. When the campaign ends, engagers are paid pro-rata — leftovers return to you.",
  },
] as const;

const kolSteps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Pick a live campaign",
    description:
      "Browse active campaigns. Each has a SOL reward pool and a post to amplify on X.",
  },
  {
    number: "02",
    icon: Building2,
    title: "Verify, reply or quote, then submit",
    description:
      "Verify your X account, post on X, then paste your post link (1 per campaign, from your verified handle). Engagement updates about every 6 hours.",
  },
  {
    number: "03",
    icon: Coins,
    title: "Get paid in SOL",
    description:
      "When the campaign ends, your share goes to the wallet linked to your verified X. Creators who also fund a campaign get a 1.15× score bonus.",
    hint: HOW_IT_WORKS_CREATOR_BONUS_HINT,
  },
] as const;

const ENGAGEMENT_WEIGHTS = [
  { label: "Likes", weight: "×1.0", note: "baseline signal" },
  { label: "Replies", weight: "×1.5", note: "conversation" },
  { label: "Retweets", weight: "×2.5", note: "amplification" },
  { label: "Quotes", weight: "×3.0", note: "highest intent" },
  { label: "Views", weight: "per 1k", note: "reach, capped" },
] as const;

function StepGrid({
  steps,
}: {
  steps: readonly {
    number: string;
    icon: typeof MessageSquare;
    title: string;
    description: string;
    hint?: string;
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.number}
          className="group card-premium-hover rounded-2xl border border-border/60 p-5 sm:p-6 h-full"
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-3xl font-semibold text-primary/15 group-hover:text-primary/25 transition-colors tabular-nums">
              {step.number}
            </span>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <step.icon className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          <h3 className="font-semibold mb-2 tracking-tight inline-flex items-center gap-1.5">
            {step.title}
            {step.hint ? (
              <InfoHint content={step.hint} label={`More about: ${step.title}`} />
            ) : null}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

export function KolHowItWorks() {
  return (
    <section className="mb-8 sm:mb-10 min-w-0 space-y-10">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <p className="eyebrow mb-2">For projects</p>
            <h2 className="heading-section text-xl sm:text-2xl">
              Hire reach with a <span className="text-gradient">SOL pool</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm sm:text-right">
            Fund amplification. KOLs compete. You get a leaderboard and auto-payouts — unused SOL comes back.
          </p>
        </div>
        <StepGrid steps={projectSteps} />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <p className="eyebrow mb-2">For KOLs</p>
            <h2 className="heading-section text-xl sm:text-2xl">
              Three steps to <span className="text-gradient">earn SOL</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm sm:text-right">
            Verify X, reply or quote, submit your link — get paid when the campaign ends.
          </p>
        </div>
        <StepGrid steps={kolSteps} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 text-sm text-muted-foreground panel-glass rounded-xl px-4 py-3 border border-border/60">
          <Trophy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="inline-flex items-start gap-1.5 min-w-0">
            <span className="min-w-0">
              Your share = your fair engagement score ÷ total score × reward pool. Higher rank =
              bigger payout.
            </span>
            <InfoHint content={HOW_IT_WORKS_SCORE_HINT} label="How is my SOL share calculated?" />
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground panel-glass rounded-xl px-4 py-3 border border-primary/15">
          <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="inline-flex items-start gap-1.5 min-w-0">
            <span className="min-w-0">
              +1 S3Labs Point per campaign, plus up to +3 early-bird points for submitting early.{" "}
              <Link to="/profile" className="text-primary hover:underline">
                Track on profile
              </Link>
            </span>
            <InfoHint content={POINTS_EARLY_BIRD_HINT} label="What are early-bird points?" />
          </span>
        </div>
      </div>

      <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight mb-1">Fair scoring, built for real KOLs</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every engagement type has a different weight. Scores also use follower-relative caps,
              diminishing returns, spike detection, and an engager-quality audit at payout — so
              bought likes, comments, and quotes cannot dominate a campaign pool.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 mb-4">
          {ENGAGEMENT_WEIGHTS.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-center"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-mono font-semibold text-foreground tabular-nums">{item.weight}</p>
              <p className="text-[11px] text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>

        <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed list-disc pl-4">
          <li>Engagement cannot exceed views — blocks impossible like/view ratios.</li>
          <li>Volume above your reach is capped and compressed — farming stops paying off.</li>
          <li>Sudden engagement spikes with flat views are discounted (bought-burst signal).</li>
          <li>
            At campaign end we sample who commented/quoted — low-quality or duplicate engagers
            slash your payout share. Flagged rewards can be held for review.
          </li>
          <li>Credibility scales with your real follower base; verified accounts get a small bonus.</li>
          <li className="flex items-start gap-1.5">
            <span className="min-w-0">
              Wallets that create and fund a campaign get a 1.15× payout score bonus.
            </span>
            <InfoHint
              content={HOW_IT_WORKS_CREATOR_BONUS_HINT}
              label="What is the creator score bonus?"
            />
          </li>
        </ul>
      </div>
    </section>
  );
}
