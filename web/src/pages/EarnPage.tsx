import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { EarnLlmPanel } from "@/components/earn/EarnLlmPanel";
import { EarnPromptPanel } from "@/components/earn/EarnPromptPanel";
import { EarnSkillsPanel } from "@/components/earn/EarnSkillsPanel";
import { EarnTokenPanel } from "@/components/earn/EarnTokenPanel";
import { EarnYieldPanel } from "@/components/earn/EarnYieldPanel";
import { EarnPageSkeleton, type EarnSkeletonTrack } from "@/components/earn/EarnSkeleton";
import { EarnTrackTabs } from "@/components/earn/EarnTrackTabs";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";

const EARN_TRACKS = ["yield", "token", "prompts", "skills", "llm"] as const;
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
  const llmQueryKey = ["earn", "llm", key] as const;

  useEffect(() => {
    setActiveTrack(parseTrack(searchParams.get("track")));
  }, [searchParams]);

  useEffect(() => {
    if (!syraAuthReady || !connected || !address) return;
    void ensureSyraAuth();
  }, [syraAuthReady, connected, address, ensureSyraAuth]);

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
        void queryClient.invalidateQueries({ queryKey: ["earn", "llm"] });
      }
    });
  };

  const handleRequestAuth = async (): Promise<boolean> => {
    const session = await requestSyraAuth();
    if (session) {
      void queryClient.invalidateQueries({ queryKey: ["earn", "skills"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "prompts"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
      void queryClient.invalidateQueries({ queryKey: ["earn", "llm"] });
    }
    return Boolean(session);
  };

  const invalidateSkills = () => {
    void queryClient.invalidateQueries({ queryKey: ["earn", "skills"] });
  };

  const invalidateLlm = () => {
    void queryClient.invalidateQueries({ queryKey: ["earn", "llm"] });
  };

  const trackSkeleton = activeTrack as EarnSkeletonTrack;

  return (
    <PillarLayout embedded hideHeader title="Earn">
      {!key ? (
        <EarnPageSkeleton track={trackSkeleton} />
      ) : (
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
            <EarnPromptPanel
              anonymousId={anonymousId}
              connected={connected}
              syraAuthenticated={syraAuthenticated}
              syraAuthReady={syraAuthReady}
              onSignIn={handleSignIn}
              onRequestAuth={handleRequestAuth}
            />
          }
          skillsContent={
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
          }
          tokenContent={
            <EarnTokenPanel
              baseAnonymousId={anonymousId}
              walletAddress={address}
              connected={connected}
              syraAuthenticated={syraAuthenticated}
              onSignIn={handleSignIn}
              onRequestAuth={handleRequestAuth}
            />
          }
          llmContent={
            <EarnLlmPanel
              anonymousId={anonymousId}
              llmQueryKey={llmQueryKey}
              connected={connected}
              syraAuthenticated={syraAuthenticated}
              syraAuthReady={syraAuthReady}
              onSignIn={handleSignIn}
              onRequestAuth={handleRequestAuth}
              onLlmChanged={invalidateLlm}
            />
          }
        />
      )}
    </PillarLayout>
  );
}
