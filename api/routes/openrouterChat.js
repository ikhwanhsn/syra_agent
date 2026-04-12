import express from "express";
import { callOpenRouter } from "../libs/openrouter.js";

/**
 * Minimal OpenAI-style chat proxy: POST /openrouter with body { message } or { messages, systemPrompt }.
 * Uses server OPENROUTER_API_KEY (same stack as /agent/chat).
 */
export async function createOpenRouterChatRouter() {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const { message, messages: bodyMessages, systemPrompt } = req.body || {};
      let apiMessages;

      if (Array.isArray(bodyMessages) && bodyMessages.length > 0) {
        apiMessages = [...bodyMessages];
        if (systemPrompt && typeof systemPrompt === "string") {
          apiMessages.unshift({ role: "system", content: systemPrompt });
        }
      } else {
        apiMessages = [{ role: "user", content: message || "Hi" }];
      }

      const result = await callOpenRouter(apiMessages);
      return res.json(result);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({
        error: error.message,
        ...(error.raw && { raw: error.raw }),
      });
    }
  });

  return router;
}
