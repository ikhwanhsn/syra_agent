import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlogCodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function BlogCodeBlock({ code, language = "plaintext", className }: BlogCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("blog-code-block group my-8 overflow-hidden rounded-2xl", className)}>
      <div className="blog-code-header flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
            <span className="blog-code-dot blog-code-dot-red" />
            <span className="blog-code-dot blog-code-dot-yellow" />
            <span className="blog-code-dot blog-code-dot-green" />
          </div>
          <span className="truncate font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {language}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="blog-code-pre overflow-x-auto px-4 py-5 sm:px-5">
        <code className="font-mono text-[13px] leading-relaxed text-foreground/95 sm:text-sm">
          {code}
        </code>
      </pre>
    </div>
  );
}
