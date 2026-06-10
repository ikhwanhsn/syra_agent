import { Navigate, useSearchParams } from "@/lib/navigation";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PlaygroundQuickstart } from "@/components/playground/PlaygroundQuickstart";
import {
  PlaygroundTabBar,
  parsePlaygroundTab,
  playgroundTabToParam,
  type PlaygroundTab,
} from "@/components/playground/PlaygroundTabBar";
import { SyraApiCatalog } from "@/components/playground/SyraApiCatalog";
import { PlaygroundModals } from "@/components/playground/PlaygroundModals";
import { PlaygroundCustomTester } from "@/pages/playground/PlaygroundCustomTester";
import { PlaygroundSessionProvider } from "@/contexts/PlaygroundSessionContext";
import { playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { cn } from "@/lib/utils";

function PlaygroundMainInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parsePlaygroundTab(searchParams.get("tab"));

  const setTab = (next: PlaygroundTab) => {
    const params = new URLSearchParams(searchParams);
    const param = playgroundTabToParam(next);
    if (param) params.set("tab", param);
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  return (
    <PlaygroundPageShell>
      <PlaygroundTabBar active={tab} onChange={setTab} />

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

/** Default `/playground` — Syra API catalog + build + custom API tabs. */
export default function PlaygroundMain() {
  const [searchParams] = useSearchParams();
  if (searchParams.has("view")) {
    return <Navigate to="/playground" replace />;
  }
  return (
    <PlaygroundSessionProvider>
      <PlaygroundMainInner />
    </PlaygroundSessionProvider>
  );
}
