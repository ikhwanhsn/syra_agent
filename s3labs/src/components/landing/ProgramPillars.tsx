import { Link } from "react-router-dom";
import { ArrowRight, Coins, Megaphone, Rocket, Users } from "lucide-react";

import SectionHeader from "@/components/landing/SectionHeader";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Coins,
    title: "Revenue Program",
    subtitle: "Core program",
    description:
      "Monetization support for Solana products with real users and credible execution. Target first revenue in 30–90 days.",
    accent: true,
  },
  {
    icon: Rocket,
    title: "GTM Sprint",
    subtitle: "Adoption",
    description:
      "Adoption playbooks, community growth, and ecosystem positioning — measured go-to-market for live MVPs.",
    accent: true,
  },
  {
    icon: Megaphone,
    title: "Distribution",
    subtitle: "KOL Marketplace",
    description:
      "On-chain SOL campaigns that connect projects with KOLs on X. Performance-based payouts at snapshot.",
    href: "/kol",
    cta: "Explore KOL Marketplace",
  },
  {
    icon: Users,
    title: "Operator Network",
    subtitle: "500+ founders",
    description:
      "Operators, mentors, and partners across the Solana builder graph. Workshops, collab, and warm intros.",
    href: "/community",
    cta: "Join the network",
  },
] as const;

const ProgramPillars = () => (
  <section className="section-shell">
    <div className="section-divider" />
    <div className="container relative z-10">
      <SectionHeader
        eyebrow="Four pillars"
        title={
          <>
            {"What founders"}
            <span className="text-gradient block mt-1">get from S3 Labs</span>
          </>
        }
        description="Programs matched to your stage — revenue, distribution, and network access"
      />

      <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="group card-premium-hover p-8 flex flex-col h-full">
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <pillar.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                {pillar.subtitle}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
              {pillar.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed flex-1">{pillar.description}</p>
            {"href" in pillar && pillar.href ? (
              <Button variant="heroOutline" size="sm" className="mt-6 rounded-full w-fit group/btn" asChild>
                <Link to={pillar.href}>
                  {pillar.cta}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default ProgramPillars;
