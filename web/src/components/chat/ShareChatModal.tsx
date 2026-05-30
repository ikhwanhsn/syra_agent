import { useState, useCallback } from "react";
import { Share2, Copy, Check, Lock, Globe, CheckCircle2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ShareChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: string;
  /** Default is private (false). Pass false for new shares. */
  isSharePublic: boolean;
  onVisibilityChange: (isPublic: boolean) => void;
}

export function ShareChatModal({
  open,
  onOpenChange,
  shareLink,
  isSharePublic,
  onVisibilityChange,
}: ShareChatModalProps) {
  const { toast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setLinkCopied(true);
      toast({ title: "Link copied", description: "Share link copied to clipboard." });
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }, [shareLink, toast]);

  const handleSelectPublic = useCallback(() => {
    if (!isSharePublic) onVisibilityChange(true);
  }, [isSharePublic, onVisibilityChange]);

  const handleSelectPrivate = useCallback(() => {
    if (isSharePublic) onVisibilityChange(false);
  }, [isSharePublic, onVisibilityChange]);

  const handleSaveSetting = useCallback(() => {
    toast({ title: "Settings saved", description: isSharePublic ? "Chat is now public." : "Chat is now private." });
  }, [isSharePublic, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">Share chat</DialogTitle>
          </div>
          <DialogDescription>
            Choose who can view this chat. New shares are private by default.
          </DialogDescription>
        </DialogHeader>

        {/* Share link – visible so user knows what they're sharing */}
        <div className="px-6 pb-4">
          <p className="text-sm font-medium text-foreground mb-2">Link to share</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={shareLink}
              className="flex-1 min-w-0 font-mono text-xs bg-muted/50 border-border"
            />
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0"
              onClick={handleCopyLink}
              title="Copy link"
            >
              {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Who can view</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSelectPrivate}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                "hover:border-amber-500/50 hover:bg-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2",
                !isSharePublic
                  ? "border-amber-500/70 bg-amber-500/10 shadow-sm dark:border-amber-400/50 dark:bg-amber-500/15"
                  : "border-border bg-card"
              )}
              aria-pressed={!isSharePublic}
              aria-label="Private – only you can view"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  !isSharePublic ? "bg-amber-500/20 dark:bg-amber-500/25" : "bg-muted"
                )}
              >
                <Lock className={cn("h-5 w-5", !isSharePublic ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
              </div>
              <span className={cn("font-medium", !isSharePublic ? "text-amber-700 dark:text-amber-300" : "text-foreground")}>
                Private
              </span>
              <span className="text-xs text-muted-foreground leading-snug">
                Only you can view this chat
              </span>
            </button>

            <button
              type="button"
              onClick={handleSelectPublic}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                "hover:border-emerald-500/50 hover:bg-emerald-500/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2",
                isSharePublic
                  ? "border-emerald-500/70 bg-emerald-500/10 shadow-sm dark:border-emerald-400/50 dark:bg-emerald-500/15"
                  : "border-border bg-card"
              )}
              aria-pressed={isSharePublic}
              aria-label="Public – anyone with the link can view"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isSharePublic ? "bg-emerald-500/20 dark:bg-emerald-500/25" : "bg-muted"
                )}
              >
                <Globe className={cn("h-5 w-5", isSharePublic ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
              </div>
              <span className={cn("font-medium", isSharePublic ? "text-emerald-700 dark:text-emerald-300" : "text-foreground")}>
                Public
              </span>
              <span className="text-xs text-muted-foreground leading-snug">
                Anyone with the link can view
              </span>
            </button>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSaveSetting} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Save setting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
