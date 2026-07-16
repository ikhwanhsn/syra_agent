import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BlogProgressBar } from "@/components/blog/BlogProgressBar";
import { BlogArticleHeader } from "@/components/blog/BlogArticleHeader";
import { BlogAuthorCard } from "@/components/blog/BlogAuthorCard";
import { BlogFeaturedImage } from "@/components/blog/BlogFeaturedImage";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { BlogSocialShare } from "@/components/blog/BlogSocialShare";
import { BlogRelatedPosts } from "@/components/blog/BlogRelatedPosts";
import { BlogNewsletter } from "@/components/blog/BlogNewsletter";
import { ArticlePageShell, ARTICLE_SIDEBAR_STICKY } from "@/components/blog/ArticlePageShell";
import { ArticleCopyForXButton } from "@/components/marketing/ArticleCopyForXButton";
import { ArticleXFormatGuide } from "@/components/marketing/ArticleXFormatGuide";
import { Button } from "@/components/ui/button";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/data/marketing/articleContent";
import { useDocumentMeta } from "@/lib/marketing/useDocumentMeta";
import { cn } from "@/lib/utils";

const SITE_ORIGIN = "https://www.syraa.fun" as const;

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = useMemo(() => (slug ? getArticleBySlug(slug) : undefined), [slug]);
  const related = useMemo(
    () => (article ? getRelatedArticles(article.slug, 2) : []),
    [article],
  );

  useDocumentMeta({
    title: article ? `${article.title} · Syra` : "Article not found · Syra",
    description: article?.description ?? "This Syra article does not exist or the link is outdated.",
    canonicalPath: article ? `/articles/${article.slug}` : "/articles",
    ogImage: article?.coverImage ? `${SITE_ORIGIN}${article.coverImage}` : undefined,
    ogType: "article",
  });

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !article) return "";
    return `${window.location.origin}/articles/${article.slug}`;
  }, [article]);

  if (!article) {
    return (
      <ArticlePageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Article not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            This article does not exist or the link is outdated.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-xl">
              <Link to="/articles">All articles</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/">Back to Syra</Link>
            </Button>
          </div>
        </div>
      </ArticlePageShell>
    );
  }

  return (
    <ArticlePageShell>
      <BlogProgressBar />

      <BlogArticleHeader article={article} />

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ArticleCopyForXButton slug={article.slug} variant="featured" />
        </div>
        <ArticleXFormatGuide className="max-w-2xl" />
      </div>

      <div className="mt-6 min-w-0 sm:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-start lg:gap-6 xl:gap-8">
        <div className="min-w-0 space-y-6 sm:space-y-8">
          <BlogFeaturedImage src={article.coverImage} alt={article.title} />

          <div className="lg:hidden">
            <BlogAuthorCard author={article.author} variant="card" />
          </div>

          <BlogContent content={article.content} />

          <div className="lg:hidden">
            <BlogSocialShare title={article.title} url={shareUrl} />
          </div>

          <BlogNewsletter />
          <BlogRelatedPosts articles={related} />
        </div>

        <aside className="hidden min-w-0 lg:block">
          <div className={cn(ARTICLE_SIDEBAR_STICKY, "space-y-4")}>
            <BlogAuthorCard author={article.author} variant="card" />
            <BlogTableOfContents />
            <ArticleCopyForXButton slug={article.slug} variant="featured" className="w-full justify-center" />
            <BlogSocialShare title={article.title} url={shareUrl} />
          </div>
        </aside>
      </div>
    </ArticlePageShell>
  );
}
