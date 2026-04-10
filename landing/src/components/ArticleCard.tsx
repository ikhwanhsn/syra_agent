import { motion } from "framer-motion";
import type { TargetAndTransition, Transition } from "framer-motion";
import { FileText, ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleItem } from "@/data/articles";

/** Shared surface: one accent color, same hover on every card (including coming soon). */
const cardSurfaceClass =
  "group glass-card overflow-hidden rounded-2xl border border-transparent transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_32px_-10px_hsl(var(--accent)/0.2)]";

const iconBoxClass =
  "mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 transition-colors group-hover:bg-accent/20";

export interface ArticleCardProps {
  article: ArticleItem;
  titleAs?: "h2" | "h3";
  motionInitial?: TargetAndTransition;
  motionAnimate?: TargetAndTransition;
  motionTransition?: Transition;
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

  const inner = (
    <>
      <div className={iconBoxClass}>
        <FileText className="h-6 w-6 text-primary" />
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{article.source}</p>
      {titleEl}
      <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-4">
        {article.description}
      </p>
      {article.comingSoon ? (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Clock className="h-4 w-4 shrink-0" />
          Coming soon
        </span>
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
        <div className="flex h-full flex-col p-6">{inner}</div>
      ) : (
        <a
          href={article.href}
          target={article.external ? "_blank" : undefined}
          rel={article.external ? "noopener noreferrer" : undefined}
          className="flex h-full flex-col p-6"
        >
          {inner}
        </a>
      )}
    </motion.div>
  );
}
