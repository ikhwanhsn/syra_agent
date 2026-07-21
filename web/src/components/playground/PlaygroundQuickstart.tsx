import { useCallback, useState } from "react";

import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Package,
  Plug,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { SYRA_ONE_LINER } from "@/content/syraFocus";
import { SYRA_LIVE_SUBLINE } from "@/lib/syraBranding";

import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";

import { PlaygroundHero } from "@/components/playground/PlaygroundHero";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";

import {
  PLAYGROUND_PAGE_CLASS,
  playgroundPanelClass,
  playgroundStatPillClass,
} from "@/components/playground/playgroundStyles";

type SnippetTab = "mcp" | "sdk" | "curl";

const SNIPPET_TABS: {
  id: SnippetTab;
  label: string;
  icon: typeof Terminal;
  blurb: string;
}[] = [
  {
    id: "mcp",
    label: "MCP server",
    icon: Plug,
    blurb: "Recommended — first paid call from Cursor or Claude.",
  },
  {
    id: "sdk",
    label: "TypeScript SDK",
    icon: Package,
    blurb: "Typed client for agents — handles signing and retries.",
  },
  {
    id: "curl",
    label: "curl",
    icon: Terminal,
    blurb: "Discover payment requirements and inspect raw x402 headers.",
  },
];

const INTEGRATION_LINKS = [
  { label: "MCP setup", href: "https://docs.syraa.fun/docs/build/mcp" },
  { label: "SDK guide", href: "https://docs.syraa.fun/docs/build/sdk" },
  { label: "x402 discovery", href: "https://api.syraa.fun/.well-known/x402" },
  { label: "Agent tools", href: "https://api.syraa.fun/agent/tools" },
  { label: "OpenAPI", href: "https://api.syraa.fun/openapi.json" },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Install MCP",
    body: "Add Syra to Cursor or Claude. Copy the mcp.json snippet below (or run the one-liner).",
  },
  {
    n: "02",
    title: "Fund the payer wallet",
    body: "Put ≥ $1 USDC on Solana in the wallet behind SYRA_PAYER_KEYPAIR, plus a little SOL for fees. Phantom or any Solana wallet works.",
  },
  {
    n: "03",
    title: "Call syra_spend_news",
    body: "Ask your agent for BTC news (or invoke syra_spend_news). Expect structured JSON after a settled 402.",
  },
  {
    n: "04",
    title: "Confirm success",
    body: "You should see news articles in the tool result. Check syraa.fun for public paid-call traction.",
  },
] as const;

const TROUBLESHOOTING = [
  {
    title: "402 keeps returning / payment fails",
    fix: "Confirm SYRA_PAYER_KEYPAIR is a valid Solana secret, the wallet holds USDC (not only SOL), and SYRA_API_BASE_URL is https://api.syraa.fun.",
  },
  {
    title: "Insufficient funds",
    fix: "Top up ≥ $1 USDC on Solana mainnet. Micro-routes start around $0.001–$0.02; keep a buffer for retries.",
  },
  {
    title: "Tool not found / empty tools",
    fix: 'Set SYRA_MCP_TOOL_PROFILE=curated (default) and restart the MCP host. Use syra_call_tool with a toolId from GET /agent/tools as escape hatch.',
  },
] as const;

function buildSnippets(apiBase: string) {
  const base = apiBase.replace(/\/$/, "");
  const newsUrl = `${base}/news?ticker=BTC`;

  return {
    curl: `# 1. First call returns HTTP 402 with x402 payment requirements

curl -i "${newsUrl}"

# 2. Complete payment with your Solana wallet + retry with PAYMENT-SIGNATURE header

# See docs: https://docs.syraa.fun/docs/x402-agent/getting-started`,

    sdk: `# Install
npm install @syra-ai/sdk

# First paid call — createSyraPaidClient reads SYRA_PAYER_KEYPAIR from env

import { createSyraPaidClient } from "@syra-ai/sdk";

const syra = await createSyraPaidClient({
  baseUrl: "${base}",
});

const news = await syra.get("/news", { ticker: "BTC" });
console.log(news);`,

    mcp: `# Cursor mcp.json (or Claude Desktop MCP config)

{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "${base}",
        "SYRA_MCP_TOOL_PROFILE": "curated",
        "SYRA_PAYER_KEYPAIR": "\${SYRA_PAYER_KEYPAIR}"
      }
    }
  }
}

# One-liner (Claude Code):
# claude mcp add syra -- npx -y @syra-ai/mcp-server@latest

# Then call: syra_spend_news with ticker BTC

# Local only (skips payment):
# SYRA_USE_DEV_ROUTES=true + local api base URL`,
  };
}

