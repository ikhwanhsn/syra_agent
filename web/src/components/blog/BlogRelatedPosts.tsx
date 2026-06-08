import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import type { ArticleDetail } from "@/data/marketing/articleContent";

interface BlogRelatedPostsProps {
  articles: ArticleDetail[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogRelatedPosts({ articles }: BlogRelatedPostsProps) {
  if (articles.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="blog-related my-16 sm:my-20"
      aria-labelledby="blog-related-heading"
    >
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="section-eyebrow-gradient text-xs font-medium uppercase tracking-[0.18em]">
            Continue reading
          </span>
          <h2
            id="blog-related-heading"
            className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Related <span className="neon-text">articles</span>
          </h2>
        </div>
        <Link
          to="/articles"
          className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {articles.map((article, index) => (
          <motion.article
            key={article.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              to={`/articles/${article.slug}`}
              className="blog-related-card group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={article.coverImage}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="blog-related-overlay absolute inset-0" aria-hidden />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readingTimeMinutes} min
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground/90">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {article.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                  Read article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
