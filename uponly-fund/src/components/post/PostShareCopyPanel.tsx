import { useCallback, useState } from "react";
import type { PostUpdateMeta } from "@/content/posts/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildPostOnXUrl,
  copyPostShareText,
  getPostShareCopyWithUrl,
  type PostShareFormat,
} from "@/lib/postShare";
import { cn } from "@/lib/utils";
import { Check, Copy, ExternalLink, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

interface PostShareCopyPanelProps {
  meta: PostUpdateMeta;
  format: PostShareFormat;
  className?: string;
}

const FORMAT_LABELS: Record<PostShareFormat, { button: string; title: string; hint: string }> = {
  video: {
    button: "Post copy",
    title: "X post · video",
    hint: "Copy this text after uploading your screen recording to X.",
  },
  photo: {
    button: "Post copy",
    title: "X post · photo",
    hint: "Copy this text after attaching your exported image to X.",
  },
};

export function PostShareCopyPanel({ meta, format, className }: PostShareCopyPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyText = getPostShareCopyWithUrl(meta, format);
  const labels = FORMAT_LABELS[format];

  const handleCopy = useCallback(async () => {
    const ok = await copyPostShareText(meta, format);
    if (ok) {
      setCopied(true);
      toast.success("Post copy ready — paste on X");
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      toast.error("Could not copy to clipboard");
    }
  }, [meta, format]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/15 sm:h-10 sm:gap-2 sm:px-4",
          className,
        )}
      >
        <MessageSquareText className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{labels.button}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="post-share-modal border-white/10 bg-[#0a0a0a] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-medium tracking-tight text-white/95">
              {labels.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/45">{labels.hint}</DialogDescription>
          </DialogHeader>

          <pre className="post-share-modal-body">{copyText}</pre>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <a
              href={buildPostOnXUrl(meta, format)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-white/25 hover:text-white/90"
            >
              <ExternalLink className="h-4 w-4" />
              Open on X
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-uof/30 bg-uof/15 px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-uof transition-colors hover:bg-uof/25"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy post text"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
