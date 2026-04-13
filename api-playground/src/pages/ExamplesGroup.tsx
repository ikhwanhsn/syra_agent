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
import { QueryParamsModal } from '@/components/QueryParamsModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import type { RequestParam } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { BRAND_NAME } from '@/lib/branding';
import { resolveApiBaseUrl, resolvePurchVaultBaseUrl } from '@/lib/resolveApiBaseUrl';
import { buildFullMppExampleFlowList } from '@/lib/mppOpenApiToExampleFlows';
import { MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';
import { cn } from '@/lib/utils';

type ExamplesCatalog = 'x402' | 'mpp';

const ExamplesGroup = () => {
  const { catalog, groupSlug } = useParams<{ catalog: ExamplesCatalog; groupSlug: string }>();
  const navigate = useNavigate();
  const { wallet, selectPaymentChain } = useApiPlayground();
  const { connect, setConnectChainPickListener } = useWalletContext();

  useEffect(() => {
    setConnectChainPickListener((option) => {
      if (option !== 'email') selectPaymentChain(option);
    });
    return () => setConnectChainPickListener(null);
  }, [selectPaymentChain, setConnectChainPickListener]);

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
      <div className="min-h-[100dvh] bg-background flex flex-col w-full playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => connect()}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
          flowStatus="idle"
        />
        <div className="flex-1 flex items-center justify-center px-4 relative z-[1] pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
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
      <div className="min-h-[100dvh] bg-background flex flex-col w-full playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => connect()}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
          flowStatus="idle"
        />
        <div className="flex-1 flex items-center justify-center px-4 relative z-[1] pt-[calc(3.5rem+env(safe-area-inset-top,0px))]">
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
    <div className="min-h-[100dvh] bg-background flex flex-col w-full overflow-x-hidden max-w-[100vw] playground-ambient relative">
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
          <nav
            className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-6"
            aria-label="Breadcrumb"
          >
            <Link
              to="/examples"
              className="rounded-full px-3 py-1 font-medium hover:text-foreground hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06] transition-colors"
            >
              Example flows
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="rounded-full px-2.5 py-1 text-xs font-mono bg-muted/40 border border-border/50 text-muted-foreground">
              {catalogLabel}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="rounded-full px-3 py-1 font-medium text-foreground bg-background/80 dark:bg-white/[0.06] border border-border/50">
              {group?.name ?? '…'}
            </span>
          </nav>

          <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-8 border border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      'absolute inset-0 rounded-2xl blur-md opacity-70',
                      isMpp ? 'bg-gradient-to-br from-accent/25 to-primary/10' : 'bg-gradient-to-br from-primary/25 to-ring/10',
                    )}
                    aria-hidden
                  />
                  <div
                    className={cn(
                      'relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shadow-md ring-1',
                      isMpp
                        ? 'bg-card/90 border-accent/30 ring-accent/15'
                        : 'bg-card/90 border-border/50 ring-border/40',
                    )}
                  >
                    <Zap className={cn('h-6 w-6 sm:h-7 sm:w-7', isMpp ? 'text-accent' : 'text-primary')} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
                    {group?.name}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {isMpp && mppLoadState === 'loading' ? (
                      'Loading…'
                    ) : (
                      <>
                        <span className="tabular-nums font-medium text-foreground/85">{flows.length}</span> API
                        {flows.length !== 1 ? 's' : ''} — {catalogLabel} — Run opens in {BRAND_NAME}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isMpp && mppLoadState === 'loading' ? (
            <div className="glass-panel rounded-2xl border border-border/50 flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping" aria-hidden />
                <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-muted/30 ring-1 ring-border/50">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">Loading MPP catalog</p>
            </div>
          ) : isMpp && mppLoadState === 'error' ? (
            <div className="rounded-2xl border border-destructive/35 bg-destructive/[0.06] backdrop-blur-sm p-5 sm:p-6 flex gap-4 items-start shadow-md">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-foreground">Could not load MPP catalog</p>
                <p className="text-sm text-muted-foreground mt-1.5">{mppErrorMessage}</p>
              </div>
            </div>
          ) : (
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {sortedFlows.map((flow) => {
                  const method = flow.method;
                  return (
                    <div
                      key={flow.id}
                      className={cn(
                        'group flex items-center justify-between gap-3 p-4 sm:p-4 rounded-2xl border transition-all duration-300',
                        'bg-card/70 backdrop-blur-sm border-border/50',
                        'hover:border-border hover:bg-card/90 hover:shadow-md dark:hover:shadow-elevate-sm',
                        'hover:-translate-y-0.5',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-foreground block truncate leading-snug">
                          {flow.label}
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-mono font-medium px-2 py-0.5 border border-border/40"
                          >
                            {method}
                          </Badge>
                          {isMpp ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium border-accent/35 text-accent bg-accent/[0.06]"
                            >
                              MPP
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        variant="neon"
                        size="sm"
                        onClick={() => handleRun(flow)}
                        className="gap-1.5 shrink-0 rounded-full px-3.5 h-9 font-semibold shadow-sm"
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
