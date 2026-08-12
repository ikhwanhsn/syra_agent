import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostBackLinkProps {
  className?: string;
  to?: string;
}

/**
 * Fixed back control, stays visible while the ship-log page scrolls.
 * An in-flow spacer keeps header layout from collapsing under the fixed button.
 */
export function PostBackLink({ className, to = "/" }: PostBackLinkProps) {
  const label = to === "/post" ? "Back to ship log" : "Back to Syra";

  return (
    <>
      <span
        className="inline-flex h-9 w-9 shrink-0 sm:h-10 sm:w-10"
        aria-hidden
      />
      <Link
        to={to}
        aria-label={label}
        className={cn(
          "post-back-link fixed z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-[0_8px_24px_hsl(0_0%_0%/0.08)] backdrop-blur-md transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:h-10 sm:w-10",
          "left-[max(0.75rem,env(safe-area-inset-left,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] sm:left-6 sm:top-4 md:left-8",
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </>
  );
}
