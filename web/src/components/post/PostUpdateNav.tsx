import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPostBundleByNumber } from "@/content/posts";
import { getPostRoutePath } from "@/lib/postRoutes";
import {
  getVisiblePostBundles,
  getVisiblePostUpdateNumbers,
} from "@/lib/postRegistryVisibility";
import { usePostXStatus } from "@/lib/postXStatus";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { cn } from "@/lib/utils";

interface PostUpdateNavProps {
  updateNumber: number;
  format: "video" | "photo";
}

function PostUpdateNavPill({
  n,
  active,
  format,
}: {
  n: number;
  active: boolean;
  format: "video" | "photo";
}) {
  const bundle = getPostBundleByNumber(n);
  const defaultPosted = bundle?.video.meta.postedOnX ?? false;
  const { posted } = usePostXStatus(n, defaultPosted);

  return (
    <Link
      to={getPostRoutePath(format, n)}
      className={cn(
        "relative inline-flex h-7 min-w-[1.75rem] shrink-0 flex-col items-center justify-center rounded-full px-2 font-mono text-[10px] tabular-nums transition-colors",
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800",
      )}
      aria-label={`Update #${n}${posted ? ", posted on X" : ", not posted on X"}`}
      aria-current={active ? "page" : undefined}
      title={`Update #${n} · ${posted ? "Posted on X" : "Not posted on X"}`}
    >
      <span>{n}</span>
      <span
        className={cn(
          "mt-0.5 h-1 w-1 rounded-full",
          posted ? "bg-emerald-500" : "bg-amber-500",
        )}
        aria-hidden
      />
    </Link>
  );
}

export function PostUpdateNav({ updateNumber, format }: PostUpdateNavProps) {
  const statusTick = usePostRegistryRefresh();
  const numbers = useMemo(() => getVisiblePostUpdateNumbers(), [statusTick]);
  const visibleBundles = useMemo(() => getVisiblePostBundles(), [statusTick]);
  const { prev, next } = useMemo(() => {
    const index = numbers.indexOf(updateNumber);
    if (index === -1) return { prev: null, next: null };
    return {
      prev: index > 0 ? numbers[index - 1]! : null,
      next: index < numbers.length - 1 ? numbers[index + 1]! : null,
    };
  }, [numbers, updateNumber]);

  if (numbers.length <= 1) return null;

  if (!visibleBundles.some((bundle) => bundle.video.meta.updateNumber === updateNumber)) {
    return null;
  }

  return (
    <nav
      aria-label="Switch ship log update"
      className="post-update-nav flex items-center gap-0.5 rounded-full border border-neutral-200 bg-neutral-50 p-0.5"
    >
      {prev ? (
        <Link
          to={getPostRoutePath(format, prev)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={`Previous update #${prev}`}
          title={`Update #${prev}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-300"
          aria-hidden
        >
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      <div className="flex max-w-[7.5rem] items-center gap-0.5 overflow-x-auto px-0.5 sm:max-w-none">
        {numbers.map((n) => (
          <PostUpdateNavPill key={n} n={n} active={n === updateNumber} format={format} />
        ))}
      </div>

      {next ? (
        <Link
          to={getPostRoutePath(format, next)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={`Next update #${next}`}
          title={`Update #${next}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-300"
          aria-hidden
        >
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
