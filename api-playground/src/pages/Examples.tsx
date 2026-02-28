import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExampleFlows, EXAMPLE_FLOWS_VISIBLE_COUNT, getParamsForExampleFlow, type ExampleFlowPreset } from '@/hooks/useApiPlayground';
import { TopBar } from '@/components/TopBar';
import { ConnectChainModal } from '@/components/ConnectChainModal';
import { QueryParamsModal } from '@/components/QueryParamsModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';
import type { RequestParam } from '@/types/api';

const Examples = () => {
  const navigate = useNavigate();
  const { wallet, connectWallet, selectPaymentChain } = useApiPlayground();
  const { setConnectChainOverride, openLoginModal } = useWalletContext();
  const featuredFlows = getExampleFlows().slice(0, EXAMPLE_FLOWS_VISIBLE_COUNT);
  const restFlows = getExampleFlows().slice(EXAMPLE_FLOWS_VISIBLE_COUNT);

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
          if (option === 'email') {
            setIsConnectChainModalOpen(false);
            openLoginModal();
            return;
          }
          selectPaymentChain(option);
          setIsConnectChainModalOpen(false);
          const override = option === 'base' ? 'ethereum-only' : 'solana-only';
          setConnectChainOverride(override);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              connectWallet(option);
              setTimeout(() => setConnectChainOverride(null), 5000);
            });
          });
        }}
      />
      <div className="flex-1 pt-14 sm:pt-16 p-3 sm:p-6 max-w-5xl mx-auto w-full min-w-0">
        <div className="flex items-center gap-4 mb-6 pt-4 pb-2">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground px-4 py-2 -ml-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to playground
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">All v2 example flows</h1>
            <p className="text-sm text-muted-foreground">
              Click Run to open the playground and send the request
            </p>
          </div>
        </div>

        {featuredFlows.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Featured (also on Request Builder)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {featuredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <span className="text-sm font-medium truncate">{flow.label}</span>
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
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            All v2 endpoints ({restFlows.length} more)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {restFlows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <span className="text-sm font-medium truncate">{flow.label}</span>
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
            ))}
          </div>
        </section>
      </div>

      <QueryParamsModal
        isOpen={!!paramsModalFlow}
        onClose={() => { setParamsModalFlow(null); setParamsModalInitialParams([]); }}
        flow={paramsModalFlow}
        initialParams={paramsModalInitialParams}
        onRun={handleRunWithParams}
      />
    </div>
  );
};

export default Examples;
