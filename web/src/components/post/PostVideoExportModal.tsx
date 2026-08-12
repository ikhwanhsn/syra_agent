import { useEffect, useState } from "react";
import type { PostSlide } from "@/content/posts/types";
import {
  isPostVideoFormatSupported,
  type PostVideoExportFormat,
} from "@/video/render/renderPostVideoOnWeb";
import { PostVideoPlayer } from "@/video/preview/PostVideoPlayer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

interface FormatOption {
  format: PostVideoExportFormat;
  label: string;
  hint: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: "mp4",
    label: "MP4",
    hint: "H.264 · X / iOS",
  },
  {
    format: "webm",
    label: "WebM",
    hint: "VP8 · smaller",
  },
];

export interface PostVideoExportSelection {
  format: PostVideoExportFormat;
}

interface PostVideoExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: PostSlide[];
  onExport: (selection: PostVideoExportSelection) => void;
}

export function PostVideoExportModal({
  open,
  onOpenChange,
  slides,
  onExport,
}: PostVideoExportModalProps) {
  const [selected, setSelected] = useState<PostVideoExportFormat>("mp4");
  const [supported, setSupported] = useState<Record<PostVideoExportFormat, boolean>>({
    webm: true,
    mp4: true,
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setChecking(true);

    void (async () => {
      const [webm, mp4] = await Promise.all([
        isPostVideoFormatSupported("webm"),
        isPostVideoFormatSupported("mp4"),
      ]);
      if (cancelled) return;
      setSupported({ webm, mp4 });
      setSelected(mp4 ? "mp4" : "webm");
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleExport = () => {
    if (!supported[selected] || checking) return;
    onOpenChange(false);
    onExport({ format: selected });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="post-share-modal max-h-[92dvh] overflow-y-auto border-neutral-200 bg-white text-neutral-900 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-medium tracking-tight text-neutral-900">
            Download video
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Preview the Syra cinematic look, then download Full HD · 30fps. What you see is what you
            get.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black">
          {open ? (
            <PostVideoPlayer slides={slides} autoPlay loop controls initiallyMuted />
          ) : null}
        </div>

        <p className="text-xs text-neutral-500">
          Cinematic depth stage, soft gold bloom, spring reveals, same style for every ship log.
        </p>

        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Video export format">
          {FORMAT_OPTIONS.map((option) => {
            const enabled = supported[option.format];
            const active = selected === option.format;
            return (
              <button
                key={option.format}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!enabled || checking}
                onClick={() => setSelected(option.format)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  active
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300",
                  (!enabled || checking) && "cursor-not-allowed opacity-45",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {checking ? "Checking…" : enabled ? option.hint : "Unsupported here"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExport}
            disabled={!supported[selected] || checking}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-900 bg-neutral-900 px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download {selected.toUpperCase()}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
