import { motion } from "framer-motion";
import { ArrowRight, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

/**
 * Blog CTA — agent activation, not email capture.
 * Email/waitlist is starved per docs/AGENT_BUILDER_GTM.md.
 */
export function BlogNewsletter() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className={cn(overviewCardShell, "p-6 sm:p-8")}
      aria-labelledby="blog-builder-cta-heading"
    >
      <p className={overviewKickerClass}>For agent builders</p>
      <h2
        id="blog-builder-cta-heading"
        className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        First paid call in 5 minutes
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
        Install MCP, fund Solana USDC, call <code className="text-xs">syra_spend_news</code> — same path as
        the marketplace Integrate tab. No waitlist.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="h-11 gap-2 rounded-xl px-5">
          <a href="https://docs.syraa.fun/docs/build/mcp">
            <Plug className="h-4 w-4" aria-hidden />
            Install MCP
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="outline" className="h-11 gap-2 rounded-xl px-5">
          <a href="/marketplace">Marketplace Integrate</a>
        </Button>
      </div>
    </motion.section>
  );
}
