import { useState } from "react";
import { useNavigate } from "@/lib/navigation";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { acceptLpExperimentRisk, hasAcceptedLpExperimentRisk } from "@/lib/lpExperimentRiskAgreement";

type Props = {
  /** When true, user must accept before using the page. */
  blockUntilAccepted?: boolean;
};

export function LpExperimentRiskAgreementDialog({ blockUntilAccepted = true }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => blockUntilAccepted && !hasAcceptedLpExperimentRisk());
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAccept = () => {
    if (!acknowledged) return;
    acceptLpExperimentRisk();
    setOpen(false);
  };

  const handleLeave = () => {
    navigate("/overview", { replace: true });
  };

  if (!open) return null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
      }}
    >
      <AlertDialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-violet-500/25 bg-violet-500/[0.08] px-6 py-4">
          <AlertDialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-violet-500/35 bg-violet-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800 dark:text-violet-200">
                Beta
              </span>
              <AlertDialogTitle className="text-lg">Experimental LP desk — full risk</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The LP agent experiment is in <strong className="font-medium text-foreground">beta</strong>. Simulated
                and real on-chain strategies can lose capital. Nothing here is financial advice.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">Simulation</strong> uses modeled PnL — results may not
                match live markets.
              </span>
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span>
                <strong className="font-medium text-foreground">LP Real Agent</strong> spends real SOL from your
                custodied wallet on Meteora DLMM. You can lose part or all of deposited funds.
              </span>
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span>
                Strategies, pool selection, and automation may fail due to chain congestion, slippage, exploits, or
                bugs.
              </span>
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <span>Only use capital you can afford to lose. You are solely responsible for enabling the real agent.</span>
            </li>
          </ul>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
            <Checkbox
              id="lp-risk-ack"
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
            />
            <Label htmlFor="lp-risk-ack" className="cursor-pointer text-sm leading-snug text-foreground">
              I understand this is an experimental beta, I may lose funds, and I accept full responsibility for
              turning on any real LP agent.
            </Label>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleLeave}>
            Leave experiment
          </Button>
          <Button
            type="button"
            className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 sm:w-auto"
            disabled={!acknowledged}
            onClick={handleAccept}
          >
            I accept the risks — continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
