import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Layers } from 'lucide-react';
import { getExampleFlowGroups } from '@/hooks/useApiPlayground';
import { TopBar } from '@/components/TopBar';
import { ConnectChainModal } from '@/components/ConnectChainModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { useWalletContext } from '@/contexts/WalletContext';

const Examples = () => {
  const { wallet, connectWallet, selectPaymentChain } = useApiPlayground();
  const { openLoginModal, isPrivyMounted, requestConnect } = useWalletContext();
  const [isConnectChainModalOpen, setIsConnectChainModalOpen] = useState(false);
  const groups = getExampleFlowGroups();

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
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border/50">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Example flows</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Browse APIs by group or partner — open a group to see all endpoints and run them
              </p>
            </div>
          </div>

          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groups.map((group) => (
                <Link
                  key={group.slug}
                  to={`/examples/${group.slug}`}
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
        </div>
      </div>
    </div>
  );
};

export default Examples;
