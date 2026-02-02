import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Bot, User, Copy, Check, RefreshCw, Wrench, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Context-specific step sequences — each tells a short "story" relevant to the user's question. */
const STEP_SEQUENCES: Record<string, string[]> = {
  news: [
    "Understanding your question...",
    "Finding relevant news and headlines...",
    "Checking sources and dates...",
    "Reading and summarizing...",
    "Preparing your answer...",
  ],
  search: [
    "Understanding what you're looking for...",
    "Searching across sources...",
    "Filtering relevant results...",
    "Organizing findings...",
    "Preparing your answer...",
  ],
  analysis: [
    "Understanding your question...",
    "Analyzing market data...",
    "Checking sentiment and signals...",
    "Gathering insights...",
    "Preparing your answer...",
  ],
  research: [
    "Understanding the topic...",
    "Running deep research...",
    "Checking reports and data...",
    "Synthesizing findings...",
    "Preparing your answer...",
  ],
  signals: [
    "Understanding your question...",
    "Checking trading signals and data...",
    "Analyzing price and charts...",
    "Gathering signal insights...",
    "Preparing your answer...",
  ],
  tokens: [
    "Understanding your question...",
    "Fetching token and market data...",
    "Analyzing metrics...",
    "Gathering insights...",
    "Preparing your answer...",
  ],
  default: [
    "Thinking about your question...",
    "Looking that up...",
    "Gathering information...",
    "Preparing your answer...",
  ],
};

/** Pick a step sequence that matches the user's message. */
function getStepsForMessage(userMessage: string | undefined): string[] {
  if (!userMessage || typeof userMessage !== "string")
    return STEP_SEQUENCES.default;
  const t = userMessage.trim().toLowerCase();
  if (/news|latest|headline|article|what'?s\s+happening/i.test(t)) return STEP_SEQUENCES.news;
  if (/search|find|x\s*search|twitter|look\s+up/i.test(t)) return STEP_SEQUENCES.search;
  if (/analyze|analysis|sentiment|market\s+overview/i.test(t)) return STEP_SEQUENCES.analysis;
  if (/research|deep\s*dive|report|explain\s+in\s+detail/i.test(t)) return STEP_SEQUENCES.research;
  if (/signal|trade|price|chart|trading/i.test(t)) return STEP_SEQUENCES.signals;
  if (/token|memecoin|dex|jupiter|pump|rug|bubble/i.test(t)) return STEP_SEQUENCES.tokens;
  return STEP_SEQUENCES.default;
}

export type ToolUsageItem = { name: string; status: "running" | "complete" | "error" };

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUsage?: ToolUsageItem;
  /** Optional: multiple tools used for this answer (future API support). */
  toolUsages?: ToolUsageItem[];
}

interface ChatMessageProps {
  message: Message;
  agentName?: string;
  agentAvatar?: string;
  onRegenerate?: (messageId: string) => void;
  /** When true, disable Regenerate (e.g. while another request is in progress) */
  isRegenerateDisabled?: boolean;
}

