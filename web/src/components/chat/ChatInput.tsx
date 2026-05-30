import { useState, useRef, useEffect, useImperativeHandle, forwardRef, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExampleQuestionsBar } from "@/components/chat/ExampleQuestionsBar";
import { CHAT_CONTENT_INNER_CLASS } from "@/lib/chatLayout";
import { cn } from "@/lib/utils";

export interface ChatInputHandle {
  focus: () => void;
  /** Set the input value (e.g. when editing a user question). */
  setValue: (value: string) => void;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  /** Shown above the input on empty chats; hidden once the user sends a message. */
  showExampleQuestions?: boolean;
}

const SINGLE_LINE_MAX_PX = 44;

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  {
    onSend,
    isLoading = false,
    onStop,
    placeholder = "Message Syra Agent...",
    showExampleQuestions = false,
  },
  ref,
) {
  const [message, setMessage] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setValue: (value: string) => {
        setMessage(value);
        textareaRef.current?.focus();
      },
    }),
    [],
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 200);
    el.style.height = `${nextHeight}px`;
    setIsMultiline(nextHeight > SINGLE_LINE_MAX_PX);
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

  const canSend = message.trim().length > 0;

  return (
    <div className="relative z-10 shrink-0 bg-gradient-to-t from-background via-background/98 to-background/90 pb-[max(0.75rem,env(safe-area-inset-bottom,0))] pt-3 backdrop-blur-xl">
      <div className={cn(CHAT_CONTENT_INNER_CLASS, "px-3 sm:px-4")}>
        {showExampleQuestions && (
          <ExampleQuestionsBar onSelect={onSend} disabled={isLoading} />
        )}
        <div
          className={cn(
            "relative flex min-h-[52px] w-full gap-1.5 overflow-hidden rounded-[1.35rem]",
            "border border-border/60 bg-card/80 p-1.5 pl-3.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)]",
            "ring-1 ring-inset ring-white/[0.04] backdrop-blur-xl backdrop-saturate-150",
            "transition-[border-color,box-shadow,background-color] duration-200",
            "focus-within:border-border focus-within:bg-card/95 focus-within:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.4)]",
            "focus-within:ring-white/[0.06] dark:focus-within:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]",
            isMultiline ? "items-end" : "items-center",
          )}
        >
          <textarea
            ref={textareaRef}
            autoFocus
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "min-h-[36px] max-h-[200px] min-w-0 flex-1 resize-none border-0 bg-transparent py-2",
              "text-[15px] leading-[1.45] text-foreground shadow-none scrollbar-thin",
              "placeholder:text-[15px] placeholder:text-muted-foreground/65",
              "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              isMultiline ? "pb-1.5" : "py-2.5",
            )}
            disabled={isLoading}
            aria-label="Message input"
          />

          <div
            className={cn(
              "flex shrink-0 items-center justify-center",
              isMultiline ? "pb-0.5" : "self-center",
            )}
          >
            {isLoading ? (
              <Button
                type="button"
                onClick={onStop}
                size="icon"
                variant="destructive"
                className="h-9 w-9 shrink-0 rounded-full touch-manipulation sm:h-9 sm:w-9"
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSend}
                size="icon"
                disabled={!canSend}
                aria-label="Send message"
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-0 touch-manipulation",
                  "transition-all duration-200 ease-out",
                  canSend
                    ? "bg-primary text-primary-foreground shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.55)] hover:bg-primary/90 hover:shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.5)]"
                    : "bg-muted/50 text-muted-foreground/50 hover:bg-muted/50",
                )}
              >
                <Send
                  className="h-[17px] w-[17px] shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
