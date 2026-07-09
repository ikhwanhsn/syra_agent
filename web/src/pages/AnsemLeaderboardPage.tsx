import { useEffect } from "react";
import { Link } from "@/lib/navigation";
import { ArrowLeft } from "lucide-react";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { PLAYGROUND_CONTENT_SHELL } from "@/components/playground/playgroundStyles";
import { AnsemEngagementArena } from "@/components/ansem/AnsemEngagementArena";
import { ANSEM } from "@/lib/ansem";
import { PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export function AnsemLeaderboardView() {
  return (
    <div className="relative flex min-h-full min-w-0 w-full flex-col overflow-x-hidden">
      <OverviewPageBackdrop />

      <div
        className={cn(
          PLAYGROUND_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "min-w-0 space-y-6 pb-14",
        )}
      >
        <Link
          to="/ansem"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to $ANSEM hub
        </Link>

        <AnsemEngagementArena />
      </div>
    </div>
  );
}

export default function AnsemLeaderboardPage() {
  useEffect(() => {
    document.title = `$${ANSEM.symbol} Leaderboard · Syra`;
    return () => {
      document.title = "Syra";
    };
  }, []);

  return <AnsemLeaderboardView />;
}
