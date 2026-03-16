import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Play, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getExampleFlowGroups,
  getExampleFlowsForGroup,
  getParamsForExampleFlow,
  type ExampleFlowPreset,
} from '@/hooks/useApiPlayground';
import { TopBar } from '@/components/TopBar';
import { ConnectChainModal } from '@/components/ConnectChainModal';
import { QueryParamsModal } from '@/components/QueryParamsModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import type { RequestParam } from '@/types/api';
import { Badge } from '@/components/ui/badge';

const ExamplesGroup = () => {
  const { groupSlug } = useParams<{ groupSlug: string }>();
  const navigate = useNavigate();
  const { wallet, connectWallet, selectPaymentChain } = useApiPlayground();
  const { setConnectChainOverride, openLoginModal, isPrivyMounted, requestConnect } = useWalletContext();

  const groups = getExampleFlowGroups();
  const group = groups.find((g) => g.slug === groupSlug);
  const flows = groupSlug ? getExampleFlowsForGroup(groupSlug) : [];

  const [isConnectChainModalOpen, setIsConnectChainModalOpen] = useState(false);
  const [paramsModalFlow, setParamsModalFlow] = useState<ExampleFlowPreset | null>(null);
  const [paramsModalInitialParams, setParamsModalInitialParams] = useState<RequestParam[]>([]);

  const handleRun = (flow: ExampleFlowPreset) => {
    const paramsForFlow = getParamsForExampleFlow(flow);
    if (paramsForFlow.length > 0) {
      setParamsModalFlow(flow);
      setParamsModalInitialParams(paramsForFlow);
    } else {
      navigate('/', { state: { runFlowId: flow.id } });
    }
  };

  const handleRunWithParams = (params: RequestParam[]) => {
    if (!paramsModalFlow) return;
    navigate('/', { state: { runFlowId: paramsModalFlow.id, runFlowParams: params } });
    setParamsModalFlow(null);
    setParamsModalInitialParams([]);
  };

  if (!groupSlug || !group) {
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/examples" className="hover:text-foreground transition-colors">
              Example flows
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="text-foreground font-medium">{group.name}</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{group.name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {flows.length} API{flows.length !== 1 ? 's' : ''} — click Run to open the playground and send the request
                </p>
              </div>
            </div>
          </div>

          {/* API list */}
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
                      <span className="text-sm font-medium text-foreground block truncate">
                        {flow.label}
                      </span>
                      <Badge
                        variant="secondary"
                        className="mt-1.5 text-xs font-mono"
                      >
                        {method}
                      </Badge>
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

export default ExamplesGroup;
