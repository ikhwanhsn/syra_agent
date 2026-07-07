import { Navigate, useSearchParams } from "@/lib/navigation";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PlaygroundQuickstart } from "@/components/playground/PlaygroundQuickstart";
import {
  parsePlaygroundTab,
} from "@/components/playground/PlaygroundTabBar.types";
import { SyraApiCatalog } from "@/components/playground/SyraApiCatalog";
import { PlaygroundModals } from "@/components/playground/PlaygroundModals";
import { PlaygroundCustomTester } from "@/pages/playground/PlaygroundCustomTester";
import { PlaygroundSessionProvider } from "@/contexts/PlaygroundSessionContext";
import { playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { cn } from "@/lib/utils";

function PlaygroundMainInner() {
  const [searchParams] = useSearchParams();
  const tab = parsePlaygroundTab(searchParams.get("tab"));

  return (
    <PlaygroundPageShell>
      <div
        key={tab}
        id={`playground-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`playground-tab-${tab}`}
        className={cn("relative z-[1]", playgroundTabPanelEnter)}
      >
        {tab === "syra" ? <SyraApiCatalog /> : null}
        {tab === "build" ? <PlaygroundQuickstart /> : null}
        {tab === "custom" ? <PlaygroundCustomTester /> : null}
      </div>

      <PlaygroundModals />
    </PlaygroundPageShell>
  );
}

/** Default `/marketplace` — Syra API catalog + integrate + custom request tabs. */
export default function PlaygroundMain() {
  const [searchParams] = useSearchParams();
  if (searchParams.has("view")) {
    return <Navigate to="/marketplace" replace />;
  }
  return (
    <PlaygroundSessionProvider>
      <PlaygroundMainInner />
    </PlaygroundSessionProvider>
  );
}
