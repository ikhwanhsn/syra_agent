export interface ArticleItem {
  id: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  comingSoon: boolean;
  /** Attribution line above the title. */
  source: string;
  /** Public URL under `public/` (e.g. `/images/articles/foo.webp`). Omit for coming soon — card shows a placeholder instead. */
  coverImage?: string;
}

/** Max cards in the home page “Insights & Updates” section. */
export const LANDING_ARTICLE_LIMIT = 3;

export const UOF_X_SOURCE_LINE = "Published on X · @uponly_fund";

export const articles: ArticleItem[] = [
  {
    id: "uof-rise-ecosystem",
    title: "Why we publish mandate-first disclosure on RISE",
    description:
      "Allocator narrative, treasury intent, and the liquid $UPONLY sleeve share one growth story—structured so markets can diligence what founders already see in product velocity.",
    href: "https://x.com/uponly_fund",
    external: true,
    comingSoon: false,
    source: UOF_X_SOURCE_LINE,
    coverImage: "/images/articles/article-one.webp",
  },
  {
    id: "uof-terminal",
    title: "Live desk: screening RISE markets with fund-grade context",
    description:
      "How the terminal ties together protocol floors, borrow mechanics, and participation signals—always read-only until you execute on rise.rich.",
    href: "https://x.com/uponly_fund",
    external: true,
    comingSoon: false,
    source: UOF_X_SOURCE_LINE,
    coverImage: "/images/articles/article-two.webp",
  },
  {
    id: "article-more",
    title: "More updates on X",
    description:
      "Ship logs, risk copy changes, and venue notes land on @uponly_fund first—follow for release cadence and disclosure updates.",
    href: "#",
    external: false,
    comingSoon: true,
    source: UOF_X_SOURCE_LINE,
  },
];
