import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Coins,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Package,
  Play,
  Plug,
  SlidersHorizontal,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaygroundResponseSheet } from "@/components/playground/PlaygroundResponseSheet";
import { PlaygroundModals } from "@/components/playground/PlaygroundModals";
import { QueryParamsModal } from "@/components/QueryParamsModal";
import { getParamsForExampleFlow, type ExampleFlowPreset } from "@/hooks/useApiPlayground";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useMarketplaceOpenApiOperation } from "@/hooks/useMarketplaceOpenApiOperation";
import { flowNeedsParamModal } from "@/lib/playgroundFlow";
import { getPlaygroundSyraPathname } from "@/lib/playgroundUrl";
import { MARKETPLACE_ROUTE } from "@/lib/marketplaceConstants";
import { buildMarketplaceUsageSnippets } from "@/lib/marketplaceApiUsage";
import { buildMarketplaceApiDetail } from "@/lib/marketplaceApiDetailModel";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import {
  PLAYGROUND_PAGE_CLASS,
  playgroundPanelClass,
} from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type SnippetTab = "mcp" | "sdk" | "curl";

const PAYMENT_STEPS = [
  {
    title: "Wire MCP or SDK",
    detail: "Install @syra-ai/mcp-server or @syra-ai/x402-payer. Agents discover routes via /.well-known/x402 and /agent/tools — no shopping cart.",
  },
  {
    title: "Call the endpoint",
    detail: "First response is HTTP 402 with x402 payment requirements (amount, recipient, network).",
  },
  {
    title: "Sign & retry",
    detail: "Signer settles USDC, adds PAYMENT-SIGNATURE, and retries the same request for the JSON payload.",
  },
  {
    title: "Optional: try in-browser",
    detail: "Use Try in browser below if you want a human preview — Syra handles the 402 → pay → retry loop.",
  },
] as const;

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

function FactCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/45 bg-muted/15 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

interface MarketplaceApiDetailViewProps {
  flow: ExampleFlowPreset;
}

