import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { BlogAmbient } from "@/components/blog/BlogAmbient";
import { BlogProgressBar } from "@/components/blog/BlogProgressBar";
import { BlogArticleHeader } from "@/components/blog/BlogArticleHeader";
import { BlogAuthorCard } from "@/components/blog/BlogAuthorCard";
import { BlogFeaturedImage } from "@/components/blog/BlogFeaturedImage";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import { BlogSocialShare } from "@/components/blog/BlogSocialShare";
import { BlogRelatedPosts } from "@/components/blog/BlogRelatedPosts";
import { BlogNewsletter } from "@/components/blog/BlogNewsletter";
import { BlogComments } from "@/components/blog/BlogComments";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/data/marketing/articleContent";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = useMemo(() => (slug ? getArticleBySlug(slug) : undefined), [slug]);
  const related = useMemo(
    () => (article ? getRelatedArticles(article.slug, 2) : []),
    [article],
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !article) return "";
    return `${window.location.origin}/articles/${article.slug}`;
  }, [article]);

  if (!article) {
    return (
      <div className="blog-root min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Article not found
          </h1>
          <p className="mt-3 text-muted-foreground">
            This article does not exist or the link is outdated.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/articles" className="btn-primary">
              All articles
            </Link>
            <Link to="/home" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="blog-root relative min-h-screen overflow-x-hidden bg-background">
      <BlogProgressBar />
      <BlogAmbient />
      <Navbar />

      <main className="relative pt-24 pb-16 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl lg:max-w-none">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-16">
              {/* Main column */}
              <div className="min-w-0">
                <BlogArticleHeader article={article} />

                <div className="mb-8 lg:hidden">
                  <BlogAuthorCard author={article.author} variant="card" />
                </div>

                <BlogFeaturedImage
                  src={article.coverImage}
                  alt={article.title}
                />

                <BlogContent content={article.content} />

                <div className="mt-10 lg:hidden">
                  <BlogSocialShare title={article.title} url={shareUrl} />
                </div>

                <BlogNewsletter />
                <BlogComments />
                <BlogRelatedPosts articles={related} />
              </div>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-28 space-y-6">
                  <BlogAuthorCard author={article.author} variant="card" />
                  <BlogTableOfContents />
                  <BlogSocialShare title={article.title} url={shareUrl} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
