/**
 * Translation service — detect language and normalize to English.
 */

const ENGLISH_PATTERN = /^[\x00-\x7F\u00C0-\u024F\s\d.,!?;:'"()-]+$/;

/**
 * @param {string} text
 * @returns {string}
 */
export function detectLanguage(text) {
  const sample = String(text || "").slice(0, 500).trim();
  if (!sample) return "unknown";
  if (ENGLISH_PATTERN.test(sample)) return "en";
  // TODO: integrate dedicated language detection API (e.g. Google Cloud Translate detect)
  return "non_en";
}

/**
 * @param {{ title: string; summary: string; language?: string }} input
 * @returns {Promise<{ title: string; summary: string; language: string; translated: boolean }>}
 */
export async function translateToEnglish(input) {
  const lang = input.language || detectLanguage(`${input.title} ${input.summary}`);
  if (lang === "en" || lang === "unknown") {
    return {
      title: input.title,
      summary: input.summary,
      language: lang === "unknown" ? "en" : "en",
      translated: false,
    };
  }

  // TODO: integrate translation provider (OpenRouter or dedicated API)
  return {
    title: input.title,
    summary: input.summary,
    language: lang,
    translated: false,
    // Mark as needing translation — pipeline continues with original text
  };
}

/**
 * @param {Array<{ title: string; summary: string; language?: string }>} articles
 */
export async function translateArticles(articles) {
  const results = [];
  for (const article of articles) {
    const translated = await translateToEnglish(article);
    results.push({ ...article, ...translated });
  }
  return results;
}
