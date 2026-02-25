import { useState, useEffect, useRef } from "react";
import {
  fetchResearch,
  fetchBrowse,
  fetchXSearch,
  fetchResearchResume,
  fetchResearchStore,
  saveResearchStore,
  type StoredResearchPayload,
} from "../api/research";
import { LoadingState, LoadingStateInline } from "../components/LoadingState";
import { useWalletContext } from "../contexts/WalletContext";
import { cn } from "../lib/utils";

type PanelState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

type XSearchData = { result: string; query?: string; citations?: unknown[] };

function hasStoredData(payload: StoredResearchPayload | null): boolean {
  if (!payload) return false;
  return (
    (payload.panels != null && Object.keys(payload.panels).length > 0) ||
    !!payload.customXSearch ||
    !!payload.deepResearch ||
    !!payload.browse ||
    !!payload.resume
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  className,
  onRefresh,
  showRefresh,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
  onRefresh?: () => void;
  showRefresh?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-800 bg-syra-card p-4 shadow-sm transition-colors hover:border-gray-700 sm:p-5",
        className
      )}
    >
      <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-syra-primary/15 text-base sm:h-10 sm:w-10 sm:text-lg"
            aria-hidden
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {showRefresh && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-600 bg-gray-800/60 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-500 hover:bg-gray-700/60 hover:text-white sm:w-auto"
            title="Refresh for fresh research"
          >
            <span aria-hidden>↻</span>
            Refresh
          </button>
        )}
      </div>
      <div className="min-h-[120px]">{children}</div>
    </div>
  );
}

function ContentBox({
  state,
  render,
  emptyMessage = "Run a query or use a preset below to see results.",
}: {
  state: PanelState<unknown>;
  render: (data: unknown) => React.ReactNode;
  emptyMessage?: string;
}) {
  if (state.status === "loading") {
    return <LoadingState message="Loading…" size="md" />;
  }
  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-200">
        {state.error}
      </div>
    );
  }
  if (state.status === "success") {
    return (
      <div className="max-h-[60vh] overflow-y-auto overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/20 p-3 text-sm sm:max-h-[70vh] sm:p-4">
        <div className="space-y-3">{render(state.data)}</div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 p-6 text-center">
      <p className="text-sm text-gray-500">{emptyMessage}</p>
    </div>
  );
}

