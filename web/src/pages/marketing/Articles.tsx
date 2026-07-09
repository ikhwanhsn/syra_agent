import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ArticleCard } from "@/components/marketing/ArticleCard";
import { ArticlesPageSkeleton } from "@/components/marketing/ArticlesSkeleton";
import {
  ArticleTagFilter,
  FeaturedArticleHero,
} from "@/components/marketing/FeaturedArticleHero";
import { BlogAmbient } from "@/components/blog/BlogAmbient";
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
    <div className="blog-root relative min-h-screen overflow-x-hidden bg-background">
      <BlogAmbient />
      <Navbar />

      <main className="relative pt-28 pb-16">
        <section className="relative overflow-hidden py-12">
          <div className="pointer-events-none absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-accent/8 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-primary/6 blur-[90px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              to="/home"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to home
            </Link>

            {showSkeleton ? (
              <ArticlesPageSkeleton />
            ) : (
              <>
                <motion.header
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-12 max-w-3xl"
                >
                  <span className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium tracking-wider uppercase">
                    Articles
                  </span>
                  <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
                    Insights & <span className="neon-text">Updates</span>
                  </h1>
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Deep dives on machine money, x402 APIs, and agent infrastructure on Solana.
                    Written by the Syra team — also published on{" "}
                    <a
                      href="https://x.com/syra_agent"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      @syra_agent
                    </a>
                    .
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {published.length} article{published.length === 1 ? "" : "s"} published
                    {comingSoon.length > 0
                      ? ` · ${comingSoon.length} coming soon`
                      : ""}
                  </p>
                </motion.header>

                {featured ? (
                  <div className="mb-14">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Featured
                    </h2>
                    <FeaturedArticleHero article={featured} showAdminCopy={isAdmin} />
                  </div>
                ) : null}

                <ArticleTagFilter
                  tags={allTags}
                  activeTag={activeTag}
                  onChange={setActiveTag}
                />

                {gridArticles.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gridArticles.map((article, index) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        titleAs="h2"
                        showAdminCopy={isAdmin && !article.comingSoon}
                        motionTransition={{ duration: 0.5, delay: index * 0.06 }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center">
                    <p className="text-muted-foreground">
                      No articles match this topic yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTag(null)}
                      className="mt-4 text-sm font-medium text-primary hover:underline"
                    >
                      Show all articles
                    </button>
                  </div>
                )}

                <motion.aside
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-16 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 p-6 sm:p-8"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {SYRA_X_SOURCE_LINE}
                  </p>
                  <h2 className="mb-2 text-xl font-semibold sm:text-2xl">
                    Get updates as they ship
                  </h2>
                  <p className="mb-6 max-w-xl text-sm text-muted-foreground sm:text-base">
                    New articles, API releases, and product notes land on X first. Follow
                    @syra_agent so you do not miss the next deep dive.
                  </p>
                  <a
                    href="https://x.com/syra_agent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Follow on X
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </motion.aside>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
