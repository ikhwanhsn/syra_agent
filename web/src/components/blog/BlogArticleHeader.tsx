import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-w-0 w-full"
    >
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All articles
        </Link>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <p className={overviewKickerClass}>{article.category}</p>
        {article.tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-border/55 bg-muted/15 text-[11px] font-medium"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <h1 className="mt-4 text-balance font-display text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-[2.75rem]">
        {article.title}
      </h1>

      <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
        {article.excerpt}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4 opacity-60" aria-hidden />
          {formatDate(article.publishedAt)}
        </span>
        <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 opacity-60" aria-hidden />
          {article.readingTimeMinutes} min read
        </span>
      </div>
    </motion.header>
  );
}
