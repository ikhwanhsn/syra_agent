import { useRef, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, SkeletonMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AgentSelector, Agent, defaultAgents } from "./AgentSelector";
import { SystemPromptModal } from "./SystemPromptModal";
import { EmptyState } from "./EmptyState";

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
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onToggleSidebar: () => void;
}

export function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onStopGeneration,
  selectedAgent,
  onSelectAgent,
  systemPrompt,
  onSystemPromptChange,
  onToggleSidebar,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10"
            onClick={onToggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <AgentSelector
            agents={defaultAgents}
            selectedAgent={selectedAgent}
            onSelectAgent={onSelectAgent}
          />
        </div>
        <SystemPromptModal
          systemPrompt={systemPrompt}
          onSave={onSystemPromptChange}
        />
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSendMessage} />
        ) : (
          <div className="divide-y divide-border/50">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                agentName={selectedAgent.name}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <SkeletonMessage />
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={onSendMessage}
        isLoading={isLoading}
        onStop={onStopGeneration}
        placeholder={`Message ${selectedAgent.name}...`}
      />
    </div>
  );
}
