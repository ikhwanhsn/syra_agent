import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Layers, Loader2, AlertCircle } from 'lucide-react';
import {
  getExampleFlowGroups,
  getExampleFlowGroupsFromFlows,
  type ExampleFlowPreset,
} from '@/hooks/useApiPlayground';
import { TopBar } from '@/components/TopBar';
import { ConnectChainModal } from '@/components/ConnectChainModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveApiBaseUrl, resolvePurchVaultBaseUrl } from '@/lib/resolveApiBaseUrl';
import { buildFullMppExampleFlowList } from '@/lib/mppOpenApiToExampleFlows';

const Examples = () => {
  const { wallet, connectWallet, selectPaymentChain } = useApiPlayground();
  const { openLoginModal, isPrivyMounted, requestConnect } = useWalletContext();
  const [isConnectChainModalOpen, setIsConnectChainModalOpen] = useState(false);
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
    fetch(`${syra.replace(/\/$/, '')}/mpp-openapi.json`)
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
    <div className="min-h-[100dvh] bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw]">
      <TopBar
        wallet={wallet}
        onOpenConnectModal={() => setIsConnectChainModalOpen(true)}
        onToggleSidebar={() => {}}
        isSidebarOpen={false}
      />
      <ConnectChainModal
        isOpen={isConnectChainModalOpen}
        onClose={() => setIsConnectChainModalOpen(false)}
        onPick={(option) => {
          setIsConnectChainModalOpen(false);
          if (!isPrivyMounted) {
            requestConnect(option);
            if (option !== 'email') selectPaymentChain(option);
            return;
          }
          if (option === 'email') {
            openLoginModal();
            return;
          }
          selectPaymentChain(option);
          connectWallet(option);
        }}
      />
      <div className="flex-1 min-h-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] w-full overflow-y-scroll overflow-x-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 min-w-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Example flows</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground/90">x402</span> — curated Syra demos.{' '}
                <span className="font-medium text-foreground/90">MPP</span> — full catalog from{' '}
                <span className="font-mono text-foreground/80">GET /mpp-openapi.json</span> (same URLs as x402; MPP is
                discovery metadata for AgentCash / MPPscan).
              </p>
            </div>
          </div>

          <Tabs defaultValue="x402" className="w-full">
            <TabsList className="mb-6 grid w-full max-w-md grid-cols-2 h-10">
              <TabsTrigger value="x402" className="text-sm">
                x402
              </TabsTrigger>
              <TabsTrigger value="mpp" className="text-sm">
                MPP
              </TabsTrigger>
            </TabsList>

            <TabsContent value="x402" className="mt-0">
              <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {x402Groups.map((group) => (
                    <Link
                      key={group.slug}
                      to={`/examples/x402/${group.slug}`}
                      className="flex items-center gap-4 p-4 sm:p-5 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:bg-card/80 transition-all duration-200 group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-secondary/80 border border-border/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                        <Layers className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {group.name}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {group.count} API{group.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="mpp" className="mt-0">
              {mppLoadState === 'loading' ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Loading MPP catalog from API…</p>
                </div>
              ) : mppLoadState === 'error' ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Could not load MPP catalog</p>
                    <p className="text-sm text-muted-foreground mt-1">{mppErrorMessage}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ensure the Syra API is reachable ({resolveApiBaseUrl()}) and try again.
                    </p>
                  </div>
                </div>
              ) : (
                <section>
                  <p className="text-sm text-muted-foreground mb-4">
                    {mppFlows.length} operation{mppFlows.length !== 1 ? 's' : ''} from Syra MPP discovery — same payment
                    flow as x402; use <span className="font-mono text-foreground/80">/mpp/v1/check-status</span> for the
                    MPP-branded health check.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mppGroups.map((group) => (
                      <Link
                        key={group.slug}
                        to={`/examples/mpp/${group.slug}`}
                        className="flex items-center gap-4 p-4 sm:p-5 rounded-xl bg-card border border-border/60 hover:border-accent/40 hover:bg-card/80 transition-all duration-200 group"
                      >
                        <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                          <Layers className="h-5 w-5 text-accent group-hover:text-accent transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                            {group.name}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {group.count} API{group.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
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
