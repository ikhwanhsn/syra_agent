import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { Play, Zap, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getExampleFlowGroups,
  getExampleFlowGroupsFromFlows,
  getExampleFlowsForGroup,
  getParamsForExampleFlow,
  filterExampleFlowsByGroupSlug,
  type ExampleFlowPreset,
} from '@/hooks/useApiPlayground';
import { TopBar } from '@/components/TopBar';
import { ConnectChainModal } from '@/components/ConnectChainModal';
import { QueryParamsModal } from '@/components/QueryParamsModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import type { RequestParam } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { BRAND_NAME } from '@/lib/branding';
import { resolveApiBaseUrl, resolvePurchVaultBaseUrl } from '@/lib/resolveApiBaseUrl';
import { buildFullMppExampleFlowList } from '@/lib/mppOpenApiToExampleFlows';

type ExamplesCatalog = 'x402' | 'mpp';

const ExamplesGroup = () => {
  const { catalog, groupSlug } = useParams<{ catalog: ExamplesCatalog; groupSlug: string }>();
  const navigate = useNavigate();
  const { wallet, connectWallet, selectPaymentChain } = useApiPlayground();
  const { openLoginModal, isPrivyMounted, requestConnect } = useWalletContext();

  const isMpp = catalog === 'mpp';

  const [mppFlows, setMppFlows] = useState<ExampleFlowPreset[]>([]);
  const [mppLoadState, setMppLoadState] = useState<'idle' | 'loading' | 'ok' | 'error'>(isMpp ? 'loading' : 'ok');
  const [mppErrorMessage, setMppErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isMpp) return;
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
  }, [isMpp]);

  const x402Groups = getExampleFlowGroups();
  const mppGroups = getExampleFlowGroupsFromFlows(mppFlows);
  const groups = isMpp ? mppGroups : x402Groups;
  const group = groupSlug ? groups.find((g) => g.slug === groupSlug) : undefined;

  const flows: ExampleFlowPreset[] =
    isMpp && groupSlug
      ? filterExampleFlowsByGroupSlug(mppFlows, groupSlug)
      : groupSlug
        ? getExampleFlowsForGroup(groupSlug)
        : [];

  const [isConnectChainModalOpen, setIsConnectChainModalOpen] = useState(false);
  const [paramsModalFlow, setParamsModalFlow] = useState<ExampleFlowPreset | null>(null);
  const [paramsModalInitialParams, setParamsModalInitialParams] = useState<RequestParam[]>([]);

  const handleRun = (flow: ExampleFlowPreset) => {
    const paramsForFlow = getParamsForExampleFlow(flow);
    if (isMpp || flow.examplePaymentCatalog === 'mpp') {
      if (paramsForFlow.length > 0) {
        setParamsModalFlow(flow);
        setParamsModalInitialParams(paramsForFlow);
      } else {
        navigate('/', { state: { runFlowPreset: flow } });
      }
      return;
    }
    if (paramsForFlow.length > 0) {
      setParamsModalFlow(flow);
      setParamsModalInitialParams(paramsForFlow);
    } else {
      navigate('/', { state: { runFlowId: flow.id } });
    }
  };

  const handleRunWithParams = (params: RequestParam[]) => {
    if (!paramsModalFlow) return;
    if (isMpp || paramsModalFlow.examplePaymentCatalog === 'mpp') {
      navigate('/', { state: { runFlowPreset: paramsModalFlow, runFlowParams: params } });
    } else {
      navigate('/', { state: { runFlowId: paramsModalFlow.id, runFlowParams: params } });
    }
    setParamsModalFlow(null);
    setParamsModalInitialParams([]);
  };

  if (!catalog || !groupSlug || (catalog !== 'x402' && catalog !== 'mpp')) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col w-full">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => {}}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Invalid examples link.</p>
            <Button asChild variant="outline">
              <Link to="/examples">Back to Examples</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!group && !(isMpp && mppLoadState === 'loading')) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col w-full">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => {}}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Group not found.</p>
            <Button asChild variant="outline">
              <Link to="/examples">Back to Examples</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sortedFlows = [...flows].sort((a, b) =>
    (a.label ?? '').localeCompare(b.label ?? '', undefined, { sensitivity: 'base' })
  );

  const catalogLabel = isMpp ? 'MPP' : 'x402';

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
      <div className="flex-1 min-h-0 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))] w-full overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 min-w-0">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/examples" className="hover:text-foreground transition-colors">
              Example flows
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="text-xs font-mono text-muted-foreground/90">{catalogLabel}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="text-foreground font-medium">{group?.name ?? '…'}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  isMpp
                    ? 'bg-gradient-to-br from-accent/20 to-primary/10 border-accent/30'
                    : 'bg-gradient-to-br from-primary/20 to-accent/20 border-border/50'
                }`}
              >
                <Zap className={`h-6 w-6 ${isMpp ? 'text-accent' : 'text-primary'}`} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{group?.name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isMpp && mppLoadState === 'loading' ? (
                    'Loading…'
                  ) : (
                    <>
                      {flows.length} API{flows.length !== 1 ? 's' : ''} — {catalogLabel} — click Run to open{' '}
                      {BRAND_NAME}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {isMpp && mppLoadState === 'loading' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Loading MPP catalog…</p>
            </div>
          ) : isMpp && mppLoadState === 'error' ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Could not load MPP catalog</p>
                <p className="text-sm text-muted-foreground mt-1">{mppErrorMessage}</p>
              </div>
            </div>
          ) : (
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedFlows.map((flow) => {
                  const method = flow.method;
                  return (
                    <div
                      key={flow.id}
                      className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 hover:border-border hover:bg-card/80 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground block truncate">{flow.label}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {method}
                          </Badge>
                          {isMpp ? (
                            <Badge variant="outline" className="text-[10px] border-accent/40 text-accent">
                              MPP
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRun(flow)}
                        className="gap-1.5 shrink-0"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Run
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

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
    </div>
  );
};

/** Old URLs `/examples/:groupSlug` → `/examples/x402/:groupSlug` */
export function ExamplesLegacyGroupRedirect() {
  const { groupSlug } = useParams<{ groupSlug: string }>();
  if (!groupSlug || groupSlug === 'x402' || groupSlug === 'mpp') {
    return <Navigate to="/examples" replace />;
  }
  return <Navigate to={`/examples/x402/${groupSlug}`} replace />;
}

export default ExamplesGroup;
