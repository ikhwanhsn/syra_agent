"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LANG_LABELS: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  py: "Python",
  python: "Python",
  rs: "Rust",
  rust: "Rust",
  go: "Go",
  java: "Java",
  sol: "Solidity",
  solidity: "Solidity",
  json: "JSON",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
  md: "Markdown",
  markdown: "Markdown",
  html: "HTML",
  css: "CSS",
  plaintext: "Text",
  text: "Text",
};

const LANG_FILENAMES: Record<string, string> = {
  js: "script.js",
  javascript: "script.js",
  jsx: "component.jsx",
  ts: "module.ts",
  typescript: "module.ts",
  tsx: "component.tsx",
  py: "script.py",
  python: "script.py",
  rs: "main.rs",
  rust: "main.rs",
  go: "main.go",
  sol: "contract.sol",
  solidity: "contract.sol",
  json: "data.json",
  bash: "run.sh",
  sh: "run.sh",
  shell: "run.sh",
  sql: "query.sql",
  yaml: "config.yaml",
  yml: "config.yml",
};

function displayLang(lang: string): string {
  const key = lang.trim().toLowerCase();
  return LANG_LABELS[key] || (key ? key : "Code");
}

function displayFilename(lang: string): string {
  const key = lang.trim().toLowerCase();
  return LANG_FILENAMES[key] || (key ? `${key}` : "code");
}

export function AgentCodeBlock({
  code,
  language = "plaintext",
  isStreaming = false,
  className,
}: {
  code: string;
  language?: string;
  isStreaming?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lang = language.replace(/^language-/, "") || "plaintext";
  const isLongSingleLine = !code.includes("\n") && code.length > 40;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        "my-4 overflow-hidden rounded-xl border border-border/70 bg-background/30 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)] max-w-full min-w-0 ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/35 px-3 py-2 min-w-0 backdrop-blur-[2px] sm:px-4">
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/20 sm:inline"
            aria-hidden
          />
          <span className="truncate font-mono text-[11px] font-medium text-foreground/85">
            {displayFilename(lang)}
          </span>
          <span className="hidden truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
            {displayLang(lang)}
          </span>
          {isStreaming ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Streaming
              <span className="h-1 w-1 animate-thinking-glow rounded-full bg-primary" />
            </span>
          ) : null}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 min-h-[36px] shrink-0 gap-1.5 rounded-lg text-xs touch-manipulation hover:bg-background/60 sm:h-7 sm:min-h-0"
          onClick={() => void handleCopy()}
          title="Copy code"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5 sm:h-3 sm:w-3" aria-hidden />
          )}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre
        className={cn(
          "bg-[hsl(var(--message-agent)/0.65)] p-3 text-[13px] leading-relaxed text-foreground/95 sm:p-4 sm:text-sm min-w-0 max-w-full scrollbar-thin",
          isLongSingleLine
            ? "overflow-x-auto break-all whitespace-pre-wrap"
            : "overflow-x-auto whitespace-pre",
        )}
      >
        <code className={cn("font-mono", lang !== "plaintext" && `language-${lang}`)}>
          {code}
          {isStreaming ? (
            <span
              className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.1em] animate-pulse bg-primary/80 align-text-bottom"
              aria-hidden
            />
          ) : null}
        </code>
      </pre>
    </div>
  );
}
