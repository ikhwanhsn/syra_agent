import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostBackLinkProps {
  className?: string;
  to?: string;
}

export function PostBackLink({ className, to = "/" }: PostBackLinkProps) {
  return (
    <Link
      to={to}
      aria-label={to === "/post" ? "Back to brief studio" : "Back to Up Only Fund"}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white/90 sm:h-10 sm:w-10",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </Link>
  );
}
