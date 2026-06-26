import { Link } from "react-router-dom";
import { ArrowRight, Coins, Megaphone, Rocket, Users } from "lucide-react";

import SectionHeader from "@/components/landing/SectionHeader";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const pillars = [
  {
    icon: Rocket,
    title: "Programs",
    description: "Revenue, GTM, and mentorship for live MVPs",
    href: "/programs",
  },
  {
    icon: Coins,
    title: "Portfolio",
    description: "Case studies and founder outcomes",
    href: "/portfolio",
  },
  {
    icon: Users,
    title: "Community",
    description: "500+ founder operator network",
    href: "/community",
  },
  {
    icon: Megaphone,
    title: "KOL",
    description: "On-chain distribution marketplace",
    href: "/kol",
  },
] as const;

const LandingPillars = () => (
  <section className="section-shell">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Explore"
        title={
          <>
            {"Everything S3 Labs"}
            <span className="text-gradient block mt-1">offers builders</span>
          </>
        }
        description="Programs, proof, network, and distribution — one growth partner"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
        {pillars.map((pillar) => (
          <Link
            key={pillar.href}
            to={pillar.href}
            className="group card-premium-hover p-6 flex flex-col h-full"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
              <pillar.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
              {pillar.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              {pillar.description}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">
              Learn more
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default LandingPillars;
