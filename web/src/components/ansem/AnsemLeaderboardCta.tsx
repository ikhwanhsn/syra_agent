import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { AnsemSectionHeader } from "@/components/ansem/AnsemSectionHeader";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

export function AnsemLeaderboardCta({ className }: { className?: string }) {
  return (
    <section className={cn("min-w-0 space-y-5", className)}>
      <AnsemSectionHeader
        kicker="Bull squad"
        title="$ANSEM engagement arena"
        description="Scan your X profile, climb the squad leaderboard, and see who's posting about $ANSEM."
      />

      <div
        className={cn(
          overviewCardShell,
          "relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background/80 to-orange-600/5 p-5 sm:p-6",
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-500" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-foreground">Leaderboard & X scan</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Connect wallet, scan your X for $ANSEM posts, and compete on the squad board.
                Recent posters are added automatically.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 font-semibold text-white hover:from-amber-600 hover:to-orange-700 sm:w-auto"
          >
            <Link to="/ansem/leaderboard">
              Open leaderboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
