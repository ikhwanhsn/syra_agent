import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import { SYRA_DOCS_BADGE, SYRA_HIGHLIGHT, SYRA_MISSION, SYRA_TAGLINE } from "@/content/syraBrand";
import { SYRA_AGENT_URL, SYRA_MARKETPLACE_URL } from "@/content/syraUrls";
import { ArrowRight, Bot, ExternalLink, Package, Zap } from "lucide-react";

const PATHS = [
  {
    icon: Bot,
    title: "Use Syra",
    description: "Chat with the agent, explore tools, and run onchain workflows.",
    href: "/docs/agent/getting-started",
    cta: { label: "Try Agent", href: SYRA_AGENT_URL, external: true },
  },
  {
    icon: Package,
    title: "Build with packages",
    description: "Install MCP for Cursor/Claude or the typed SDK with x402 auto-pay.",
    href: "/docs/build/mcp",
    cta: { label: "Install SDK", href: "/docs/build/sdk", external: false },
  },
  {
    icon: Zap,
    title: "Build with the API",
    description: "Integrate pay-per-call endpoints with x402 micropayments.",
    href: "/docs/api-reference",
    cta: { label: "API Marketplace", href: SYRA_MARKETPLACE_URL, external: true },
  },
];

export default function DocsHome() {
  return (
    <DocsLayout hideBreadcrumbs>
      <div className="relative -mx-4 px-4 pb-10 mb-10 border-b border-border/60 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-gradient opacity-60" aria-hidden />

        <div className="w-full">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            {SYRA_DOCS_BADGE}
          </span>

          <h1 className="docs-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            <span className="gradient-text-primary">{SYRA_TAGLINE}</span>
            <span className="block text-foreground/90 text-xl sm:text-2xl md:text-3xl mt-2 font-medium">on Solana</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-4 leading-relaxed">{SYRA_MISSION}</p>
          <p className="text-sm sm:text-base text-muted-foreground/90 mb-8 leading-relaxed border-l-2 border-primary/30 pl-4">
            {SYRA_HIGHLIGHT}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button variant="primary" size="lg" asChild>
              <Link to="/docs/welcome">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
                <Bot className="mr-2 h-4 w-4" />
                Try Agent
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={SYRA_MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
                API Marketplace
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <section className="not-prose">
        <h2 className="docs-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Choose your path
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PATHS.map((path) => (
            <div
              key={path.title}
              className="group rounded-lg border border-border/60 p-5 hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <path.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{path.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{path.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" asChild>
                  <Link to={path.href}>
                    Read docs
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  {path.cta.external ? (
                    <a href={path.cta.href} target="_blank" rel="noopener noreferrer">
                      {path.cta.label}
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link to={path.cta.href}>{path.cta.label}</Link>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DocsLayout>
  );
}
