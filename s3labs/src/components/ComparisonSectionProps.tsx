
import SectionHeader from "@/components/landing/SectionHeader";
import StatMetric from "@/components/landing/StatMetric";
import { X, Check, TrendingDown, TrendingUp, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const ComparisonSection = () => {

  const withoutS3Labs = [
    {
      icon: Clock,
      title: "6-12 Months to First Revenue",
      description: "Trial & error alone, multiple pivots without guidance",
    },
    {
      icon: TrendingDown,
      title: "High Burn Rate",
      description: "Budget wasted on ineffective experiments",
    },
    {
      icon: X,
      title: "Limited Network",
      description: "Difficult to access investors, partners, and early adopters",
    },
    {
      icon: X,
      title: "Marketing Trial & Error",
      description: "Ad spend without knowing which channels work",
    },
    {
      icon: X,
      title: "Unclear GTM Strategy",
      description: "Confused about product positioning and target market",
    },
    {
      icon: X,
      title: "Solo Founder Syndrome",
      description: "Business decisions without expert feedback",
    },
  ];

  const withS3Labs = [
    {
      icon: Zap,
      title: "30-90 Days to First Revenue",
      description: "Proven framework for monetization and product-market fit",
    },
    {
      icon: TrendingUp,
      title: "3x Better Budget Efficiency",
      description: "Focus on validated channels and strategies",
    },
    {
      icon: Check,
      title: "Exclusive Network Access",
      description: "Direct connection to VCs, angels, and 500+ founder community",
    },
    {
      icon: Check,
      title: "Growth Marketing Playbook",
      description: "Marketing strategies proven to work in Solana ecosystem",
    },
    {
      icon: Check,
      title: "Clear GTM Roadmap",
      description: "Step-by-step guidance from MVP to product-market fit",
    },
    {
      icon: Check,
      title: "Weekly Mentorship",
      description: "1-on-1 sessions with experts who have built & exited",
    },
  ];

  return (
    <section id="comparison" className="section-shell">
      <div className="section-divider" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,700px)] h-[min(92vw,700px)] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className={cn(siteShell, "relative z-10 min-w-0")}>
        <SectionHeader
          eyebrow={"Comparison"}
          title={
            <>
              {"The Founder Journey:"}
              <span className="text-gradient block mt-1">
                {"With vs Without S3 Labs"}
              </span>
            </>
          }
          description={"See the significant difference between going solo vs having our mentorship & network"}
        />

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-10">
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-5 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {"Without S3 Labs"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {"Longer & costlier path"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {withoutS3Labs.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3.5 p-4 rounded-xl bg-muted/20 border border-border/50"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium overflow-hidden ring-1 ring-primary/25 relative">
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                Recommended
              </span>
            </div>
            <div className="px-6 py-5 border-b border-primary/20 bg-gradient-primary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {"With S3 Labs"}
                  </h3>
                  <p className="text-xs text-white/80">
                    {"Fast track to revenue & growth"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {withS3Labs.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3.5 p-4 rounded-xl bg-primary/5 border border-primary/15 hover:border-primary/25 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground text-sm mb-0.5">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-glass max-w-4xl mx-auto px-6 py-8 mb-12">
          <div className="grid md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border/60">
            <StatMetric value="3x" label={"Faster to Revenue"} />
            <StatMetric value="5x" label={"Marketing ROI"} />
            <StatMetric value="10x" label={"Network & Opportunities"} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-6 text-sm md:text-base">
            {"Choose the faster and more efficient path"}
          </p>
          <Button
            variant="hero"
            size="xl"
            asChild
            className="group btn-premium"
          >
            <Link to="/apply">
              {"Start Your Journey with S3 Labs"}
              <TrendingUp className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
