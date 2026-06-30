import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { highlightCode, type SupportedLanguage } from "@/lib/shiki";

export interface CodeTab {
  label: string;
  language?: SupportedLanguage;
  code: string;
  plain?: boolean;
}

interface CodeBlockProps {
  code: string;
  language?: SupportedLanguage;
  filename?: string;
  showLineNumbers?: boolean;
  plain?: boolean;
  tabs?: CodeTab[];
}

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  showLineNumbers = false,
  plain = false,
  tabs,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  if (tabs && tabs.length > 0) {
    return (
      <Tabs defaultValue={tabs[0].label} className="my-4">
        <div className="code-block overflow-hidden rounded-lg">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-code-border bg-muted/30">
            <TabsList className="h-7 bg-transparent p-0 gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.label}
                  value={tab.label}
                  className="h-6 px-2.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {tabs.map((tab) => (
            <TabsContent key={tab.label} value={tab.label} className="mt-0">
              <CodeBlockInner
                code={tab.code}
                language={tab.language ?? "bash"}
                plain={tab.plain ?? true}
                showLineNumbers={showLineNumbers}
                theme={resolvedTheme}
                onCopy={async (text) => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                copied={copied}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    );
  }

  return (
    <div className="code-block overflow-hidden my-4 rounded-lg">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-code-border bg-muted/30 flex-wrap min-w-0">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-xs font-medium text-muted-foreground">{filename}</span>
          )}
          {!filename && language && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {language}
            </span>
          )}
        </div>
        <CopyButton
          onCopy={async () => {
            await navigator.clipboard.writeText(code.trim());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          copied={copied}
        />
      </div>
      <CodeBlockInner
        code={code}
        language={language}
        plain={plain}
        showLineNumbers={showLineNumbers}
        theme={resolvedTheme}
      />
    </div>
  );
}

function CopyButton({ onCopy, copied }: { onCopy: () => void; copied: boolean }) {
  return (
    <button
      onClick={onCopy}
      type="button"
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 -my-1 rounded min-touch"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-success" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function CodeBlockInner({
  code,
  language,
  plain,
  showLineNumbers,
  theme,
  onCopy,
  copied,
}: {
  code: string;
  language: SupportedLanguage;
  plain: boolean;
  showLineNumbers: boolean;
  theme?: string;
  onCopy?: (text: string) => void;
  copied?: boolean;
}) {
  const [html, setHtml] = useState<string>("");
  const trimmedCode = code.trim();
  const lines = trimmedCode.split("\n");

  useEffect(() => {
    if (plain) {
      setHtml("");
      return;
    }
    let cancelled = false;
    highlightCode(trimmedCode, language, theme === "light" ? "light" : "dark").then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [trimmedCode, language, plain, theme]);

  return (
    <div className="relative">
      {onCopy && (
        <div className="absolute top-2 right-2 z-10">
          <CopyButton onCopy={() => onCopy(trimmedCode)} copied={copied ?? false} />
        </div>
      )}
      <div className="overflow-x-auto overflow-x-auto-touch">
        {plain || !html ? (
          <pre className="p-3 sm:p-4 text-xs sm:text-sm leading-relaxed min-w-0">
            <code className="block whitespace-pre font-mono">
              {showLineNumbers
                ? lines.map((line, i) => (
                    <div key={i} className="table-row">
                      <span className="table-cell pr-4 text-muted-foreground/50 select-none text-right">
                        {i + 1}
                      </span>
                      <span className="table-cell whitespace-pre">{line}</span>
                    </div>
                  ))
                : trimmedCode}
            </code>
          </pre>
        ) : (
          <pre
            className={cn(
              "p-3 sm:p-4 text-xs sm:text-sm leading-relaxed min-w-0 shiki-code",
              "[&_.line]:table-row [&_.line]:whitespace-pre",
              showLineNumbers && "[&_.line]:before:content-[attr(data-line)] [&_.line]:before:table-cell [&_.line]:before:pr-4 [&_.line]:before:text-muted-foreground/50 [&_.line]:before:select-none [&_.line]:before:text-right"
            )}
          >
            <code className="font-mono" dangerouslySetInnerHTML={{ __html: html }} />
          </pre>
        )}
      </div>
    </div>
  );
}