/** Renders markdown-like text: # headings, **bold**, links (including [[n]](url)), lists, paragraphs */
function MarkdownLike({ text }: { text: string }) {
  function renderInline(content: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let key = 0;
    // **bold**, [[1]](url) ref links, [text](url), raw https? URLs
    const regex = /(\*\*[^*]+\*\*)|(\[\[\d+\]\]\([^)]+\))|(\[[^\]]*\]\([^)]+\))|(https?:\/\/[^\s)]+)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(remaining)) !== null) {
      if (m.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, m.index));
      }
      if (m[1]) {
        parts.push(<strong key={key++} className="font-semibold text-white">{m[1].slice(2, -2)}</strong>);
      } else if (m[2]) {
        const refMatch = m[2].match(/\[\[(\d+)\]\]\(([^)]+)\)/);
        if (refMatch) {
          parts.push(
            <a key={key++} href={refMatch[2]} target="_blank" rel="noopener noreferrer" className="text-syra-primary hover:underline" title={refMatch[2]}>
              [{refMatch[1]}]
            </a>
          );
        } else parts.push(m[2]);
      } else if (m[3]) {
        const linkMatch = m[3].match(/\[([^\]]*)\]\(([^)]+)\)/);
        if (linkMatch) {
          parts.push(
            <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-syra-primary hover:underline">
              {linkMatch[1] || linkMatch[2]}
            </a>
          );
        } else parts.push(m[3]);
      } else if (m[4]) {
        parts.push(
          <a key={key++} href={m[4]} target="_blank" rel="noopener noreferrer" className="text-syra-primary hover:underline break-all">
            {m[4]}
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < remaining.length) parts.push(remaining.slice(lastIndex));
    if (parts.length === 0) return content;
    return <>{parts}</>;
  }

  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm text-gray-300">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        // # Heading (single)
        if (/^#\s+/.test(trimmed) && !/^##\s+/.test(trimmed)) {
          return (
            <h1 key={i} className="mt-4 text-xl font-semibold text-white first:mt-0">
              {renderInline(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }
        // ## Heading
        if (/^##\s+/.test(trimmed) && !/^###\s+/.test(trimmed)) {
          return (
            <h2 key={i} className="mt-4 text-lg font-semibold text-white first:mt-0">
              {renderInline(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }
        // ### Heading
        if (/^###\s+/.test(trimmed) && !/^####\s+/.test(trimmed)) {
          return (
            <h3 key={i} className="mt-4 text-base font-semibold text-white first:mt-0">
              {renderInline(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }
        // #### Heading
        if (/^####\s+/.test(trimmed)) {
          return (
            <h4 key={i} className="mt-3 text-sm font-semibold text-white first:mt-0">
              {renderInline(trimmed.replace(/^####\s+/, ""))}
            </h4>
          );
        }
        // Numbered list (1. or 2. etc)
        if (/^\d+\.\s+/m.test(trimmed)) {
          const items = trimmed.split(/\n/).filter(Boolean);
          return (
            <ul key={i} className="list-inside list-decimal space-y-2 pl-1">
              {items.map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^\d+\.\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        // Unordered list
        if (/^[-*]\s+/m.test(trimmed)) {
          const items = trimmed.split(/\n/).filter(Boolean);
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {items.map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

const SYRA_PRESETS = [
  {
    id: "growth",
    label: "Growth strategy",
    description: "Syra growth & GTM",
    xSearchQuery: '(AI agent OR "onchain AI" OR "crypto AI tool") (need OR looking for OR building) -airdrop -giveaway lang:en'
  },
  {
    id: "features",
    label: "New feature ideas",
    description: "Crypto research API and AI tools",
    xSearchQuery: '("onchain data" OR "wallet analytics" OR "crypto research tool") (problem OR missing OR wish) -job -hiring lang:en'
  },
  {
    id: "competitors",
    label: "Competitors & market",
    description: "Competitive landscape",
    xSearchQuery: '(Nansen OR Dune OR Arkham OR Flipside OR DefiLlama) (API OR AI OR agent) lang:en'
  },
  {
    id: "adoption",
    label: "Adoption & distribution",
    description: "Crypto API adoption and developer distribution",
    xSearchQuery: '("developer API" OR "crypto SDK" OR "web3 API") (launched OR integrating OR building with) -course lang:en'
  },
  {
    id: "monetization",
    label: "Monetization & pricing",
    description: "Paid API and x402 monetization",
    xSearchQuery: '("API pricing" OR "usage based billing" OR "pay per API call" OR "micropayments") (crypto OR AI) lang:en'
  },
  {
    id: "partnerships",
    label: "Partnerships & integrations",
    description: "Crypto AI partnerships and integrations",
    xSearchQuery: '(integration OR partner OR ecosystem) ("AI agent" OR "onchain data" OR "crypto API") -announcement lang:en'
  },
  {
    id: "ux",
    label: "UX & onboarding",
    description: "Crypto app UX and user onboarding",
    xSearchQuery: '("developer onboarding" OR "API documentation" OR "SDK experience") (confusing OR hard OR friction) lang:en'
  },
  {
    id: "trends",
    label: "Market trends",
    description: "Crypto AI and agent trends",
    xSearchQuery: '("AI agents" OR "autonomous agent" OR "machine to machine payments") (trend OR future OR 2025) lang:en'
  },
  {
    id: "differentiation",
    label: "Differentiation & positioning",
    description: "Crypto research API differentiation",
    xSearchQuery: '("onchain analytics" OR "crypto research API") (better than OR alternative to OR vs) lang:en'
  },
  {
    id: "community",
    label: "Community & feedback",
    description: "Syra and crypto API community feedback",
    xSearchQuery: '("onchain tools" OR "crypto analytics") (recommend OR best tool OR opinion) -airdrop lang:en'
  },
  {
    id: "roadmap",
    label: "Roadmap & priorities",
    description: "Crypto API product roadmap priorities",
    xSearchQuery: '("AI crypto startup" OR "web3 API startup") (building in public OR roadmap OR shipping) lang:en'
  },
  {
    id: "risk",
    label: "Risks & challenges",
    description: "Crypto API business risks",
    xSearchQuery: '("crypto API" OR "onchain analytics") (problem OR churn OR expensive OR scaling issue) lang:en'
  },
];

function panelResultsFromPayload(payload: StoredResearchPayload | null): Record<string, PanelState<XSearchData>> {
  const out: Record<string, PanelState<XSearchData>> = {};
  if (payload?.panels) {
    for (const [id, p] of Object.entries(payload.panels)) {
      if (p?.data) out[id] = { status: "success", data: p.data };
    }
  }
  return out;
}

export function ResearchPage() {
  const { canInteract } = useWalletContext();
  const [customQuery, setCustomQuery] = useState("");
  const [panelResults, setPanelResults] = useState<Record<string, PanelState<XSearchData>>>({});
  const [loadingPanelId, setLoadingPanelId] = useState<string | null>(null);
  const [deepResearch, setDeepResearch] = useState<PanelState<{ content: string; sources?: unknown[] }>>({ status: "idle" });
  const [browse, setBrowse] = useState<PanelState<{ query: string; result: string }>>({ status: "idle" });
  const [lastResearchQuery, setLastResearchQuery] = useState("");
  const [lastBrowseQuery, setLastBrowseQuery] = useState("");
  const [storeLoadStatus, setStoreLoadStatus] = useState<"idle" | "loading" | "done" | "error">("loading");
  const storedPayloadRef = useRef<StoredResearchPayload | null>(null);
  const [customXSearch, setCustomXSearch] = useState<PanelState<XSearchData>>({ status: "idle" });
  const [lastCustomXSearchQuery, setLastCustomXSearchQuery] = useState("");
  const [resumeState, setResumeState] = useState<PanelState<{ resume: string; truncated?: boolean }>>({ status: "idle" });
  const [refreshAllInProgress, setRefreshAllInProgress] = useState(false);

  // Load research from database on mount / refresh (replace local state with stored)
  useEffect(() => {
    let cancelled = false;
    setStoreLoadStatus("loading");
    fetchResearchStore()
      .then(({ payload }) => {
        if (cancelled || !payload || !hasStoredData(payload)) {
          setStoreLoadStatus("done");
          return;
        }
        storedPayloadRef.current = payload;
        setPanelResults(panelResultsFromPayload(payload));
        if (payload.deepResearch?.data) {
          setDeepResearch({ status: "success", data: payload.deepResearch.data });
          setLastResearchQuery(payload.deepResearch.lastQuery ?? "");
        }
        if (payload.browse?.data) {
          setBrowse({ status: "success", data: payload.browse.data });
          setLastBrowseQuery(payload.browse.lastQuery ?? "");
        }
        if (payload.customXSearch?.data) {
          setCustomXSearch({ status: "success", data: payload.customXSearch.data });
          setLastCustomXSearchQuery(payload.customXSearch.lastQuery ?? "");
        }
        if (payload.resume?.resume) {
          setResumeState({ status: "success", data: { resume: payload.resume.resume } });
        }
        setStoreLoadStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStoreLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistResearch(payload: StoredResearchPayload) {
    try {
      await saveResearchStore(payload);
      storedPayloadRef.current = payload;
    } catch {
      /* ignore save errors (e.g. network) */
    }
  }

  const runPanelXSearch = async (preset: (typeof SYRA_PRESETS)[number]) => {
    const { id, xSearchQuery } = preset;
    setLoadingPanelId(id);
    setPanelResults((prev) => ({ ...prev, [id]: { status: "loading" } }));
    try {
      const data = await fetchXSearch(xSearchQuery);
      setPanelResults((prev) => ({ ...prev, [id]: { status: "success", data } }));
      const prev = storedPayloadRef.current ?? {};
      const next: StoredResearchPayload = {
        ...prev,
        panels: { ...(prev.panels ?? {}), [id]: { data, lastQuery: xSearchQuery } },
      };
      await persistResearch(next);
    } catch (e) {
      setPanelResults((prev) => ({
        ...prev,
        [id]: { status: "error", error: e instanceof Error ? e.message : String(e) },
      }));
    } finally {
      setLoadingPanelId(null);
    }
  };

  const runResearch = async (query: string) => {
    setLastResearchQuery(query);
    setDeepResearch({ status: "loading" });
    try {
      const data = await fetchResearch(query, "deep");
      setDeepResearch({ status: "success", data });
      const prev = storedPayloadRef.current ?? {};
      await persistResearch({ ...prev, deepResearch: { data, lastQuery: query } });
    } catch (e) {
      setDeepResearch({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const runBrowse = async (query: string) => {
    setLastBrowseQuery(query);
    setBrowse({ status: "loading" });
    try {
      const data = await fetchBrowse(query);
      setBrowse({ status: "success", data });
      const prev = storedPayloadRef.current ?? {};
      await persistResearch({ ...prev, browse: { data, lastQuery: query } });
    } catch (e) {
      setBrowse({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const runResume = async () => {
    setResumeState({ status: "loading" });
    const prev = storedPayloadRef.current ?? {};
    const resumePayload = {
      panels: prev.panels,
      customXSearch: prev.customXSearch,
      deepResearch: prev.deepResearch,
      browse: prev.browse,
    };
    try {
      const data = await fetchResearchResume(resumePayload);
      setResumeState({ status: "success", data: { resume: data.resume, truncated: data.truncated } });
      await persistResearch({ ...prev, resume: { resume: data.resume, fetchedAt: new Date().toISOString() } });
    } catch (e) {
      setResumeState({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const runCustomXSearch = async (query: string) => {
    setLastCustomXSearchQuery(query);
    setCustomXSearch({ status: "loading" });
    try {
      const data = await fetchXSearch(query);
      setCustomXSearch({ status: "success", data });
      const prev = storedPayloadRef.current ?? {};
      await persistResearch({ ...prev, customXSearch: { data, lastQuery: query } });
    } catch (e) {
      setCustomXSearch({
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleCustomRun = (type: "research" | "xsearch" | "browse") => {
    const q = customQuery.trim();
    if (!q) return;
    if (type === "research") runResearch(q);
    else if (type === "xsearch") runCustomXSearch(q);
    else runBrowse(q);
  };

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runRefreshAll = async () => {
    if (!canInteract || refreshAllInProgress) return;
    setRefreshAllInProgress(true);
    try {
      for (let i = 0; i < SYRA_PRESETS.length; i++) {
        await runPanelXSearch(SYRA_PRESETS[i]);
        if (i < SYRA_PRESETS.length - 1) await delay(10_000);
      }
      await delay(10_000);
      await runResume();
    } finally {
      setRefreshAllInProgress(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6">
      <header className="flex flex-col gap-3 border-b border-gray-800 pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 sm:pb-6">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Research & insight</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            X search panels for strategy and growth. Run or refresh any panel for fresh research.
          </p>
        </div>
        {canInteract && (
          <button
            type="button"
            onClick={runRefreshAll}
            disabled={refreshAllInProgress}
            className="flex items-center gap-2 rounded-lg border border-syra-primary/50 bg-syra-primary/10 px-4 py-2 text-sm font-medium text-syra-primary hover:bg-syra-primary/20 disabled:opacity-50 disabled:pointer-events-none"
            title="Run all preset panels (10s delay each), then resume"
          >
            {refreshAllInProgress ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-syra-primary/30 border-t-syra-primary" aria-hidden />
                Refresh all…
              </>
            ) : (
              "Refresh all"
            )}
          </button>
        )}
      </header>

      {/* Resume — Jatevo summary of latest research */}
      <section>
        <Panel
          title="Resume"
          subtitle="Executive summary of all latest research (Jatevo)"
          icon="📋"
          onRefresh={runResume}
          showRefresh={canInteract}
        >
          {resumeState.status === "loading" ? (
            <LoadingState message="Generating resume…" size="md" />
          ) : resumeState.status === "error" ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-200">
              {resumeState.error}
            </div>
          ) : resumeState.status === "success" ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/20 p-4 text-sm">
              <MarkdownLike text={resumeState.data.resume} />
              {resumeState.data.truncated && (
                <p className="mt-3 text-xs text-gray-500">[Summary was truncated. Consider running fewer or shorter research panels.]</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 p-6 text-center">
              <p className="text-sm text-gray-500">Run some research panels below, then click Refresh to generate an executive summary.</p>
            </div>
          )}
        </Panel>
      </section>

      {/* Strategy & growth — one panel per insight */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          Syra strategy & growth
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SYRA_PRESETS.map((preset) => {
            const state = panelResults[preset.id] ?? { status: "idle" as const };
            const isLoading = loadingPanelId === preset.id;
            return (
              <Panel
                key={preset.id}
                title={preset.label}
                subtitle={preset.description}
                icon="𝕏"
                onRefresh={() => runPanelXSearch(preset)}
                showRefresh={canInteract}
              >
                {isLoading ? (
                  <LoadingStateInline message="Running X search…" />
                ) : state.status === "error" ? (
                  <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-200">
                    {state.error}
                  </div>
                ) : state.status === "success" ? (
                  <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/20 p-4 text-sm">
                    <MarkdownLike text={state.data.result} />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 p-6 text-center">
                    <p className="text-sm text-gray-500">Click Refresh to run X search.</p>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </section>

      {/* Custom X search panel */}
      {(customXSearch.status !== "idle" || lastCustomXSearchQuery) && (
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            Custom X search
          </h2>
          <Panel
            title="Custom X search"
            subtitle={lastCustomXSearchQuery || "Run a query below"}
            icon="𝕏"
            onRefresh={() => lastCustomXSearchQuery && runCustomXSearch(lastCustomXSearchQuery)}
            showRefresh={canInteract && !!lastCustomXSearchQuery}
          >
            <ContentBox
              state={customXSearch}
              emptyMessage="Enter a query below and click X search."
              render={(d) => <MarkdownLike text={(d as { result: string }).result} />}
            />
          </Panel>
        </section>
      )}

      {/* Optional: Deep research card with refresh */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          Deep research (optional)
        </h2>
        <Panel
          title="Deep research"
          subtitle="Comprehensive analysis with sources"
          icon="🔬"
          onRefresh={lastResearchQuery ? () => runResearch(lastResearchQuery) : undefined}
          showRefresh={canInteract && deepResearch.status === "success" && !!lastResearchQuery}
        >
          <ContentBox
            state={deepResearch}
            emptyMessage="Run a custom deep research below to see results and refresh for fresh research."
            render={(d) => (
              <>
                <MarkdownLike text={(d as { content: string }).content} />
                {(d as { sources?: unknown[] }).sources?.length ? (
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    <p className="text-xs font-medium text-gray-500">Sources</p>
                    <ul className="mt-1 list-inside list-disc text-xs text-gray-400">
                      {((d as { sources: unknown[] }).sources || []).slice(0, 10).map((s: unknown, i: number) => (
                        <li key={i}>{typeof s === "string" ? s : JSON.stringify(s).slice(0, 80)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          />
        </Panel>
      </section>

      {/* Browse panel with refresh */}
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
          Browse & extract
        </h2>
        <Panel
          title="Web browse"
          subtitle="URL or search query — AI extraction"
          icon="🌐"
          onRefresh={lastBrowseQuery ? () => runBrowse(lastBrowseQuery) : undefined}
          showRefresh={canInteract && browse.status === "success" && !!lastBrowseQuery}
        >
          <ContentBox
            state={browse}
            emptyMessage="Enter a URL or search query below and click Browse. Use Refresh for fresh extraction."
            render={(d) => {
              const data = d as { query: string; result: string };
              let parsed: { result?: string; content?: string; status?: string } = {};
              try {
                parsed = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
              } catch {
                return <p className="whitespace-pre-wrap text-gray-300">{data.result}</p>;
              }
              const text = parsed.result ?? parsed.content ?? data.result;
              return <MarkdownLike text={typeof text === "string" ? text : JSON.stringify(text, null, 2)} />;
            }}
          />
        </Panel>
      </section>

      {/* Custom query */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 sm:mb-4 sm:text-sm">
          Custom query
        </h2>
        <div className="rounded-xl border border-gray-800 bg-syra-card p-3 sm:p-4">
          <label htmlFor="custom-query" className="sr-only">
            Query
          </label>
          <input
            id="custom-query"
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canInteract && handleCustomRun("xsearch")}
            placeholder="e.g. Syra crypto API, or https://example.com for Browse"
            disabled={!canInteract}
            className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-syra-primary/50 focus:outline-none focus:ring-1 focus:ring-syra-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCustomRun("xsearch")}
              disabled={!canInteract || !customQuery.trim()}
              className="rounded-lg bg-syra-accent/20 px-3 py-1.5 text-sm font-medium text-syra-accent hover:bg-syra-accent/30 disabled:opacity-50"
            >
              X search
            </button>
            <button
              type="button"
              onClick={() => handleCustomRun("research")}
              disabled={!canInteract || !customQuery.trim()}
              className="rounded-lg bg-syra-primary/20 px-3 py-1.5 text-sm font-medium text-syra-primary hover:bg-syra-primary/30 disabled:opacity-50"
            >
              Deep research
            </button>
            <button
              type="button"
              onClick={() => handleCustomRun("browse")}
              disabled={!canInteract || !customQuery.trim()}
              className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              Browse
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
