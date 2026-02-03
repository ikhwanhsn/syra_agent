import { useRef, useEffect, useCallback, useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { WalletNav } from "./WalletNav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, LoadingStepMessage } from "./ChatMessage";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import type { Agent } from "./AgentSelector";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
import { ShareChatModal } from "./ShareChatModal";

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
  /** When false and sessionReady, show banner: connect wallet to use tools/realtime data */
  walletConnected?: boolean;
  /** Ref to focus the chat input (e.g. after new chat, after sending) */
  inputRef?: React.RefObject<ChatInputHandle | null>;
  /** Dark mode state and toggle for navbar */
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
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
}: ChatAreaProps) {
  const { setVisible: setWalletModalVisible } = useWalletModal();
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
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] sm:min-h-0 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className={(sidebarCollapsed ? "" : "lg:hidden ") + "h-9 w-9 shrink-0 touch-manipulation"}
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Show sidebar" : "Open menu"}
            aria-label={sidebarCollapsed ? "Show sidebar" : "Open menu"}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          {onToggleDarkMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onToggleDarkMode}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
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
            onConnectClick={() => setWalletModalVisible(true)}
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
          className="flex-1 min-h-0 min-w-0 overflow-auto overflow-x-hidden scrollbar-thin"
        >
          <div className="flex flex-col flex-1 min-w-0">
            <div className="divide-y divide-border/50 flex-1 min-w-0">
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
