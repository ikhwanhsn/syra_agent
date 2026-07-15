import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { ArticleItem } from "@/data/marketing/articles";
import { ArticleCopyForXButton } from "@/components/marketing/ArticleCopyForXButton";
import {
  ARTICLE_IMAGE_HEIGHT,
  ARTICLE_IMAGE_WIDTH,
  articleMediaFrameClass,
  articleMediaImgClass,
} from "@/lib/marketing/articleImageLayout";

/** Shared surface aligned with dashboard overview cards. */
const cardSurfaceClass = cn(
  overviewCardShell,
  "group h-full overflow-hidden transition-colors hover:border-border/70",
);

export interface ArticleCardProps {
  article: ArticleItem;
  titleAs?: "h2" | "h3";
  motionInitial?: TargetAndTransition;
  motionAnimate?: TargetAndTransition;
  motionTransition?: Transition;
  showAdminCopy?: boolean;
}

function ArticleMedia({ article }: { article: ArticleItem }) {
  if (article.comingSoon) {
    return (
      <div
        className={cn(
          articleMediaFrameClass,
          "flex flex-col items-center justify-center gap-3 border-b border-border/50 bg-gradient-to-br from-muted/50 via-muted/25 to-background",
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
      <div className={cn(articleMediaFrameClass, "border-b border-border/40")}>
        <img
          src={article.coverImage}
          alt=""
          loading="lazy"
          decoding="async"
          width={ARTICLE_IMAGE_WIDTH}
          height={ARTICLE_IMAGE_HEIGHT}
          className={cn(
            articleMediaImgClass,
            "transition-transform duration-300 group-hover:scale-[1.03]",
          )}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.03]"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className={cn(articleMediaFrameClass, "border-b border-border/40 bg-muted/25")} aria-hidden />
  );
}

export function ArticleCard({
  article,
  titleAs = "h3",
  motionInitial = { opacity: 0, y: 30 },
  motionAnimate = { opacity: 1, y: 0 },
  motionTransition = { duration: 0.5, delay: 0 },
  showAdminCopy = false,
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
          Read article
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </>
  );

  const cardInner = (
    <>
      <ArticleMedia article={article} />
      <div className="flex flex-1 flex-col p-6">{body}</div>
    </>
  );

  return (
    <motion.div
      initial={motionInitial}
      animate={motionAnimate}
      transition={motionTransition}
      className={cn(
        cardSurfaceClass,
        "relative",
        article.comingSoon ? "cursor-default" : "cursor-pointer",
      )}
    >
      {showAdminCopy && !article.comingSoon ? (
        <div className="absolute right-3 top-3 z-10">
          <ArticleCopyForXButton slug={article.slug} variant="card" />
        </div>
      ) : null}

      {article.comingSoon ? (
        <div className="flex h-full flex-col">{cardInner}</div>
      ) : article.external ? (
        <a
          href={article.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {cardInner}
        </a>
      ) : (
        <Link
          to={article.href}
          className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {cardInner}
        </Link>
      )}
    </motion.div>
  );
}
