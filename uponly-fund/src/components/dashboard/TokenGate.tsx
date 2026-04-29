import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, RISE_UPONLY_MINT } from "@/components/rise/RiseShared";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import { useUponlyAccess } from "@/lib/useUponlyAccess";

type TokenGateProps = {
  pageTitle: string;
  preview: ReactNode;
  children: ReactNode;
};

function getGateTitle(state: ReturnType<typeof useUponlyAccess>["state"]): string {
  if (state === "no-wallet") return "Connect wallet to unlock live insights";
  if (state === "no-provider") return "Install Phantom to unlock live insights";
  if (state === "loading") return "Verifying $UPONLY position...";
  if (state === "no-uponly") return "This wallet does not hold or borrow $UPONLY yet";
  if (state === "error") return "Could not verify wallet access";
  return "Access granted";
}

function getGateDescription(state: ReturnType<typeof useUponlyAccess>) {
  if (state.state === "error") return state.message;
  return "Hold, deposit, or borrow against $UPONLY to unlock live whale flows, signals, activity, and news.";
}

export function TokenGate({ pageTitle, preview, children }: TokenGateProps) {
  const access = useUponlyAccess();
  const buyUrl = buildRiseTradeUrl(RISE_UPONLY_MINT);

  if (access.state === "granted") {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <GlassCard className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Premium Insights
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">{getGateTitle(access.state)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{getGateDescription(access)}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {buyUrl ? (
              <Button asChild size="sm" className="h-9">
                <a href={buyUrl} target="_blank" rel="noopener noreferrer">
                  Buy $UPONLY on RISE
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="secondary" className="h-9">
              <Link to="/dashboard/borrow">Open borrow simulator</Link>
            </Button>
          </div>
        </div>
      </GlassCard>

      <div aria-label={`${pageTitle} preview`}>{preview}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] rounded-b-2xl bg-gradient-to-t from-background/90 via-background/55 to-transparent backdrop-blur-[1.5px]" />
    </div>
  );
}
