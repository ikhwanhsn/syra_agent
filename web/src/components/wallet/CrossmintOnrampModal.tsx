/**
 * Crossmint fiat onramp — buy USDC with card into a Syra agent wallet.
 * Manual crypto transfer remains available via FuelAgentModal.
 */
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { agentWalletApi, type CrossmintOnrampStatus } from "@/lib/chatApi";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anonymousId: string;
  agentAddress: string;
  chain?: "solana" | "base";
  onCompleted?: () => void;
};

export function CrossmintOnrampModal({
  open,
  onOpenChange,
  anonymousId,
  agentAddress,
  chain = "solana",
  onCompleted,
}: Props) {
  const { toast } = useToast();
  const [status, setStatus] = useState<CrossmintOnrampStatus | null>(null);
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [checkout, setCheckout] = useState<{
    orderId: string;
    clientSecret: string;
    clientApiKey: string;
  } | null>(null);
  const [CheckoutUi, setCheckoutUi] = useState<ComponentType<{
    orderId: string;
    clientSecret: string;
    clientApiKey: string;
    receiptEmail: string;
  }> | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void agentWalletApi
      .getOnrampStatus()
      .then((s) => {
        if (cancelled) return;
        setStatus(s);
        setAmount(String(s.defaultAmountUsd ?? 10));
      })
      .catch(() => {
        if (!cancelled) setStatus({ enabled: false, fundingSource: "crossmint_onramp" });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !checkout) return;
    let cancelled = false;
    void import("@crossmint/client-sdk-react-ui")
      .then(({ CrossmintProvider, CrossmintEmbeddedCheckout }) => {
        if (cancelled) return;
        function Embedded({
          orderId,
          clientSecret,
          clientApiKey,
          receiptEmail,
        }: {
          orderId: string;
          clientSecret: string;
          clientApiKey: string;
          receiptEmail: string;
        }) {
          return (
            <CrossmintProvider apiKey={clientApiKey}>
              <div className="mx-auto w-full max-w-[450px] rounded-xl bg-background">
                <CrossmintEmbeddedCheckout
                  orderId={orderId}
                  clientSecret={clientSecret}
                  payment={{
                    receiptEmail,
                    crypto: { enabled: false },
                    fiat: { enabled: true },
                    defaultMethod: "fiat",
                  }}
                />
              </div>
            </CrossmintProvider>
          );
        }
        setCheckoutUi(() => Embedded);
      })
      .catch(() => {
        toast({
          title: "Checkout UI unavailable",
          description: "Install @crossmint/client-sdk-react-ui or transfer USDC manually.",
          variant: "destructive",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [checkout, open, toast]);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await agentWalletApi.createOnrampOrder(anonymousId, {
        receiptEmail: email.trim(),
        amountUsd: Number(amount),
        chain,
      });
      setCheckout({
        orderId: result.orderId,
        clientSecret: result.clientSecret,
        clientApiKey: result.clientApiKey,
      });
    } catch (err) {
      toast({
        title: "Could not start card purchase",
        description: err instanceof Error ? err.message : "Try again or transfer USDC manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [amount, anonymousId, chain, email, toast]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCheckout(null);
      setCheckoutUi(null);
      if (onCompleted) onCompleted();
    }
    onOpenChange(next);
  };

  const enabled = status?.enabled === true;
  const min = status?.minAmountUsd ?? 10;
  const max = status?.maxAmountUsd ?? 500;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" aria-hidden />
            Buy USDC with card
          </DialogTitle>
          <DialogDescription>
            Funds land on your Syra agent treasury ({agentAddress.slice(0, 4)}…{agentAddress.slice(-4)}). Manual
            transfer still works if you already hold USDC.
          </DialogDescription>
        </DialogHeader>

        {!status ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          </div>
        ) : !enabled ? (
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>Card onramp is not enabled on this environment yet.</p>
            <p>Transfer USDC to your agent address, then refresh balances.</p>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : checkout && CheckoutUi ? (
          <CheckoutUi
            orderId={checkout.orderId}
            clientSecret={checkout.clientSecret}
            clientApiKey={checkout.clientApiKey}
            receiptEmail={email.trim()}
          />
        ) : checkout ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading checkout…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="onramp-email">Receipt email</Label>
              <Input
                id="onramp-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Used for KYC and receipt. Required by the onramp provider.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onramp-amount">Amount (USD)</Label>
              <Input
                id="onramp-amount"
                type="number"
                min={min}
                max={max}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Minimum ${min} (card fees make tiny top-ups uneconomic). Max ${max}.
              </p>
            </div>
            <Button
              type="button"
              className={cn("w-full rounded-xl gap-2")}
              disabled={loading || !email.trim()}
              onClick={() => void handleCreate()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
              Continue to card checkout
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
