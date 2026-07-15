import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { playgroundFilterRailClass } from "@/components/playground/playgroundStyles";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { ArticleItem } from "@/data/marketing/articles";
import { ArticleCopyForXButton } from "@/components/marketing/ArticleCopyForXButton";
import {
  ARTICLE_IMAGE_HEIGHT,
  ARTICLE_IMAGE_WIDTH,
  articleMediaFrameClass,
  articleMediaImgClass,
} from "@/lib/marketing/articleImageLayout";
import { cn } from "@/lib/utils";

function formatPublishedDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface FeaturedArticleHeroProps {
  article: ArticleItem;
  showAdminCopy?: boolean;
}

export function FeaturedArticleHero({ article, showAdminCopy = false }: FeaturedArticleHeroProps) {
  const publishedLabel = formatPublishedDate(article.publishedAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className={cn(
        overviewCardShell,
        "group relative overflow-hidden transition-colors hover:border-border/70",
      )}
    >
      {showAdminCopy ? (
        <div className="absolute right-3 top-3 z-10">
          <ArticleCopyForXButton slug={article.slug} variant="featured" />
        </div>
      ) : null}

      <Link
        to={article.href}
        className="grid min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:grid-cols-2"
      >
        {article.coverImage ? (
          <div
            className={cn(
              articleMediaFrameClass,
              "border-b border-border/40 md:self-start md:border-b-0 md:border-r",
            )}
          >
            <img
              src={article.coverImage}
              alt=""
              width={ARTICLE_IMAGE_WIDTH}
              height={ARTICLE_IMAGE_HEIGHT}
              className={cn(
                articleMediaImgClass,
                "transition-transform duration-500 group-hover:scale-[1.03]",
              )}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/55 via-background/5 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-background/25" />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.04]"
              aria-hidden
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col justify-center gap-3 p-5 sm:gap-4 sm:p-6 md:p-8 lg:p-10">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {article.source}
          </p>

          <h2 className="text-xl font-bold leading-tight transition-colors group-hover:text-primary sm:text-2xl lg:text-3xl">
            {article.title}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base line-clamp-4">
            {article.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {publishedLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {publishedLabel}
              </span>
            ) : null}
            {article.readingTimeMinutes ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {article.readingTimeMinutes} min read
              </span>
            ) : null}
          </div>

          {article.tags && article.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Topics">
              {article.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Read featured article
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export interface ArticleTagFilterProps {
  tags: string[];
  activeTag: string | null;
  onChange: (tag: string | null) => void;
}

export function ArticleTagFilter({ tags, activeTag, onChange }: ArticleTagFilterProps) {
  if (tags.length === 0) return null;

  const pillClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
      active
        ? "border-accent/50 bg-accent/10 text-foreground"
        : "border-border/60 bg-muted/20 text-muted-foreground hover:border-accent/30 hover:text-foreground",
    );

  return (
    <div
      className={cn(playgroundFilterRailClass, "mb-8")}
      role="group"
      aria-label="Filter articles by topic"
    >
      <button type="button" onClick={() => onChange(null)} className={pillClass(activeTag === null)}>
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onChange(tag)}
          className={pillClass(activeTag === tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
