import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { ArticlesPageSkeleton } from "@/components/marketing/ArticlesSkeleton";
import {
  ArticleTagFilter,
  FeaturedArticleHero,
} from "@/components/marketing/FeaturedArticleHero";
import { ArticlePageShell } from "@/components/blog/ArticlePageShell";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import {
  getAllArticleTags,
  getPublishedArticles,
  SYRA_X_SOURCE_LINE,
} from "@/data/marketing/articles";
import { useArticlesData } from "@/hooks/useArticlesData";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { buildArticlesListJsonLd } from "@/lib/marketing/articlesJsonLd";
import { useDocumentMeta } from "@/lib/marketing/useDocumentMeta";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import { cn } from "@/lib/utils";

const PAGE_TITLE = "Articles · Syra";
const PAGE_DESCRIPTION =
  "Read Syra articles on machine money, x402 APIs, agent wallets, and building on Solana. Product updates, deep dives, and insights from the Syra team.";

export default function Articles() {
  const { articles: allArticles, isLoading } = useArticlesData();
  const showSkeleton = useMinimumSkeleton(isLoading);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { address, connected } = useWalletContext();
  const isAdmin = isAdminWallet(connected, address);

  useDocumentMeta({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    canonicalPath: "/articles",
    ogType: "website",
  });

  const published = useMemo(() => getPublishedArticles(allArticles), [allArticles]);
  const comingSoon = useMemo(
    () => allArticles.filter((a) => a.comingSoon),
    [allArticles],
  );
  const allTags = useMemo(() => getAllArticleTags(allArticles), [allArticles]);

  const featured = published[0];
  const gridArticles = useMemo(() => {
    const rest = published.slice(1);
    const pool = [...rest, ...comingSoon];
    if (!activeTag) return pool;
    return pool.filter(
      (article) => !article.comingSoon && article.tags?.includes(activeTag),
    );
  }, [published, comingSoon, activeTag]);

  const jsonLd = useMemo(
    () => (allArticles.length > 0 ? buildArticlesListJsonLd(allArticles) : null),
    [allArticles],
  );

  useEffect(() => {
    if (!jsonLd) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "syra-articles-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [jsonLd]);

  return (
    <ArticlePageShell>
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Syra
      </Link>

      {showSkeleton ? (
        <ArticlesPageSkeleton />
      ) : (
        <>
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-10 min-w-0"
          >
            <p className={overviewKickerClass}>Articles</p>
            <h1 className="mt-2 text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Insights & updates
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Deep dives on machine money, x402 APIs, and agent infrastructure on Solana.
              Written by the Syra team — also published on{" "}
              <a
                href="https://x.com/syra_agent"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                @syra_agent
              </a>
              .
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {published.length} article{published.length === 1 ? "" : "s"} published
              {comingSoon.length > 0 ? ` · ${comingSoon.length} coming soon` : ""}
            </p>
          </motion.header>

          {featured ? (
            <div className="mb-12">
              <p className={cn(overviewKickerClass, "mb-4")}>Featured</p>
              <FeaturedArticleHero article={featured} showAdminCopy={isAdmin} />
            </div>
          ) : null}

          <ArticleTagFilter
            tags={allTags}
            activeTag={activeTag}
            onChange={setActiveTag}
          />

          {gridArticles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {gridArticles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  titleAs="h2"
                  showAdminCopy={isAdmin && !article.comingSoon}
                  motionTransition={{ duration: 0.45, delay: index * 0.05 }}
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                overviewCardShell,
                "border-dashed px-6 py-16 text-center",
              )}
            >
              <p className="text-muted-foreground">No articles match this topic yet.</p>
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="mt-4 text-sm font-medium text-foreground hover:underline"
              >
                Show all articles
              </button>
            </div>
          )}

          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className={cn(overviewCardShell, "mt-12 p-6 sm:p-8")}
          >
            <p className={overviewKickerClass}>{SYRA_X_SOURCE_LINE}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Get updates as they ship
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              New articles, API releases, and product notes land on X first. Follow
              @syra_agent so you do not miss the next deep dive.
            </p>
            <a
              href="https://x.com/syra_agent"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/35"
            >
              Follow on X
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </motion.aside>
        </>
      )}
    </ArticlePageShell>
  );
}
