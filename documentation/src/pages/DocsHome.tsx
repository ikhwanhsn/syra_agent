import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageCircle,
  Cpu,
  BarChart3,
  Bot,
  Zap,
  BookOpen,
  ExternalLink,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "AI-Assisted Insights",
    description: "Multiple indicators + reasoning → structured trade outlooks. Real-time market data and on-chain signals.",
    href: "/docs/welcome",
  },
  {
    icon: Bot,
    title: "Syra Agent",
    description: "Chat with the AI agent at agent.syraa.fun for market analysis, signals, and research-driven insights.",
    href: "/docs/agent/getting-started",
  },
  {
    icon: MessageCircle,
    title: "x402 Autonomous Agent",
    description: "Ranked #1 on x402scan. Automated research, news & narrative monitoring, signal pipelines.",
    href: "/docs/x402-agent/getting-started",
  },
  {
    icon: Zap,
    title: "API & Workflows",
    description: "x402 v2 API for news, sentiment, research, signals. Try the API Playground at playground.syraa.fun or integrate with n8n.",
    href: "/docs/api-reference",
  },
  {
    icon: Cpu,
    title: "Research-Driven Output",
    description: "Focused on understanding — not blind execution. Every output includes explanations & indicators.",
    href: "/docs/welcome",
  },
  {
    icon: BookOpen,
    title: "Educational Context",
    description: "Market overview, technical indicators, action perspectives, risk context, and AI insights.",
    href: "/docs/agent/how-it-works",
  },
];

export default function DocsHome() {
  return (
    <DocsLayout>
      <div className="relative pb-12 mb-12 border-b border-border">
        <div className="absolute inset-0 -z-10 bg-hero-gradient" />

        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              AI Trading Intelligence • Solana
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 animate-fade-in">
            Research-driven{" "}
            <span className="gradient-text-primary">AI Trading Intelligence</span>{" "}
            for Solana
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed animate-fade-in animation-delay-100">
            Syra helps traders, analysts, and builders make smarter, data-based decisions
            with real-time market data, on-chain signals, narrative & sentiment intelligence,
            and structured AI-driven research. Try the{" "}
            <strong className="text-foreground">Syra Agent</strong> at agent.syraa.fun, or use the API and #1 x402 Agent on x402scan.
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
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Where Syra Runs</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Syra is an intelligence layer — not just a signal bot. Use the <strong className="text-foreground">Syra Agent</strong> at agent.syraa.fun, the x402 Agent, API workflows, and more.
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
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
              <div className="text-sm text-muted-foreground">What is Syra, where it runs, quick start</div>
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
              <div className="text-sm text-muted-foreground">Chat at agent.syraa.fun — signals, tokens, insights</div>
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
              <div className="text-sm text-muted-foreground">x402 v2 API, endpoints, standards. Try playground.syraa.fun</div>
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
          <div className="max-w-xl">Syra — AI Trading Intelligence for Solana. Built for clarity and structured reasoning.</div>
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
