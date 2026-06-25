import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { Coins, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitEngagement } from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";

interface SubmitEngagementFormProps {
  campaignId: string;
  campaignTitle: string;
  rewardSol?: number;
  onSubmitted?: () => void;
}

export function SubmitEngagementForm({
  campaignId,
  campaignTitle,
  rewardSol,
  onSubmitted,
}: SubmitEngagementFormProps) {
  const wallet = useWallet();
  const [tweetUrl, setTweetUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Connect your Solana wallet first");
      return submitEngagement(campaignId, {
        kolWallet: wallet.publicKey.toBase58(),
        tweetUrl,
      });
    },
    onSuccess: () => {
      setTweetUrl("");
      toast.success("You're in!", {
        description: "Your post is tracked. Climb the leaderboard to grow your payout.",
      });
      onSubmitted?.();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8 space-y-5">
      <div>
        <p className="eyebrow mb-1">Ready to earn?</p>
        <h3 className="font-semibold text-lg">Submit your post</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          After you reply or quote <span className="text-foreground">{campaignTitle}</span> on X,
          paste your tweet link below. We verify it and track your engagement until payout.
        </p>
        {rewardSol != null && rewardSol > 0 ? (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              Competing for{" "}
              <span className="font-semibold text-primary">{formatSol(rewardSol)} SOL</span>
            </span>
          </div>
        ) : null}
      </div>

      {!wallet.publicKey ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Connect your wallet</span> from the
            navbar first — that&apos;s where your SOL rewards will be sent.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="kol-submission-url">Your reply or quote tweet URL</Label>
        <Input
          id="kol-submission-url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          placeholder="https://x.com/yourhandle/status/..."
          className="bg-background/60"
        />
        <p className="text-xs text-muted-foreground">
          One X account per campaign · one unique post · duplicates are rejected
        </p>
      </div>

      <Button
        variant="hero"
        className="rounded-full w-full sm:w-auto"
        disabled={!wallet.publicKey || !tweetUrl || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying your post…
          </>
        ) : (
          "Submit & start earning"
        )}
      </Button>
    </div>
  );
}