export function ChatMessage({ message, agentName = "Syra Agent", onRegenerate, isRegenerateDisabled }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markdownComponents: Components = {
    // Tables: scrollable container and styled cells
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-border max-w-full scrollbar-thin">
        <table className="w-full min-w-[280px] sm:min-w-[400px] border-collapse text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-secondary/60 border-b border-border" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => <tbody className="divide-y divide-border" {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => (
      <tr className="hover:bg-secondary/30 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-3 text-left font-semibold text-foreground align-top" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-3 text-muted-foreground align-top break-words min-w-0" {...props}>
        {children}
      </td>
    ),
    // Code: block with Copy button vs inline
    code: ({ node, className, children, ...props }) => {
      const code = String(children).replace(/\n$/, "");
      const hasLanguage = className?.startsWith("language-");
      const isBlock = hasLanguage || code.includes("\n");
      const lang = className?.replace("language-", "") ?? "plaintext";
      if (isBlock) {
        return (
          <div className="my-3 rounded-xl overflow-hidden border border-border max-w-full">
            <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 bg-secondary/50 border-b border-border min-w-0">
              <span className="text-xs font-medium text-muted-foreground truncate">{lang}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs shrink-0"
                onClick={() => navigator.clipboard.writeText(code)}
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </div>
            <pre className="p-3 sm:p-4 overflow-x-auto bg-secondary/30 text-xs sm:text-sm">
              <code className="font-mono text-foreground break-words">{children}</code>
            </pre>
          </div>
        );
      }
      return (
        <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-sm font-mono text-foreground" {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
    // Headings
    h1: ({ children, ...props }) => (
      <h1 className="mt-6 mb-2 text-lg sm:text-xl font-bold text-foreground break-words" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="mt-5 mb-2 text-base sm:text-lg font-semibold text-foreground break-words" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="mt-4 mb-2 text-sm sm:text-base font-semibold text-foreground break-words" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="mt-3 mb-1.5 text-sm font-semibold text-foreground" {...props}>{children}</h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="mt-3 mb-1 text-sm font-medium text-foreground" {...props}>{children}</h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="mt-2 mb-1 text-xs font-medium text-muted-foreground" {...props}>{children}</h6>
    ),
    // Lists
    ul: ({ children, ...props }) => (
      <ul className="my-2 ml-4 list-disc space-y-1 text-foreground" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-2 ml-4 list-decimal space-y-1 text-foreground" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="pl-1" {...props}>{children}</li>
    ),
    // Paragraphs and blockquote
    p: ({ children, ...props }) => (
      <p className="my-2 whitespace-pre-wrap text-foreground leading-relaxed" {...props}>{children}</p>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="my-2 border-l-4 border-primary/50 pl-4 italic text-muted-foreground" {...props}>
        {children}
      </blockquote>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    a: ({ href, children, ...props }) => (
      <a href={href} className="text-primary underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
  };

  return (
    <div
      className={cn(
        "group flex gap-3 sm:gap-4 px-3 py-4 sm:px-4 sm:py-6 animate-fade-in min-w-0",
        isUser ? "bg-transparent" : "bg-secondary/30"
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
          </div>
        ) : (
          <div className="relative">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center glow-sm">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            {message.isStreaming && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">
            {isUser ? "You" : agentName}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Tools used for this answer — section for assistant messages */}
        {!isUser && (message.toolUsage || (message.toolUsages && message.toolUsages.length > 0)) && (() => {
          const tools: ToolUsageItem[] = message.toolUsages?.length
            ? message.toolUsages
            : message.toolUsage
              ? [message.toolUsage]
              : [];
          if (tools.length === 0) return null;
          return (
            <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-border bg-muted/80">
                <Wrench className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {tools.length === 1 ? "Tool used for this answer" : "Tools used for this answer"}
                </span>
              </div>
              <ul className="divide-y divide-border/50">
                {tools.map((tool, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3",
                      tool.status === "error" && "bg-destructive/5"
                    )}
                  >
                    {tool.status === "running" ? (
                      <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
                    ) : tool.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    ) : (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground">{tool.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {tool.status === "running" ? "Running…" : tool.status === "error" ? "Error" : "Complete"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Message Content - auto-detects markdown (tables, code, headings, lists) and renders rich UI */}
        <div className="text-foreground leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-flex gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary typing-dot" />
            </span>
          )}
        </div>

        {/* Actions */}
        {!isUser && !message.isStreaming && (
          <div className="flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground touch-manipulation"
              onClick={() => onRegenerate?.(message.id)}
              disabled={!onRegenerate || isRegenerateDisabled}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 bg-secondary/30 animate-fade-in min-w-0">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full skeleton-shimmer shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-20 rounded skeleton-shimmer" />
          <div className="h-4 w-12 rounded skeleton-shimmer" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-4 w-4/5 rounded skeleton-shimmer" />
          <div className="h-4 w-3/5 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

/** Base delay per step (ms); fast cycle for snappy UX. */
const STEP_DURATION_MS = 900;
const STEP_DURATION_VARIATION_MS = 200;
const FADE_OUT_MS = 150;

/** Animated loading message: contextual steps, slower cycle, UI aligned with real ChatMessage for best UX. */
export function LoadingStepMessage({
  lastUserMessage,
  agentName = "Syra Agent",
}: { lastUserMessage?: string; agentName?: string } = {}) {
  const steps = getStepsForMessage(lastUserMessage);
  const [stepIndex, setStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;
    let nextTickTimeout: ReturnType<typeof setTimeout>;

    const runStep = () => {
      setStepIndex((i) => {
        const next = i + 1 >= steps.length ? i : i + 1;
        if (next <= i) return i;
        setIsVisible(false);
        hideTimeout = setTimeout(() => {
          setStepIndex(next);
          setIsVisible(true);
          const variation = (Math.random() - 0.5) * 2 * STEP_DURATION_VARIATION_MS;
          const delay = Math.max(STEP_DURATION_MS + variation, STEP_DURATION_MS - STEP_DURATION_VARIATION_MS);
          nextTickTimeout = setTimeout(runStep, delay);
        }, FADE_OUT_MS);
        return i;
      });
    };

    const variation = (Math.random() - 0.5) * 2 * STEP_DURATION_VARIATION_MS;
    const initialDelay = Math.max(STEP_DURATION_MS + variation, STEP_DURATION_MS - STEP_DURATION_VARIATION_MS);
    nextTickTimeout = setTimeout(runStep, initialDelay);

    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(nextTickTimeout);
    };
  }, [steps.length]);

  const label = steps[Math.min(stepIndex, steps.length - 1)];

  return (
    <div className="group flex gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-6 bg-secondary/30 animate-fade-in min-w-0">
      {/* Avatar — matches ChatMessage assistant: Bot icon */}
      <div className="flex-shrink-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center glow-sm">
          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
        {/* Header — agent name + "Thinking" so it matches real message layout */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{agentName}</span>
          <span className="text-xs text-muted-foreground">Thinking</span>
        </div>

        {/* Step text in a pill — dynamic text with blink */}
        <div
          className={cn(
            "inline-flex items-center px-4 py-2.5 rounded-xl loading-step-pill transition-all duration-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
        >
          <span className="text-sm text-foreground/90 animate-loading-blink">{label}</span>
        </div>
      </div>
    </div>
  );
}
