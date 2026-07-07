import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "@/lib/navigation";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PlaygroundCustomTester } from "@/pages/playground/PlaygroundCustomTester";
import { PlaygroundModals } from "@/components/playground/PlaygroundModals";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { InvalidShareLink } from "@/pages/playground/InvalidShareLink";
import { MAIN_CONTENT_PB_SAFE_CLASS } from "@/lib/branding";
import { MARKETPLACE_ROUTE, marketplaceSharePath } from "@/lib/marketplaceConstants";
import { cn } from "@/lib/utils";
import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import type { RequestParam } from "@/types/api";

function isValidShareSlug(s: string): boolean {
  return /^[a-f0-9]{1,24}$/i.test(s);
}

/** Share-link route (`/marketplace/s/:slug`) — custom tester with loaded request. */
const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: shareSlug } = useParams<{ slug?: string }>();
  const {
    history,
    selectedHistoryId,
    loadSharedRequest,
    runExampleFlow,
    runExampleFlowFromPreset,
  } = usePlaygroundSession();

  const lastRunFlowIdRef = useRef<string | null>(null);
  const lastLoadedShareSlugRef = useRef<string | null>(null);
  const [shareLoadStatus, setShareLoadStatus] = useState<
    "idle" | "loading" | "success" | "not_found"
  >("idle");

  const isInvalidSharePage = shareSlug === "invalid";
  const attemptedSlug = (location.state as { attemptedSlug?: string } | null)?.attemptedSlug;

  useEffect(() => {
    if (!shareSlug) {
      setShareLoadStatus("idle");
      lastLoadedShareSlugRef.current = null;
    }
  }, [shareSlug]);

  useEffect(() => {
    if (!shareSlug || shareSlug === "invalid" || !loadSharedRequest) return;
    const selected = history.find((h) => h.id === selectedHistoryId);
    if (selected?.shareSlug === shareSlug) {
      setShareLoadStatus("success");
      lastLoadedShareSlugRef.current = shareSlug;
      return;
    }
    if (lastLoadedShareSlugRef.current === shareSlug) return;
    lastLoadedShareSlugRef.current = shareSlug;
    if (!isValidShareSlug(shareSlug)) {
      navigate(`${MARKETPLACE_ROUTE}/s/invalid`, { replace: true, state: { attemptedSlug: shareSlug } });
      return;
    }
    setShareLoadStatus("loading");
    loadSharedRequest(shareSlug)
      .then((ok) => {
        if (ok) setShareLoadStatus("success");
        else navigate(`${MARKETPLACE_ROUTE}/s/invalid`, { replace: true, state: { attemptedSlug: shareSlug } });
      })
      .catch(() =>
        navigate(`${MARKETPLACE_ROUTE}/s/invalid`, { replace: true, state: { attemptedSlug: shareSlug } }),
      );
  }, [shareSlug, loadSharedRequest, navigate, history, selectedHistoryId]);

  const locationPathname = location.pathname;
  useEffect(() => {
    if (!locationPathname.startsWith(MARKETPLACE_ROUTE) && !locationPathname.startsWith("/playground")) return;
    if (locationPathname.includes("/s/")) return;
    if (!selectedHistoryId) return;
    const selected = history.find((h) => h.id === selectedHistoryId);
    if (!selected?.shareSlug) return;
    navigate(marketplaceSharePath(selected.shareSlug), { replace: true });
  }, [locationPathname, selectedHistoryId, history, navigate]);

  useEffect(() => {
    if (!locationPathname.includes("/s/") || shareSlug === "invalid") return;
    if (shareLoadStatus === "loading") return;
    if (selectedHistoryId !== undefined) return;
    navigate(`${MARKETPLACE_ROUTE}?tab=custom`, { replace: true });
  }, [locationPathname, selectedHistoryId, shareLoadStatus, shareSlug, navigate]);

  useEffect(() => {
    const state = location.state as {
      runFlowId?: string;
      runFlowPreset?: ExampleFlowPreset;
      runFlowParams?: RequestParam[];
    } | null;
    const preset = state?.runFlowPreset;
    if (preset) {
      const key = `preset:${preset.id}`;
      if (lastRunFlowIdRef.current === key) return;
      lastRunFlowIdRef.current = key;
      runExampleFlowFromPreset(preset, state?.runFlowParams);
      navigate(`${MARKETPLACE_ROUTE}?tab=custom`, { replace: true, state: {} });
      return;
    }
    const flowId = state?.runFlowId;
    if (!flowId) {
      lastRunFlowIdRef.current = null;
      return;
    }
    if (lastRunFlowIdRef.current === flowId) return;
    lastRunFlowIdRef.current = flowId;
    runExampleFlow(flowId, state?.runFlowParams);
    navigate(`${MARKETPLACE_ROUTE}?tab=custom`, { replace: true, state: {} });
  }, [location.state, runExampleFlow, runExampleFlowFromPreset, navigate]);

  if (isInvalidSharePage) {
    return (
      <PlaygroundPageShell>
        <div className={cn("relative z-[1] flex min-h-0 flex-1", MAIN_CONTENT_PB_SAFE_CLASS)}>
          <InvalidShareLink slug={attemptedSlug} />
        </div>
        <PlaygroundModals />
      </PlaygroundPageShell>
    );
  }

  if (shareSlug && shareLoadStatus === "loading") {
    return (
      <PlaygroundPageShell>
        <div className="relative z-[1] flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Loading shared request…</p>
          </div>
        </div>
      </PlaygroundPageShell>
    );
  }

  return (
    <PlaygroundPageShell>
      <PlaygroundCustomTester />
      <PlaygroundModals />
    </PlaygroundPageShell>
  );
};

export default Index;
