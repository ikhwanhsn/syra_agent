import { useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { WalletNav } from "./WalletNav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, LoadingStepMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AgentSelector, Agent, defaultAgents } from "./AgentSelector";
import { EmptyState } from "./EmptyState";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
import { SystemPromptModal } from "./SystemPromptModal";

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
  /** When false, show connect-wallet prompt instead of chat; input is hidden */
  walletConnected?: boolean;
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
  walletConnected = true,
}: ChatAreaProps) {
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] sm:min-h-0">
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
          <AgentSelector
            agents={defaultAgents}
            selectedAgent={selectedAgent}
            onSelectAgent={onSelectAgent}
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <SystemPromptModal systemPrompt={systemPrompt} disabled />
          <WalletNav />
        </div>
      </header>

      {/* Messages or Connect Wallet */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {!walletConnected ? (
          <ConnectWalletPrompt
            variant="center"
            onConnectClick={() => setWalletModalVisible(true)}
          />
        ) : messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSendMessage} />
        ) : (
          <div className="divide-y divide-border/50">
            {messages.map((message, index) => {
              const isEmptyStreamingAssistant =
                message.role === "assistant" &&
                message.isStreaming &&
                !message.content?.trim();
              if (isEmptyStreamingAssistant) {
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
        )}
      </ScrollArea>

      {/* Input – only when wallet connected */}
      {walletConnected && (
        <ChatInput
          onSend={onSendMessage}
          isLoading={isLoading}
          onStop={onStopGeneration}
          placeholder={`Message ${selectedAgent.name}...`}
        />
      )}
    </div>
  );
}
