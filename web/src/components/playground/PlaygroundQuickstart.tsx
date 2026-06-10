import { useCallback, useState } from "react";

import { Check, Copy, ExternalLink, Package, Plug, Terminal, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

import { SYRA_ONE_LINER } from "@/content/syraFocus";

import { resolveApiBaseUrl } from "@/lib/resolveApiBaseUrl";

import { playgroundSectionEnter } from "@/components/playground/playgroundMotion";

import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";



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

    <div className={cn(PLAYGROUND_PAGE_CLASS, "space-y-6")}>

      {/* Hero strip */}

      <div

        className={cn(

          "playground-build-hero relative overflow-hidden rounded-2xl border border-border/50 p-6 sm:p-8",

          playgroundSectionEnter,

        )}

      >

        <div className="relative z-[1] max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Developer playground
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            Build on the rail
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Discover Syra x402 endpoints, integrate with SDK or MCP, or send custom payment-gated
            requests — all from one surface.
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Zap className="h-3 w-3" aria-hidden />
            x402 v2 · Solana USDC
          </div>

          <p className="mt-3 text-base font-medium tracking-tight text-foreground sm:text-lg">
            {SYRA_ONE_LINER}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Copy-paste integration paths for discovery, typed agents, and MCP hosts. Pick a method,
            copy the snippet, and ship in minutes.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            {INTEGRATION_LINKS.map(({ label, href }) => (

              <a

                key={href}

                href={href}

                target="_blank"

                rel="noopener noreferrer"

                className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-background"

              >

                {label}

                <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden />

              </a>

            ))}

          </div>

        </div>

      </div>



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

                  "group flex w-full flex-col rounded-xl border p-4 text-left transition-all duration-200",

                  active

                    ? "border-primary/40 bg-primary/[0.04] shadow-glow-sm ring-1 ring-primary/15"

                    : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80",

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



          <div className="playground-code-panel relative min-h-[320px] flex-1 overflow-hidden rounded-xl border border-border/50">

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

