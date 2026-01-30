import { useState } from "react";
import { Bot, User, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

interface ChatMessageProps {
  message: Message;
  agentName?: string;
  agentAvatar?: string;
}

export function ChatMessage({ message, agentName = "NexusAI" }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const language = lines[0] || "plaintext";
        const code = lines.slice(1).join("\n");
        
        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-xs font-medium text-muted-foreground">{language}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => navigator.clipboard.writeText(code)}
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </div>
            <pre className="p-4 overflow-x-auto bg-secondary/30">
              <code className="text-sm font-mono text-foreground">{code}</code>
            </pre>
          </div>
        );
      }
      
      // Format inline elements
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part.split(/(\*\*.*?\*\*)/g).map((segment, i) => {
            if (segment.startsWith("**") && segment.endsWith("**")) {
              return <strong key={i} className="font-semibold">{segment.slice(2, -2)}</strong>;
            }
            return segment;
          })}
        </span>
      );
    });
  };

  return (
    <div
      className={cn(
        "group flex gap-4 px-4 py-6 animate-fade-in",
        isUser ? "bg-transparent" : "bg-secondary/30"
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <User className="w-4 h-4 text-foreground" />
          </div>
        ) : (
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center glow-sm">
              <Bot className="w-4 h-4 text-primary-foreground" />
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

        {/* Tool Usage Indicator */}
        {message.toolUsage && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 w-fit">
            {message.toolUsage.status === "running" ? (
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm text-foreground">
              {message.toolUsage.status === "running" ? "Using" : "Used"}{" "}
              <span className="font-medium text-primary">{message.toolUsage.name}</span>
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="text-foreground leading-relaxed">
          {formatContent(message.content)}
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
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
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
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
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
    <div className="flex gap-4 px-4 py-6 bg-secondary/30 animate-fade-in">
      <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      <div className="flex-1 space-y-3">
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
