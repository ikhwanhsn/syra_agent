import { useState, useCallback, useEffect, useMemo } from 'react';
import { Wallet, ChevronLeft, ArrowRight } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWalletContext } from '@/contexts/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const SOLANA_GRADIENT = 'from-[#9945FF] to-[#14F195]';
const BASE_COLOR = '#0052FF';

type Step = 'choose-network' | 'solana-wallets' | 'base-wallets';

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BASE_WALLETS: { id: string; name: string; description: string }[] = [
  { id: 'metamask', name: 'MetaMask', description: 'Browser extension' },
  { id: 'coinbase', name: 'Coinbase Wallet', description: 'Extension or app' },
  { id: 'other', name: 'Other EVM wallet', description: 'Any EVM-compatible wallet' },
];

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  const { wallets, select } = useWallet();
  const walletContext = useWalletContext();
  const [step, setStep] = useState<Step>('choose-network');
  const [connectingBase, setConnectingBase] = useState<string | null>(null);

  const resetStep = useCallback(() => {
    setStep('choose-network');
    setConnectingBase(null);
  }, []);

  useEffect(() => {
    if (!open) resetStep();
  }, [open, resetStep]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetStep();
  }, [onOpenChange, resetStep]);

  const handleSelectSolana = useCallback(() => setStep('solana-wallets'), []);
  const handleSelectBase = useCallback(() => setStep('base-wallets'), []);
  const handleBack = useCallback(() => setStep('choose-network'), []);

  const solanaWalletsList = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; icon?: string; installed: boolean }[] = [];
    for (const w of wallets) {
      const name = w.adapter.name;
      if (seen.has(name)) continue;
      seen.add(name);
      list.push({
        name,
        icon: typeof w.adapter.icon === 'string' ? w.adapter.icon : undefined,
        installed: w.readyState === WalletReadyState.Installed,
      });
    }
    list.sort((a, b) => (a.installed === b.installed ? 0 : a.installed ? -1 : 1));
    return list;
  }, [wallets]);

  const handleConnectSolana = useCallback(
    (walletName: string) => {
      select(walletName);
      handleClose();
    },
    [select, handleClose]
  );

  const handleConnectBase = useCallback(
    async (walletId: string) => {
      setConnectingBase(walletId);
      try {
        await walletContext.connectBase();
        handleClose();
      } finally {
        setConnectingBase(null);
      }
    },
    [walletContext, handleClose]
  );

  const hasInjectedProvider = typeof window !== 'undefined' && !!(window as unknown as { ethereum?: unknown }).ethereum;

  const stepTitle =
    step === 'choose-network'
      ? 'Connect Wallet'
      : step === 'solana-wallets'
        ? 'Solana'
        : 'Base';
  const stepSubtitle =
    step === 'choose-network'
      ? 'Choose a network, then pick a wallet to connect.'
      : step === 'solana-wallets'
        ? 'Choose a Solana wallet to connect.'
        : 'Choose an EVM wallet to connect on Base.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px] p-0 gap-0 overflow-hidden"
        onPointerDownOutside={handleClose}
        onEscapeKeyDown={handleClose}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              {stepTitle}
            </DialogTitle>
            {step !== 'choose-network' && (
              <Button variant="ghost" size="sm" className="h-8 -mr-1 text-muted-foreground" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-0.5" />
                Back
              </Button>
            )}
          </div>
          <DialogDescription className="text-sm">{stepSubtitle}</DialogDescription>
          {step !== 'choose-network' && (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium w-fit mt-1',
                step === 'solana-wallets'
                  ? 'bg-gradient-to-r from-[#9945FF]/20 to-[#14F195]/20 text-foreground'
                  : 'bg-[#0052FF]/15 text-foreground'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', step === 'solana-wallets' ? 'bg-[#14F195]' : 'bg-[#0052FF]')} />
              {step === 'solana-wallets' ? 'Solana' : 'Base'}
            </div>
          )}
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
          {step === 'choose-network' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSelectSolana}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-card/50 p-4 text-left transition-all',
                  'hover:border-primary/40 hover:bg-accent/5 hover:shadow-md active:scale-[0.99]'
                )}
              >
                <div className={cn('rounded-xl bg-gradient-to-br p-2.5', SOLANA_GRADIENT)}>
                  <span className="text-base font-bold text-white">SOL</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Solana</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Phantom, Solflare, Coinbase Wallet</p>
                </div>
                <span className="text-xs text-primary font-medium flex items-center gap-1 mt-auto">
                  Choose wallet <ArrowRight className="h-3 w-3" />
                </span>
              </button>
              <button
                type="button"
                onClick={handleSelectBase}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-xl border-2 border-border bg-card/50 p-4 text-left transition-all',
                  'hover:border-[#0052FF]/40 hover:bg-[#0052FF]/5 hover:shadow-md active:scale-[0.99]'
                )}
              >
                <div className="rounded-xl p-2.5 text-white" style={{ backgroundColor: BASE_COLOR }}>
                  <span className="text-base font-bold">B</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Base</p>
                  <p className="text-xs text-muted-foreground mt-0.5">MetaMask, Coinbase Wallet, EVM</p>
                </div>
                <span className="text-xs font-medium flex items-center gap-1 mt-auto" style={{ color: BASE_COLOR }}>
                  Choose wallet <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            </div>
          )}

          {step === 'solana-wallets' && (
            <ScrollArea className="max-h-[min(50vh,280px)] -mx-1 pr-1">
              <ul className="space-y-2">
                {solanaWalletsList.map((w) => (
                  <li key={w.name}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 transition-colors',
                        'hover:bg-accent/5 hover:border-border/80'
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/80 overflow-hidden">
                        {w.icon ? (
                          <img src={w.icon} alt="" width={24} height={24} className="object-contain" />
                        ) : (
                          <Wallet className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{w.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.installed ? 'Detected' : 'Not detected'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0"
                        onClick={() => handleConnectSolana(w.name)}
                        disabled={!w.installed}
                      >
                        Connect
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {solanaWalletsList.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No Solana wallet detected. Install Phantom, Solflare, or Coinbase Wallet.
                </p>
              )}
            </ScrollArea>
          )}

          {step === 'base-wallets' && (
            <>
              {!hasInjectedProvider && (
                <p className="text-sm text-destructive mb-3 rounded-lg bg-destructive/10 px-3 py-2">
                  No EVM wallet detected. Install MetaMask or Coinbase Wallet to connect.
                </p>
              )}
              <ScrollArea className="max-h-[min(50vh,280px)] -mx-1 pr-1">
                <ul className="space-y-2">
                  {BASE_WALLETS.map((w) => {
                    const isConnecting = connectingBase === w.id;
                    return (
                      <li key={w.id}>
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 transition-colors',
                            'hover:bg-accent/5 hover:border-border/80'
                          )}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/80">
                            <Wallet className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">{w.name}</p>
                            <p className="text-xs text-muted-foreground">{w.description}</p>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0"
                            onClick={() => handleConnectBase(w.id)}
                            disabled={!hasInjectedProvider || !!connectingBase}
                          >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
