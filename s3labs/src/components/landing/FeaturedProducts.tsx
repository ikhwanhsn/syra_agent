import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Stagger, StaggerItem } from "@/components/discovery/motion/Stagger";
import SectionHeader from "@/components/landing/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { featuredProducts } from "@/lib/landingContent";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const FeaturedProducts = () => (
  <section className="section-shell bg-gradient-subtle" id="products">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Products"
        title={
          <>
            Featured
            <span className="text-gradient block mt-1">products</span>
          </>
        }
        description="Explore live tools and upcoming experiences across the S3Labs ecosystem."
      />

      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {featuredProducts.map((product) => {
          const isSoon = product.comingSoon === true;
          const cardClass = cn(
            "group card-premium-hover p-6 sm:p-7 flex flex-col h-full text-left",
            product.href && !isSoon && "cursor-pointer",
          );

          const body = (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:shadow-[0_0_24px_hsl(var(--primary)/0.2)] transition-all">
                  <product.icon className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase tracking-wider shrink-0",
                    isSoon
                      ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
                  )}
                >
                  {isSoon ? "Soon" : "Live"}
                </Badge>
              </div>

              <h3 className="text-base font-semibold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {product.description}
              </p>

              {product.href ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4">
                  {isSoon ? "Learn more" : "Open"}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground mt-4">
                  Coming soon
                </span>
              )}
            </>
          );

          if (product.href) {
            return (
              <StaggerItem key={product.title}>
                <Link to={product.href} className={cardClass}>
                  {body}
                </Link>
              </StaggerItem>
            );
          }

          return (
            <StaggerItem key={product.title}>
              <article className={cardClass}>{body}</article>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  </section>
);

export default FeaturedProducts;
