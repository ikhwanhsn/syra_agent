import { Check, Circle } from "lucide-react";
import { usePostXStatus } from "@/lib/postXStatus";
import { cn } from "@/lib/utils";

interface PostXStatusControlProps {
  updateNumber: number;
  /** Seed from content meta when local override is unset. */
  defaultPosted?: boolean;
  variant?: "badge" | "dot";
  className?: string;
}

export function PostXStatusControl({
  updateNumber,
  defaultPosted = false,
  variant = "badge",
  className,
}: PostXStatusControlProps) {
  const { posted, toggle } = usePostXStatus(updateNumber, defaultPosted);

  if (variant === "dot") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "inline-flex h-2 w-2 shrink-0 rounded-full transition-colors",
          posted ? "bg-emerald-400/90" : "bg-amber-400/70",
          className,
        )}
        aria-label={posted ? "Posted on X — click to mark not posted" : "Not on X — click to mark posted"}
        title={posted ? "Posted on X" : "Not posted on X"}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors sm:px-3",
        posted
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400/90 hover:bg-emerald-500/15"
          : "border-amber-500/20 bg-amber-500/8 text-amber-300/80 hover:bg-amber-500/12",
        className,
      )}
      aria-pressed={posted}
      title={posted ? "Click to mark as not posted on X" : "Click to mark as posted on X"}
    >
      {posted ? (
        <Check className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        <Circle className="h-3 w-3 shrink-0" aria-hidden />
      )}
      <span className="hidden sm:inline">{posted ? "On X" : "Not on X"}</span>
      <span className="sm:hidden">{posted ? "X" : "—"}</span>
    </button>
  );
}

/** Read-only badge for list rows (still clickable to toggle). */
export function PostXStatusLabel({
  updateNumber,
  defaultPosted = false,
}: {
  updateNumber: number;
  defaultPosted?: boolean;
}) {
  const { posted, toggle } = usePostXStatus(updateNumber, defaultPosted);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors",
        posted
          ? "bg-emerald-500/12 text-emerald-400/85 hover:bg-emerald-500/18"
          : "bg-amber-500/10 text-amber-300/75 hover:bg-amber-500/16",
      )}
      title={posted ? "Posted on X — click to change" : "Not posted on X — click to mark posted"}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", posted ? "bg-emerald-400" : "bg-amber-400/80")}
        aria-hidden
      />
      {posted ? "Posted" : "Not posted"}
    </button>
  );
}
