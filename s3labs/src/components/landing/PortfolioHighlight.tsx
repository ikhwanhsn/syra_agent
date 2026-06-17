import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Users, DollarSign } from "lucide-react";

import SectionHeader from "@/components/landing/SectionHeader";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: DollarSign, value: "$35K+", label: "Week-one revenue" },
  { icon: TrendingUp, value: "+900%", label: "Peak MoM growth" },
  { icon: Users, value: "700+", label: "Users in month one" },
];

const PortfolioHighlight = () => (
  <section className="section-shell bg-gradient-subtle">
    <div className="section-divider" />
    <div className="container relative z-10">
      <SectionHeader
        eyebrow="Portfolio"
        title={
          <>
            {"Results founders"}
            <span className="text-gradient block mt-1">actually ship</span>
          </>
        }
        description="Swarm Protocol, AI Agents, and more — velocity over vanity metrics"
      />

      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-10">
        {highlights.map((item) => (
          <div key={item.label} className="card-premium-hover p-6 text-center">
            <item.icon className="w-5 h-5 text-primary mx-auto mb-3" />
            <div className="text-2xl font-semibold text-foreground tabular-nums">{item.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button variant="heroOutline" size="lg" className="rounded-full group" asChild>
          <Link to="/portfolio">
            View full portfolio
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default PortfolioHighlight;
