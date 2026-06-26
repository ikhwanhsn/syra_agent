import StatMetric from "@/components/landing/StatMetric";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const PortfolioStatsHero = () => (
  <section className="section-shell pt-0">
    <div className={cn(siteShell, "relative z-10")}>
      <div className="panel-glass px-6 sm:px-10 py-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
          <StatMetric value="+900%" label="Peak MoM growth" />
          <StatMetric value="$35K+" label="Week-one revenue" />
          <StatMetric value="$65K+" label="Portfolio revenue" />
          <StatMetric value="95%" label="Program success rate" />
        </div>
      </div>
    </div>
  </section>
);

export default PortfolioStatsHero;
