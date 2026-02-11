import { useState, useRef, useEffect, useImperativeHandle, forwardRef, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ChatInputHandle {
  focus: () => void;
}

interface ModelOption {
  id: string;
  name: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** Model selector inside input (ChatGPT-style) */
  models?: ModelOption[];
  selectedModelId?: string;
  onSelectModel?: (modelId: string) => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  {
    onSend,
    isLoading = false,
    onStop,
    placeholder = "Message Syra Agent...",
    models = [],
    selectedModelId = "",
    onSelectModel,
  },
  ref
) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Shorter placeholder for mobile to prevent truncation
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const displayPlaceholder = isMobile ? "Type a message..." : placeholder;

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
  }), []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full min-w-0 border-t border-border bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0)] shrink-0 safe-area-bottom">
      <div className="w-full min-w-0 max-w-4xl mx-auto px-3 py-2.5 sm:px-4 sm:py-4">
        <div className="relative flex items-end gap-2 p-2.5 sm:p-2.5 rounded-xl sm:rounded-2xl border border-border bg-card shadow-soft transition-shadow focus-within:shadow-medium focus-within:border-primary/30 min-h-[56px] sm:min-h-[48px] min-w-0">
          {/* Text Input – main area, prioritized on mobile */}
          <textarea
            ref={textareaRef}
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            rows={1}
            className={cn(
              "flex-1 min-w-[100px] sm:min-w-[140px] min-h-[36px] sm:min-h-[28px] resize-none bg-transparent text-foreground placeholder:text-muted-foreground",
              "focus:outline-none py-2 sm:py-2.5 px-2.5 sm:px-3 text-base sm:text-base max-h-[140px] sm:max-h-[200px] scrollbar-thin",
              "placeholder:text-sm sm:placeholder:text-base"
            )}
            disabled={isLoading}
            aria-label="Message input"
          />

          {/* Model selector – hidden on very small screens, compact on larger mobile */}
          {models.length > 0 && onSelectModel && (
            <Select
              value={selectedModelId || (models[0]?.id ?? "")}
              onValueChange={onSelectModel}
              disabled={isLoading}
            >
              <SelectTrigger
                className="hidden sm:flex h-10 sm:h-9 w-auto min-w-[80px] sm:min-w-[110px] gap-1 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-medium focus:ring-2 focus:ring-ring focus:ring-offset-0 px-2 sm:px-3 [&>span]:truncate shrink-0 touch-manipulation min-h-[44px] sm:min-h-0"
                title={models.find((m) => m.id === (selectedModelId || models[0]?.id))?.name ?? "Choose model"}
              >
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent align="end" className="max-h-[70vh] overflow-y-auto">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {isLoading ? (
            <Button
              onClick={onStop}
              size="icon"
              className="shrink-0 h-10 w-10 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg bg-destructive hover:bg-destructive/90 touch-manipulation"
              aria-label="Stop generating"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!message.trim()}
              aria-label="Send message"
              className={cn(
                "shrink-0 h-10 w-10 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg transition-all touch-manipulation",
                message.trim()
                  ? "bg-primary hover:bg-primary/90 glow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
