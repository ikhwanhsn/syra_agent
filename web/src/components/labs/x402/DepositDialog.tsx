import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LabWallet } from "@/lib/labsX402Api";

interface DepositDialogProps {
  wallet: LabWallet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepositDialog({ wallet, open, onOpenChange }: DepositDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!wallet) return null;

  const copyAddress = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit to {wallet.label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG value={wallet.address} size={180} level="M" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Send SOL (for fees) and USDC to this address on Solana mainnet.
          </p>
          <div className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <code className="flex-1 break-all text-xs">{wallet.address}</code>
            <Button variant="ghost" size="icon" onClick={() => void copyAddress()} aria-label="Copy address">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
