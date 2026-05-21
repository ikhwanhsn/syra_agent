/**
 * Shared atoms / helpers for the /rise dashboard.
 *
 * Keeps the bigger composite components (RiseHero, MarketScreener, etc.)
 * narrow and readable — anything reused by 2+ rise components lives here.
 */
import { memo, type ReactNode, useMemo } from "react";
import { ArrowUpRight, BadgeCheck, ChartCandlestick, ImageOff, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInt, formatPct, formatPctSigned, formatUsd } from "@/lib/marketDisplayFormat";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";

export const RISE_UPONLY_MINT = "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise" as const;

export function shortenMint(mint: string | null | undefined, leading = 4, trailing = 4): string {
  if (!mint) return "—";
  if (mint.length <= leading + trailing + 1) return mint;
  return `${mint.slice(0, leading)}…${mint.slice(-trailing)}`;
}

export { formatPctSigned };

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
  if (Math.abs(n) < 0.0001) {
    const toSubscript = (value: number): string => {
      const map: Record<string, string> = {
        "0": "₀",
        "1": "₁",
        "2": "₂",
        "3": "₃",
        "4": "₄",
        "5": "₅",
        "6": "₆",
        "7": "₇",
        "8": "₈",
        "9": "₉",
      };
      return String(value)
        .split("")
        .map((d) => map[d] ?? d)
        .join("");
    };
    const abs = Math.abs(n);
    const fraction = abs.toFixed(12).split(".")[1]?.replace(/0+$/, "") ?? "";
    const firstNonZero = fraction.search(/[1-9]/);
    if (firstNonZero < 0) return "$0";
    const leadingZeros = firstNonZero;
    const significant = fraction.slice(firstNonZero, firstNonZero + 4).padEnd(4, "0");
    const sign = n < 0 ? "-" : "";
    return `${sign}$0.0${toSubscript(leadingZeros)}${significant}`;
  }
  return formatUsd(n);
}

type TokenAvatarProps = {
  imageUrl: string | null | undefined;
  symbol: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

function TokenAvatarImpl({ imageUrl, size = "md", className }: TokenAvatarProps) {
  const dim =
    size === "xs"
      ? "h-6 w-6 text-[0.55rem]"
      : size === "sm"
        ? "h-8 w-8 text-[0.625rem]"
        : size === "md"
          ? "h-10 w-10 text-xs"
          : "h-14 w-14 text-sm";
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
    </div>
  );
}

/** Memoized so screener refetches do not re-mount every row's avatar `<img>`. */
export const TokenAvatar = memo(TokenAvatarImpl);

type ChangePillProps = {
  pct: number | null;
  className?: string;
  withSign?: boolean;
};

function ChangePillImpl({
  pct,
  className,
  withSign = true,
}: ChangePillProps) {
  const tone = changeTone(pct);
  const text = pct === null ? "—" : withSign ? formatPctSigned(pct) : formatPct(pct);
  // Semantic tokens (--ds-positive / --ds-negative) drive both themes —
  // matches floorsniffer's flat pill (no glow, no gradient, tabular nums).
  const toneStyle =
    tone === "up"
      ? {
          color: "var(--ds-positive)",
          backgroundColor: "var(--ds-positive-soft)",
          borderColor: "var(--ds-positive-border)",
        }
      : tone === "down"
        ? {
            color: "var(--ds-negative)",
            backgroundColor: "var(--ds-negative-soft)",
            borderColor: "var(--ds-negative-border)",
          }
        : undefined;
  return (
    <span
      style={toneStyle}
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums leading-none sm:text-xs",
        tone === "neutral" && "border-border/50 bg-muted/30 text-muted-foreground",
        className,
      )}
    >
      {text}
    </span>
  );
}

/** Memoized pill — pct + withSign + className fully describe its render. */
export const ChangePill = memo(ChangePillImpl);

export function VerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  if (!verified) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-500/20 text-emerald-200 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_0_0_3px_hsl(150_60%_45%/0.18)]",
        className,
      )}
      title="Verified market"
      aria-label="Verified market"
    >
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-100" strokeWidth={2.4} aria-hidden />
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
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const launchClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Trade on RISE (opens in new tab)"
      title="Trade on RISE"
      className={cn(
        "group/trade relative inline-flex shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-lg border font-semibold tabular-nums tracking-tight text-foreground/92 antialiased",
        "border-border/50 bg-gradient-to-b from-background/[0.92] to-background/[0.52]",
        "shadow-[0_1px_0_0_hsl(0_0%_100%/0.07)_inset,0_1px_2px_-1px_hsl(0_0%_0%/0.22)]",
        "transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out",
        "hover:border-emerald-500/38 hover:from-emerald-500/[0.09] hover:to-background/[0.58]",
        "hover:text-foreground hover:shadow-[0_1px_0_0_hsl(0_0%_100%/0.08)_inset,0_10px_28px_-14px_hsl(160_55%_38%/0.42)]",
        "active:scale-[0.97] motion-reduce:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "dark:border-border/40 dark:from-background/[0.55] dark:to-background/[0.28] dark:hover:border-emerald-400/32 dark:hover:shadow-[0_1px_0_0_hsl(0_0%_100%/0.05)_inset,0_14px_36px_-16px_hsl(160_65%_42%/0.35)]",
        size === "sm" ? "min-h-8 px-2.5 py-1 text-[0.6875rem] leading-none" : "min-h-9 px-3 py-1.5 text-xs leading-none",
        className,
      )}
    >
      <ChartCandlestick
        className={cn(iconClass, "shrink-0 stroke-[2.15] text-emerald-600/95 opacity-[0.92] transition-[opacity,color,transform] duration-200 dark:text-emerald-400/95")}
        aria-hidden
      />
      <span className="select-none">Trade</span>
      <ArrowUpRight
        className={cn(
          launchClass,
          "shrink-0 stroke-[2.25] text-muted-foreground/45 opacity-90 transition-[opacity,transform,color] duration-200 ease-out",
          "group-hover/trade:-translate-y-px group-hover/trade:translate-x-px group-hover/trade:text-emerald-600/85 dark:group-hover/trade:text-emerald-400/90",
          "motion-reduce:group-hover/trade:translate-x-0 motion-reduce:group-hover/trade:translate-y-0",
        )}
        aria-hidden
      />
    </a>
  );
}

/** Flat dashboard surface — no blur, no gradient. Matches floorsniffer's
 *  screener panels. Single hairline border, subtle inset only on dark theme. */
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
        "relative min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_0_0_1px_hsl(0_0%_100%/0.02)_inset]",
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