export function MarketplaceApiDetailView({ flow }: MarketplaceApiDetailViewProps) {
  const { toast } = useToast();
  const { openConnectModal } = useConnectModal();
  const path = getPlaygroundSyraPathname(flow.url) || flow.url;
  const openApi = useMarketplaceOpenApiOperation(path);

  const detail = useMemo(
    () =>
      buildMarketplaceApiDetail(flow, {
        openApiDescription: openApi.description,
        openApiSummary: openApi.summary,
        openApiTags: openApi.tags,
      }),
    [flow, openApi.description, openApi.summary, openApi.tags],
  );

  const {
    wallet,
    status,
    response,
    paymentDetails,
    runExampleFlowFromPreset,
    sendRequest,
    setIsPaymentModalOpen,
    selectedPaymentChain,
    selectPaymentChain,
    paymentOptionsByChain,
    isResponsePanelOpen,
    setIsResponsePanelOpen,
  } = usePlaygroundSession();

  const [snippetTab, setSnippetTab] = useState<SnippetTab>("mcp");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [copiedQuick, setCopiedQuick] = useState<"mcp" | "sdk" | null>(null);
  const [paramsModalFlow, setParamsModalFlow] = useState<ExampleFlowPreset | null>(null);
  const [paramsModalInitialParams, setParamsModalInitialParams] = useState<
    import("@/types/api").RequestParam[]
  >([]);

  const snippets = useMemo(
    () => buildMarketplaceUsageSnippets(flow, detail.exampleRequestUrl),
    [flow, detail.exampleRequestUrl],
  );

  const paymentLane = useMemo(() => {
    try {
      return resolvePlaygroundPaymentLane(flow.url, response);
    } catch {
      return "x402" as const;
    }
  }, [flow.url, response]);

  const isLoading = status === "loading";
  const activeSnippet = snippets[snippetTab];
  const manifestJson = useMemo(
    () => JSON.stringify(detail.agentManifest, null, 2),
    [detail.agentManifest],
  );

  useEffect(() => {
    document.title = `${detail.name} · Syra APIs`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", detail.summary || detail.description.slice(0, 160));
    return () => {
      document.title = "Syra APIs";
    };
  }, [detail.name, detail.summary, detail.description]);

  useEffect(() => {
    const id = "syra-api-agent-manifest";
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = id;
      el.type = "application/json";
      document.head.appendChild(el);
    }
    el.textContent = manifestJson;
    return () => {
      el?.remove();
    };
  }, [manifestJson]);

  useEffect(() => {
    if (paymentLane !== "mpp") return;
    if (selectedPaymentChain !== "solana") selectPaymentChain("solana");
  }, [paymentLane, selectedPaymentChain, selectPaymentChain]);

  useEffect(() => {
    if (paramsModalFlow) setIsResponsePanelOpen(false);
  }, [paramsModalFlow, setIsResponsePanelOpen]);

  const handleTry = useCallback(() => {
    const paramsForFlow = getParamsForExampleFlow(flow);
    if (flowNeedsParamModal(flow, paramsForFlow)) {
      setIsResponsePanelOpen(false);
      setParamsModalFlow(flow);
      setParamsModalInitialParams(paramsForFlow);
      return;
    }
    setIsResponsePanelOpen(true);
    void runExampleFlowFromPreset(flow, paramsForFlow);
  }, [flow, runExampleFlowFromPreset, setIsResponsePanelOpen]);

  const handleRunWithParams = useCallback(
    (nextParams: import("@/types/api").RequestParam[]) => {
      setParamsModalFlow(null);
      setParamsModalInitialParams([]);
      setIsResponsePanelOpen(true);
      void runExampleFlowFromPreset(flow, nextParams);
    },
    [flow, runExampleFlowFromPreset, setIsResponsePanelOpen],
  );

  const copyText = async (text: string, kind: "snippet" | "manifest" | "mcp" | "sdk") => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === "snippet") {
        setCopiedSnippet(true);
        window.setTimeout(() => setCopiedSnippet(false), 2000);
      } else if (kind === "manifest") {
        setCopiedManifest(true);
        window.setTimeout(() => setCopiedManifest(false), 2000);
      } else {
        setCopiedQuick(kind);
        window.setTimeout(() => setCopiedQuick(null), 2000);
      }
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <>
      <article
        className={cn(PLAYGROUND_PAGE_CLASS, "space-y-6 pb-24 sm:space-y-8")}
        itemScope
        itemType="https://schema.org/WebAPI"
      >
        <meta itemProp="name" content={detail.name} />
        <meta itemProp="description" content={detail.description} />

        <nav
          className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            to={`${MARKETPLACE_ROUTE}?tab=syra`}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Catalog
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
          <span className="truncate rounded-lg px-2 py-1 text-foreground">{detail.name}</span>
        </nav>

        <header className={cn(playgroundPanelClass, "p-5 sm:p-7")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {detail.category ? (
                  <span className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground ring-1 ring-border/40">
                    {detail.category}
                  </span>
                ) : null}
                <span className="rounded-md bg-primary/[0.06] px-2 py-0.5 text-[10px] font-medium text-primary/90 ring-1 ring-primary/15">
                  {detail.tierLabel}
                </span>
                {detail.brand ? (
                  <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/40">
                    {detail.brand}
                  </span>
                ) : null}
              </div>

              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {detail.name}
                </h1>
                {detail.summary ? (
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                    {detail.summary}
                  </p>
                ) : null}
              </div>

              <ul className="space-y-2">
                {detail.humanBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg border border-border/50 bg-muted/25 px-3 py-1.5 font-mono text-xs text-foreground/85">
                  {detail.method} {detail.path}
                </code>
                {detail.priceLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                    <Coins className="h-3.5 w-3.5" aria-hidden />
                    {detail.priceLabel} / call
                  </span>
                ) : null}
              </div>
              {detail.priceLabel ? (
                <p className="text-xs text-muted-foreground">
                  Includes Syra platform fee over upstream.{" "}
                  <a
                    href="https://docs.syraa.fun/docs/build/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Pricing vs DIY
                  </a>
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:min-w-[12rem]">
              <Button
                type="button"
                size="sm"
                className="h-10 rounded-xl px-4"
                onClick={() => void copyText(snippets.mcp, "mcp")}
              >
                {copiedQuick === "mcp" ? (
                  <Check className="mr-1.5 h-4 w-4" aria-hidden />
                ) : (
                  <Plug className="mr-1.5 h-4 w-4" aria-hidden />
                )}
                {copiedQuick === "mcp" ? "Copied MCP" : "Copy MCP snippet"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-10 rounded-xl px-4"
                onClick={() => void copyText(snippets.sdk, "sdk")}
              >
                {copiedQuick === "sdk" ? (
                  <Check className="mr-1.5 h-4 w-4" aria-hidden />
                ) : (
                  <Package className="mr-1.5 h-4 w-4" aria-hidden />
                )}
                {copiedQuick === "sdk" ? "Copied SDK" : "Copy SDK snippet"}
              </Button>
              <div className="flex flex-col gap-2 border-t border-border/40 pt-2 sm:flex-row lg:flex-col">
                {wallet.connected ? (
                  <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-xs font-medium tabular-nums text-foreground">
                    <Wallet className="h-4 w-4 text-primary" aria-hidden />
                    {wallet.balance || "0 USDC"}
                  </span>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => openConnectModal()}>
                    <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
                    Connect wallet
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl px-4"
                  disabled={isLoading}
                  onClick={handleTry}
                >
                  {isLoading ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Play className="mr-1.5 h-4 w-4" aria-hidden />
                  )}
                  Try in browser
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section
          className={cn(playgroundPanelClass, "border-primary/20 bg-primary/[0.03] p-5 sm:p-6")}
          id="agent-reference"
          aria-labelledby="agent-reference-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Bot className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="agent-reference-title" className="text-base font-semibold text-foreground">
                  For AI agents
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Primary path: MCP / SDK / paid fetch. Copy the agent manifest for routers and
                  autonomous callers, or read the{" "}
                  <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[11px]">
                    #syra-api-agent-manifest
                  </code>{" "}
                  script tag on this page.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs"
              onClick={() => void copyText(manifestJson, "manifest")}
            >
              {copiedManifest ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              Copy agent manifest
            </Button>
          </div>

          <pre
            id="syra-api-agent-manifest-display"
            className="mt-4 max-h-[20rem] overflow-auto rounded-xl border border-border/50 bg-background/80 p-4 font-mono text-[11px] leading-relaxed text-foreground/90"
          >
            {manifestJson}
          </pre>
        </section>

        <section className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
          <SectionTitle>Quick reference</SectionTitle>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <FactCell label="Method" value={detail.method} />
            <FactCell label="Payment" value="x402 micropay (USDC)" />
            <FactCell label="Networks" value="Solana · Base" />
            <FactCell label="Price" value={detail.priceLabel ? `${detail.priceLabel} / call` : "See 402 response"} />
            <FactCell label="Flow ID" value={detail.flowId} />
            <FactCell label="Tier" value={detail.tierLabel} />
            {detail.brand ? <FactCell label="Provider" value={detail.brand} /> : null}
            {detail.category ? <FactCell label="Category" value={detail.category} /> : null}
          </div>
        </section>

        {(detail.parsed.whenToUse || detail.parsed.returnsSummary || detail.parsed.inputsSummary) && (
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.parsed.whenToUse ? (
              <div className={cn(playgroundPanelClass, "border-primary/20 bg-primary/[0.03] p-5 sm:p-6")}>
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" aria-hidden />
                  <h2 className="text-sm font-semibold">When to use</h2>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{detail.parsed.whenToUse}</p>
              </div>
            ) : null}
            {detail.parsed.inputsSummary ? (
              <div className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
                <SectionTitle>Inputs</SectionTitle>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{detail.parsed.inputsSummary}</p>
              </div>
            ) : null}
            {detail.parsed.returnsSummary ? (
              <div className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
                <SectionTitle>What you get</SectionTitle>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{detail.parsed.returnsSummary}</p>
              </div>
            ) : null}
          </section>
        )}

        <section className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
          <SectionTitle>Full description</SectionTitle>
          {openApi.loading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading full API documentation…</p>
          ) : (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
              {detail.description}
            </p>
          )}
        </section>

        <section className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
          <SectionTitle>Endpoint</SectionTitle>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Example request URL</p>
              <code className="mt-1 block overflow-x-auto rounded-xl border border-border/50 bg-muted/20 p-3 font-mono text-xs text-foreground/90">
                {detail.exampleRequestUrl}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <a href={detail.openApiUrl} target="_blank" rel="noopener noreferrer">
                  OpenAPI spec
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <a href={detail.discoveryUrl} target="_blank" rel="noopener noreferrer">
                  x402 discovery
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <a href={detail.docsUrl} target="_blank" rel="noopener noreferrer">
                  Integration guide
                  <ExternalLink className="ml-1.5 h-3 w-3" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
          <SectionTitle>Parameters</SectionTitle>
          {detail.parameters.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-border/50 bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Required</th>
                    <th className="px-4 py-2.5 font-medium">Example</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.parameters.map((param) => (
                    <tr key={param.name} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{param.name}</td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 font-medium",
                            param.required
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground",
                          )}
                        >
                          {param.required ? "Yes" : "Optional"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-primary/90">
                        {param.example || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {param.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : detail.requestBody ? (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border/50 bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground/90">
              {detail.requestBody}
            </pre>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
              No query parameters — send a direct {detail.method} request.
            </p>
          )}
        </section>

        <section className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
          <SectionTitle>How payment works</SectionTitle>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {PAYMENT_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-3 rounded-xl border border-border/40 bg-muted/10 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={cn(playgroundPanelClass, "p-5 sm:p-6")}>
          <SectionTitle>Code examples</SectionTitle>
          <div className="mt-4 flex flex-wrap gap-2 border-b border-border/40 pb-3">
            {(
              [
                { id: "mcp" as const, label: "MCP" },
                { id: "sdk" as const, label: "TypeScript" },
                { id: "curl" as const, label: "curl" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSnippetTab(id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  snippetTab === id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-8 gap-1.5 text-xs"
              onClick={() => void copyText(activeSnippet, "snippet")}
            >
              {copiedSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </Button>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border/50 bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground/90">
            {activeSnippet}
          </pre>
        </section>
      </article>

      <PlaygroundResponseSheet
        open={isResponsePanelOpen}
        onOpenChange={setIsResponsePanelOpen}
        title={detail.name}
        subtitle={detail.path}
        status={status}
        response={response}
        paymentDetails={paymentDetails}
        paymentLane={paymentLane}
        isLoading={isLoading}
        selectedPaymentChain={selectedPaymentChain}
        onSelectPaymentChain={selectPaymentChain}
        paymentOptionsByChain={paymentOptionsByChain}
        onRunAgain={handleTry}
        onPayAndRetry={() => setIsPaymentModalOpen(true)}
        onResend={() => {
          void sendRequest();
        }}
      />

      <QueryParamsModal
        isOpen={!!paramsModalFlow}
        onClose={() => {
          setParamsModalFlow(null);
          setParamsModalInitialParams([]);
        }}
        flow={paramsModalFlow}
        initialParams={paramsModalInitialParams}
        onRun={handleRunWithParams}
      />

      <PlaygroundModals />
    </>
  );
}
