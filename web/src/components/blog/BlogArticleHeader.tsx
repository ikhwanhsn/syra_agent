import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArticleDetail } from "@/data/marketing/articleContent";

interface BlogArticleHeaderProps {
  article: ArticleDetail;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogArticleHeader({ article }: BlogArticleHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="blog-header relative mb-10 sm:mb-14"
    >
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </li>
          <li aria-hidden className="text-border">
            /
          </li>
          <li>
            <Link to="/articles" className="transition-colors hover:text-foreground">
              Articles
            </Link>
          </li>
          <li aria-hidden className="text-border">
            /
          </li>
          <li className="max-w-[12rem] truncate font-medium text-foreground sm:max-w-xs" aria-current="page">
            {article.category}
          </li>
        </ol>
      </nav>

      <div className="blog-header-glow pointer-events-none absolute -inset-x-8 -top-8 h-48 opacity-60" aria-hidden />

      <div className="relative">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="blog-eyebrow inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
            <Sparkles className="h-3.5 w-3.5" />
            {article.category}
          </span>
          {article.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border/60 bg-background/40 text-[11px] font-medium backdrop-blur-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <h1 className="blog-title font-display text-balance text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-[2.75rem] lg:text-[3.25rem]">
          {article.title}
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {article.excerpt}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-foreground/40" />
            {formatDate(article.publishedAt)}
          </span>
          <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-foreground/40" />
            {article.readingTimeMinutes} min read
          </span>
        </div>
      </div>
    </motion.header>
  );
}
