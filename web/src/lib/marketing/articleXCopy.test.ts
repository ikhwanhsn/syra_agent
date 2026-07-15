import { describe, expect, it } from "vitest";
import { buildArticleXContent } from "@/lib/marketing/articleXCopy";
import { articleDetails } from "@/data/marketing/articleContent";

describe("buildArticleXContent", () => {
  it("builds copy for every published article without hanging", () => {
    for (const article of articleDetails) {
      const copy = buildArticleXContent(article);
      expect(copy).toContain(article.title);
      expect(copy).toContain(`https://www.syraa.fun/articles/${article.slug}`);
      expect(copy).not.toMatch(/AI IMAGE PROMPT/i);
      expect(copy).not.toMatch(/PROMPT_STYLE|Generate this image/i);
    }
  });

  it("includes h3 subheadings from article markdown", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("Inline payer (scripts and CI)");
  });

  it("copies plain paragraph body without image prompt blocks", () => {
    const article = articleDetails[0];
    const copy = buildArticleXContent(article);
    expect(copy.startsWith(article.title)).toBe(true);
    expect(copy).toContain(article.excerpt || article.description);
    expect(copy).not.toContain("━━━━━━━━");
    expect(copy).not.toContain("🖼️");
  });
});
