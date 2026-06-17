import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";

function toneClass(tone: string): string {
  if (tone === "safe") return "text-emerald-500";
  if (tone === "danger") return "text-red-500";
  return "text-amber-500";
}

function toneRing(tone: string): string {
  if (tone === "safe") return "stroke-emerald-500/80";
  if (tone === "danger") return "stroke-red-500/80";
  return "stroke-amber-500/80";
}

function truncateMint(mint: string): string {
  if (mint.length <= 16) return mint;
  return `${mint.slice(0, 6)}…${mint.slice(-6)}`;
}

export interface PumpfunVerdictCardProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunVerdictCard({ data, className }: PumpfunVerdictCardProps) {
  const { syraAlpha, mint } = data;
  const pumpfun = data.pumpfun.ok ? data.pumpfun.data : null;
  const dossierAsset = data.dossier.ok ? data.dossier.data?.asset : null;
  const name = pumpfun?.name ?? dossierAsset?.name ?? "Unknown token";
  const symbol = pumpfun?.symbol ?? dossierAsset?.symbol ?? "—";
  const image = pumpfun?.imageUri ?? dossierAsset?.imageUrl;
  const score = syraAlpha.score;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <article className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {image ? (
            <img
              src={image}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl border border-border/60 object-cover"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-2xl border border-border/60 bg-muted/40" />
          )}
          <div className="min-w-0 space-y-2">
            <p className={overviewKickerClass}>Syra Alpha Verdict</p>
            <h2 className="truncate font-display text-2xl font-semibold tracking-tight">{name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{symbol}</span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {truncateMint(mint)}
              </Badge>
              {pumpfun?.complete === true ? (
                <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Graduated
                </Badge>
              ) : pumpfun?.complete === false ? (
                <Badge variant="outline">Bonding curve</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{syraAlpha.disclaimer}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2 self-center lg:self-auto">
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={cn("transition-all duration-700", toneRing(syraAlpha.tone))}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("font-mono text-3xl font-bold tabular-nums", toneClass(syraAlpha.tone))}>
                {score}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
            </div>
          </div>
          <p className={cn("text-center text-sm font-semibold", toneClass(syraAlpha.tone))}>
            {syraAlpha.verdict}
          </p>
        </div>
      </div>

      {syraAlpha.factors.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border/40 pt-4">
          {syraAlpha.factors.map((factor) => (
            <Badge
              key={factor.id}
              variant="outline"
              className={cn(
                "font-normal",
                factor.delta > 0 && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                factor.delta < 0 && "border-red-500/30 text-red-600 dark:text-red-400",
              )}
            >
              {factor.label} {factor.delta > 0 ? "+" : ""}
              {factor.delta}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}
