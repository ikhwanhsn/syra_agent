import { useState } from "react";
import { Check, ChevronDown, Copy, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  bestLiveVenue,
  impersonatorVenues,
  officialVenues,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { spcxCardQuietClass } from "@/components/spcx/spcxStyles";

export function SpcxBuySafety({ report }: { report: SpcxIntelligenceReport }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const scams = impersonatorVenues(report);
  const official = officialVenues(report);
  const liveVenue = bestLiveVenue(report);
  const verifiedMint = liveVenue?.mint || official[0]?.mint || "";

  const handleCopy = async () => {
    if (!verifiedMint) return;
    try {
      await navigator.clipboard.writeText(verifiedMint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          spcxCardQuietClass,
          scams.length > 0 ? "border-destructive/25" : "border-emerald-500/20",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {scams.length > 0 ? (
            <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {scams.length > 0
                ? `${scams.length} fake token${scams.length === 1 ? "" : "s"} blocked`
                : "Verified official token"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {scams.length > 0
                ? "Only trade through the swap above — never paste unknown mints."
                : `Trading ${liveVenue?.symbol ?? "SPCXx"} via Jupiter · 1:1 backed`}
            </p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 shrink-0 gap-1 rounded-lg px-2 text-xs">
              Details
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="space-y-3 border-t border-border/40 px-4 py-3.5">
            {verifiedMint ? (
              <div className="rounded-xl border border-border/40 bg-muted/[0.04] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Official mint
                </p>
                <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-foreground">
                  {verifiedMint}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 gap-1.5 rounded-lg text-[11px]"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy mint"}
                </Button>
              </div>
            ) : null}
            {scams.length > 0 ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                We detected scam pools trading at penny prices. The swap above routes only to the
                verified {liveVenue?.symbol ?? "SPCXx"} mint.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Always confirm the token symbol is {liveVenue?.symbol ?? "SPCXx"} before confirming
                your purchase. Never buy tokens labeled only &ldquo;SPCX&rdquo; from random DEX
                links.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
