import type { ArticleItem } from "@/data/marketing/articles";
import { getPublishedArticles } from "@/data/marketing/articles";

const SITE_ORIGIN = "https://www.syraa.fun" as const;

export function buildArticlesListJsonLd(items: ArticleItem[]) {
  const published = getPublishedArticles(items);

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Syra Articles",
    description:
      "Insights, product updates, and deep dives on machine money, x402 APIs, and agent infrastructure on Solana.",
    url: `${SITE_ORIGIN}/articles`,
    publisher: {
      "@type": "Organization",
      name: "Syra",
      url: SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
      },
      sameAs: ["https://x.com/syra_agent"],
    },
    blogPost: published.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      url: `${SITE_ORIGIN}${article.href}`,
      datePublished: article.publishedAt,
      image: article.coverImage ? `${SITE_ORIGIN}${article.coverImage}` : undefined,
      keywords: article.tags?.join(", "),
    })),
  };
}
