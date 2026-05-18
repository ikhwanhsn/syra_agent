import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, MessageCircle, Twitter } from "lucide-react";
import { GlassCard } from "@/components/rise/RiseShared";
import { cn } from "@/lib/utils";
import type { DashboardDictionary } from "@/lib/dashboardI18n";

type Props = {
  copy: DashboardDictionary["createTokenPage"];
  name: string;
  symbol: string;
  description: string;
  twitter: string;
  telegram: string;
  backing: "sol" | "usdc";
  creatorFeePercent: number;
  imageFile: File | null;
};

export function CreateTokenPreview({
  copy,
  name,
  symbol,
  description,
  twitter,
  telegram,
  backing,
  creatorFeePercent,
  imageFile,
}: Props) {
  const reduceMotion = useReducedMotion() ?? false;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const displayName = name.trim() || copy.previewPlaceholderName;
  const displaySymbol = symbol.trim().toUpperCase() || copy.previewPlaceholderSymbol;
  const hasSocials = Boolean(twitter.trim() || telegram.trim());

  return (
    <GlassCard
      padded={false}
      className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_28px_64px_-32px_hsl(0_0%_0%/0.55)]"
    >
      <div className="border-b border-border/45 bg-gradient-to-b from-card/60 to-transparent px-4 py-3.5 sm:px-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.previewEyebrow}</p>
        <p className="mt-0.5 text-xs text-muted-foreground/90">{copy.previewNewMarket}</p>
      </div>

      <motion.div
        className="relative px-4 py-5 sm:px-5"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="pointer-events-none absolute -right-6 -top-4 h-32 w-32 rounded-full bg-[radial-gradient(circle,hsl(var(--uof)/0.18),transparent_68%)]"
          aria-hidden
        />
        <motion.div className="flex items-start gap-3.5" layout={!reduceMotion}>
          <div
            className={cn(
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-muted/40 to-muted/10 shadow-inner",
              !previewUrl && "flex items-center justify-center",
            )}
          >
            {previewUrl ? (
              <motion.img
                key={previewUrl}
                src={previewUrl}
                alt=""
                className="h-full w-full object-cover"
                initial={reduceMotion ? false : { scale: 1.08, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : (
              <span className="font-mono text-lg font-semibold text-muted-foreground/50">
                {(displaySymbol.slice(0, 2) || "?").toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-base font-semibold tracking-tight text-foreground">{displayName}</h3>
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500/80" aria-hidden />
            </div>
            <p className="mt-0.5 font-mono text-sm font-medium text-muted-foreground">${displaySymbol}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {description.trim() || copy.sectionStoryHint}
            </p>
          </div>
        </motion.div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <PreviewStat label={copy.previewBacking} value={backing === "sol" ? copy.backingSol : copy.backingUsdc} />
          <PreviewStat label={copy.previewCreatorFee} value={`${creatorFeePercent}%`} />
        </div>

        {hasSocials ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {twitter.trim() ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/25 px-2 py-1 text-[0.65rem] text-muted-foreground">
                <Twitter className="h-3 w-3" aria-hidden /> X
              </span>
            ) : null}
            {telegram.trim() ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/25 px-2 py-1 text-[0.65rem] text-muted-foreground">
                <MessageCircle className="h-3 w-3" aria-hidden /> TG
              </span>
            ) : null}
          </div>
        ) : null}
      </motion.div>
    </GlassCard>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/45 bg-background/35 px-3 py-2.5 shadow-inner">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}
