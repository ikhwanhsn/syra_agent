import { useEffect, useState } from "react";
import { articles, type ArticleItem } from "@/data/marketing/articles";

/**
 * Resolves static article data on the next tick so the list page can show skeleton UI.
 */
export function useArticlesData() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ArticleItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setItems(articles);
        setIsLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return { articles: items, isLoading };
}
