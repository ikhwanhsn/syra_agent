import { useRef, useEffect, useCallback, useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { Button } from "@/components/ui/button";
import { WalletNav } from "./WalletNav";
import { AppTopNavLinks } from "./AppTopNavLinks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, LoadingStepMessage } from "./ChatMessage";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import type { Agent } from "./AgentSelector";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
/** Pixel threshold: if within this distance from bottom, consider "at bottom" for follow-scroll. */
const SCROLL_BOTTOM_THRESHOLD = 80;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUsage?: {
    name: string;
    status: "running" | "complete" | "error";
  };
  toolUsages?: Array<{ name: string; status: "running" | "complete" | "error" }>;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  /** Called when user clicks Regenerate on an assistant message; receives that message id */
  onRegenerate?: (assistantMessageId: string) => void;
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  /** Current system prompt (read-only in UI for now) */
  systemPrompt: string;
  onToggleSidebar: () => void;
  /** When true (desktop), show menu button to expand sidebar. When false, only show on small screens. */
  sidebarCollapsed?: boolean;
  /** When false, show connect-wallet prompt (session not ready). When true, show chat and input. */
  sessionReady?: boolean;
  /** When false, chat runs without a linked wallet (tools/history behavior per backend). */
  walletConnected?: boolean;
  /** Ref to focus the chat input (e.g. after new chat, after sending) */
  inputRef?: React.RefObject<ChatInputHandle | null>;
  /** Dark mode state and toggle for navbar */
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  /** User avatar URL for user messages */
  userAvatarUrl?: string | null;
  /** When user saves an edited user message in place: (messageId, newContent) => update */
  onUpdateUserMessage?: (messageId: string, content: string) => void;
}

export function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  selectedAgent,
  onSelectAgent,
  systemPrompt,
  onToggleSidebar,
  sidebarCollapsed = false,
  sessionReady = true,
  walletConnected = true,
  inputRef,
  isDarkMode = true,
  onToggleDarkMode,
  userAvatarUrl = null,
  onUpdateUserMessage,
}: ChatAreaProps) {
  const { openConnectModal } = useConnectModal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldFollowScroll, setShouldFollowScroll] = useState(true);
  const lastMessageCountRef = useRef(0);
  const lastMessageRoleRef = useRef<"user" | "assistant" | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const isAtBottom = useCallback((el: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_BOTTOM_THRESHOLD;
  }, []);

  // When user sends a message (new user message added), scroll to bottom so the new Q&A is in view and enable follow-scroll. When assistant streams, follow only if user hasn't scrolled up.
  useEffect(() => {
    if (messages.length === 0) {
      lastMessageCountRef.current = 0;
      lastMessageRoleRef.current = null;
      return;
    }
    const last = messages[messages.length - 1];
    const prevCount = lastMessageCountRef.current;
    const prevRole = lastMessageRoleRef.current;
    lastMessageCountRef.current = messages.length;
    lastMessageRoleRef.current = last.role;

    // User just sent: scroll to bottom and follow
    if (last.role === "user" && (messages.length > prevCount || prevRole !== "user")) {
      setShouldFollowScroll(true);
      scrollToBottom();
      return;
    }
    // Switched chat or first load with messages: start at bottom
    if (prevCount === 0 && messages.length > 0) {
      setShouldFollowScroll(true);
      scrollToBottom();
      return;
    }
    if (shouldFollowScroll) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, shouldFollowScroll]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setShouldFollowScroll(isAtBottom(scrollRef.current));
  }, [isAtBottom]);

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
      {/* Header — safe-area-top for notched devices, touch-friendly on mobile */}
      <header className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-2 sm:gap-4 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[56px] sm:min-h-[52px] shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={(sidebarCollapsed ? "" : "lg:hidden ") + "h-10 w-10 sm:h-9 sm:w-9 shrink-0 touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"}
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Show sidebar" : "Open menu"}
            aria-label={sidebarCollapsed ? "Show sidebar" : "Open menu"}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <AppTopNavLinks />
        </div>
        <div className="flex max-w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-2.5">
          {onToggleDarkMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-border/50 bg-muted/20 shadow-sm hover:bg-muted/35 sm:h-9 sm:min-h-0 sm:min-w-0 touch-manipulation"
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </Button>
          )}
          <WalletNav />
        </div>
      </header>

      {/* Messages or Connect Wallet (when session not ready) */}
      {!sessionReady ? (
        <ScrollArea className="flex-1 min-h-0 min-w-0">
          <ConnectWalletPrompt
            variant="center"
            onConnectClick={openConnectModal}
          />
        </ScrollArea>
      ) : messages.length === 0 ? (
        <ScrollArea className="flex-1 min-h-0 min-w-0">
          <EmptyState onSelectPrompt={onSendMessage} />
        </ScrollArea>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 min-w-0 overflow-auto overflow-x-hidden scrollbar-thin overscroll-behavior-contain"
        >
          <div className="flex flex-col flex-1 min-w-0 max-w-full">
            <div className="divide-y divide-border/50 flex-1 min-w-0 w-full">
              {messages.map((message) => {
                const isEmptyStreamingAssistant =
                  message.role === "assistant" &&
                  message.isStreaming &&
                  !message.content?.trim();
                if (isEmptyStreamingAssistant && walletConnected) {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
                  return (
                    <LoadingStepMessage
                      key={message.id}
                      lastUserMessage={lastUserMsg?.content}
                      agentName={selectedAgent.name}
                    />
                  );
                }
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    agentName={selectedAgent.name}
                    onRegenerate={onRegenerate}
                    isRegenerateDisabled={isLoading}
                    userAvatarUrl={userAvatarUrl}
                    onUpdateUserMessage={onUpdateUserMessage}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input – when session ready (chat allowed with or without wallet) */}
      {sessionReady && (
        <ChatInput
          ref={inputRef}
          onSend={onSendMessage}
          isLoading={isLoading}
          onStop={onStopGeneration}
          placeholder={`Message ${selectedAgent.name}...`}
        />
      )}
    </div>
  );
}
