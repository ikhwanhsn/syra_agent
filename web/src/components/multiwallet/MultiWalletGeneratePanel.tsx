import { useCallback, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { notify } from "@/lib/notify";
import { generateMultiWallets, type MultiWalletTierSummary } from "@/lib/multiWalletApi";
import { tierUpgradeHint } from "@/components/multiwallet/MultiWalletTierBadge";
import { cn } from "@/lib/utils";

interface MultiWalletGeneratePanelProps {
  tier: MultiWalletTierSummary | null;
  loading: boolean;
  onGenerated: () => Promise<void> | void;
}

const BASIC_WALLET_LIMIT = 5;

export function MultiWalletGeneratePanel({ tier, loading, onGenerated }: MultiWalletGeneratePanelProps) {
  const maxGenerate = useMemo(() => {
    if (!tier) return BASIC_WALLET_LIMIT;
    if (tier.limit == null) return 100;
    return Math.max(0, tier.remaining ?? tier.limit - tier.activeCount);
  }, [tier]);

  const [count, setCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const effectiveCount = Math.min(Math.max(1, count), Math.max(1, maxGenerate || 1));

  const handleGenerate = useCallback(async () => {
    if (maxGenerate <= 0) {
      notify.error("Wallet limit reached", tierUpgradeHint(tier?.tier ?? "basic", tier) ?? undefined);
      return;
    }
    setSubmitting(true);
    try {
      const result = await generateMultiWallets(effectiveCount);
      notify.success(
        "Wallets created",
        `${result.wallets.length} new Solana wallet${result.wallets.length === 1 ? "" : "s"} ready.`,
      );
      await onGenerated();
    } catch (err) {
      notify.error("Generation failed", err instanceof Error ? err.message : "Could not create wallets");
    } finally {
      setSubmitting(false);
    }
  }, [effectiveCount, maxGenerate, onGenerated, tier?.tier]);

  return (
    <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary/80">Generate</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Create wallets</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            One click creates fresh Solana keypairs stored encrypted on Syra servers, linked to your
            connected wallet.
          </p>
        </div>
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3">
          <Slider
            value={[effectiveCount]}
            min={1}
            max={Math.max(1, maxGenerate || 1)}
            step={1}
            disabled={loading || submitting || maxGenerate <= 0}
            onValueChange={(v) => setCount(v[0] ?? 1)}
            className="flex-1"
          />
          <Input
            type="number"
            min={1}
            max={Math.max(1, maxGenerate || 1)}
            value={effectiveCount}
            disabled={loading || submitting || maxGenerate <= 0}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="w-20 text-center tabular-nums"
          />
        </div>

        {tier ? (
          <p className="text-xs text-muted-foreground">
            {tierUpgradeHint(tier.tier, tier)}
            {tier.stakedSyra > 0 ? ` · ${tier.stakedSyra.toLocaleString()} $SYRA staked` : " · 0 $SYRA staked"}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No $SYRA required — create up to {BASIC_WALLET_LIMIT} wallets on the basic tier.
          </p>
        )}

        <Button
          onClick={() => void handleGenerate()}
          disabled={loading || submitting || maxGenerate <= 0}
          className="w-full sm:w-auto"
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate {effectiveCount} wallet{effectiveCount === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
