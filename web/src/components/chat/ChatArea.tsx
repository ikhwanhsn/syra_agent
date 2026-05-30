"use client";

import { useRef, useEffect, useCallback } from "react";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { ChatSidebarToggle } from "@/components/chat/ChatSidebarToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, LoadingStepMessage } from "./ChatMessage";
import { ChatInput, type ChatInputHandle } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import type { Agent } from "./AgentSelector";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
import type { AgentInlineUiPayload } from "@/lib/chatApi";
import {
  CHAT_CONTENT_INNER_CLASS,
  CHAT_MESSAGES_SCROLL_CLASS,
} from "@/lib/chatLayout";
import { cn } from "@/lib/utils";

const SCROLL_BOTTOM_THRESHOLD = 80;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUsage?: {
    name: string;
    status: "running" | "complete" | "error" | "skipped";
    costUsd?: number;
    included?: boolean;
  };
  toolUsages?: Array<{
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
  }>;
  inlineUi?: AgentInlineUiPayload;
  inlineUiDismissed?: boolean;
  swapActionsHidden?: boolean;
  swapInlineStatus?: "cancelled" | "submitted";
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  onRegenerate?: (assistantMessageId: string) => void;
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  systemPrompt: string;
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
  sessionReady?: boolean;
  walletConnected?: boolean;
  inputRef?: React.RefObject<ChatInputHandle | null>;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  userAvatarUrl?: string | null;
  userAvatarSeed?: string | null;
  onUpdateUserMessage?: (messageId: string, content: string) => void;
  onDismissPumpfunCreateForm?: (assistantMessageId: string) => void;
  onSubmitPumpfunCreateForm?: (payload: { assistantMessageId: string; prompt: string }) => void;
}

export function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  selectedAgent,
  sessionReady = true,
  walletConnected = true,
  onToggleSidebar,
  sidebarCollapsed = false,
  inputRef,
  userAvatarUrl = null,
  userAvatarSeed = null,
  onUpdateUserMessage,
  onDismissPumpfunCreateForm,
  onSubmitPumpfunCreateForm,
}: ChatAreaProps) {
  const { openConnectModal } = useConnectModal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldFollowScrollRef = useRef(true);
  const userScrolledAwayRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const lastMessageRoleRef = useRef<"user" | "assistant" | null>(null);

  const showSidebarToggle = sidebarCollapsed;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const isAtBottom = useCallback((el: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight <= SCROLL_BOTTOM_THRESHOLD;
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      lastMessageCountRef.current = 0;
      lastMessageRoleRef.current = null;
      userScrolledAwayRef.current = false;
      shouldFollowScrollRef.current = true;
      return;
    }
    const last = messages[messages.length - 1];
    const prevCount = lastMessageCountRef.current;
    const prevRole = lastMessageRoleRef.current;
    lastMessageCountRef.current = messages.length;
    lastMessageRoleRef.current = last.role;

    if (last.role === "user" && (messages.length > prevCount || prevRole !== "user")) {
      shouldFollowScrollRef.current = true;
      userScrolledAwayRef.current = false;
      scrollToBottom();
      return;
    }
    if (prevCount === 0 && messages.length > 0) {
      shouldFollowScrollRef.current = true;
      userScrolledAwayRef.current = false;
      scrollToBottom();
      return;
    }
    if (shouldFollowScrollRef.current && !userScrolledAwayRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const atBottom = isAtBottom(scrollRef.current);
    shouldFollowScrollRef.current = atBottom;
    userScrolledAwayRef.current = !atBottom;
  }, [isAtBottom]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        className={cn(
          "pointer-events-none absolute left-3 top-3 z-20 sm:left-4 sm:top-4",
          !showSidebarToggle && "lg:hidden",
        )}
      >
        <ChatSidebarToggle
          mode="expand"
          onClick={onToggleSidebar}
          className="pointer-events-auto"
        />
      </div>

      {!sessionReady ? (
        <ScrollArea className="min-h-0 flex-1 basis-0">
          <ConnectWalletPrompt variant="center" onConnectClick={openConnectModal} />
        </ScrollArea>
      ) : messages.length === 0 ? (
        <div className={CHAT_MESSAGES_SCROLL_CLASS}>
          <EmptyState agentName={selectedAgent.name} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={CHAT_MESSAGES_SCROLL_CLASS}
          aria-label="Chat messages"
        >
          <div
            className={cn(
              CHAT_CONTENT_INNER_CLASS,
              "flex flex-col gap-1.5 pb-4 pt-12 sm:gap-2 sm:pb-6 sm:pt-14",
            )}
          >
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
                  userAvatarSeed={userAvatarSeed}
                  onUpdateUserMessage={onUpdateUserMessage}
                  onDismissPumpfunCreateForm={onDismissPumpfunCreateForm}
                  onSubmitPumpfunCreateForm={onSubmitPumpfunCreateForm}
                />
              );
            })}
          </div>
        </div>
      )}

      {sessionReady && (
        <ChatInput
          ref={inputRef}
          onSend={onSendMessage}
          isLoading={isLoading}
          onStop={onStopGeneration}
          placeholder={`Message ${selectedAgent.name}…`}
          showExampleQuestions={messages.length === 0}
        />
      )}
    </div>
  );
}
