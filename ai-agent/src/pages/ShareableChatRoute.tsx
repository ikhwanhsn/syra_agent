import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { chatApi, type ApiChat } from "@/lib/chatApi";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import Index from "./Index";
import SharedChat from "./SharedChat";
import { Loader2 } from "lucide-react";

type Status = "loading" | "owner" | "shared" | "private" | "notfound" | "error";

export default function ShareableChatRoute() {
  const { shareId } = useParams<{ shareId: string }>();
  const location = useLocation();
  const { ready, anonymousId } = useAgentWallet();
  const [status, setStatus] = useState<Status>("loading");
  const [chat, setChat] = useState<ApiChat | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // If Index passed state when navigating here (owner opened from /), use it and skip fetch
  const stateChat = (location.state as { fromOwner?: boolean; chat?: ApiChat } | null)?.chat;
  const fromOwner = (location.state as { fromOwner?: boolean } | null)?.fromOwner;

  useEffect(() => {
    if (!shareId?.trim()) {
      setStatus("notfound");
      return;
    }
    const sid = shareId.trim();

    if (fromOwner && stateChat && stateChat.id) {
      setChat(stateChat);
      setStatus("owner");
      return;
    }

    // Wait for session to be ready so we have anonymousId for owner check (fixes refresh: owner gets their chat back)
    if (!ready) {
      setStatus("loading");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    chatApi
      .getByShareId(sid, anonymousId ?? undefined)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.chat) {
          setChat(result.chat);
          setStatus(result.isOwner ? "owner" : "shared");
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
  }, [shareId, ready, anonymousId, fromOwner, stateChat?.id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "owner" && chat) {
    return (
      <Index
        initialChatId={chat.id}
        initialChat={chat}
      />
    );
  }

  if (status === "shared" || status === "private" || status === "notfound" || status === "error") {
    return (
      <SharedChat
        preloadedStatus={status === "shared" ? "public" : status}
        preloadedChat={status === "shared" ? chat ?? undefined : undefined}
        preloadedErrorMessage={errorMessage}
      />
    );
  }

  return null;
}
