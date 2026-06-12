import { ArrowRight, BookOpen, MapPin, ShieldCheck } from "lucide-react";
import { spcxCardClass, spcxKickerClass, spcxSectionTitleClass } from "@/components/spcx/spcxStyles";

const STEPS = [
  {
    icon: BookOpen,
    title: "What is this page?",
    body: "SpaceX now trades live on Nasdaq as SPCX. This page tracks the stock price vs tokenized versions you can buy on crypto — so you never overpay or buy a fake token.",
  },
  {
    icon: MapPin,
    title: "Pick how you want exposure",
    body: "You can buy on a crypto wallet (fastest), through an exchange like Kraken, or via a brokerage track. We show which routes are live right now.",
  },
  {
    icon: ShieldCheck,
    title: "Verify, then buy",
    body: "Scammers copy the SPCX name with fake tokens. Always check our scam radar and mint verifier before swapping any money.",
  },
] as const;

export function SpcxQuickStart({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <div className={spcxCardClass}>
      <div className="border-b border-border/40 bg-muted/[0.03] px-5 py-4 sm:px-6">
        <p className={spcxKickerClass}>New here?</p>
        <h2 className={`mt-1 ${spcxSectionTitleClass}`}>Start in 3 simple steps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No stock or crypto experience needed — we explain everything as you go.
        </p>
      </div>
      <div className="grid gap-0 divide-y divide-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col gap-3 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </div>
              <step.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
      {onGetStarted ? (
        <div className="border-t border-border/40 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            Jump to how to buy
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
