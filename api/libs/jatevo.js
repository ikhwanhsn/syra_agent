/**
 * Call Jatevo LLM API (OpenAI-compatible chat completions).
 * @param {Array<{ role: string; content: string }>} messages - Conversation messages (system can be first).
 * @param {{ max_tokens?: number; temperature?: number }} [options]
 * @returns {Promise<{ response: string; raw: object }>}
 */
export async function callJatevo(messages, options = {}) {
  const apiKey = process.env.JATEVO_API_KEY;
  if (!apiKey) {
    throw new Error("JATEVO_API_KEY is not set");
  }

  const response = await fetch("https://inference.jatevo.id/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages,
      stop: [],
      stream: false,
      top_p: 1,
      max_tokens: options.max_tokens ?? 2000,
      temperature: options.temperature ?? 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data?.error?.message || "Jatevo API error");
    err.status = response.status;
    err.raw = data;
    throw err;
  }

  return {
    response: data?.choices?.[0]?.message?.content || "No response",
    raw: data,
  };
}
