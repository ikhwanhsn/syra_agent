/**
 * Extract a single JSON object from an LLM chat reply (plain, fenced, or embedded).
 * @param {string} text
 * @returns {unknown}
 */
export function parseJsonObjectFromLlm(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (!raw) throw new Error("Empty model response");

  const tryParse = (s) => JSON.parse(s.trim());

  try {
    return tryParse(raw);
  } catch {
    /* continue */
  }

  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(raw);
  if (fence?.[1]) {
    return tryParse(fence[1]);
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return tryParse(raw.slice(start, end + 1));
  }

  throw new Error("No JSON object found in model response");
}
