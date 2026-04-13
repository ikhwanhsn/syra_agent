import { Wallet, Zap, Mail, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type ConnectOption = 'solana' | 'base' | 'email';

interface ConnectChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when user picks an option: solana/base opens wallet connect for that chain, email opens Privy login (email/social). */
  onPick: (option: ConnectOption) => void;
}

const optionRowClass =
  'group relative flex h-auto min-h-0 w-full min-w-0 items-center justify-start gap-4 rounded-xl border border-border/40 bg-muted/15 p-4 text-left text-foreground shadow-sm outline-none transition-all duration-200 hover:border-border/80 hover:bg-muted/30 hover:text-foreground hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] whitespace-normal font-normal';

export function ConnectChainModal({ isOpen, onClose, onPick }: ConnectChainModalProps) {
  const handlePick = (option: ConnectOption) => {
    onPick(option);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'gap-0 overflow-hidden border-border/50 bg-background/95 p-0 shadow-2xl shadow-black/40 backdrop-blur-xl w-full max-w-xl',
          'sm:rounded-2xl'
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
        >
          <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="relative space-y-6 px-6 pb-6 pt-7 sm:px-7 sm:pb-7 sm:pt-8">
          <DialogHeader className="space-y-3 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Secure access
            </p>
            <DialogTitle className="flex flex-col gap-3 text-2xl font-semibold tracking-tight sm:text-[1.65rem] sm:leading-tight">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/60 shadow-inner">
                <Wallet className="h-5 w-5 text-foreground" strokeWidth={1.75} />
              </span>
              <span className="text-balance">Connect your wallet</span>
            </DialogTitle>
            <DialogDescription className="space-y-3 text-pretty text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              <span className="block">
                Choose how to continue. Email uses Privy; Solana or Base opens Privy&apos;s wallet list
                for that network (EVM limited to Base).
              </span>
              <span className="flex flex-wrap items-center gap-x-1 rounded-lg border border-border/40 bg-muted/25 px-3 py-2.5 text-[12px] leading-snug sm:text-[13px]">
                <span className="text-muted-foreground">Solana x402:</span>
                <span className="font-medium text-foreground">Phantom</span>
                <span className="text-muted-foreground">
                  is recommended. Enable it in your Privy dashboard if needed.
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2.5 min-w-0">
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                optionRowClass,
                'hover:border-primary/25',
              )}
              onClick={() => handlePick('email')}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/40 ring-1 ring-border/50">
                <Mail className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
                  Email
                  <span className="rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Privy
                  </span>
                </span>
                <span className="block text-[13px] leading-snug text-muted-foreground">
                  Sign in with email or social — ideal if you are starting on Base or
                  prefer a passwordless flow.
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground/70"
                aria-hidden
              />
            </button>

            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                optionRowClass,
                'hover:border-[#9945FF]/35 hover:shadow-[0_12px_40px_-16px_rgba(153,69,255,0.35)]',
              )}
              onClick={() => handlePick('solana')}
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9945FF]/25 to-[#9945FF]/5 ring-1 ring-[#9945FF]/25">
                <Zap className="h-5 w-5 text-[#9945FF]" fill="currentColor" fillOpacity={0.15} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
                  Solana
                  <span className="rounded-full bg-[#9945FF]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c4a3ff]">
                    Recommended
                  </span>
                </span>
                <span className="block text-[13px] leading-snug text-muted-foreground">
                  Phantom first, then Solflare and other Solana wallets.
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#9945FF]/80"
                aria-hidden
              />
            </button>

            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                optionRowClass,
                'hover:border-[#0052FF]/35 hover:shadow-[0_12px_40px_-16px_rgba(0,82,255,0.28)]',
              )}
              onClick={() => handlePick('base')}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052FF]/25 to-[#0052FF]/5 ring-1 ring-[#0052FF]/25">
                <span className="text-lg font-bold leading-none text-[#0052FF]">B</span>
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  Base
                </span>
                <span className="block text-[13px] leading-snug text-muted-foreground">
                  MetaMask, Rainbow, Coinbase Wallet, and other EVM wallets on Base.
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#0052FF]/80"
                aria-hidden
              />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
