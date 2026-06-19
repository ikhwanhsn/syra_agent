import { useCallback, useState } from "react";

import { Check, Copy, ExternalLink, Package, Plug, Terminal, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import { SYRA_ONE_LINER } from "@/content/syraFocus";

import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";

import { PlaygroundHero } from "@/components/playground/PlaygroundHero";
import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";

import {
  PLAYGROUND_PAGE_CLASS,
  playgroundPanelClass,
  playgroundStatPillClass,
} from "@/components/playground/playgroundStyles";



type SnippetTab = "curl" | "sdk" | "mcp";



const SNIPPET_TABS: {

  id: SnippetTab;

  label: string;

  icon: typeof Terminal;

  blurb: string;

}[] = [

  {

    id: "curl",

    label: "curl",

    icon: Terminal,

    blurb: "Discover payment requirements and inspect raw x402 headers.",

  },

  {

    id: "sdk",

    label: "TypeScript SDK",

    icon: Package,

    blurb: "Typed client for agents — handles signing and retries.",

  },

  {

    id: "mcp",

    label: "MCP server",

    icon: Plug,

    blurb: "Wire Syra into Cursor, Claude Desktop, or any MCP host.",

  },

];



const INTEGRATION_LINKS = [

  { label: "Getting started", href: "https://docs.syraa.fun/docs/x402-agent/getting-started" },

  { label: "OpenAPI catalog", href: "https://api.syraa.fun" },

  { label: "MCP setup", href: "https://docs.syraa.fun" },

] as const;



function buildSnippets(apiBase: string) {

  const newsUrl = `${apiBase.replace(/\/$/, "")}/news?ticker=BTC`;

  return {

    curl: `# 1. First call returns HTTP 402 with x402 payment requirements

curl -i "${newsUrl}"



# 2. Complete payment with your Solana wallet + retry with PAYMENT-SIGNATURE header

# See docs: https://docs.syraa.fun/docs/x402-agent/getting-started`,

    sdk: `# Install

npm install @syra/sdk



# First paid call (provide a signer that implements SyraPaymentSigner)

import { createSyraClient } from "@syra/sdk";



const syra = createSyraClient({

  baseUrl: "${apiBase.replace(/\/$/, "")}",

  signer: mySolanaSigner, // signs x402 USDC payment

});



const news = await syra.get("/news", { ticker: "BTC" });

console.log(news);`,

    mcp: `# Cursor / Claude Desktop — add to MCP config (stdio)

{

  "mcpServers": {

    "syra": {

      "command": "npx",

      "args": ["-y", "@syra/mcp-server"],

      "env": {

        "SYRA_API_BASE_URL": "${apiBase.replace(/\/$/, "")}"

      }

    }

  }

}



# Local dev without payment:

# SYRA_USE_DEV_ROUTES=true + local api base URL`,

  };

}



export function PlaygroundQuickstart() {

  const [tab, setTab] = useState<SnippetTab>("curl");

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
        kicker="Developer playground"
        title="Build on the rail"
        description="Discover Syra x402 endpoints, integrate with SDK or MCP, or send custom payment-gated requests — all from one surface."
        badges={
          <>
            <span className={playgroundStatPillClass}>
              <Zap className="h-3.5 w-3.5 text-primary" aria-hidden />
              x402 v2 · Solana USDC
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
        Copy-paste integration paths for discovery, typed agents, and MCP hosts.
      </p>



      <div

        className={cn(

          "grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-6",

          playgroundSectionEnter,

        )}

        style={{ animationDelay: "60ms" }}

      >

        {/* Method picker */}

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

                    : cn(
                        playgroundPanelClass,
                        "hover:border-border/70 hover:shadow-md",
                      ),

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



        {/* Code panel */}

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



          <div className={cn(playgroundPanelClass, "playground-code-panel relative min-h-[320px] flex-1 overflow-hidden")}>

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

    </div>

  );

}

