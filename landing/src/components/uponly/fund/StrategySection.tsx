import { useReducedMotion, motion } from "framer-motion";
import { RISE_DOCS, FeatureCard, ExternalLink, itemFade, SectionEyebrow, stagger } from "../primitives";
import { CheckCircle2, FileSearch, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const CRITERIA = [
  {
    icon: FileSearch,
    title: "Protocol + docs fit",
    text: "We read RISE mechanics (floor, borrow, launch path) and prefer teams that can explain the same in plain language. No guarantee of outperformance—structure is the filter.",
  },
  {
    icon: CheckCircle2,
    title: "Traction + execution",
    text: "We look for shipping history, market feedback, and operational seriousness. Momentum is noisy; we separate narrative from what is verifiable.",
  },
  {
    icon: Users,
    title: "Founders & community",
    text: "Responsiveness, security posture, and how they treat users matter. This is judgment, not a scorecard.",
  },
  {
    icon: Shield,
    title: "Risk limits",
    text: "Concentration caps, small initial tickets, and avoid scenarios we cannot explain to our own community. Past diligence does not predict the next market regime.",
  },
] as const;

type StrategySectionProps = { className?: string };

export function StrategySection({ className }: StrategySectionProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <section className={cn("mb-20 min-w-0", className)} id="strategy" aria-labelledby="uof-strategy-heading">
      <div className="mb-8 min-w-0 max-w-3xl">
        <SectionEyebrow>Evaluation criteria</SectionEyebrow>
        <h2
          id="uof-strategy-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] min-[500px]:text-2xl sm:text-3xl md:text-4xl"
        >
          How we look at RISE ecosystem projects
        </h2>
        <p className="mt-3 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          The list below is <strong className="font-medium text-foreground/90">diligence framing</strong>, not a trading signal. We
          separate analysis from any execution you take elsewhere.
        </p>
        <p className="mt-2">
          <ExternalLink href={RISE_DOCS.security} className="text-sm">
            RISE security documentation
          </ExternalLink>
        </p>
      </div>
      <motion.div
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-4 min-[520px]:grid-cols-2"
      >
        {CRITERIA.map((c) => (
          <motion.div key={c.title} {...itemFade(reduce)}>
            <FeatureCard icon={c.icon} title={c.title}>
              {c.text}
            </FeatureCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
