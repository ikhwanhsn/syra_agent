import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmXVerification,
  fetchWalletVerification,
  KolApiError,
  requestXVerification,
} from "@/lib/kolApi";

function buildXVerificationTweet(code: string, handle: string): string {
  const cleanHandle = handle.trim().replace(/^@/, "");
  return `Verifying @${cleanHandle} on @s3labs_ KOL Arena\n\n${code}`;
}

function openXVerificationTweet(code: string, handle: string): void {
  const text = buildXVerificationTweet(code, handle);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatVerifyError(error: unknown): string {
  if (error instanceof KolApiError) {
    if (error.code === "twitterapi_unavailable" || error.code === "twitterapi_error") {
      return error.message;
    }
    if (error.code === "verification_code_not_found") {
      return error.message;
    }
    if (error.code === "handle_already_verified") {
      return error.message;
    }
    if (error.code === "verification_expired") {
      return error.message;
    }
  }

  const message = error instanceof Error ? error.message : "Verification failed";
  if (/system error/i.test(message)) {
    return "X lookup failed — check your handle and try again in a minute.";
  }
  return message;
}

interface VerifyXAccountCardProps {
  onVerified?: () => void;
  /** When true, hide the card if the wallet is already verified. */
  compactWhenVerified?: boolean;
}

export function VerifyXAccountCard({
  onVerified,
  compactWhenVerified = false,
}: VerifyXAccountCardProps) {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const address = wallet.publicKey?.toBase58();

  const [xHandle, setXHandle] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  const verificationQuery = useQuery({
    queryKey: ["kol-x-verification", address],
    queryFn: () => fetchWalletVerification(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (verificationQuery.data?.xHandle) {
      setXHandle(verificationQuery.data.xHandle);
    }
  }, [verificationQuery.data?.xHandle]);

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect your Solana wallet first");
      const handle = xHandle.trim().replace(/^@/, "");
      if (!handle) throw new Error("Enter your X handle");
      return requestXVerification({ wallet: address, xHandle: handle });
    },
    onSuccess: (data) => {
      if (data.alreadyVerified) {
        setPendingCode(null);
        toast.success("X account already verified", {
          description:
            "Eligible rewards send automatically when campaigns end.",
        });
        queryClient.invalidateQueries({ queryKey: ["kol-x-verification", address] });
        onVerified?.();
        return;
      }
      if (!data.code) return;
      const handle = xHandle.trim().replace(/^@/, "");
      setPendingCode(data.code);
      openXVerificationTweet(data.code, handle);
      toast.success("Post the tweet on X", {
        description: "Then come back here and click Confirm.",
      });
    },
    onError: (e: Error) => toast.error(formatVerifyError(e)),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect your Solana wallet first");
      const handle =
        xHandle.trim().replace(/^@/, "") ||
        verificationQuery.data?.xHandle ||
        "";
      if (!handle) throw new Error("Enter your X handle");
      return confirmXVerification({ wallet: address, xHandle: handle });
    },
    onSuccess: (data) => {
      setPendingCode(null);
      const sentCount =
        data.autoDistributed?.distributed?.filter(
          (row) => row.status === "confirmed",
        ).length ?? 0;
      const heldCount =
        data.autoDistributed?.distributed?.filter(
          (row) => row.status === "pending_minimum",
        ).length ?? 0;

      if (data.alreadyVerified) {
        toast.success("X account already verified", {
          description:
            sentCount > 0
              ? `${sentCount} reward${sentCount === 1 ? "" : "s"} sent to your wallet.`
              : "Eligible rewards send automatically when campaigns end.",
        });
      } else {
        toast.success("X account verified", {
          description:
            sentCount > 0
              ? `${sentCount} reward${sentCount === 1 ? "" : "s"} sent to your wallet.`
              : heldCount > 0
                ? "Some rewards are held in the pool until you reach 0.01 SOL."
                : "Rewards will send automatically when campaigns end.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["kol-x-verification", address] });
      queryClient.invalidateQueries({ queryKey: ["kol-earnings", address] });
      queryClient.invalidateQueries({ queryKey: ["kol-campaign"] });
      onVerified?.();
    },
    onError: (e: Error) => toast.error(formatVerifyError(e)),
  });

  const verified = verificationQuery.data?.verified === true;
  const displayHandle = verificationQuery.data?.xHandle;

  if (compactWhenVerified && verified && displayHandle) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
        <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <span className="font-medium text-foreground">@{displayHandle}</span>{" "}
          <span className="text-muted-foreground">verified — you can submit posts and receive rewards.</span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5 sm:p-8 space-y-5 min-w-0">
      <div>
        <p className="eyebrow mb-1">Verify your identity</p>
        <h3 className="font-semibold text-lg">Link your X account</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Click Verify to post a short code on X, then Confirm once it&apos;s live.
          Required before you can submit a campaign post. One-time setup — rewards
          also send to this wallet when campaigns end.
        </p>
      </div>

      {!address ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">Connect your wallet</span>{" "}
            from the navbar first.
          </p>
        </div>
      ) : verified && displayHandle ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-medium text-foreground">@{displayHandle} verified</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Linked to this wallet — submit posts and receive rewards when eligible.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="kol-x-handle">Your X handle</Label>
            <Input
              id="kol-x-handle"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@yourhandle"
              className="bg-background/60"
            />
          </div>

          {pendingCode ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Post the pre-filled tweet on X, then click Confirm below.
              </p>
              <button
                type="button"
                className="mt-2 text-xs text-primary hover:underline"
                onClick={() => {
                  const handle = xHandle.trim().replace(/^@/, "");
                  if (handle) openXVerificationTweet(pendingCode, handle);
                }}
              >
                Open X again
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {!pendingCode ? (
              <Button
                variant="hero"
                className="rounded-full"
                disabled={!address || !xHandle.trim() || requestMutation.isPending}
                onClick={() => requestMutation.mutate()}
              >
                {requestMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening X…
                  </>
                ) : (
                  <>
                    Verify
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="hero"
                className="rounded-full"
                disabled={
                  !address ||
                  (!xHandle.trim() && !displayHandle) ||
                  confirmMutation.isPending
                }
                onClick={() => confirmMutation.mutate()}
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking…
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