export function PlaygroundQuickstart() {
  const [tab, setTab] = useState<SnippetTab>("mcp");
  const [copied, setCopied] = useState(false);
  const apiBase = resolveApiBaseUrl();
  const snippets = buildSnippets(apiBase);
  const activeSnippet = snippets[tab];
  const activeMeta = SNIPPET_TABS.find((t) => t.id === tab)!;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }, [activeSnippet]);

  return (
    <div className={cn(PLAYGROUND_PAGE_CLASS, "space-y-6 sm:space-y-8")}>
      <PlaygroundHero
        kicker="First paid call"
        title="First paid call in 5 minutes"
        description={`${SYRA_LIVE_SUBLINE}. Install MCP, fund ≥ $1 USDC on Solana, call syra_spend_news — settle x402 and get JSON agents can act on.`}
        badges={
          <>
            <span className={playgroundStatPillClass}>
              <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
              x402 · Solana USDC
            </span>
            <span className={playgroundStatPillClass}>
              <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden />
              ≥ $1 USDC
            </span>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {INTEGRATION_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-background"
              >
                {label}
                <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />
              </a>
            ))}
          </div>
        }
      />

      <p className={cn("max-w-2xl text-sm leading-relaxed text-muted-foreground", playgroundSectionEnter)}>
        <span className="font-medium text-foreground">{SYRA_ONE_LINER}</span>
        {" — "}
        This is the canonical activation path. Catalog browse is optional for humans.
      </p>

      <ol
        className={cn(
          "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
          playgroundSectionEnter,
        )}
        style={{ animationDelay: "40ms" }}
      >
        {STEPS.map((step) => (
          <li
            key={step.n}
            className={cn(playgroundPanelClass, "flex flex-col p-4")}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Step {step.n}
            </span>
            <h3 className="mt-2 text-sm font-semibold text-foreground">{step.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>

      <div
        className={cn(
          "grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-6",
          playgroundSectionEnter,
        )}
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Integration path
          </p>

          {SNIPPET_TABS.map(({ id, label, icon: Icon, blurb }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "group flex w-full flex-col rounded-2xl border p-4 text-left transition-all duration-200",
                  active
                    ? "border-primary/40 bg-primary/[0.04] shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_16px_40px_-24px_hsl(var(--primary)/0.25)] ring-1 ring-primary/15"
                    : cn(playgroundPanelClass, "hover:border-border/70 hover:shadow-md"),
                )}
              >
                <span className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/40 text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  {label}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">{blurb}</span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{activeMeta.label}</p>
              <p className="text-xs text-muted-foreground">{activeMeta.blurb}</p>
            </div>
            <button
              type="button"
              onClick={() => void copy()}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                copied
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/50",
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              {copied ? "Copied" : "Copy snippet"}
            </button>
          </div>

          <div
            className={cn(
              playgroundPanelClass,
              "playground-code-panel relative min-h-[320px] flex-1 overflow-hidden",
            )}
          >
            <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" aria-hidden />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                {tab === "curl" ? "terminal" : tab === "sdk" ? "agent.ts" : "mcp.json"}
              </span>
            </div>
            <pre className="max-h-[420px] overflow-auto p-5 font-mono text-[12px] leading-[1.65] text-foreground/90 sm:text-[13px]">
              <code>{activeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>

      <section
        className={cn(playgroundPanelClass, "space-y-4 p-5", playgroundSectionEnter)}
        style={{ animationDelay: "100ms" }}
        aria-labelledby="quickstart-troubleshoot"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          <h2 id="quickstart-troubleshoot" className="text-sm font-semibold text-foreground">
            Troubleshooting
          </h2>
        </div>
        <ul className="space-y-3">
          {TROUBLESHOOTING.map((item) => (
            <li key={item.title}>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.fix}</p>
            </li>
          ))}
        </ul>
      </section>

      <div
        className={cn(
          "flex flex-col gap-2 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between",
          playgroundSectionEnter,
        )}
        style={{ animationDelay: "120ms" }}
      >
        <p className="text-xs text-muted-foreground">
          Next: fund USDC, call <span className="font-mono text-foreground/80">syra_spend_news</span>, then explore
          Invest / Earn betas via <span className="font-mono text-foreground/80">GET /pillars</span>.
        </p>
        <a
          href="https://docs.syraa.fun/docs/build/mcp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          MCP setup docs
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
