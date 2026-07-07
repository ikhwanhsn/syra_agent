import type { ReactNode } from "react";
import { Clock, Coins } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MachineMoneyPreviewToggle } from "@/components/dashboard/MachineMoneyPreviewToggle";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useMachineMoneyPreview } from "@/contexts/MachineMoneyPreviewContext";
import { isPillarGated } from "@/lib/dashboardPillarNav";
import { cn } from "@/lib/utils";

type MachineMoneyPageGateProps = {
  pillarId: string;
  children: ReactNode;
  pillarLabel: string;
  pillarTagline: string;
  pillarDescription?: string;
};

function PillarComingSoon({
  pillarLabel,
  pillarTagline,
  pillarDescription,
  showAdminPreviewControls = false,
}: Omit<MachineMoneyPageGateProps, "children"> & {
  showAdminPreviewControls?: boolean;
}) {
  return (
    <PillarLayout
      embedded
      title={pillarLabel}
      tagline={pillarTagline}
      description={pillarDescription}
      actions={showAdminPreviewControls ? <MachineMoneyPreviewToggle /> : undefined}
    >
      {showAdminPreviewControls ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          <EyePreviewBadge />
          <span>Admin preview — this is what users see until Machine Money ships.</span>
        </div>
      ) : null}
      <div className={cn(overviewCardShell, "p-8 sm:p-10 text-center")}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
          <Clock className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <Badge variant="secondary" className="mb-3 rounded-lg px-2.5 py-0.5 font-medium">
          Coming soon
        </Badge>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {pillarLabel} is rolling out
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          Machine Money pillars — Earn, Treasury, Invest, Spend, and Grow — are in active development.
          You&apos;ll get access here when this module ships.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link to="/overview">
              <Coins className="mr-1.5 h-4 w-4" aria-hidden />
              Back to overview
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link to="/marketplace">Explore marketplace</Link>
          </Button>
        </div>
      </div>
    </PillarLayout>
  );
}

function EyePreviewBadge() {
  return (
    <Badge
      variant="outline"
      className="shrink-0 rounded-md border-amber-500/35 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300"
    >
      Preview
    </Badge>
  );
}

export function MachineMoneyPageGate({
  pillarId,
  children,
  pillarLabel,
  pillarTagline,
  pillarDescription,
}: MachineMoneyPageGateProps) {
  const { machineMoneyUnlocked, previewComingSoon } = useMachineMoneyPreview();

  if (isPillarGated(pillarId, machineMoneyUnlocked)) {
    return (
      <PillarComingSoon
        pillarLabel={pillarLabel}
        pillarTagline={pillarTagline}
        pillarDescription={pillarDescription}
        showAdminPreviewControls={previewComingSoon}
      />
    );
  }

  return <>{children}</>;
}
