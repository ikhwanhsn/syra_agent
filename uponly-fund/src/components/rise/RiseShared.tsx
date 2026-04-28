/**
 * Shared atoms / helpers for the /rise dashboard.
 *
 * Keeps the bigger composite components (RiseHero, MarketScreener, etc.)
 * narrow and readable — anything reused by 2+ rise components lives here.
 */
import { type ReactNode, useMemo } from "react";
import { ArrowUpRight, BadgeCheck, ImageOff, ShieldAlert, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";

export const RISE_UPONLY_MINT = "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise" as const;

export function shortenMint(mint: string | null | undefined, leading = 4, trailing = 4): string {
  if (!mint) return "—";
  if (mint.length <= leading + trailing + 1) return mint;
  return `${mint.slice(0, leading)}…${mint.slice(-trailing)}`;
}

export function formatPctSigned(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  const fixed = Math.abs(pct) < 1 ? pct.toFixed(2) : pct.toFixed(1);
  return `${sign}${fixed.replace(/\.0$/, "")}%`;
}

export function formatRelativeAge(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours) || hours < 0) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30;
  if (months < 12) return `${Math.round(months)}mo`;
  return `${(months / 12).toFixed(1)}y`;
}

export function changeTone(pct: number | null): "up" | "down" | "neutral" {
  if (pct === null || !Number.isFinite(pct)) return "neutral";
  if (pct > 0.01) return "up";
  if (pct < -0.01) return "down";
  return "neutral";
}

/** Compact USD with smart precision for tiny prices. */
export function formatPriceSmart(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (Math.abs(n) < 0.0001) return n.toExponential(2).replace("e", "e");
  return formatUsd(n);
}

export function TokenAvatar({
  imageUrl,
  symbol,
  size = "md",
  className,
}: {
  imageUrl: string | null | undefined;
  symbol: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "xs"
      ? "h-6 w-6 text-[0.55rem]"
      : size === "sm"
        ? "h-8 w-8 text-[0.625rem]"
        : size === "md"
          ? "h-10 w-10 text-xs"
          : "h-14 w-14 text-sm";
  const fallback = (symbol || "•").slice(0, 3).toUpperCase();
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-background/50 to-background/20 shadow-inner",
        dim,
        className,
      )}
      aria-hidden
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(e) => {
            const t = e.currentTarget;
            t.style.display = "none";
          }}
        />
      ) : null}
      <span className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-foreground/70">
        {fallback}
      </span>
    </div>
  );
}

export function ChangePill({
  pct,
  className,
  withSign = true,
}: {
  pct: number | null;
  className?: string;
  withSign?: boolean;
}) {
  const tone = changeTone(pct);
  const text = pct === null ? "—" : withSign ? formatPctSigned(pct) : formatPct(pct);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums leading-none sm:text-xs",
        tone === "up" && "border-emerald-500/45 bg-emerald-500/15 text-emerald-400",
        tone === "down" && "border-red-500/45 bg-red-500/15 text-red-400",
        tone === "neutral" && "border-border/50 bg-muted/30 text-muted-foreground",
        className,
      )}
    >
      {text}
    </span>
  );
}

export function VerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  if (!verified) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-ring/40 bg-ring/10 px-1 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-foreground/85",
        className,
      )}
      title="Verified market"
    >
      <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
      <span>Verified</span>
    </span>
  );
}

export function LevelChip({ level, className }: { level: number | null; className?: string }) {
  if (level === null || !Number.isFinite(level)) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border/50 bg-background/40 px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tabular-nums text-foreground/85",
        className,
      )}
      title="RISE protocol level"
    >
      L{Math.round(level)}
    </span>
  );
}

export function RiseTradeButton({
  mint,
  size = "sm",
  className,
}: {
  mint: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const url = useMemo(() => buildRiseTradeUrl(mint), [mint]);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-md border border-border/55 bg-background/40 font-medium text-foreground/95 transition-colors hover:border-success/40 hover:bg-success/[0.05] hover:text-foreground",
        size === "sm" ? "px-2 py-1 text-[0.7rem]" : "px-3 py-1.5 text-xs",
        className,
      )}
    >
      <ShoppingCart className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      Trade
      <ArrowUpRight className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
    </a>
  );
}

/** Glass-card surface — same look used throughout /uponly. */
export function GlassCard({
  className,
  children,
  as: Tag = "div",
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
  padded?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-b from-card/60 to-card/30 shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_18px_44px_-18px_hsl(0_0%_0%/0.35)] backdrop-blur-md",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Section heading with eyebrow + optional right slot. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  right,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/85 sm:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-balance text-lg font-semibold tracking-[-0.01em] text-foreground sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/** Dense KPI card — used by RiseHero and the spotlight. */
export function StatTile({
  label,
  value,
  sub,
  accent = false,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border/40 bg-background/30 p-3 shadow-sm sm:p-3.5",
        accent && "border-success/35 bg-success/[0.06]",
        className,
      )}
    >
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[0.65rem]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums text-foreground sm:text-[0.95rem]">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground/85 sm:text-xs">{sub}</p> : null}
    </div>
  );
}

/** Compact row card used by movers rails and mobile screener. */
export function MarketRowCard({
  market,
  onClick,
  className,
}: {
  market: RiseMarketRow;
  onClick?: () => void;
  className?: string;
}) {
  const isInteractive = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      className={cn(
        "group/card flex w-full min-w-0 items-center gap-3 rounded-xl border border-border/45 bg-card/40 px-3 py-2.5 text-left shadow-sm transition-colors",
        isInteractive
          ? "hover:border-foreground/30 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          : "cursor-default",
        className,
      )}
    >
      <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">${market.symbol || "—"}</p>
          <VerifiedBadge verified={market.isVerified} />
        </div>
        <p className="truncate text-[0.7rem] text-muted-foreground sm:text-xs">{market.name || shortenMint(market.mint)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(market.priceUsd)}</p>
        <ChangePill pct={market.priceChange24hPct} className="mt-0.5" />
      </div>
    </button>
  );
}

/** Tiny atom: side note row used by KPIs / footer disclaimers. */
export function SubtleNote({ icon: Icon, children }: { icon?: typeof ShieldAlert; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[0.65rem] leading-relaxed text-muted-foreground/85 sm:text-xs">
      {Icon ? <Icon className="mt-0.5 h-3 w-3 shrink-0 opacity-70" aria-hidden /> : null}
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function EmptyState({
  icon: Icon = ImageOff,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof ImageOff;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 bg-background/30 px-6 py-10 text-center",
        className,
      )}
    >
      <Icon className="h-6 w-6 text-muted-foreground/70" aria-hidden />
      <p className="text-sm font-medium text-foreground/90">{title}</p>
      {description ? <p className="max-w-sm text-xs text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
