import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DashboardDictionary } from "@/lib/dashboardI18n";

type Props = {
  copy: DashboardDictionary["createTokenPage"];
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
};

export function CreateTokenImageUpload({ copy, file, onFileChange, disabled }: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const acceptFile = useCallback(
    (f: File | undefined) => {
      if (!f || !f.type.startsWith("image/")) return;
      onFileChange(f);
    },
    [onFileChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled) return;
      acceptFile(e.dataTransfer.files?.[0]);
    },
    [acceptFile, disabled],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      acceptFile(e.target.files?.[0]);
      e.target.value = "";
    },
    [acceptFile],
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Label className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {copy.imageLabel}
      </Label>
      <label
        htmlFor="create-token-image"
        className={cn(
          "group relative flex min-h-[11.5rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border text-center transition-[border-color,box-shadow,background] duration-200",
          dragActive
            ? "border-primary/55 bg-primary/[0.06] shadow-[0_0_0_1px_hsl(var(--primary)/0.2)_inset,0_20px_48px_-28px_hsl(var(--uof)/0.35)]"
            : "border-dashed border-border/60 bg-gradient-to-b from-muted/25 via-muted/10 to-transparent hover:border-border hover:from-muted/35",
          disabled && "pointer-events-none opacity-60",
          previewUrl && "min-h-[10rem] border-solid border-border/50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent"
              initial={false}
              animate={{ opacity: dragActive ? 1 : 0.72 }}
            />
            <motion.div
              className="relative z-[1] flex flex-col items-center gap-2 px-4 py-6"
              initial={false}
              animate={{ opacity: dragActive ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ImagePlus className="h-7 w-7 text-foreground/90" aria-hidden />
              <span className="text-sm font-medium text-foreground">{copy.replaceImage}</span>
            </motion.div>
            <motion.div
              className="absolute bottom-3 left-3 right-3 z-[2] flex items-center justify-between gap-2 rounded-xl border border-border/45 bg-background/75 px-3 py-2 text-left backdrop-blur-md"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{file?.name}</p>
                <p className="text-[0.65rem] text-muted-foreground">{copy.dropHint.split("(")[1]?.replace(").", "") ?? "max 15 MB"}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFileChange(null);
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" aria-hidden />
                {copy.removeImage}
              </Button>
            </motion.div>
          </>
        ) : (
          <div className="relative z-[1] flex flex-col items-center gap-3 px-6 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/50 bg-gradient-to-b from-background/80 to-muted/30 shadow-inner">
              <Sparkles className="h-6 w-6 text-foreground/55" aria-hidden />
              </div>
              <motion.div animate={dragActive ? { scale: 1.03 } : { scale: 1 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-medium text-foreground/90">{copy.dropHint.split(".")[0]}</p>
              <p className="mt-1 text-xs text-muted-foreground">PNG · JPG · GIF · 15 MB max</p>
            </motion.div>
          </div>
        )}
        <input
          id="create-token-image"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif"
          className="sr-only"
          onChange={onPick}
          disabled={disabled}
        />
      </label>
    </motion.div>
  );
}
