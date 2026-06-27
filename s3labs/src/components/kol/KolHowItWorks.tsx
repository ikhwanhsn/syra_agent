import { ArrowRight, Award, Coins, MessageSquare, Trophy } from "lucide-react";
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
      "Share your take — reply to or quote the project's post. More engagement (likes, views, replies) means a bigger share of the pool.",
  },
  {
    number: "03",
    icon: Coins,
    title: "Get paid automatically",
    description:
      "Submit your post URL here. When the campaign ends, rewards are split by engagement score and sent straight to your wallet.",
  },
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
          No applications. No middlemen. Connect your wallet, post on X, and track your rank live.
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="flex items-start gap-2 text-sm text-muted-foreground panel-glass rounded-xl px-4 py-3 w-full sm:flex-1 sm:min-w-[240px]">
          <Trophy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            Your share = your engagement score ÷ total score × reward pool. Higher rank = bigger payout.
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm text-muted-foreground panel-glass rounded-xl px-4 py-3 w-full sm:flex-1 sm:min-w-[240px] border border-primary/15">
          <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            +1 S3Labs Point per campaign, plus up to +3 early-bird points for submitting early.{" "}
            <Link to="/profile" className="text-primary hover:underline">
              Track on profile
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
}
