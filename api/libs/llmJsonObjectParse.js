/**
 * Extract a single JSON object from an LLM chat reply (plain, fenced, or embedded).
 * Tolerates common model failures: markdown fences, trailing commas, and length truncations.
 */

const OPENROUTER_TRUNCATION_NOTE_RE =
  /\n\n\[Response was cut off due to length limit\.[^\]]*\]\s*$/i;

/**
 * @param {string} s
 * @returns {string}
 */
function stripTruncationNote(s) {
  return s.replace(OPENROUTER_TRUNCATION_NOTE_RE, "").trim();
}

/**
 * @param {string} s
 * @returns {string}
 */
function stripTrailingCommas(s) {
  return s.replace(/,\s*([\]}])/g, "$1");
}

/**
 * Balance braces/brackets and close an unfinished string so truncated LLM JSON can parse.
 * Best-effort: may drop a partial trailing value.
 * @param {string} s
 * @returns {string}
 */
export function closeTruncatedJson(s) {
  let inString = false;
  let escape = false;
  /** @type {string[]} */
  const stack = [];
  let out = "";

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      out += c;
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }

    if (c === "{" || c === "[") {
      stack.push(c);
      out += c;
      continue;
    }

    if (c === "}" || c === "]") {
      const want = c === "}" ? "{" : "[";
      while (stack.length && stack[stack.length - 1] !== want) {
        const open = /** @type {string} */ (stack.pop());
        out += open === "{" ? "}" : "]";
      }
      if (stack.length && stack[stack.length - 1] === want) {
        stack.pop();
        out += c;
      }
      // else drop mismatched closer
      continue;
    }

    out += c;
  }

  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  out = out.replace(/,\s*"[^"]*"\s*:\s*(?:true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)?\s*$/, "");
  out = out.replace(/,\s*"[^"]*"\s*:\s*$/, "");
  out = out.replace(/,\s*"[^"]*"\s*$/, "");
  out = out.replace(/:\s*$/, ": null");
  out = stripTrailingCommas(out);

  // Re-scan after cleanup to append any still-open containers.
  inString = false;
  escape = false;
  stack.length = 0;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{" || c === "[") stack.push(c);
    else if (c === "}" || c === "]") {
      const want = c === "}" ? "{" : "[";
      if (stack.length && stack[stack.length - 1] === want) stack.pop();
    }
  }
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length) {
    const open = /** @type {string} */ (stack.pop());
    out += open === "{" ? "}" : "]";
  }
  return out;
}

/**
 * @param {string} s
 * @returns {unknown}
 */
function tryParseJson(s) {
  const trimmed = stripTruncationNote(s).trim();
  if (!trimmed) throw new Error("Empty model response");

  const attempts = [
    trimmed,
    stripTrailingCommas(trimmed),
    closeTruncatedJson(stripTrailingCommas(trimmed)),
  ];

  /** @type {Error | null} */
  let lastErr = null;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("Invalid JSON in model response");
}

/**
 * @param {string} text
 * @returns {unknown}
 */
export function parseJsonObjectFromLlm(text) {
  const raw = typeof text === "string" ? stripTruncationNote(text.trim()) : "";
  if (!raw) throw new Error("Empty model response");

  try {
    return tryParseJson(raw);
  } catch {
    /* continue */
  }

  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/m.exec(raw);
  if (fence?.[1]) {
    try {
      return tryParseJson(fence[1]);
    } catch {
      /* continue */
    }
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return tryParseJson(raw.slice(start, end + 1));
    } catch {
      /* try closing from the opening brace when the response was truncated mid-object */
    }
  }

  if (start >= 0) {
    return tryParseJson(raw.slice(start));
  }

  throw new Error("No JSON object found in model response");
}
