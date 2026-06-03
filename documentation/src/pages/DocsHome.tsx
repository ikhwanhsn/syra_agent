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
  ArrowRight,
  MessageCircle,
  Cpu,
  Coins,
  Bot,
  Zap,
  BookOpen,
  ExternalLink,
  Wallet,
  Layers,
} from "lucide-react";

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
    description: "Chat and workflows at agent.syraa.fun — research, tools, and onchain actions for operators and agents.",
    href: "/docs/agent/getting-started",
  },
  {
    icon: Zap,
    title: "API & x402",
    description: "Pay-per-call routes for news, signals, research, and partner tools. Try playground.syraa.fun.",
    href: "/docs/api-reference",
  },
  {
    icon: MessageCircle,
    title: "x402 Autonomous Agent",
    description: "Automated research and workflow pipelines on x402scan.",
    href: "/docs/x402-agent/getting-started",
  },
  {
    icon: Cpu,
    title: "Agent-native stack",
    description: SYRA_AGENT_CAPABILITIES[5].description,
    href: "/docs/agent/how-it-works",
  },
];

export default function DocsHome() {
  return (
    <DocsLayout>
      <div className="relative -mx-4 px-4 pb-12 mb-12 border-b border-border sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10 2xl:-mx-12 2xl:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-background" aria-hidden />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-gradient" aria-hidden />

        <div className="relative w-full max-w-none">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              {SYRA_DOCS_BADGE}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
            <span className="gradient-text-primary">{SYRA_TAGLINE}</span>
            <span className="block text-foreground/90 text-3xl md:text-4xl mt-2 font-semibold">
              on Solana
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-4 sm:mb-5 leading-relaxed animate-fade-in animation-delay-100 max-w-3xl">
            {SYRA_MISSION}
          </p>

          <p className="text-base text-muted-foreground/90 mb-6 sm:mb-8 leading-relaxed animate-fade-in animation-delay-100 max-w-3xl border-l-2 border-primary/30 pl-4">
            {SYRA_HIGHLIGHT}
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 animate-fade-in animation-delay-200">
            <Button variant="primary" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
              <Link to="/docs/welcome">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
              <a href="https://agent.syraa.fun" target="_blank" rel="noopener noreferrer">
                <Bot className="mr-2 h-4 w-4 shrink-0" />
                Try Agent
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:min-w-[12rem] sm:w-auto justify-center border-border/60 bg-transparent hover:bg-muted/50 text-foreground"
              asChild
            >
              <a href="https://playground.syraa.fun" target="_blank" rel="noopener noreferrer">
                API Playground
                <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:min-w-[12rem] sm:w-auto justify-center border-border/60 bg-transparent hover:bg-muted/50 text-foreground"
              asChild
            >
              <a href="https://syraa.fun" target="_blank" rel="noopener noreferrer">
                Visit Website
                <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <section className="mb-16">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">What Syra enables</h2>
        </div>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          Machine money infrastructure for autonomous agents — earn, manage treasuries, participate in DeFi, and
          coordinate value on Solana. Use the <strong className="text-foreground">Syra Agent</strong>, x402 APIs, and
          ecosystem integrations.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.href}
              className="group p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-300 hover-lift"
            >
              <feature.icon className="h-8 w-8 text-primary mb-3 transition-transform group-hover:scale-110" />
              <h3 className="font-semibold mb-1.5 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Explore the Docs</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/docs/welcome"
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">Welcome</div>
              <div className="text-sm text-muted-foreground">What Syra is, machine economy, quick start</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/docs/agent/getting-started"
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">Syra Agent</div>
              <div className="text-sm text-muted-foreground">Chat at agent.syraa.fun — tools, treasury, onchain</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/docs/api-reference"
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">API Reference</div>
              <div className="text-sm text-muted-foreground">x402 API, endpoints, standards · playground.syraa.fun</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/docs/x402-agent/getting-started"
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium group-hover:text-primary transition-colors">x402 Agent</div>
              <div className="text-sm text-muted-foreground">Autonomous agent on x402scan</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </section>

      <footer className="pt-8 pb-8 sm:pb-0 border-t border-border text-sm text-muted-foreground safe-bottom">
        <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4">
          <div className="min-w-0 max-w-3xl text-balance">
            Syra — {SYRA_TAGLINE.toLowerCase()} on Solana. Documentation for operators, builders, and autonomous agents.
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="https://agent.syraa.fun" className="hover:text-primary transition-colors">
              Agent
            </a>
            <a href="https://playground.syraa.fun" className="hover:text-primary transition-colors">
              API Playground
            </a>
            <a href="https://syraa.fun" className="hover:text-primary transition-colors">
              Website
            </a>
          </div>
        </div>
      </footer>
    </DocsLayout>
  );
}
