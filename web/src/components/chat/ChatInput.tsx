import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  KeyboardEvent,
} from "react";
import { AtSign, Mic, MicOff, Send, Slash, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExampleQuestionsBar } from "@/components/chat/ExampleQuestionsBar";
import { CHAT_CONTENT_INNER_CLASS } from "@/lib/chatLayout";
import { cn } from "@/lib/utils";
import { chatApi, type AgentLlmModel } from "@/lib/chatApi";
import { SWAP_PRESET_TOKENS } from "@/lib/swapPresets";

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
  selectedModelId?: string | null;
  onSelectModel?: (modelId: string | null) => void;
}

const SINGLE_LINE_MAX_PX = 44;

const SLASH_COMMANDS = [
  { id: "news", label: "/news", hint: "Latest crypto headlines", prompt: "Latest crypto news" },
  { id: "signal", label: "/signal", hint: "BTC trading signal", prompt: "Give me a Bitcoin trading signal" },
  { id: "sentiment", label: "/sentiment", hint: "Market sentiment", prompt: "What is current crypto market sentiment?" },
  { id: "research", label: "/research", hint: "Research SOL", prompt: "Research SOL" },
  { id: "swap", label: "/swap", hint: "Open a swap", prompt: "Swap tokens" },
  { id: "price", label: "/price", hint: "SOL price", prompt: "SOL price" },
] as const;

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  {
    onSend,
    isLoading = false,
    onStop,
    placeholder = "Message Syra Agent...",
    showExampleQuestions = false,
    selectedModelId = null,
    onSelectModel,
  },
  ref,
) {
  const [message, setMessage] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [models, setModels] = useState<AgentLlmModel[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const speechSupported = getSpeechRecognition() != null;

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

  useEffect(() => {
    if (!onSelectModel) {
      setModels([]);
      return;
    }
    let cancelled = false;
    chatApi
      .getModels()
      .then(({ models: list }) => {
        if (!cancelled) setModels(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [onSelectModel]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const slashQuery = message.startsWith("/") ? message.slice(1).split(/\s/)[0].toLowerCase() : "";
  const slashMatches = message.startsWith("/")
    ? SLASH_COMMANDS.filter(
        (c) =>
          c.label.slice(1).startsWith(slashQuery) ||
          c.hint.toLowerCase().includes(slashQuery),
      )
    : [];

  const atMatch = /(^|\s)@([a-zA-Z0-9]*)$/.exec(message);
  const mentionQuery = atMatch?.[2]?.toLowerCase() ?? "";
  const mentionMatches = atMatch
    ? SWAP_PRESET_TOKENS.filter((t) => t.label.toLowerCase().includes(mentionQuery))
    : [];

  useEffect(() => {
    setSlashOpen(slashMatches.length > 0 && !message.includes(" "));
    setSlashIndex(0);
  }, [message, slashMatches.length]);

  useEffect(() => {
    setMentionOpen(mentionMatches.length > 0);
    setMentionIndex(0);
  }, [message, mentionMatches.length]);

  const applySlash = (prompt: string) => {
    setMessage("");
    setSlashOpen(false);
    onSend(prompt);
  };

  const applyMention = (label: string) => {
    const next = message.replace(/(^|\s)@[a-zA-Z0-9]*$/, `$1$${label} `);
    setMessage(next);
    setMentionOpen(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      const cmd = SLASH_COMMANDS.find(
        (c) => message.trim().toLowerCase() === c.label,
      );
      onSend(cmd ? cmd.prompt : message.trim());
      setMessage("");
      setSlashOpen(false);
      setMentionOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen && slashMatches.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % slashMatches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySlash(slashMatches[slashIndex]?.prompt ?? slashMatches[0].prompt);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashOpen(false);
        return;
      }
    }
    if (mentionOpen && mentionMatches.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionMatches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyMention(mentionMatches[mentionIndex]?.label ?? mentionMatches[0].label);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDictation = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setMessage((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const canSend = message.trim().length > 0;
  const selectedModel = models.find((m) => m.id === selectedModelId);

  return (
    <div className="relative z-10 shrink-0 bg-gradient-to-t from-background via-background/98 to-background/90 pb-[max(0.75rem,env(safe-area-inset-bottom,0))] pt-3 backdrop-blur-xl">
      <div className={cn(CHAT_CONTENT_INNER_CLASS, "px-3 sm:px-4")}>
        {showExampleQuestions && (
          <ExampleQuestionsBar onSelect={onSend} disabled={isLoading} />
        )}
        <div className="relative">
          {slashOpen && slashMatches.length > 0 ? (
            <ul
              className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
              role="listbox"
              aria-label="Commands"
            >
              {slashMatches.map((cmd, i) => (
                <li key={cmd.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === slashIndex}
                    className={cn(
                      "flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm touch-manipulation",
                      i === slashIndex ? "bg-muted" : "hover:bg-muted/50",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySlash(cmd.prompt)}
                  >
                    <span className="font-mono text-foreground">{cmd.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{cmd.hint}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {mentionOpen && mentionMatches.length > 0 ? (
            <ul
              className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
              role="listbox"
              aria-label="Token mentions"
            >
              {mentionMatches.map((tok, i) => (
                <li key={tok.mint}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === mentionIndex}
                    className={cn(
                      "flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm touch-manipulation",
                      i === mentionIndex ? "bg-muted" : "hover:bg-muted/50",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyMention(tok.label)}
                  >
                    <AtSign className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                    <span className="font-medium">{tok.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div
            className={cn(
              "relative flex min-h-[52px] w-full flex-col overflow-hidden rounded-[1.35rem]",
              "border border-border/60 bg-card/80 p-1.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)]",
              "ring-1 ring-inset ring-white/[0.04] backdrop-blur-xl backdrop-saturate-150",
              "transition-[border-color,box-shadow,background-color] duration-200",
              "focus-within:border-border focus-within:bg-card/95 focus-within:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.4)]",
              "focus-within:ring-white/[0.06] dark:focus-within:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]",
            )}
          >
            <div
              className={cn(
                "flex w-full gap-1.5 pl-2",
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
                  "flex shrink-0 items-center justify-center gap-0.5",
                  isMultiline ? "pb-0.5" : "self-center",
                )}
              >
                {speechSupported ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-full touch-manipulation",
                      listening && "bg-destructive/15 text-destructive",
                    )}
                    aria-label={listening ? "Stop dictation" : "Start dictation"}
                    aria-pressed={listening}
                    onClick={toggleDictation}
                    disabled={isLoading}
                  >
                    {listening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
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
            <div className="flex flex-wrap items-center gap-1 px-2 pb-1 pt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <Slash className="h-3 w-3" aria-hidden />
                commands
                <AtSign className="h-3 w-3" aria-hidden />
                tokens
              </span>
              {onSelectModel && models.length > 0 ? (
                <label className="ml-auto inline-flex min-h-[36px] items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="sr-only">Model</span>
                  <select
                    className="max-w-[11rem] truncate rounded-md border-0 bg-transparent py-1 text-[11px] text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedModelId ?? ""}
                    onChange={(e) => onSelectModel(e.target.value || null)}
                    aria-label="Language model"
                    disabled={isLoading}
                  >
                    <option value="">Default model</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  {selectedModel?.contextWindow ? (
                    <span className="hidden tabular-nums sm:inline">
                      {selectedModel.contextWindow}
                    </span>
                  ) : null}
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
