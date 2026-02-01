import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Paperclip, Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  onStop,
  placeholder = "Message Syra Agent...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

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
    <div className="w-full sm:min-w-0 border-t border-border bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0)] shrink-0">
      <div className="w-full sm:min-w-0 max-w-4xl mx-auto px-2 py-2 sm:px-4 sm:py-4">
        <div className="relative flex items-end gap-1.5 sm:gap-2 p-2 rounded-xl sm:rounded-2xl border border-border bg-card shadow-soft transition-shadow focus-within:shadow-medium focus-within:border-primary/30 min-h-[44px] sm:min-h-0 sm:min-w-0">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl touch-manipulation"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "flex-1 min-w-0 resize-none bg-transparent text-foreground placeholder:text-muted-foreground",
              "focus:outline-none py-2 sm:py-2.5 text-sm sm:text-base max-h-[120px] sm:max-h-[200px] scrollbar-thin"
            )}
            disabled={isLoading}
            aria-label="Message input"
          />

          {/* Voice Input Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl touch-manipulation"
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Send / Stop Button */}
          {isLoading ? (
            <Button
              onClick={onStop}
              size="icon"
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-destructive hover:bg-destructive/90 touch-manipulation"
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
                "shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl transition-all touch-manipulation",
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
}
