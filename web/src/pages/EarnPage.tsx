import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { EarnPromptPanel } from "@/components/earn/EarnPromptPanel";
import { EarnSkillsPanel } from "@/components/earn/EarnSkillsPanel";
import { EarnSummarySection } from "@/components/earn/EarnSummarySection";
import { EarnTokenPanel } from "@/components/earn/EarnTokenPanel";
import { EarnYieldPanel } from "@/components/earn/EarnYieldPanel";
import { EarnPageSkeleton } from "@/components/earn/EarnSkeleton";
import { EarnTrackTabs } from "@/components/earn/EarnTrackTabs";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { Button } from "@/components/ui/button";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { fetchEarnSummary } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

const EARN_TRACKS = ["yield", "token", "prompts", "skills"] as const;
type EarnTrack = (typeof EARN_TRACKS)[number];

function parseTrack(value: string | null): EarnTrack {
  if (value && EARN_TRACKS.includes(value as EarnTrack)) return value as EarnTrack;
  return "yield";
}

export default function EarnPage() {
  const { address, connected } = useWalletContext();
  const { anonymousId } = useAgentWallet();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth, requestSyraAuth } = useSyraAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTrack, setActiveTrack] = useState<EarnTrack>(parseTrack(searchParams.get("track")));

  const key = anonymousId ?? address ?? "";
  const skillsQueryKey = ["earn", "skills", key] as const;

  useEffect(() => {
    setActiveTrack(parseTrack(searchParams.get("track")));
  }, [searchParams]);

  useEffect(() => {
    if (!syraAuthReady || !connected || !address) return;
    void ensureSyraAuth();
  }, [syraAuthReady, connected, address, ensureSyraAuth]);

  const summaryQ = useQuery({
    queryKey: ["earn", "summary", key],
    queryFn: () => fetchEarnSummary(key),
    enabled: Boolean(key),
    staleTime: 60_000,
  });

  const showSkeleton = useMinimumSkeleton(summaryQ.isLoading);

  const data = summaryQ.data?.data;
  const earnings = data?.earnings ?? [];

  const handleTrackChange = useCallback(
    (value: string) => {
      const track = parseTrack(value);
      setActiveTrack(track);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (track === "yield") next.delete("track");
        else next.set("track", track);
        return next;
      });
    },
    [setSearchParams],
  );

  const handleSignIn = () => {
    void requestSyraAuth().then((session) => {
      if (session) {
        void queryClient.invalidateQueries({ queryKey: ["earn", "skills"] });
        void queryClient.invalidateQueries({ queryKey: ["earn", "prompts"] });
        void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
      }
    });
  };

  const handleRequestAuth = async (): Promise<boolean> => {
    const session = await requestSyraAuth();
    if (session) {
      void queryClient.invalidateQueries({ queryKey: ["earn", "skills"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "prompts"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    }
    return Boolean(session);
  };

  const invalidateSkills = () => {
    void queryClient.invalidateQueries({ queryKey: ["earn", "skills"] });
    void queryClient.invalidateQueries({ queryKey: ["earn", "summary", key] });
  };

  return (
    <PillarLayout
      embedded
      title="Earn"
      tagline="Deposit to earn · get paid for what you create"
      description="Run LP Auto on your agent wallet, share playbooks, publish APIs, or launch a pump.fun token."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/wallet?wallet=lp">LP / Earn wallet</Link>
        </Button>
      }
    >
      {showSkeleton && key ? (
        <EarnPageSkeleton />
      ) : (
        <div className="space-y-6">
          {key ? (
            <EarnSummarySection
              pendingUsd={data?.pendingUsd ?? 0}
              paidUsd={data?.paidUsd ?? 0}
              earnings={earnings}
            />
          ) : null}

          <EarnTrackTabs
            activeTrack={activeTrack}
            onTrackChange={handleTrackChange}
            yieldContent={
              <EarnYieldPanel
                anonymousId={anonymousId}
                walletAddress={address}
                connected={connected}
                syraAuthenticated={syraAuthenticated}
                syraAuthReady={syraAuthReady}
                onSignIn={handleSignIn}
                onRequestAuth={handleRequestAuth}
              />
            }
            promptsContent={
              key ? (
                <EarnPromptPanel
                  anonymousId={anonymousId}
                  connected={connected}
                  syraAuthenticated={syraAuthenticated}
                  syraAuthReady={syraAuthReady}
                  onSignIn={handleSignIn}
                  onRequestAuth={handleRequestAuth}
                />
              ) : (
                <div className={cn(overviewCardShell, "p-6 text-center text-sm text-muted-foreground")}>
                  Connect wallet to manage playbooks.
                </div>
              )
            }
            skillsContent={
              key ? (
                <EarnSkillsPanel
                  anonymousId={anonymousId}
                  skillsQueryKey={skillsQueryKey}
                  connected={connected}
                  syraAuthenticated={syraAuthenticated}
                  syraAuthReady={syraAuthReady}
                  onSignIn={handleSignIn}
                  onRequestAuth={handleRequestAuth}
                  onSkillsChanged={invalidateSkills}
                />
              ) : (
                <div className={cn(overviewCardShell, "p-6 text-center text-sm text-muted-foreground")}>
                  Connect wallet to manage skills.
                </div>
              )
            }
            tokenContent={
              key ? (
                <EarnTokenPanel
                  baseAnonymousId={anonymousId}
                  walletAddress={address}
                  connected={connected}
                  syraAuthenticated={syraAuthenticated}
                  onSignIn={handleSignIn}
                  onRequestAuth={handleRequestAuth}
                />
              ) : (
                <div className={cn(overviewCardShell, "p-6 text-center text-sm text-muted-foreground")}>
                  Connect wallet to launch tokens.
                </div>
              )
            }
          />
        </div>
      )}
    </PillarLayout>
  );
}
