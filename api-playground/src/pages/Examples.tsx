import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Layers, Loader2, AlertCircle } from 'lucide-react';
import {
  getExampleFlowGroups,
  getExampleFlowGroupsFromFlows,
  type ExampleFlowPreset,
} from '@/hooks/useApiPlayground';
import { TopBar } from '@/components/TopBar';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  resolveApiBaseUrl,
  resolvePurchVaultBaseUrl,
  resolveSyraBrowserFetchUrl,
} from '@/lib/resolveApiBaseUrl';
import { buildFullMppExampleFlowList } from '@/lib/mppOpenApiToExampleFlows';
import { MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';
import { cn } from '@/lib/utils';

const Examples = () => {
  const { wallet, selectPaymentChain } = useApiPlayground();
  const { connect, setConnectChainPickListener } = useWalletContext();

  useEffect(() => {
    setConnectChainPickListener((option) => {
      if (option !== 'email') selectPaymentChain(option);
    });
    return () => setConnectChainPickListener(null);
  }, [selectPaymentChain, setConnectChainPickListener]);
  const x402Groups = getExampleFlowGroups();

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
    <div className="min-h-[100dvh] h-dvh bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw] playground-ambient relative">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => connect()}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
        flowStatus="idle"
      />
      <div
        className={cn(
          'flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden relative z-[1]',
          MAIN_CONTENT_PT_CLASS,
          MAIN_CONTENT_PB_SAFE_CLASS,
        )}
      >
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0 pb-24">
          <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-8 border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-ring/10 to-transparent blur-md opacity-80"
                  aria-hidden
                />
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-card/90 ring-1 ring-border/60 dark:ring-white/[0.08] shadow-md flex items-center justify-center border border-border/40">
                  <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Example flows
                </h1>
                <p className="text-sm sm:text-[15px] text-muted-foreground mt-2 leading-relaxed max-w-3xl text-balance">
                  <span className="font-medium text-foreground/90">x402</span> — curated Syra demos.{' '}
                  <span className="font-medium text-foreground/90">MPP</span> — full catalog from{' '}
                  <span className="font-mono text-xs sm:text-sm text-foreground/85">GET /mpp-openapi.json</span> (same
                  URLs as x402; MPP is discovery metadata for AgentCash / MPPscan).
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="x402" className="w-full">
            <TabsList className="mb-8 grid w-full max-w-md grid-cols-2 h-auto p-1 gap-1 rounded-xl border border-border/50 bg-muted/25 dark:bg-black/20 shadow-inner shadow-black/5">
              <TabsTrigger
                value="x402"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background/90 data-[state=active]:dark:bg-white/[0.08] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/60 data-[state=active]:text-foreground py-2.5"
              >
                x402
              </TabsTrigger>
              <TabsTrigger
                value="mpp"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background/90 data-[state=active]:dark:bg-white/[0.08] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-border/60 data-[state=active]:text-foreground py-2.5"
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
                        'flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 group',
                        'bg-card/70 backdrop-blur-sm border-border/50',
                        'hover:border-primary/30 hover:bg-card/90 hover:shadow-md dark:hover:shadow-elevate-sm',
                        'hover:-translate-y-0.5 active:translate-y-0',
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
                    <span className="font-mono text-xs sm:text-sm text-foreground/85">/mpp/v1/check-status</span> for
                    the MPP-branded health check.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {mppGroups.map((group) => (
                      <Link
                        key={group.slug}
                        to={`/examples/mpp/${group.slug}`}
                        className={cn(
                          'flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 group',
                          'bg-card/70 backdrop-blur-sm border-border/50',
                          'hover:border-accent/35 hover:bg-card/90 hover:shadow-md dark:hover:shadow-elevate-sm',
                          'hover:-translate-y-0.5 active:translate-y-0',
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
      </div>
    </div>
  );
};

export default Examples;
