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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BRAND_NAME } from '@/lib/branding';
import {
  resolveApiBaseUrl,
  resolvePurchVaultBaseUrl,
  resolveSyraBrowserFetchUrl,
} from '@/lib/resolveApiBaseUrl';
import { buildFullMppExampleFlowList } from '@/lib/mppOpenApiToExampleFlows';
import { MAIN_CONTENT_PT_CLASS, MAIN_CONTENT_PB_SAFE_CLASS } from '@/lib/branding';
import { cn } from '@/lib/utils';

type ExamplesCatalog = 'x402' | 'mpp';

/** Split `Partner: action name` into a small vendor label + primary title (reduces noise vs one long line). */
function splitFlowLabel(label: string): { vendor: string | null; detail: string } {
  const idx = label.indexOf(':');
  if (idx < 1) return { vendor: null, detail: label };
  const vendor = label.slice(0, idx).trim();
  const detail = label.slice(idx + 1).trim();
  if (!detail || vendor.length > 42) return { vendor: null, detail: label };
  return { vendor, detail };
}

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
    setParamsModalFlow(flow);
    setParamsModalInitialParams(paramsForFlow);
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
      <div className="min-h-[100dvh] h-dvh max-h-[100dvh] bg-background flex flex-col w-full max-w-[100vw] overflow-x-hidden playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => connect()}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
          flowStatus="idle"
        />
        <div className="flex flex-1 min-h-0 items-center justify-center px-4 relative z-[1] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)]">
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
      <div className="min-h-[100dvh] h-dvh max-h-[100dvh] bg-background flex flex-col w-full max-w-[100vw] overflow-x-hidden playground-ambient">
        <TopBar
          wallet={wallet}
          onOpenConnectModal={() => connect()}
          onToggleSidebar={() => {}}
          isSidebarOpen={false}
          flowStatus="idle"
        />
        <div className="flex flex-1 min-h-0 items-center justify-center px-4 relative z-[1] pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)]">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {sortedFlows.map((flow) => {
                  const method = flow.method;
                  const isGet = method === 'GET';
                  const { vendor, detail } = splitFlowLabel(flow.label);
                  return (
                    <div
                      key={flow.id}
                      className={cn(
                        'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 sm:p-4',
                        'border-border/45 bg-gradient-to-b from-card/90 to-card/55 backdrop-blur-xl',
                        'shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05)]',
                        'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out',
                        'hover:-translate-y-px hover:border-border/70 hover:from-card/95 hover:to-card/70',
                        'hover:shadow-lg hover:shadow-black/20',
                        'dark:hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.65),inset_0_1px_0_hsl(0_0%_100%/0.06)]',
                      )}
                    >
                      <div
                        className="pointer-events-none absolute inset-y-4 left-0 w-px rounded-full bg-primary/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        aria-hidden
                      />
                      <div className="relative flex flex-col gap-2.5">
                        <div
                          className={cn(
                            'flex min-h-[1.25rem] items-center gap-2',
                            vendor ? 'justify-between' : 'justify-end',
                          )}
                        >
                          {vendor ? (
                            <span className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              {vendor}
                            </span>
                          ) : null}
                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                            {isMpp ? (
                              <Badge
                                variant="outline"
                                className="border-accent/35 bg-accent/[0.06] px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-accent"
                              >
                                MPP
                              </Badge>
                            ) : null}
                            <Badge
                              variant="secondary"
                              className={cn(
                                'border px-1.5 py-0 font-mono text-[9px] font-bold uppercase tracking-wider',
                                isGet
                                  ? 'border-border/50 bg-muted/30 text-muted-foreground'
                                  : 'border-primary/18 bg-primary/[0.09] text-foreground',
                              )}
                            >
                              {method}
                            </Badge>
                          </div>
                        </div>

                        <Tooltip delayDuration={280}>
                          <TooltipTrigger asChild>
                            <h3 className="line-clamp-2 cursor-default text-left font-display text-[15px] font-medium leading-snug tracking-tight text-foreground/95 sm:text-base">
                              {detail}
                            </h3>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-[min(22rem,calc(100vw-2rem))] border-border/50 bg-popover/95 px-3 py-2 text-xs font-normal leading-relaxed text-popover-foreground shadow-2xl backdrop-blur-xl"
                          >
                            {flow.label}
                          </TooltipContent>
                        </Tooltip>

                        <div className="flex items-center justify-end pt-0.5">
                          <Button
                            variant="neon"
                            size="sm"
                            onClick={() => handleRun(flow)}
                            className="h-9 w-full gap-1.5 rounded-full font-semibold shadow-sm transition-[box-shadow,transform] duration-200 hover:shadow-md sm:w-auto sm:px-5"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Run
                          </Button>
                        </div>
                      </div>
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
