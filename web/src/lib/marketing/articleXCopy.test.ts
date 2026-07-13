import { describe, expect, it } from "vitest";
import { buildArticleXContent } from "@/lib/marketing/articleXCopy";
import { articleDetails } from "@/data/marketing/articleContent";

describe("buildArticleXContent", () => {
  it("builds copy for every published article without hanging", () => {
    for (const article of articleDetails) {
      const copy = buildArticleXContent(article);
      expect(copy).toContain(article.title);
      expect(copy).toContain(`https://www.syraa.fun/articles/${article.slug}`);
    }
  });

  it("includes h3 subheadings from article markdown", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("Inline payer (scripts and CI)");
  });
});
