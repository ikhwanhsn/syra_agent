import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitEngagement } from "@/lib/kolApi";

interface SubmitEngagementFormProps {
  campaignId: string;
  campaignTitle: string;
  onSubmitted?: () => void;
}

export function SubmitEngagementForm({
  campaignId,
  campaignTitle,
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
      toast.success("Submission received", {
        description: "Your reply/quote is now tracked for rewards.",
      });
      onSubmitted?.();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="panel-glass rounded-2xl border border-border/60 p-6 space-y-4">
      <div>
        <p className="eyebrow mb-1">Submit engagement</p>
        <h3 className="font-semibold">{campaignTitle}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your reply or quote tweet URL. Rewards go to your connected wallet.
        </p>
      </div>

      <WalletMultiButton className="!rounded-full !bg-primary !h-10" />

      <div className="space-y-2">
        <Label htmlFor="kol-submission-url">Your reply / quote URL</Label>
        <Input
          id="kol-submission-url"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          placeholder="https://x.com/you/status/..."
        />
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
            Verifying…
          </>
        ) : (
          "Submit for rewards"
        )}
      </Button>
    </div>
  );
}
