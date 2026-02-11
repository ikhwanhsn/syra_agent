import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";

export interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const {
    anonymousId,
    agentAddress,
    agentShortAddress,
    agentSolBalance,
    agentUsdcBalance,
    avatarUrl,
    updateAvatarUrl,
  } = useAgentWallet();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      navigator.clipboard?.writeText(text).then(
        () => {
          toast({ title: "Copied", description: `${label} copied to clipboard.` });
          setCopied(label);
          setTimeout(() => setCopied(null), 2000);
        },
        () => toast({ title: "Copy failed", variant: "destructive" })
      );
    },
    [toast]
  );

  const handleGenerateNew = useCallback(async () => {
    if (!anonymousId) {
      toast({
        title: "Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    try {
      // Generate new random avatar
      const result = await agentWalletApi.generateAvatar(anonymousId);
      // Update avatar in context immediately for real-time update
      if (updateAvatarUrl && result.avatarUrl) {
        updateAvatarUrl(result.avatarUrl);
      }
      toast({
        title: "Avatar generated",
        description: "A new random avatar has been generated.",
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Failed to generate avatar.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }, [anonymousId, toast, updateAvatarUrl]);

  function formatUsdc(value: number | null | undefined): string {
    if (value == null) return "—";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toFixed(2);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1.5">
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            View and manage your profile information and avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-6">
          {/* Avatar Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Profile Avatar</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-card border-2 border-border shadow-md">
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      key={`${avatarUrl}-${generating ? 'generating' : 'done'}`}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center border-2 border-border shadow-md">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateNew}
                  disabled={generating || !anonymousId}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Random Avatar
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Generate a new random avatar for your profile.
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Account Information</Label>
            <div className="space-y-3">
              {/* Anonymous ID */}
              {anonymousId && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Anonymous ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={anonymousId}
                      readOnly
                      className="font-mono text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => copyToClipboard(anonymousId, "Anonymous ID")}
                    >
                      {copied === "Anonymous ID" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Agent Address */}
              {agentAddress && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Agent Wallet Address</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={agentAddress}
                      readOnly
                      className="font-mono text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => copyToClipboard(agentAddress, "Agent Address")}
                    >
                      {copied === "Agent Address" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Balances */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Balances</Label>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">USDC</span>
                    <span className={cn(
                      "font-medium tabular-nums",
                      agentUsdcBalance != null && agentUsdcBalance > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    )}>
                      ${formatUsdc(agentUsdcBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SOL</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {agentSolBalance != null ? agentSolBalance.toFixed(4) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
