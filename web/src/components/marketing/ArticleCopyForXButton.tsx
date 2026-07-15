import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { getArticleBySlug } from "@/data/marketing/articleContent";
import { copyArticleXContent } from "@/lib/marketing/articleXCopy";
import { cn } from "@/lib/utils";

export interface ArticleCopyForXButtonProps {
  slug: string;
  className?: string;
  variant?: "card" | "featured";
}

export function ArticleCopyForXButton({
  slug,
  className,
  variant = "card",
}: ArticleCopyForXButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const article = getArticleBySlug(slug);
      if (!article) {
        toast.error("Article content not found");
        return;
      }

      const ok = await copyArticleXContent(article);
      if (ok) {
        setCopied(true);
        toast.success("Article text copied for X");
        window.setTimeout(() => setCopied(false), 2200);
      } else {
        toast.error("Could not copy to clipboard");
      }
    },
    [slug],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-foreground",
        variant === "featured" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs",
        className,
      )}
      title="Copy full article text for X"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copy for X
        </>
      )}
    </button>
  );
}
