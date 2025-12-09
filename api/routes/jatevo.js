import express from "express";

export async function createJatevoRouter() {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const response = await fetch(
        "https://inference.jatevo.id/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.JATEVO_API_KEY}`, // replace with your real key
          },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages: [
              {
                role: "user",
                content: req.body.message || "Hi",
              },
            ],
            stop: [],
            stream: false,
            top_p: 1,
            max_tokens: 1000,
            temperature: 1,
            presence_penalty: 0,
            frequency_penalty: 0,
          }),
        }
      );

      const data = await response.json();

      // return final AI response
      return res.json({
        response: data?.choices?.[0]?.message?.content || "No response",
        raw: data,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}
