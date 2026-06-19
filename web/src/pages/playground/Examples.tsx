import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/navigation';
import { ChevronRight, Layers, Loader2, AlertCircle } from 'lucide-react';
import {
  getExampleFlowGroupsFromFlows,
  type ExampleFlowPreset,
} from '@/hooks/useApiPlayground';
import { useX402DiscoveryCatalog } from '@/hooks/useX402DiscoveryCatalog';
import { PlaygroundPageShell, PlaygroundScrollBody } from '@/components/playground/PlaygroundPageShell';
import { PlaygroundHero } from '@/components/playground/PlaygroundHero';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PLAYGROUND_PAGE_CLASS,
  playgroundPanelClass,
  playgroundSegmentedRoot,
  playgroundSegmentedTrigger,
} from '@/components/playground/playgroundStyles';
import { cn } from '@/lib/utils';
import {
  resolveApiBaseUrl,
  resolvePurchVaultBaseUrl,
  resolveSyraBrowserFetchUrl,
} from '@/lib/resolveApiBaseUrl';
import { buildFullMppExampleFlowList } from '@/lib/mppOpenApiToExampleFlows';
const Examples = () => {
  const { selectPaymentChain } = useApiPlayground();
  const { flows: x402Flows } = useX402DiscoveryCatalog();
  const x402Groups = useMemo(
    () => getExampleFlowGroupsFromFlows(x402Flows),
    [x402Flows],
  );

  const [mppFlows, setMppFlows] = useState<ExampleFlowPreset[]>([]);
  const [mppLoadState, setMppLoadState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [mppErrorMessage, setMppErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const syra = resolveApiBaseUrl();
    const purch = resolvePurchVaultBaseUrl();
    setMppLoadState('loading');
    setMppErrorMessage(null);
    fetch(resolveSyraBrowserFetchUrl(`${syra.replace(/\/$/, '')}/mpp-openapi.json`))
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((doc) => {
        if (cancelled) return;
        const list = buildFullMppExampleFlowList(doc, syra, purch) as ExampleFlowPreset[];
        setMppFlows(list);
        setMppLoadState('ok');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setMppFlows([]);
        setMppLoadState('error');
        setMppErrorMessage(e instanceof Error ? e.message : 'Failed to load MPP catalog');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mppGroups = getExampleFlowGroupsFromFlows(mppFlows);

  return (
    <PlaygroundPageShell>
      <PlaygroundScrollBody>
        <div className={cn(PLAYGROUND_PAGE_CLASS, "min-w-0 space-y-8")}>
          <PlaygroundHero
            kicker="Example flows"
            title="Explore payment-gated APIs"
            description="Browse grouped x402 demos or the full MPP discovery catalog — same URLs, different discovery metadata for agents and MPPscan."
            stats={[
              { label: "x402 groups", value: String(x402Groups.length) },
              { label: "MPP ops", value: mppLoadState === "ok" ? String(mppFlows.length) : "…" },
            ]}
          />

          <Tabs defaultValue="x402" className="w-full">
            <TabsList className={cn(playgroundSegmentedRoot(2), "mb-6 h-auto max-w-md")}>
              <TabsTrigger
                value="x402"
                className={cn(
                  playgroundSegmentedTrigger(false),
                  "border-0 bg-transparent shadow-none",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/55",
                )}
              >
                x402
              </TabsTrigger>
              <TabsTrigger
                value="mpp"
                className={cn(
                  playgroundSegmentedTrigger(false),
                  "border-0 bg-transparent shadow-none",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/55",
                )}
              >
                MPP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="x402" className="mt-0">
              <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {x402Groups.map((group) => (
                    <Link
                      key={group.slug}
                      to={`/examples/x402/${group.slug}`}
                      className={cn(
                        playgroundPanelClass,
                        "group flex items-center gap-4 p-4 sm:p-5 transition-all duration-300",
                        "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                      )}
                    >
                      <div
                        className={cn(
                          'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300',
                          'bg-secondary/50 ring-1 ring-border/50',
                          'group-hover:bg-primary/12 group-hover:ring-primary/25',
                        )}
                      >
                        <Layers className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {group.name}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 tabular-nums">
                          {group.count} API{group.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/70 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                    </Link>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="mpp" className="mt-0">
              {mppLoadState === 'loading' ? (
                <div className="glass-panel rounded-2xl border border-border/50 flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping" aria-hidden />
                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-muted/30 ring-1 ring-border/50">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">Loading MPP catalog</p>
                  <p className="text-xs text-muted-foreground">Fetching discovery from your Syra API…</p>
                </div>
              ) : mppLoadState === 'error' ? (
                <div className="rounded-2xl border border-destructive/35 bg-destructive/[0.06] backdrop-blur-sm p-5 sm:p-6 flex gap-4 items-start shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-foreground">Could not load MPP catalog</p>
                    <p className="text-sm text-muted-foreground mt-1.5">{mppErrorMessage}</p>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      Ensure the Syra API is reachable ({resolveApiBaseUrl()}) and try again.
                    </p>
                  </div>
                </div>
              ) : (
                <section>
                  <p className="text-sm text-muted-foreground mb-6 max-w-3xl leading-relaxed">
                    <span className="tabular-nums font-medium text-foreground/90">{mppFlows.length}</span> operation
                    {mppFlows.length !== 1 ? 's' : ''} from Syra MPP discovery — same payment flow as x402; use{' '}
                    <span className="font-mono text-xs sm:text-sm text-foreground/85">/mpp/health</span> for
                    the MPP-branded health check.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {mppGroups.map((group) => (
                      <Link
                        key={group.slug}
                        to={`/examples/mpp/${group.slug}`}
                        className={cn(
                          playgroundPanelClass,
                          "group flex items-center gap-4 p-4 sm:p-5 transition-all duration-300",
                          "hover:border-accent/35 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                        )}
                      >
                        <div
                          className={cn(
                            'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300',
                            'bg-accent/10 ring-1 ring-accent/25',
                            'group-hover:bg-accent/18 group-hover:ring-accent/40',
                          )}
                        >
                          <Layers className="h-5 w-5 text-accent" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-base font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                            {group.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 tabular-nums">
                            {group.count} API{group.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/70 shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-300" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PlaygroundScrollBody>
    </PlaygroundPageShell>
  );
};

export default Examples;
