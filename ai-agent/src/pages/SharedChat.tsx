import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { chatApi, type ApiChat, type ApiMessage } from "@/lib/chatApi";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, MessageSquare, Home, Loader2 } from "lucide-react";
import { defaultAgents } from "@/components/chat/AgentSelector";

function toMessage(m: {
  id: string;
  role: string;
  content: string;
  timestamp: string | Date;
  toolUsage?: { name: string; status: string };
}) {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: typeof m.timestamp === "string" ? new Date(m.timestamp) : m.timestamp,
    toolUsage: m.toolUsage as ApiMessage["toolUsage"],
  };
}

type SharedStatus = "loading" | "private" | "public" | "notfound" | "error";

interface SharedChatProps {
  preloadedStatus?: SharedStatus;
  preloadedChat?: ApiChat | null;
  preloadedErrorMessage?: string;
}

export default function SharedChat({
  preloadedStatus,
  preloadedChat,
  preloadedErrorMessage = "",
}: SharedChatProps = {}) {
  const { shareId } = useParams<{ shareId: string }>();
  const { anonymousId } = useAgentWallet();
  const [status, setStatus] = useState<SharedStatus>(preloadedStatus ?? "loading");
  const [chat, setChat] = useState<ApiChat | null>(preloadedChat ?? null);
  const [errorMessage, setErrorMessage] = useState<string>(preloadedErrorMessage);

  useEffect(() => {
    if (preloadedStatus !== undefined) {
      setStatus(preloadedStatus);
      setChat(preloadedChat ?? null);
      setErrorMessage(preloadedErrorMessage ?? "");
      return;
    }
    if (!shareId?.trim()) {
      setStatus("notfound");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    chatApi
      .getByShareId(shareId.trim(), anonymousId ?? undefined)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.chat) {
          setChat(result.chat);
          setStatus("public");
        } else if ("private" in result && result.private) {
          setStatus("private");
          setErrorMessage(result.message ?? result.error ?? "This chat is private.");
        } else if ("error" in result) {
          setStatus(result.error?.toLowerCase().includes("not found") ? "notfound" : "error");
          setErrorMessage(result.error ?? "Something went wrong.");
        } else {
          setStatus("notfound");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Failed to load this chat.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shareId, anonymousId, preloadedStatus, preloadedChat, preloadedErrorMessage]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    );
  }

  if (status === "private") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Subtle gradient mesh background */}
        <div
          className="fixed inset-0 pointer-events-none overflow-hidden"
          aria-hidden
        >
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/6 blur-[80px]" />
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md flex flex-col items-center text-center">
            {/* Lock icon with soft glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-2xl bg-muted/50 blur-xl scale-150" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-border/60 bg-card/80 shadow-xl backdrop-blur-sm">
                <Lock className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 tracking-tight">
              This chat is private
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm mb-8">
              {errorMessage}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button asChild variant="default" className="gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Back to Syra
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 border-border/60">
                <Link to="/">
                  <MessageSquare className="h-4 w-4" />
                  Start your own chat
                </Link>
              </Button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground/80">
              Only the owner can view this conversation. If you have the link, they may have set it to private.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "notfound" || status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {status === "notfound" ? "Chat not found" : "Something went wrong"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "notfound"
              ? "This link may be invalid or the chat may have been deleted."
              : errorMessage}
          </p>
          <Button asChild>
            <Link to="/">Go to Syra Agent</Link>
          </Button>
        </div>
      </div>
    );
  }

  // status === "public" – read-only shared chat
  const messages = (chat?.messages ?? []).map(toMessage);
  const agentName = defaultAgents[0]?.name ?? "Syra";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-card">
            <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              {chat?.title ?? "Shared chat"}
            </h1>
            <p className="text-xs text-muted-foreground">Read-only · Shared with you</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="default" size="sm" className="gap-1.5">
            <Link to="/">
              <MessageSquare className="h-4 w-4" />
              New Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Open in Syra</Link>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">This chat has no messages yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  agentName={agentName}
                  onRegenerate={undefined}
                  isRegenerateDisabled={true}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
