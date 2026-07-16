import { describe, expect, it } from "vitest";
import { buildArticleXContent } from "@/lib/marketing/articleXCopy";
import { articleDetails } from "@/data/marketing/articleContent";

describe("buildArticleXContent", () => {
  it("builds complete copy for every published article", () => {
    for (const article of articleDetails) {
      const copy = buildArticleXContent(article);
      expect(copy).toContain(article.title);
      expect(copy).toContain(article.excerpt || article.description);
      expect(copy).toContain(`https://www.syraa.fun/articles/${article.slug}`);
      expect(copy).not.toMatch(/AI IMAGE PROMPT/i);
      expect(copy).not.toMatch(/PROMPT_STYLE|Generate this image/i);
      expect(copy).not.toContain("━━━━━━━━");
      expect(copy).not.toContain("🖼️");
      // Full article body should be substantial — not a truncated teaser
      expect(copy.length).toBeGreaterThan(article.excerpt.length + 400);
    }
  });

  it("includes h3 subheadings from article markdown", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("Inline payer (scripts and CI)");
  });

  it("includes table rows that appear on the website", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("@syra-ai/sdk");
    expect(copy).toContain("@syra-ai/mcp-server");
    expect(copy).toContain("syra.pillars.earn");
    expect(copy).toContain("API Marketplace");
  });

  it("includes code examples from the article body", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("npm install @syra-ai/sdk");
    expect(copy).toContain("createSyraPaidClient");
    expect(copy).toContain("syra.get(\"/v1/market/pulse\"");
  });

  it("formats lists and skips image / originally-published chrome", () => {
    const access = articleDetails.find((a) => a.slug === "syra-access-x402-mpp");
    expect(access).toBeDefined();
    const copy = buildArticleXContent(access!);
    expect(copy).toContain("• Implement x402 retry logic");
    expect(copy).not.toContain("/images/articles/");
    expect(copy).not.toMatch(/Originally published/i);
  });

  it("keeps short X-friendly paragraph breaks for long prose", () => {
    const strategy = articleDetails.find((a) => a.slug === "future-agentic-era-syra-positioning");
    expect(strategy).toBeDefined();
    const copy = buildArticleXContent(strategy!);
    const blankLineBlocks = copy.split("\n\n").filter((b) => b.trim().length > 0);
    expect(blankLineBlocks.length).toBeGreaterThan(12);
  });
});
