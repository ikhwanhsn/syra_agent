import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { btcCardInset, btcKickerClass } from "@/components/btc/btcStyles";
import { BtcShareableSection, type BtcShareableSectionProps } from "@/components/btc/share/BtcShareableSection";

export function BtcSectionShell({
  id,
  kicker,
  title,
  description,
  shareSlug,
  shareLines,
  capturedAt,
  onShare,
  shareDisabled,
  loading,
  empty,
  children,
  shareChildren,
  className,
  bodyClassName,
  accent,
}: Omit<BtcShareableSectionProps, "shareSlug"> & { shareSlug?: string }) {
  const slug = shareSlug ?? id.replace(/^section-/, "");
  return (
    <BtcLazySection sectionId={id}>
      <BtcShareableSection
        kicker={kicker}
        title={title}
        description={description}
        shareSlug={slug}
        shareLines={shareLines}
        capturedAt={capturedAt}
        onShare={onShare}
        shareDisabled={shareDisabled}
        loading={loading}
        empty={empty}
        shareChildren={shareChildren}
        className={className}
        bodyClassName={bodyClassName}
        accent={accent}
      >
        {children}
      </BtcShareableSection>
    </BtcLazySection>
  );
}

export function BtcLazySection({
  sectionId,
  children,
  minHeight = 160,
}: {
  /** Nav anchor — always in DOM so scroll spy + hash links work before content mounts. */
  sectionId?: string;
  children: ReactNode;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      id={sectionId}
      ref={ref}
      className={cn(sectionId && "scroll-mt-24")}
      style={{ minHeight: visible ? undefined : minHeight }}
    >
      {visible ? children : <div className="h-full min-h-[inherit] animate-pulse rounded-2xl bg-muted/15" />}
    </div>
  );
}

export function BtcSparkline({
  values,
  className,
  color = "#3b82f6",
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 100;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-full", className)} preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export function BtcMetricTile({
  label,
  value,
  hint,
  accent,
  inset = true,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "up" | "down" | "neutral";
  inset?: boolean;
}) {
  return (
    <div className={cn(inset ? btcCardInset : "rounded-xl", "p-4")}>
      <p className={btcKickerClass}>{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-xl font-semibold tabular-nums text-foreground",
          accent === "up" && "text-emerald-600 dark:text-emerald-400",
          accent === "down" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
