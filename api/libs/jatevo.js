/**
 * Call Jatevo LLM API (OpenAI-compatible chat completions).
 * When the model hits max_tokens, the API returns finish_reason "length" and the reply is truncated.
 * @param {Array<{ role: string; content: string }>} messages - Conversation messages (system can be first).
 * @param {{ max_tokens?: number; temperature?: number }} [options]
 * @returns {Promise<{ response: string; raw: object; truncated: boolean; finishReason: string | null }>}
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
      model: "glm-4.7",
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

  const choice = data?.choices?.[0];
  const content = choice?.message?.content || "No response";
  const finishReason = choice?.finish_reason;
  const truncated = finishReason === "length";

  return {
    response: truncated
      ? `${content}\n\n[Response was cut off due to length limit. You can ask for more or rephrase.]`
      : content,
    raw: data,
    truncated,
    finishReason: finishReason ?? null,
  };
}
