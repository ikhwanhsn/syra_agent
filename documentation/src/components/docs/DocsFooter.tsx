import { SYRA_AGENT_URL, SYRA_PLAYGROUND_URL, SYRA_WEB_ORIGIN } from "@/content/syraUrls";
import { SYRA_TAGLINE } from "@/content/syraBrand";

export function DocsFooter() {
  return (
    <footer className="mt-16 pt-8 border-t border-border/60 text-sm text-muted-foreground safe-bottom">
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4">
        <p className="min-w-0 max-w-xl text-balance leading-relaxed">
          Syra — {SYRA_TAGLINE.toLowerCase()} on Solana. Documentation for operators, builders, and
          autonomous agents.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href={SYRA_AGENT_URL} className="hover:text-primary transition-colors">
            Agent
          </a>
          <a href={SYRA_PLAYGROUND_URL} className="hover:text-primary transition-colors">
            API Playground
          </a>
          <a href={SYRA_WEB_ORIGIN} className="hover:text-primary transition-colors">
            Website
          </a>
        </div>
      </div>
    </footer>
  );
}
