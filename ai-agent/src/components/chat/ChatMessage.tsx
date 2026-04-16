import { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Copy, Check, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PumpfunPriceChart } from "@/components/chat/PumpfunPriceChart";
import { PumpfunCreateCoinInlineForm } from "@/components/chat/PumpfunCreateCoinInlineForm";
import { PumpfunCreateCoinResultBar } from "@/components/chat/PumpfunCreateCoinResultBar";
import { AgentSwapInlineForm } from "@/components/chat/AgentSwapInlineForm";
import type { AgentInlineUiPayload } from "@/lib/chatApi";
import { injectSolscanLinksInMarkdown } from "@/lib/solanaExplorerMarkdown";

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

export type ToolUsageItem = {
  name: string;
  status: "running" | "complete" | "error" | "skipped";
  costUsd?: number;
  included?: boolean;
  chartMint?: string;
  chartCoinId?: string;
  chartSymbol?: string;
  chartName?: string;
  pumpfunCreateMint?: string;
  pumpfunCreateSignature?: string;
  pumpfunCreateSymbol?: string;
  pumpfunCreateName?: string;
};

export interface ChatMessageModel {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUsage?: ToolUsageItem;
  /** Optional: multiple tools used for this answer (future API support). */
  toolUsages?: ToolUsageItem[];
  inlineUi?: AgentInlineUiPayload;
  inlineUiDismissed?: boolean;
  swapActionsHidden?: boolean;
  swapInlineStatus?: "cancelled" | "submitted";
}

interface ChatMessageProps {
  message: ChatMessageModel;
  agentName?: string;
  agentAvatar?: string;
  onRegenerate?: (messageId: string) => void;
  /** When true, disable Regenerate (e.g. while another request is in progress) */
  isRegenerateDisabled?: boolean;
  /** User avatar URL for user messages */
  userAvatarUrl?: string | null;
  /** When user saves an edited user message: (messageId, newContent) => update in place */
  onUpdateUserMessage?: (messageId: string, content: string) => void;
  /** pump.fun launch form: dismiss without sending */
  onDismissPumpfunCreateForm?: (assistantMessageId: string) => void;
  /** pump.fun launch form: submit structured follow-up user turn */
  onSubmitPumpfunCreateForm?: (payload: { assistantMessageId: string; prompt: string }) => void;
  /** Shared / read-only view: show form as static notice only */
  pumpfunCreateFormReadOnly?: boolean;
}

