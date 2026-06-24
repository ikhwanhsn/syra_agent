import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MemecoinAnalysisQuota } from "@/lib/pumpfunAnalysisApi";
import {
  formatQuotaResetHint,
  PUMPFUN_SCAN_TIER_LIMITS,
  PUMPFUN_SCAN_TIER_SUMMARY,
  PUMPFUN_SCAN_STAKE_THRESHOLDS,
  tierLabel,
  tierUpgradeHint,
} from "@/lib/pumpfunScanQuota";

export interface PumpfunScanLimitModalProps {
  open: boolean;
  onClose: () => void;
  quota?: MemecoinAnalysisQuota;
}

export function PumpfunScanLimitModal({ open, onClose, quota }: PumpfunScanLimitModalProps) {
  const upgradeHint = tierUpgradeHint(quota?.tier);
  const used = quota?.used ?? PUMPFUN_SCAN_TIER_LIMITS.free;
  const limit = quota?.limit ?? PUMPFUN_SCAN_TIER_LIMITS.free;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
          <DialogTitle>Daily scan limit reached</DialogTitle>
          <DialogDescription>
            You&apos;ve used all {used}/{limit} Pumpfun Alpha scans for today.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 sm:px-6">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Scan tiers</p>
            <p className="mt-2 text-muted-foreground">{PUMPFUN_SCAN_TIER_SUMMARY}</p>
          </div>

          {quota ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Current tier: <span className="font-medium text-foreground">{tierLabel(quota.tier)}</span>
              </span>
              <span>{formatQuotaResetHint(quota.resetAt)}</span>
            </div>
          ) : null}

          {upgradeHint ? (
            <p className="text-sm text-muted-foreground">{upgradeHint}</p>
          ) : null}

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-emerald-400">•</span>
              <span>
                <span className="font-medium text-foreground">{PUMPFUN_SCAN_TIER_LIMITS.staker}/day</span>{" "}
                with {PUMPFUN_SCAN_STAKE_THRESHOLDS.staker} $SYRA staked via Streamflow
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400">•</span>
              <span>
                <span className="font-medium text-foreground">Unlimited</span> with{" "}
                {PUMPFUN_SCAN_STAKE_THRESHOLDS.unlimited} $SYRA staked
              </span>
            </li>
          </ul>
        </div>

        <DialogFooter className="border-t border-border/60 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="neon" asChild>
            <Link to="/staking">Stake $SYRA</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
