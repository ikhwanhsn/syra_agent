import { ArrowRight, Award, Coins, MessageSquare, ShieldCheck, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Pick a live campaign",
    description:
      "Browse active campaigns from Solana projects. Each one has a reward pool in SOL and a post they want amplified on X.",
  },
  {
    number: "02",
    icon: ArrowRight,
    title: "Reply or quote on X",
    description:
      "Share your take — reply to or quote the project's post. We auto-detect your engagement every 6 hours.",
  },
  {
    number: "03",
    icon: Coins,
    title: "Verify & claim SOL",
    description:
      "When the campaign ends, verify your X account and claim your pro-rata share of the reward pool.",
  },
] as const;

const ENGAGEMENT_WEIGHTS = [
  { label: "Likes", weight: "×1.0", note: "baseline signal" },
  { label: "Replies", weight: "×1.5", note: "conversation" },
  { label: "Retweets", weight: "×2.5", note: "amplification" },
  { label: "Quotes", weight: "×3.0", note: "highest intent" },
  { label: "Views", weight: "per 1k", note: "reach, capped" },
] as const;

export function KolHowItWorks() {
  return (
    <section className="mb-8 sm:mb-10 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow mb-2">How it works</p>
          <h2 className="heading-section text-xl sm:text-2xl">
            Three steps to <span className="text-gradient">earn SOL</span>
          </h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm sm:text-right">
          No applications. Reply or quote on X — we track engagement automatically and you claim after verify.
        </p>
      </div>

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
            <h3 className="font-semibold mb-2 tracking-tight">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 text-sm text-muted-foreground panel-glass rounded-xl px-4 py-3 border border-border/60">
          <Trophy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            Your share = your fair engagement score ÷ total score × reward pool. Higher rank =
            bigger payout.
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground panel-glass rounded-xl px-4 py-3 border border-primary/15">
          <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            +1 S3Labs Point per campaign, plus up to +3 early-bird points for submitting early.{" "}
            <Link to="/profile" className="text-primary hover:underline">
              Track on profile
            </Link>
          </span>
        </div>
      </div>

      <div className="mt-4 panel-glass rounded-2xl border border-border/60 p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold tracking-tight mb-1">Fair scoring, built for real KOLs</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every engagement type has a different weight. Scores also use follower-relative caps,
              diminishing returns on volume, and soft integrity checks — so bought likes and fake
              views cannot dominate a campaign pool.
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
          <li>Credibility scales with your real follower base; verified accounts get a small bonus.</li>
          <li>Hover any score on the leaderboard to see the full breakdown.</li>
        </ul>
      </div>
    </section>
  );
}