/** Generate a cute, unique avatar for user messages */
function getUserAvatar(messageId: string) {
  // Generate a consistent color based on message ID hash
  const colors = [
    { gradient: "from-zinc-500 to-zinc-700", emoji: "✨" },
    { gradient: "from-neutral-400 to-neutral-600", emoji: "🌟" },
    { gradient: "from-stone-500 to-stone-700", emoji: "💫" },
    { gradient: "from-zinc-400 to-zinc-600", emoji: "⭐" },
    { gradient: "from-neutral-500 to-neutral-700", emoji: "🎯" },
    { gradient: "from-stone-400 to-stone-600", emoji: "🚀" },
    { gradient: "from-zinc-600 to-zinc-800", emoji: "💎" },
    { gradient: "from-neutral-600 to-neutral-800", emoji: "👑" },
  ];
  
  // Use message ID to generate consistent hash
  let hash = 0;
  for (let i = 0; i < messageId.length; i++) {
    hash = ((hash << 5) - hash) + messageId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return colors[Math.abs(hash) % colors.length];
}

export function ChatMessage({
  message,
  agentName = "Syra Agent",
  agentAvatar = "/logo.jpg",
  onRegenerate,
  isRegenerateDisabled,
  userAvatarUrl = null,
  onUpdateUserMessage,
  onDismissPumpfunCreateForm,
  onSubmitPumpfunCreateForm,
  pumpfunCreateFormReadOnly = false,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isUser = message.role === "user";
  // Use provided avatarUrl or fallback to generated avatar
  const userAvatar = useMemo(() => {
    if (userAvatarUrl) {
      return { avatarUrl: userAvatarUrl };
    }
    return getUserAvatar(message.id);
  }, [message.id, userAvatarUrl]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEditing = () => {
    setEditDraft(message.content);
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && isUser) {
      editTextareaRef.current?.focus();
      const len = message.content.length;
      editTextareaRef.current?.setSelectionRange(len, len);
    }
  }, [isEditing, isUser, message.content.length]);

  const saveEdit = () => {
    const trimmed = editDraft.trim();
    if (trimmed && onUpdateUserMessage) {
      onUpdateUserMessage(message.id, trimmed);
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditDraft("");
  };

  const markdownComponents: Components = {
    // Tables: scrollable container and styled cells
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-border max-w-full scrollbar-thin -mx-1 sm:mx-0">
        <table className="w-full min-w-[240px] sm:min-w-[400px] border-collapse text-sm" {...props}>
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
      // Detect very long single-line strings (like transaction signatures)
      const isLongSingleLine = !code.includes("\n") && code.length > 40;
      if (isBlock) {
        return (
          <div className="my-3 rounded-xl overflow-hidden border border-border max-w-full min-w-0">
            <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 bg-secondary/50 border-b border-border min-w-0">
              <span className="text-xs font-medium text-muted-foreground truncate min-w-0">{lang}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-7 gap-1.5 text-xs shrink-0 min-h-[36px] sm:min-h-0 touch-manipulation"
                onClick={() => navigator.clipboard.writeText(code)}
                title="Copy code"
                aria-label="Copy code"
              >
                <Copy className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
            <pre className={cn(
              "p-3 sm:p-4 bg-secondary/30 text-xs sm:text-sm min-w-0 max-w-full scrollbar-thin",
              // For long single-line strings (like signatures): wrap on all screens
              // For multi-line code blocks: allow horizontal scroll
              isLongSingleLine 
                ? "overflow-x-auto break-all whitespace-pre-wrap" 
                : "overflow-x-auto whitespace-pre"
            )}
            style={isLongSingleLine ? { wordBreak: 'break-all', overflowWrap: 'anywhere' } : undefined}
            >
              <code 
                className="font-mono text-foreground break-all min-w-0" 
                style={isLongSingleLine ? { wordBreak: 'break-all', overflowWrap: 'anywhere' } : undefined}
              >
                {children}
              </code>
            </pre>
          </div>
        );
      }
      const inlineCode = String(children);
      const isLongInline = inlineCode.length > 30 && !inlineCode.includes(' ');
      return (
        <code 
          className="rounded bg-secondary/60 px-1.5 py-0.5 text-sm font-mono text-foreground break-all" 
          style={isLongInline ? { wordBreak: 'break-all', overflowWrap: 'anywhere' } : undefined}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => <>{children}</>,
    // Headings
    h1: ({ children, ...props }) => (
      <h1
        className="mt-6 break-words text-balance text-xl font-semibold tracking-tight text-foreground first:mt-0 sm:mt-7 sm:text-2xl"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="mt-6 break-words border-b border-border/50 pb-2 text-lg font-semibold tracking-tight text-foreground first:mt-0 sm:mt-7 sm:text-xl"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="mt-6 break-words text-base font-semibold tracking-tight text-foreground first:mt-0 sm:text-lg" {...props}>
        {children}
      </h3>
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
      <ul
        className="my-4 ml-5 list-disc space-y-2.5 pl-0.5 text-[15px] leading-relaxed text-foreground/95 marker:text-primary/40 sm:text-base"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="my-4 ml-5 list-decimal space-y-2.5 pl-0.5 text-[15px] leading-relaxed text-foreground/95 marker:font-medium marker:text-muted-foreground/70 sm:text-base"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="min-w-0 break-words pl-1" {...props}>
        {children}
      </li>
    ),
    // Paragraphs and blockquote — wrap long strings like signatures
    p: ({ children, ...props }) => {
      const text = typeof children === 'string' ? children : String(children);
      const hasLongString = text.length > 50 && !text.includes(' ');
      return (
        <p
          className="my-3 min-w-0 max-w-full whitespace-pre-wrap break-words text-[15px] leading-[1.65] text-foreground/95 sm:text-base"
          style={hasLongString ? { wordBreak: "break-all", overflowWrap: "anywhere" } : undefined}
          {...props}
        >
          {children}
        </p>
      );
    },
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-5 max-w-full rounded-r-xl border-l-2 border-primary/30 bg-muted/20 py-3 pl-4 pr-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base"
        {...props}
      >
        {children}
      </blockquote>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    a: ({ href, children, ...props }) => (
      <a
        href={href}
        className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    hr: () => (
      <hr className="my-8 h-px border-0 bg-gradient-to-r from-transparent via-border/80 to-transparent" />
    ),
  };

  const toolItems = useMemo((): ToolUsageItem[] => {
    if (isUser) return [];
    if (message.toolUsages?.length) return message.toolUsages;
    if (message.toolUsage) return [message.toolUsage];
    return [];
  }, [isUser, message.toolUsages, message.toolUsage]);

  const pumpChartFromTools = useMemo(() => {
    const hit = toolItems.find(
      (t) =>
        t.status === "complete" &&
        ((typeof t.chartMint === "string" && t.chartMint.trim().length > 0) ||
          (typeof t.chartCoinId === "string" && t.chartCoinId.trim().length > 0)),
    );
    if (!hit) return null;
    const chartTitle = hit.chartSymbol?.trim() || hit.chartName?.trim() || undefined;
    if (hit.chartMint?.trim()) {
      return { kind: "mint" as const, mint: hit.chartMint.trim(), title: chartTitle };
    }
    if (hit.chartCoinId?.trim()) {
      return { kind: "coinId" as const, coinId: hit.chartCoinId.trim(), title: chartTitle };
    }
    return null;
  }, [toolItems]);

  const pumpfunCreateResult = useMemo(() => {
    const hit = toolItems.find(
      (t) =>
        t.status === "complete" &&
        typeof t.pumpfunCreateMint === "string" &&
        t.pumpfunCreateMint.trim().length > 0,
    );
    if (!hit) return null;
    const mint = hit.pumpfunCreateMint!.trim();
    const signature =
      typeof hit.pumpfunCreateSignature === "string" && hit.pumpfunCreateSignature.trim().length > 0
        ? hit.pumpfunCreateSignature.trim()
        : undefined;
    const tokenSymbol =
      typeof hit.pumpfunCreateSymbol === "string" && hit.pumpfunCreateSymbol.trim().length > 0
        ? hit.pumpfunCreateSymbol.trim()
        : undefined;
    const tokenName =
      typeof hit.pumpfunCreateName === "string" && hit.pumpfunCreateName.trim().length > 0
        ? hit.pumpfunCreateName.trim()
        : undefined;
    return { mint, signature, tokenSymbol, tokenName };
  }, [toolItems]);

  const contentWithSolscanLinks = useMemo(
    () => injectSolscanLinksInMarkdown(message.content || ""),
    [message.content],
  );

  return (
    <div
      className={cn(
        "group flex min-w-0 max-w-full animate-fade-in",
        isUser
          ? "gap-3 overflow-x-hidden overflow-y-visible bg-transparent px-3 py-2 sm:gap-4 sm:px-4 sm:py-3"
          : "items-start gap-3 overflow-hidden py-1.5 sm:gap-4 sm:py-2",
      )}
    >
      <div className={cn("flex-shrink-0", !isUser && "pt-1 sm:pt-1.5")}>
        {isUser ? (
          userAvatar.avatarUrl ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card shadow-md ring-2 ring-background/50 sm:h-8 sm:w-8">
              <img
                src={userAvatar.avatarUrl}
                alt="You"
                className="h-full w-full object-cover"
                key={userAvatar.avatarUrl}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md ring-2 ring-background/50 sm:h-8 sm:w-8",
                `bg-gradient-to-br ${userAvatar.gradient}`,
              )}
            >
              <span className="select-none text-base leading-none">{userAvatar.emoji}</span>
            </div>
          )
        ) : (
          <div className="relative">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card shadow-md ring-1 ring-border/60 ring-offset-2 ring-offset-background sm:h-9 sm:w-9">
              <img src={agentAvatar} alt={agentName} className="h-full w-full object-cover" />
            </div>
            {message.isStreaming && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            )}
          </div>
        )}
      </div>

      {isUser ? (
        <div className="min-w-0 flex-1 space-y-1.5 overflow-x-hidden">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="shrink-0 text-sm font-medium text-foreground">You</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="min-w-0 break-words leading-relaxed text-foreground">
            {isEditing ? (
              <div className="space-y-2">
                <div className="rounded-lg bg-border p-px">
                  <Textarea
                    ref={editTextareaRef}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        saveEdit();
                      }
                      if (e.key === "Escape") cancelEdit();
                    }}
                    rows={3}
                    className="min-h-[72px] resize-y rounded-[calc(0.5rem-1px)] border-0 bg-background shadow-none ring-offset-0 focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset focus-visible:ring-offset-0"
                    placeholder="Your message..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={saveEdit}
                    disabled={!editDraft.trim()}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="my-0 min-w-0 max-w-full break-words text-[15px] leading-relaxed text-foreground [&_p]:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {contentWithSolscanLinks}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-wrap items-center gap-2 pt-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 min-h-[44px] gap-1.5 touch-manipulation text-muted-foreground hover:text-foreground sm:h-8 sm:min-h-0"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              {onUpdateUserMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 min-h-[44px] gap-1.5 touch-manipulation text-muted-foreground hover:text-foreground sm:h-8 sm:min-h-0"
                  onClick={startEditing}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="min-w-0 flex-1 pr-1 sm:pr-2">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/45 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_56px_-28px_rgba(0,0,0,0.72)] backdrop-blur-xl dark:bg-gradient-to-b dark:from-card/90 dark:via-card/50 dark:to-card/25">
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.045] to-transparent" />
            <div className="relative space-y-3 px-4 py-4 sm:space-y-3 sm:px-6 sm:py-5">
              <div className="flex min-w-0 flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b border-border/40 pb-3">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">
                    {agentName}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground/90">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {!message.isStreaming && pumpChartFromTools && (
                <PumpfunPriceChart
                  {...(pumpChartFromTools.kind === "mint"
                    ? { mint: pumpChartFromTools.mint }
                    : { coinId: pumpChartFromTools.coinId })}
                  title={pumpChartFromTools.title}
                />
              )}

              <div className="w-full min-w-0 max-w-none break-words text-foreground text-pretty">
                {(message.content?.trim() || message.isStreaming) && (
                  <div className="min-w-0 w-full max-w-full overflow-x-auto overflow-y-visible break-words [&>*:first-child]:mt-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {contentWithSolscanLinks}
                    </ReactMarkdown>
                  </div>
                )}
                {message.isStreaming && (
                  <span className="ml-1 inline-flex gap-1">
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                )}
                {!message.isStreaming &&
                  message.inlineUi?.type === "pumpfun-create-coin" &&
                  !message.inlineUiDismissed &&
                  (pumpfunCreateFormReadOnly || (onDismissPumpfunCreateForm && onSubmitPumpfunCreateForm) ? (
                    <PumpfunCreateCoinInlineForm
                      assistantMessageId={message.id}
                      readOnly={pumpfunCreateFormReadOnly}
                      onCreate={onSubmitPumpfunCreateForm ?? (() => {})}
                      onCancel={onDismissPumpfunCreateForm ?? (() => {})}
                    />
                  ) : null)}
                {!message.isStreaming &&
                  (message.inlineUi?.type === "jupiter-swap" || message.inlineUi?.type === "pumpfun-swap") &&
                  !message.inlineUiDismissed &&
                  (pumpfunCreateFormReadOnly || (onDismissPumpfunCreateForm && onSubmitPumpfunCreateForm) ? (
                    <AgentSwapInlineForm
                      mode={message.inlineUi.type === "pumpfun-swap" ? "pumpfun" : "jupiter"}
                      inlineUi={message.inlineUi}
                      assistantMessageId={message.id}
                      readOnly={pumpfunCreateFormReadOnly}
                      actionsHidden={!!message.swapActionsHidden}
                      swapInlineStatus={message.swapInlineStatus}
                      onSwap={onSubmitPumpfunCreateForm ?? (() => {})}
                      onCancel={onDismissPumpfunCreateForm ?? (() => {})}
                    />
                  ) : null)}
                {!message.isStreaming && pumpfunCreateResult ? (
                  <PumpfunCreateCoinResultBar
                    mint={pumpfunCreateResult.mint}
                    signature={pumpfunCreateResult.signature}
                    tokenSymbol={pumpfunCreateResult.tokenSymbol}
                    tokenName={pumpfunCreateResult.tokenName}
                    className="mt-4"
                  />
                ) : null}
              </div>

              {!message.isStreaming && (
                <div className="flex flex-wrap items-center gap-1 border-t border-border/40 pt-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 min-h-[44px] gap-1.5 touch-manipulation rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-8 sm:min-h-0"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 min-h-[44px] gap-1.5 touch-manipulation rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-8 sm:min-h-0"
                    onClick={() => onRegenerate?.(message.id)}
                    disabled={!onRegenerate || isRegenerateDisabled}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div className="flex min-w-0 animate-fade-in items-start gap-3 py-1.5 sm:gap-4 sm:py-2">
      <div className="h-9 w-9 shrink-0 rounded-full skeleton-shimmer ring-1 ring-border/40 ring-offset-2 ring-offset-background sm:h-9 sm:w-9" />
      <div className="min-w-0 flex-1 pr-1 sm:pr-2">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-4 sm:p-5">
          <div className="mb-4 flex gap-2 border-b border-border/40 pb-3">
            <div className="h-4 w-28 rounded-md skeleton-shimmer" />
            <div className="h-4 w-12 rounded-md skeleton-shimmer" />
          </div>
          <div className="space-y-2.5">
            <div className="h-4 w-full rounded-md skeleton-shimmer" />
            <div className="h-4 w-[92%] rounded-md skeleton-shimmer" />
            <div className="h-4 w-[78%] rounded-md skeleton-shimmer" />
          </div>
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
    <div className="group flex min-w-0 animate-fade-in items-start gap-3 py-1.5 sm:gap-4 sm:py-2">
      <div className="flex-shrink-0 pt-1 sm:pt-1.5">
        <div className="loader-avatar-pulse relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-card shadow-md ring-1 ring-border/60 ring-offset-2 ring-offset-background sm:h-9 sm:w-9">
          <img src="/logo.jpg" alt={agentName} className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="min-w-0 flex-1 pr-1 sm:pr-2">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/45 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_24px_56px_-28px_rgba(0,0,0,0.72)] backdrop-blur-xl dark:bg-gradient-to-b dark:from-card/90 dark:via-card/50 dark:to-card/25">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.045] to-transparent" />
          <div className="relative space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border/40 pb-3">
              <span className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base">{agentName}</span>
              <span className="text-xs font-medium text-primary/80">Thinking</span>
            </div>
            <div
              className={cn(
                "loading-step-pill inline-flex max-w-full items-center rounded-xl px-4 py-3 transition-all duration-200",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
              )}
            >
              <span className="animate-loading-blink text-sm leading-snug text-foreground/90">{label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
