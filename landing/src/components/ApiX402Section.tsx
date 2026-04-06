import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ChevronDown, ChevronRight, ExternalLink, MessageSquare, Shield, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { LINK_PLAYGROUND, LINK_DOCS } from "../../config/global";
import syraLogo from "/images/logo.jpg";

const categoryIconThemes = [
  "border border-border bg-muted/70 text-foreground",
  "border border-border bg-muted/70 text-foreground",
  "border border-border bg-muted/70 text-foreground",
] as const;

const keyPointDots = ["bg-foreground/45", "bg-foreground/30", "bg-muted-foreground", "bg-foreground/40"] as const;

const apiCategories = [
  {
    icon: MessageSquare,
    label: "Sentiment & research",
    description: "Real-time sentiment, headlines, and market research.",
  },
  {
    icon: Shield,
    label: "Risk & token reports",
    description: "Token audits, rug checks, and security scoring.",
  },
  {
    icon: TrendingUp,
    label: "Signals & whale flow",
    description: "Smart money tracking, signals, and trending data.",
  },
];

const keyPoints = [
  "Pay per request — no subscriptions",
  "x402 & MPP on Solana",
  "REST-style, any HTTP client",
  "Instant access after payment",
];

const flowEase = [0.22, 1, 0.36, 1] as const;

const flowStepShadow =
  "shadow-[0_1px_0_0_hsl(var(--foreground)/0.07),inset_0_0_0_1px_hsl(var(--foreground)/0.04)]";

/** Equal-height cards — width comes from flex-1 / minmax so the row fits max-w-lg without horizontal scroll */
const flowStepCard =
  `flex min-h-[168px] w-full min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-foreground/20 bg-card px-2 py-4 text-center sm:min-h-[176px] sm:px-2.5 ${flowStepShadow}`;

function FlowArrow({ isInView, delay }: { isInView: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay, ease: flowEase }}
      className="flex h-8 shrink-0 items-center justify-center text-muted-foreground/90 sm:h-auto sm:min-h-[176px] sm:w-6 sm:self-stretch md:w-7"
      aria-hidden
    >
      <ChevronDown className="h-5 w-5 sm:hidden" strokeWidth={2} />
      <ChevronRight className="hidden h-5 w-5 sm:block" strokeWidth={2} />
    </motion.div>
  );
}

function FlowStepText({
  step,
  title,
  mono,
  delay,
  isInView,
}: {
  step: string;
  title: string;
  mono: string;
  delay: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: flowEase }}
      className={flowStepCard}
    >
      <span className="text-lg font-bold tabular-nums leading-none text-foreground sm:text-xl">{step}</span>
      <span className="mt-1.5 text-center text-[11px] font-semibold leading-snug text-foreground sm:text-xs">{title}</span>
      <span className="mt-2 line-clamp-2 w-full max-w-full px-0.5 font-mono text-[9px] leading-tight text-muted-foreground sm:text-[10px]">
        {mono}
      </span>
    </motion.div>
  );
}

