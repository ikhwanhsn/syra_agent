import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Link2,
  Loader2,
  MessageSquare,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CampaignEmailSubscribeModal,
  shouldPromptKolEmailSubscribe,
} from "@/components/kol/CampaignEmailSubscribeModal";
import {
  fetchWalletVerification,
  KolApiError,
  submitCampaignPost,
  type KolSubmission,
} from "@/lib/kolApi";
import { cn } from "@/lib/utils";

interface CampaignSubmitFormProps {
  campaignId: string;
  alreadyParticipated?: boolean;
  onSubmitted?: (submission: KolSubmission) => void;
}

type SubmitMode = "reply" | "quote";

export function CampaignSubmitForm({
  campaignId,
  alreadyParticipated = false,
  onSubmitted,
}: CampaignSubmitFormProps) {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;

  const [tweetUrl, setTweetUrl] = useState("");
  const [mode, setMode] = useState<SubmitMode>("reply");
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);

  const verificationQuery = useQuery({
    queryKey: ["kol-x-verification", address],
    queryFn: () => fetchWalletVerification(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60 * 1000,
  });

  const isVerified = verificationQuery.data?.verified === true;
  const verifiedHandle =
    verificationQuery.data?.xHandle?.replace(/^@/, "") ??
    verificationQuery.data?.xHandleKey ??
    null;

  const canSubmit = Boolean(address && isVerified);

  const mutation = useMutation({
    mutationFn: () => {
      if (!address) {
        throw new Error("Connect your Solana wallet to submit");
      }
      if (!isVerified) {
        throw new Error("Verify your X account before submitting");
      }
      return submitCampaignPost(campaignId, {
        kolWallet: address,
        tweetUrl: tweetUrl.trim(),
        mode,
      });
    },
    onSuccess: (data) => {
      toast.success("Post submitted", {
        description: `@${data.submission.authorHandle} is on the leaderboard. Engagement updates about every 24 hours.`,
      });
      setTweetUrl("");
      onSubmitted?.(data.submission);
      if (shouldPromptKolEmailSubscribe()) {
        setSubscribeModalOpen(true);
      }
    },
    onError: (e: unknown) => {
      if (e instanceof KolApiError) {
        const friendly: Record<string, string> = {
          x_not_verified: "Verify your X account before submitting",
          handle_mismatch: verifiedHandle
            ? `Post must be from your verified account @${verifiedHandle}`
            : "Post must be from your verified X account",
          duplicate_submission:
            "This wallet already submitted for this campaign",
          duplicate_kol_handle:
            "This X account already submitted one post for this campaign",
          duplicate_post: "This post was already submitted to this campaign",
          invalid_tweet_url:
            "Use a full X post link like https://x.com/handle/status/123…",
          require_created_campaign:
            "Create your own campaign and deposit SOL to open it first — drafts without a deposit don’t count",
          campaign_ended: "This campaign has ended",
          invalid_status: "This campaign is not accepting submissions",
        };
        toast.error(friendly[e.code] ?? e.message);
        return;
      }
      toast.error(e instanceof Error ? e.message : "Submit failed");
    },
  });

  const subscribeModal = (
    <CampaignEmailSubscribeModal
      open={subscribeModalOpen}
      onOpenChange={setSubscribeModalOpen}
    />
  );

  if (alreadyParticipated) {
    return (
      <>
        <div className="panel-glass rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 sm:p-6 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <h3 className="font-semibold tracking-tight">You’re on the board</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            One post per campaign. Engagement and score update about every 24
            hours — no need to resubmit.
          </p>
        </div>
        {subscribeModal}
      </>
    );
  }

  return (
    <>
      <div className="panel-glass rounded-2xl border border-primary/25 p-5 sm:p-6 space-y-4">
        <div>
          <p className="eyebrow mb-2">Submit</p>
          <h3 className="font-semibold text-lg tracking-tight">
            Submit your X post
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            After you reply or quote on X, paste the link here. Only verified X
            accounts can submit — 1 post per campaign. Engagement updates about
            every 24 hours.
          </p>
        </div>

        {!address ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
            Connect your Solana wallet, then verify your X account above before
            submitting.
          </p>
        ) : verificationQuery.isLoading ? (
          <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Checking X verification…
          </p>
        ) : !isVerified ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground inline-flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Verify your X account above first. Submissions must come from that
              verified handle.
            </span>
          </p>
        ) : (
          <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-muted-foreground">
            Submitting as{" "}
            <span className="font-medium text-foreground">@{verifiedHandle}</span>
            . Your post URL must use this handle.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="campaign-submit-url" className="text-sm font-medium">
            Your reply or quote URL
          </Label>
          <Input
            id="campaign-submit-url"
            type="url"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder={
              verifiedHandle
                ? `https://x.com/${verifiedHandle}/status/123…`
                : "https://x.com/yourhandle/status/123…"
            }
            className="h-11 rounded-xl border-border/60 bg-background/80"
            autoComplete="off"
            spellCheck={false}
            disabled={mutation.isPending || !canSubmit}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Post type</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "reply" ? "secondary" : "outline"}
              className={cn(
                "rounded-full gap-1.5",
                mode === "reply" &&
                  "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20",
              )}
              onClick={() => setMode("reply")}
              disabled={mutation.isPending || !canSubmit}
              aria-pressed={mode === "reply"}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Reply
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "quote" ? "secondary" : "outline"}
              className={cn(
                "rounded-full gap-1.5",
                mode === "quote" &&
                  "bg-primary/15 text-primary border-primary/30 hover:bg-primary/20",
              )}
              onClick={() => setMode("quote")}
              disabled={mutation.isPending || !canSubmit}
              aria-pressed={mode === "quote"}
            >
              <Quote className="w-3.5 h-3.5" />
              Quote
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="hero"
          className="rounded-full gap-2 w-full sm:w-auto"
          disabled={
            mutation.isPending || !canSubmit || tweetUrl.trim().length < 10
          }
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              Submit post
            </>
          )}
        </Button>
      </div>
      {subscribeModal}
    </>
  );
}
