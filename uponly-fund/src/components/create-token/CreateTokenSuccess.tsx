import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/rise/RiseShared";
import { buildSolscanTxUrl } from "@/lib/riseDashboardApi";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { DashboardDictionary } from "@/lib/dashboardI18n";

type Props = {
  pages: DashboardDictionary["pages"];
  copy: DashboardDictionary["createTokenPage"];
  mint: string | null;
  signatures: string[];
  onReset: () => void;
};

export function CreateTokenSuccess({ pages, copy, mint, signatures, onReset }: Props) {
  const reduceMotion = useReducedMotion() ?? false;

  const copyMint = async () => {
    if (!mint) return;
    try {
      await navigator.clipboard.writeText(mint);
      toast.success(copy.mintCopied);
    } catch {
      toast.error(copy.copyMint);
    }
  };

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[28rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.18),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.09),transparent_52%)]"
        aria-hidden
      />
      <div className="relative z-[1] mx-auto w-full max-w-2xl">
        <DashboardPageHeader
          eyebrow={pages.createTokenEyebrow}
          title={copy.successTitle}
          description={copy.successBody}
          emphasis="hero"
        />

        <GlassCard
          padded={false}
          className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_32px_72px_-36px_hsl(var(--uof)/0.35)]"
        >
          <div className="border-b border-border/45 bg-gradient-to-b from-emerald-500/[0.08] to-transparent px-5 py-8 text-center sm:px-8">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/35 bg-emerald-500/15 shadow-[0_0_32px_-8px_hsl(150_60%_45%/0.5)]"
            >
              <CheckCircle2 className="h-9 w-9 text-emerald-400" strokeWidth={1.75} aria-hidden />
            </motion.div>
            <motion.p
              className="mt-4 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {pages.createTokenEyebrow}
            </motion.p>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-7">
            {mint ? (
              <div className="rounded-2xl border border-border/50 bg-muted/15 p-4">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mint</p>
                <p className="mt-2 break-all font-mono text-sm text-foreground">{mint}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3 h-8 gap-1.5 text-xs" onClick={() => void copyMint()}>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {copy.copyMint}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Mint address was not returned by the API; check Solscan for your signatures.
              </p>
            )}

            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{copy.signaturesTitle}</p>
              <ul className="mt-3 space-y-2">
                {signatures.map((sig, i) => {
                  const url = buildSolscanTxUrl(sig);
                  return (
                    <li key={sig}>
                      <a
                        href={url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border border-border/45 bg-background/30 px-3 py-2.5 font-mono text-xs transition-colors hover:bg-muted/25",
                          !url && "pointer-events-none opacity-70",
                        )}
                      >
                        <span className="truncate text-foreground/90">
                          {i + 1}. {sig.slice(0, 14)}…{sig.slice(-8)}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {mint ? (
                <Button asChild className="shadow-[0_12px_32px_-16px_hsl(var(--uof)/0.55)]">
                  <Link to={`/token/${encodeURIComponent(mint)}`}>{copy.viewToken}</Link>
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={onReset}>
                {copy.reset}
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
