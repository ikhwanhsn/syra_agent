"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  deleteImagePrompt,
  fetchRecentImagePrompts,
  generateImagePrompt,
  type ImagePromptItem,
  type ImagePromptStyleId,
} from "@/lib/internalToolsApi";

const STYLE_OPTIONS: Array<{ id: ImagePromptStyleId | "auto"; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "data-chart", label: "Data chart" },
  { id: "ai-agent", label: "AI agent" },
  { id: "bull-bear-split", label: "Bull / bear" },
  { id: "transformation", label: "Transformation" },
  { id: "ecosystem-hub", label: "Ecosystem hub" },
  { id: "minimal-poster", label: "Minimal poster" },
];

function formatStyle(style: string): string {
  return style.replace(/-/g, " ") || "auto";
}

interface InternalImagePromptToolProps {
  wallet?: string | null;
}

export function InternalImagePromptTool({ wallet }: InternalImagePromptToolProps) {
  const queryClient = useQueryClient();
  const [sourcePrompt, setSourcePrompt] = useState("");
  const [direction, setDirection] = useState("");
  const [style, setStyle] = useState<ImagePromptStyleId | "auto">("auto");
  const [activeItem, setActiveItem] = useState<ImagePromptItem | null>(null);
  const [copiedField, setCopiedField] = useState<"prompt" | "caption" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const recentQ = useQuery({
    queryKey: ["internal-tools", "image-prompt-recent"],
    queryFn: () => fetchRecentImagePrompts(15),
    staleTime: 30_000,
  });

  const invalidateRecent = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["internal-tools", "image-prompt-recent"] });
  }, [queryClient]);

  const generateM = useMutation({
    mutationFn: () =>
      generateImagePrompt(sourcePrompt, wallet, style === "auto" ? null : style, direction || undefined),
    onSuccess: (res) => {
      setActiveItem(res.data);
      setCopiedField(null);
      invalidateRecent();
      toast.success("Prompt ready — copy into ChatGPT or your image tool");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to generate prompt"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteImagePrompt(id),
    onSuccess: (_res, deletedId) => {
      setDeleteOpen(false);
      setActiveItem((prev) => (prev?.id === deletedId ? null : prev));
      invalidateRecent();
      toast.success("Prompt deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });

  const displayItem = activeItem ?? recentQ.data?.data[0] ?? null;
  const isBusy = generateM.isPending || deleteM.isPending;

  const handleCopy = useCallback(async (text: string, field: "prompt" | "caption") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(field === "prompt" ? "Image prompt copied" : "Caption copied");
      window.setTimeout(() => setCopiedField(null), 2200);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="image-prompt-source" className="text-xs font-medium text-muted-foreground">
          Your rough image idea
        </label>
        <Textarea
          id="image-prompt-source"
          value={sourcePrompt}
          onChange={(e) => setSourcePrompt(e.target.value)}
          placeholder="e.g. chart comparing growth with vs without Syra, monochrome, shield logo top left…"
          className="min-h-[6rem] resize-y rounded-xl border-border/60 bg-background/60 text-[13px] leading-relaxed"
          disabled={isBusy}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image-prompt-direction" className="text-xs font-medium text-muted-foreground">
          Optional direction
        </label>
        <Input
          id="image-prompt-direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="e.g. more cinematic, add robot agent, landscape 16:9, no text in image"
          disabled={isBusy}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setStyle(opt.id)}
            disabled={isBusy}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
              style === opt.id
                ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/12 text-[#F3BA2F]"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        className="rounded-xl border-[#F3BA2F]/30 bg-[#F3BA2F]/15 text-[#F3BA2F] hover:bg-[#F3BA2F]/25"
        onClick={() => generateM.mutate()}
        disabled={isBusy || sourcePrompt.trim().length < 8}
      >
        {generateM.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ImageIcon className="mr-2 h-4 w-4" aria-hidden />
        )}
        {generateM.isPending ? "Building prompt…" : "Enhance prompt + caption"}
      </Button>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,260px)] lg:items-start">
        <div className="min-w-0 space-y-3">
          {displayItem ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]">
                  {formatStyle(displayItem.style)}
                </span>
                {displayItem.createdAt ? (
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(displayItem.createdAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/10 px-3 py-3">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                  Your idea
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{displayItem.sourcePrompt}</p>
              </div>

              <div className="rounded-xl border border-[#F3BA2F]/25 bg-[#F3BA2F]/5 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#F3BA2F]/80">
                    Image prompt (copy to ChatGPT)
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-[11px] text-[#F3BA2F] hover:bg-[#F3BA2F]/10 hover:text-[#F3BA2F]"
                    onClick={() => void handleCopy(displayItem.imagePrompt, "prompt")}
                  >
                    {copiedField === "prompt" ? (
                      <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    )}
                    {copiedField === "prompt" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/95">
                  {displayItem.imagePrompt}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/80">
                    X caption
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-[11px] hover:bg-muted/60"
                    onClick={() => void handleCopy(displayItem.caption, "caption")}
                  >
                    {copiedField === "caption" ? (
                      <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    )}
                    {copiedField === "caption" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/90">{displayItem.caption}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isBusy}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Delete
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Monochrome Syra noir — detailed image prompt for ChatGPT/DALL·E plus a short X caption. Same theme as
              your chart and agent graphics.
            </p>
          )}
        </div>

        {recentQ.data?.data && recentQ.data.data.length > 0 ? (
          <aside className="min-w-0 lg:sticky lg:top-0">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/80">
              Recent · {recentQ.data.total}
            </p>
            <div className="grid max-h-[min(52dvh,28rem)] gap-2 overflow-y-auto pr-0.5">
              {recentQ.data.data.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setSourcePrompt(item.sourcePrompt);
                    setCopiedField(null);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    activeItem?.id === item.id
                      ? "border-[#F3BA2F]/35 bg-[#F3BA2F]/8"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/35",
                  )}
                >
                  <span className="line-clamp-2 text-xs leading-relaxed text-foreground/85">{item.caption}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {formatStyle(item.style)}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-border/60 bg-background sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes it from saved history. Your source idea stays in the textarea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteM.isPending}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteM.isPending || !displayItem}
              onClick={() => displayItem && deleteM.mutate(displayItem.id)}
            >
              {deleteM.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
