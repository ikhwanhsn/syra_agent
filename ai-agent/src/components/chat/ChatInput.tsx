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
  placeholder = "Message NexusAI...",
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
    <div className="border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-border bg-card shadow-soft transition-shadow focus-within:shadow-medium focus-within:border-primary/30">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground rounded-xl"
          >
            <Paperclip className="w-5 h-5" />
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
              "flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground",
              "focus:outline-none py-2.5 max-h-[200px] scrollbar-thin"
            )}
            disabled={isLoading}
          />

          {/* Voice Input Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-10 w-10 text-muted-foreground hover:text-foreground rounded-xl"
          >
            <Mic className="w-5 h-5" />
          </Button>

          {/* Send / Stop Button */}
          {isLoading ? (
            <Button
              onClick={onStop}
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl bg-destructive hover:bg-destructive/90"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!message.trim()}
              className={cn(
                "shrink-0 h-10 w-10 rounded-xl transition-all",
                message.trim()
                  ? "bg-primary hover:bg-primary/90 glow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[10px]">Enter</kbd>
            {" "}to send
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-secondary font-mono text-[10px]">Shift + Enter</kbd>
            {" "}for new line
          </span>
        </div>
      </div>
    </div>
  );
}
