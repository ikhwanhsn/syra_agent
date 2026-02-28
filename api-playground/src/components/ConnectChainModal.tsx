import { Wallet, Zap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function ConnectChainModal({ isOpen, onClose, onPick }: ConnectChainModalProps) {
  const handlePick = (option: ConnectOption) => {
    onPick(option);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 min-w-0">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="min-w-0">
            Choose how you want to connect. Email opens Privy sign-in; Solana or Base opens the wallet list for that network.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 min-w-0 overflow-hidden">
          <Button
            variant="outline"
            className={cn(
              'h-auto flex flex-col items-start gap-1.5 p-4 text-left border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors min-w-0 w-full'
            )}
            onClick={() => handlePick('email')}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </span>
              Email
            </span>
            <span className="text-xs text-muted-foreground">
              Sign in with email or social (Privy). Good for web2 / Base users.
            </span>
          </Button>
          <Button
            variant="outline"
            className={cn(
              'h-auto flex flex-col items-start gap-1.5 p-4 text-left border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors min-w-0 w-full'
            )}
            onClick={() => handlePick('solana')}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="w-8 h-8 rounded-lg bg-[#9945FF]/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[#9945FF]" />
              </span>
              Solana
            </span>
            <span className="text-xs text-muted-foreground">
              Phantom, Solflare, and other Solana wallets
            </span>
          </Button>
          <Button
            variant="outline"
            className={cn(
              'h-auto flex flex-col items-start gap-1.5 p-4 text-left border-2 hover:border-[#0052FF]/50 hover:bg-[#0052FF]/5 transition-colors min-w-0 w-full'
            )}
            onClick={() => handlePick('base')}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="w-8 h-8 rounded-lg bg-[#0052FF]/20 flex items-center justify-center">
                <span className="text-[#0052FF] font-bold text-sm">B</span>
              </span>
              Base
            </span>
            <span className="text-xs text-muted-foreground">
              MetaMask, Rainbow, and other EVM wallets
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
