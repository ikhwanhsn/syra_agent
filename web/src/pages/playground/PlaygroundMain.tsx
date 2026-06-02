import { Navigate, useSearchParams } from "@/lib/navigation";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PlaygroundTabBar, type PlaygroundTab } from "@/components/playground/PlaygroundTabBar";
import { SyraApiCatalog } from "@/components/playground/SyraApiCatalog";
import { PlaygroundModals } from "@/components/playground/PlaygroundModals";
import { PlaygroundCustomTester } from "@/pages/playground/PlaygroundCustomTester";
import { PlaygroundSessionProvider } from "@/contexts/PlaygroundSessionContext";
function PlaygroundMainInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: PlaygroundTab = searchParams.get("tab") === "custom" ? "custom" : "syra";
  const setTab = (next: PlaygroundTab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "custom") params.set("tab", "custom");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  return (
    <PlaygroundPageShell>
      <PlaygroundTabBar active={tab} onChange={setTab} />
      <div key={tab} className="relative z-[1]">
        {tab === "syra" ? <SyraApiCatalog /> : <PlaygroundCustomTester />}
      </div>
      <PlaygroundModals />
    </PlaygroundPageShell>
  );
}

/** Default `/playground` — Syra API catalog + custom API tab. */
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
