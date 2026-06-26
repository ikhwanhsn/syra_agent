import SectionHeader from "@/components/landing/SectionHeader";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const caseStudies = [
  {
    name: "AI Agents",
    problem: "Strong hackathon demo but no monetization path or distribution.",
    action: "Revenue model design, GTM sprint, and mentorship on roadmap prioritization.",
    outcome: "$30K+ revenue in month one, 700+ users, +300% growth.",
  },
  {
    name: "Smart Contract Auditor",
    problem: "Small audit service with limited credibility and no paying customers.",
    action: "Product positioning, launch playbook, and ecosystem credibility building.",
    outcome: "$1K+ revenue in week one, 210+ followers, professional platform launch.",
  },
  {
    name: "Swarm Protocol",
    problem: "x402 protocol built but unclear monetization and market fit.",
    action: "Monetization discovery, distribution strategy, and growth experiments.",
    outcome: "$35K+ week-one revenue, +900% MoM growth, 680+ followers.",
  },
];

const PortfolioCaseStudies = () => (
  <section className="section-shell bg-gradient-subtle">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Case studies"
        title={
          <>
            {"Problem → Action →"}
            <span className="text-gradient block mt-1">Outcome</span>
          </>
        }
        description="How we work with founders — execution and measurable results"
      />

      <div className="grid lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {caseStudies.map((study) => (
          <article key={study.name} className="card-premium-hover p-7 flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-5 tracking-tight">
              {study.name}
            </h3>
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Problem
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{study.problem}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/80 mb-1">
                  What S3 did
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">{study.action}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Outcome
                </p>
                <p className="text-sm font-medium text-foreground leading-relaxed">{study.outcome}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default PortfolioCaseStudies;
