import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import { ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleItem } from "@/data/articles";

/** Shared surface: one accent color, same hover on every card (including coming soon). */
const cardSurfaceClass =
  "group glass-card h-full overflow-hidden rounded-2xl border border-transparent transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_32px_-10px_hsl(var(--accent)/0.2)]";

/** All article thumbs use 16:9 (same as `article-two.webp` at 1920×1080). */
const articleThumbFrameClass =
  "relative aspect-video w-full shrink-0 overflow-hidden border-b border-border/40 bg-muted/20";

export interface ArticleCardProps {
  article: ArticleItem;
  titleAs?: "h2" | "h3";
  motionInitial?: TargetAndTransition;
  motionAnimate?: TargetAndTransition;
  motionTransition?: Transition;
}

function ArticleMedia({ article }: { article: ArticleItem }) {
  if (article.comingSoon) {
    return (
      <div
        className={cn(
          articleThumbFrameClass,
          "flex flex-col items-center justify-center gap-3 border-border/50 bg-gradient-to-br from-muted/50 via-muted/25 to-background",
        )}
        aria-hidden
      >
        <Clock className="h-9 w-9 text-muted-foreground/80" />
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Coming soon
        </span>
      </div>
    );
  }

  if (article.coverImage) {
    return (
      <div className={articleThumbFrameClass}>
        <img
          src={article.coverImage}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
    );
  }

  return <div className={cn(articleThumbFrameClass, "bg-muted/25")} aria-hidden />;
}

export function ArticleCard({
  article,
  titleAs = "h3",
  motionInitial = { opacity: 0, y: 30 },
  motionAnimate = { opacity: 1, y: 0 },
  motionTransition = { duration: 0.5, delay: 0 },
}: ArticleCardProps) {
  const headingClass =
    "mb-2 text-lg font-semibold transition-colors group-hover:text-primary";

  const titleEl =
    titleAs === "h2" ? (
      <h2 className={headingClass}>{article.title}</h2>
    ) : (
      <h3 className={headingClass}>{article.title}</h3>
    );

  const body = (
    <>
      <p className="mb-2 text-xs text-muted-foreground">{article.source}</p>
      {titleEl}
      <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-4">
        {article.description}
      </p>
      {article.comingSoon ? (
        <div className="h-5 shrink-0" aria-hidden />
      ) : (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          Read more
          <ExternalLink className="h-4 w-4 shrink-0" />
        </span>
      )}
    </>
  );

  return (
    <motion.div
      initial={motionInitial}
      animate={motionAnimate}
      transition={motionTransition}
      className={cn(
        cardSurfaceClass,
        article.comingSoon ? "cursor-default" : "cursor-pointer",
      )}
    >
      {article.comingSoon ? (
        <div className="flex h-full flex-col">
          <ArticleMedia article={article} />
          <div className="flex flex-1 flex-col p-6">{body}</div>
        </div>
      ) : (
        <a
          href={article.href}
          target={article.external ? "_blank" : undefined}
          rel={article.external ? "noopener noreferrer" : undefined}
          className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArticleMedia article={article} />
          <div className="flex flex-1 flex-col p-6">{body}</div>
        </a>
      )}
    </motion.div>
  );
}
