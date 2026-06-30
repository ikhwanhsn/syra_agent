import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import {
  SYRA_AGENT_CAPABILITIES,
  SYRA_DOCS_BADGE,
  SYRA_HIGHLIGHT,
  SYRA_MISSION,
  SYRA_TAGLINE,
} from "@/content/syraBrand";
import {
  SYRA_AGENT_URL,
  SYRA_PLAYGROUND_URL,
  SYRA_WEB_LABEL,
  SYRA_WEB_ORIGIN,
} from "@/content/syraUrls";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Brain,
  Coins,
  Cpu,
  ExternalLink,
  MessageCircle,
  Wallet,
  Zap,
} from "lucide-react";

const QUICK_LINKS = [
  {
    icon: BookOpen,
    title: "Get Started",
    description: "What Syra is and how to begin",
    href: "/docs/welcome",
  },
  {
    icon: Zap,
    title: "API Reference",
    description: "x402 endpoints and payment flow",
    href: "/docs/api-reference",
  },
  {
    icon: Bot,
    title: "Syra Agent",
    description: "Chat, tools, and onchain workflows",
    href: "/docs/agent/getting-started",
  },
];

const POPULAR_ENDPOINTS = [
  { label: "Signal", href: "/docs/api/signal", method: "GET" },
  { label: "Syra Brain", href: "/docs/api/brain", method: "POST" },
  { label: "Chat Completions", href: "/docs/api/chat-completions", method: "POST" },
  { label: "x402 Standard", href: "/docs/api/x402-api-standard", method: "GET" },
];

const features = [
  {
    icon: Coins,
    title: "Autonomous revenue",
    description: SYRA_AGENT_CAPABILITIES[0].description,
    href: "/docs/welcome",
  },
  {
    icon: Wallet,
    title: "Treasury management",
    description: SYRA_AGENT_CAPABILITIES[1].description,
    href: "/docs/welcome",
  },
  {
    icon: Bot,
    title: "Syra Agent",
    description: `Chat and workflows at ${SYRA_WEB_LABEL}.`,
    href: "/docs/agent/getting-started",
  },
  {
    icon: Zap,
    title: "API & x402",
    description: "Pay-per-call routes for research, signals, and AI.",
    href: "/docs/api-reference",
  },
  {
    icon: MessageCircle,
    title: "x402 Autonomous Agent",
    description: "Automated research pipelines on x402scan.",
    href: "/docs/x402-agent/getting-started",
  },
  {
    icon: Cpu,
    title: "Agent-native stack",
    description: "Earn, treasury, invest, spend, and grow on Solana.",
    href: "/docs/agent/how-it-works",
  },
];

export default function DocsHome() {
  return (
    <DocsLayout hideBreadcrumbs fullWidth>
      <div className="relative -mx-4 px-4 pb-10 mb-10 border-b border-border/60 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-gradient opacity-60" aria-hidden />

        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            {SYRA_DOCS_BADGE}
          </span>

          <h1 className="docs-display text-4xl md:text-5xl font-semibold tracking-tight mb-3">
            <span className="gradient-text-primary">{SYRA_TAGLINE}</span>
            <span className="block text-foreground/90 text-2xl md:text-3xl mt-2 font-medium">on Solana</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-4 leading-relaxed max-w-2xl">{SYRA_MISSION}</p>
          <p className="text-base text-muted-foreground/90 mb-8 leading-relaxed max-w-2xl border-l-2 border-primary/30 pl-4">
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
              <a href={SYRA_PLAYGROUND_URL} target="_blank" rel="noopener noreferrer">
                API Playground
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <section className="mb-12 not-prose">
        <h2 className="docs-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Start here
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.title}
              to={link.href}
              className="group rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <link.icon className="h-5 w-5 text-primary mb-2" />
              <p className="font-medium group-hover:text-primary transition-colors">{link.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12 not-prose">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="docs-display text-lg font-semibold">Popular endpoints</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_ENDPOINTS.map((ep) => (
            <Link
              key={ep.href}
              to={ep.href}
              className="inline-flex items-center gap-2 rounded-md border border-border/60 px-3 py-1.5 text-sm hover:border-primary/40 hover:bg-muted/30 transition-colors"
            >
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-success/15 text-success">
                {ep.method}
              </span>
              {ep.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="docs-display text-2xl font-semibold mb-2">What Syra enables</h2>
        <p className="text-muted-foreground mb-6 leading-7 max-w-2xl">
          Machine money infrastructure for autonomous agents — earn, manage treasuries, participate in DeFi, and
          coordinate value on Solana.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 not-prose">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.href}
              className="group rounded-lg border border-border/60 p-4 hover:border-primary/40 hover:bg-muted/30 transition-all hover-lift"
            >
              <feature.icon className="h-6 w-6 text-primary mb-2" />
              <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{feature.description}</p>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-3 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      <section className="not-prose">
        <h2 className="docs-display text-2xl font-semibold mb-4">Explore the docs</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: BookOpen, title: "Welcome", desc: "Machine economy overview", href: "/docs/welcome" },
            { icon: Bot, title: "Syra Agent", desc: "Tools, treasury, onchain", href: "/docs/agent/getting-started" },
            { icon: Zap, title: "API Reference", desc: "x402 endpoints & playground", href: "/docs/api-reference" },
            {
              icon: MessageCircle,
              title: "x402 Agent",
              desc: "Autonomous agent on x402scan",
              href: "/docs/x402-agent/getting-started",
            },
          ].map((item) => (
            <Link
              key={item.title}
              to={item.href}
              className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/40 transition-colors group"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </DocsLayout>
  );
}
