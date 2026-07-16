import { describe, expect, it } from "vitest";
import {
  buildArticleXContent,
  buildArticleXHtml,
  normalizeEmDash,
} from "@/lib/marketing/articleXCopy";
import { articleDetails } from "@/data/marketing/articleContent";

describe("normalizeEmDash", () => {
  it("replaces em dashes with commas", () => {
    expect(normalizeEmDash("machine money — pay-per-call")).toBe(
      "machine money, pay-per-call",
    );
    expect(normalizeEmDash("a—b")).toBe("a, b");
  });
});

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
      expect(copy).not.toContain("—");
      expect(copy.length).toBeGreaterThan(article.excerpt.length + 400);
    }
  });

  it("includes h3 subheadings from article markdown", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("Inline payer (scripts and CI)");
  });

  it("includes table rows flattened to bullets", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("@syra-ai/sdk");
    expect(copy).toContain("@syra-ai/mcp-server");
    expect(copy).toContain("syra.pillars.earn");
    expect(copy).toContain("API Marketplace");
    expect(copy).toMatch(/• @syra-ai\/sdk:/);
  });

  it("includes code examples remapped as labeled Code blocks", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const copy = buildArticleXContent(sdk!);
    expect(copy).toContain("Code");
    expect(copy).toContain("npm install @syra-ai/sdk");
    expect(copy).toContain("createSyraPaidClient");
    expect(copy).toContain('syra.get("/v1/market/pulse"');
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
    const strategy = articleDetails.find(
      (a) => a.slug === "future-agentic-era-syra-positioning",
    );
    expect(strategy).toBeDefined();
    const copy = buildArticleXContent(strategy!);
    const blankLineBlocks = copy.split("\n\n").filter((b) => b.trim().length > 0);
    expect(blankLineBlocks.length).toBeGreaterThan(12);
  });

  it("never emits em dashes in source or generated copy", () => {
    for (const article of articleDetails) {
      expect(article.content).not.toContain("—");
      expect(article.title).not.toContain("—");
      expect(article.excerpt).not.toContain("—");
      expect(buildArticleXContent(article)).not.toContain("—");
      expect(buildArticleXHtml(article)).not.toContain("—");
    }
  });
});

describe("buildArticleXHtml", () => {
  it("emits only X-paste-supported tags and remaps unsupported ones", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const html = buildArticleXHtml(sdk!);

    // Supported
    expect(html).toContain("<h2>");
    expect(html).toContain("<h3>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<a href=");
    expect(html).toContain(sdk!.title);

    // Unsupported — must never appear
    expect(html).not.toContain("<h1>");
    expect(html).not.toContain("<table>");
    expect(html).not.toContain("<pre>");
    expect(html).not.toContain("<code>");
    expect(html).not.toContain("<hr");

    // Remaps
    expect(html).toContain("<em>Code</em>");
    expect(html).toContain("@syra-ai/sdk");
    expect(html).toContain('href="https://syraa.fun/playground"');
  });

  it("absolutizes relative links for X paste", () => {
    const access = articleDetails.find((a) => a.slug === "syra-access-x402-mpp");
    expect(access).toBeDefined();
    const html = buildArticleXHtml(access!);
    expect(html).toContain('href="https://www.syraa.fun/playground"');
    expect(html).not.toContain('href="/playground"');
  });

  it("labels callouts as italic prefixes inside blockquotes", () => {
    const sdk = articleDetails.find((a) => a.slug === "syra-sdk-guide");
    expect(sdk).toBeDefined();
    const html = buildArticleXHtml(sdk!);
    expect(html).toMatch(/<blockquote>[\s\S]*<em>Note:<\/em>/);
    expect(html).toMatch(/<blockquote>[\s\S]*<em>Tip:<\/em>/);
  });
});
