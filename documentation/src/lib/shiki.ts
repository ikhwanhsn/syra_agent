import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/langs/bash.mjs";
import json from "shiki/langs/json.mjs";
import javascript from "shiki/langs/javascript.mjs";
import python from "shiki/langs/python.mjs";
import typescript from "shiki/langs/typescript.mjs";
import githubDark from "shiki/themes/github-dark.mjs";
import githubLight from "shiki/themes/github-light.mjs";

export type SupportedLanguage = "typescript" | "javascript" | "bash" | "json" | "python" | "text";

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [githubDark, githubLight],
      langs: [typescript, javascript, bash, json, python],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  language: SupportedLanguage,
  theme: "dark" | "light"
): Promise<string> {
  const highlighter = await getHighlighter();
  const lang = language === "text" ? "plaintext" : language;
  const themeName = theme === "light" ? "github-light" : "github-dark";

  try {
    return highlighter.codeToHtml(code, { lang, theme: themeName });
  } catch {
    return highlighter.codeToHtml(code, { lang: "plaintext", theme: themeName });
  }
}
