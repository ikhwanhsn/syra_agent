import { useEffect, useState } from "react";
import type { PostVideoExportFormat } from "@/components/post/postVideoExport";
import { isPostVideoFormatSupported } from "@/components/post/postVideoRecord";
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
    format: "webm",
    label: "WebM",
    hint: "Best quality in Chrome & Firefox",
  },
  {
    format: "mp4",
    label: "MP4",
    hint: "Works on X, iOS & most editors",
  },
];

interface PostVideoExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: PostVideoExportFormat) => void;
}

export function PostVideoExportModal({ open, onOpenChange, onExport }: PostVideoExportModalProps) {
  const [selected, setSelected] = useState<PostVideoExportFormat>("webm");
  const [supported, setSupported] = useState<Record<PostVideoExportFormat, boolean>>({
    webm: true,
    mp4: true,
  });

  useEffect(() => {
    if (!open) return;

    setSupported({
      webm: isPostVideoFormatSupported("webm"),
      mp4: isPostVideoFormatSupported("mp4"),
    });
    setSelected(isPostVideoFormatSupported("webm") ? "webm" : "mp4");
  }, [open]);

  const handleExport = () => {
    if (!supported[selected]) return;
    onOpenChange(false);
    onExport(selected);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="post-share-modal border-white/10 bg-[#0a0a0a] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-base font-medium tracking-tight text-white/95">
            Export video
          </DialogTitle>
          <DialogDescription className="text-xs text-white/45">
            Full HD · 30fps with entrance animations. Pick a format for your upload target.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2" role="radiogroup" aria-label="Video export format">
          {FORMAT_OPTIONS.map((option) => {
            const enabled = supported[option.format];
            const active = selected === option.format;

            return (
              <button
                key={option.format}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!enabled}
                onClick={() => setSelected(option.format)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                  !enabled && "cursor-not-allowed opacity-45",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-[#F3BA2F] bg-[#F3BA2F]" : "border-white/25 bg-transparent",
                  )}
                  aria-hidden
                >
                  {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#030303]" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-white/90">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">
                    {enabled ? option.hint : "Not supported in this browser"}
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
            disabled={!supported[selected]}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#F3BA2F]/30 bg-[#F3BA2F]/15 px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/25 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
