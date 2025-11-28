import express from "express";
import { requirePayment } from "../utils/x402Payment.js";

export async function createTestRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.0001",
      description: "News information service - GET latest news articles",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      inputSchema: {
        queryParams: {
          category: {
            type: "string",
            required: false,
            description: "News category filter",
            enum: [
              "technology",
              "business",
              "sports",
              "entertainment",
              "world",
            ],
          },
          limit: {
            type: "number",
            required: false,
            description: "Number of articles to return (default: 10)",
          },
          offset: {
            type: "number",
            required: false,
            description: "Pagination offset (default: 0)",
          },
        },
      },
      outputSchema: {
        articles: {
          type: "array",
          description: "List of news articles",
          properties: {
            id: { type: "string", description: "Article ID" },
            title: { type: "string", description: "Article title" },
            description: { type: "string", description: "Article summary" },
            content: { type: "string", description: "Full article content" },
            author: { type: "string", description: "Article author" },
            url: { type: "string", description: "Article URL" },
            imageUrl: { type: "string", description: "Featured image URL" },
            publishedAt: {
              type: "string",
              description: "Publication timestamp",
            },
            category: { type: "string", description: "Article category" },
          },
        },
        total: { type: "number", description: "Total articles available" },
        limit: { type: "number", description: "Items per page" },
        offset: { type: "number", description: "Current offset" },
      },
    }),
    (req, res) => {
      const category = req.query.category;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      // Your news fetching logic here
      const articles = [
        {
          id: "1",
          title: "Breaking Tech News",
          description: "Latest developments in technology",
          content: "Full article content here...",
          author: "Tech Reporter",
          url: "https://example.com/news/1",
          imageUrl: "https://example.com/images/tech.jpg",
          publishedAt: new Date().toISOString(),
          category: category || "technology",
        },
        {
          id: "2",
          title: "Business Update",
          description: "Market movements today",
          content: "Full article content here...",
          author: "Business Editor",
          url: "https://example.com/news/2",
          imageUrl: "https://example.com/images/business.jpg",
          publishedAt: new Date().toISOString(),
          category: category || "business",
        },
      ];

      res.json({
        articles: articles.slice(offset, offset + limit),
        total: articles.length,
        limit: limit,
        offset: offset,
      });
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/search",
    requirePayment({
      price: "0.0002",
      description: "Advanced news search with filters",
      method: "POST",
      discoverable: true,
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: true,
            description: "Search query",
          },
          categories: {
            type: "array",
            required: false,
            description: "Filter by multiple categories",
          },
          dateFrom: {
            type: "string",
            required: false,
            description: "Start date (ISO 8601 format)",
          },
          dateTo: {
            type: "string",
            required: false,
            description: "End date (ISO 8601 format)",
          },
          sortBy: {
            type: "string",
            required: false,
            description: "Sort field",
            enum: ["relevance", "publishedAt", "popularity"],
          },
          limit: {
            type: "number",
            required: false,
            description: "Number of results (default: 10)",
          },
        },
      },
      outputSchema: {
        results: {
          type: "array",
          description: "Search results",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            url: { type: "string" },
            publishedAt: { type: "string" },
            relevanceScore: { type: "number" },
          },
        },
        total: { type: "number" },
        query: { type: "string" },
      },
    }),
    (req, res) => {
      const {
        query,
        categories,
        dateFrom,
        dateTo,
        sortBy,
        limit = 10,
      } = req.body;

      // Your search logic here
      const results = [
        {
          id: "1",
          title: `Result for: ${query}`,
          description: "Matching article description",
          url: "https://example.com/article/1",
          publishedAt: new Date().toISOString(),
          relevanceScore: 0.95,
        },
      ];

      res.json({
        results: results.slice(0, limit),
        total: results.length,
        query: query,
      });
    }
  );

  return router;
}
