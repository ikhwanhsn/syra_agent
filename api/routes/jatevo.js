import express from "express";
import { callJatevo } from "../libs/jatevo.js";

export async function createJatevoRouter() {
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

      const result = await callJatevo(apiMessages);
      return res.json(result);
    } catch (error) {
      console.error("Jatevo error:", error);
      const status = error.status || 500;
      return res.status(status).json({
        error: error.message,
        ...(error.raw && { raw: error.raw }),
      });
    }
  });

  return router;
}