function FlowStepPay({ isInView }: { isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.14, ease: flowEase }}
      className={cn(flowStepCard, "relative gap-1")}
    >
      <span className="text-lg font-bold tabular-nums leading-none text-foreground sm:text-xl">2</span>
      <div className="relative mt-0.5 flex h-[52px] w-[52px] shrink-0 items-center justify-center sm:h-[56px] sm:w-[56px]">
        <motion.div
          className="pointer-events-none absolute inset-[-4px] rounded-full border border-foreground/12"
          animate={isInView ? { opacity: [0.35, 0.85, 0.35], scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="relative flex h-full w-full items-center justify-center"
          animate={isInView ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-muted/30 to-transparent opacity-90" />
          <div className="relative z-10 h-11 w-11 overflow-hidden rounded-full bg-black ring-2 ring-foreground/15 sm:h-12 sm:w-12">
            <img
              src={syraLogo}
              alt="Pay with Syra"
              width={48}
              height={48}
              className="h-full w-full object-contain p-1 sm:p-1.5"
              draggable={false}
            />
          </div>
        </motion.div>
      </div>
      <p className="mt-1 text-[11px] font-bold leading-tight text-foreground sm:text-xs">402 Pay</p>
      <p className="font-mono text-[9px] leading-tight text-muted-foreground sm:text-[10px]">x402 · MPP</p>
    </motion.div>
  );
}

function X402FlowIllustration({ isInView }: { isInView: boolean }) {
  return (
    <div className="relative mx-auto w-full min-w-0 py-2">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: flowEase }}
        className="mb-5 text-center text-sm font-semibold tracking-tight text-foreground sm:mb-6"
      >
        How it works
      </motion.p>

      {/* One pipeline: column on mobile, equal-width row on sm+ (fluid widths → no horizontal scroll) */}
      <div className="mx-auto flex w-full max-w-[260px] flex-col sm:max-w-none sm:flex-row sm:items-stretch sm:justify-center sm:gap-0">
        <div className="w-full min-w-0 sm:flex-1">
          <FlowStepText step="1" title="Send request" mono="GET /api/..." delay={0.08} isInView={isInView} />
        </div>
        <FlowArrow isInView={isInView} delay={0.18} />
        <div className="w-full min-w-0 sm:flex-1">
          <FlowStepPay isInView={isInView} />
        </div>
        <FlowArrow isInView={isInView} delay={0.24} />
        <div className="w-full min-w-0 sm:flex-1">
          <FlowStepText step="3" title="Get data" mono="200 + JSON" delay={0.2} isInView={isInView} />
        </div>
      </div>
    </div>
  );
}

export const ApiX402Section = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="api" className="relative py-14 sm:py-20 lg:py-28 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.04] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[380px] w-[380px] rounded-full bg-muted/40 blur-[90px]" />
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-[280px] w-[280px] rounded-full bg-foreground/[0.03] blur-[85px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center"
        >
          {/* Left: Copy + CTA */}
          <div className="text-center lg:text-left order-2 lg:order-1 min-w-0">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="section-eyebrow-gradient inline-block text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4"
            >
              x402 & MPP
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-bold tracking-tight mb-4 sm:mb-6 leading-tight"
            >
              Request. Pay. Get data.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 mb-5 sm:mb-6 leading-relaxed"
            >
              Syra APIs use HTTP 402 Payment Required with x402 and MPP (Machine Payments Protocol) discovery: call an endpoint, pay on Solana when prompted, then receive the response. No subscriptions—pay only for what you use.
            </motion.p>

            {/* API categories */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mb-6 sm:mb-8 space-y-3 sm:space-y-4"
            >
              <p className="section-eyebrow-gradient text-xs sm:text-sm font-medium uppercase tracking-wider mb-2 sm:mb-3">
                Available via x402 & MPP
              </p>
              {apiCategories.map((cat, ci) => (
                <div key={cat.label} className="flex gap-3 items-start">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg",
                      categoryIconThemes[ci % categoryIconThemes.length],
                    )}
                  >
                    <cat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.25]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start"
            >
              <a
                href={LINK_PLAYGROUND}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 text-sm sm:text-base font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20"
              >
                Open API Playground
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
              <a
                href={LINK_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 text-sm sm:text-base font-medium rounded-xl border border-accent/35 bg-accent/[0.06] text-foreground hover:bg-accent/10 hover:border-accent/50 transition-all"
              >
                <FileText className="h-4 w-4 shrink-0 text-foreground" />
                Documentation
              </a>
            </motion.div>
          </div>

          {/* Right: Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="order-1 lg:order-2 flex items-center justify-center min-w-0 w-full"
          >
            <div className="glass-card w-full max-w-lg rounded-xl border border-border/80 p-4 shadow-[0_0_36px_-16px_hsl(var(--foreground)/0.06)] sm:p-6 sm:rounded-2xl lg:p-8">
              <X402FlowIllustration isInView={isInView} />
            </div>
          </motion.div>
        </div>

        {/* Key points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-10 border-t border-border/80 pt-8 sm:mt-16 sm:pt-10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {keyPoints.map((point, ki) => (
              <div
                key={point}
                className="flex items-center gap-3 rounded-lg border border-border/80 bg-card/60 px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm lg:text-base"
              >
                <span className={cn("flex h-2 w-2 shrink-0 rounded-full", keyPointDots[ki % keyPointDots.length])} />
                <span className="min-w-0">{point}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
