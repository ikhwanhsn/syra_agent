import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import type { ChatInputHandle } from "@/components/chat/ChatInput";
import { Agent, defaultAgents } from "@/components/chat/AgentSelector";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { chatApi, getApiBaseUrl } from "@/lib/chatApi";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

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

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  messages: Message[];
  shareId?: string | null;
  isPublic?: boolean;
}

function toMessage(m: { id: string; role: string; content: string; timestamp: string | Date; toolUsage?: { name: string; status: string } }): Message {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: typeof m.timestamp === "string" ? new Date(m.timestamp) : m.timestamp,
    toolUsage: m.toolUsage as Message["toolUsage"],
  };
}

/** In-memory-only chat id when user is not connected (history not saved). */
const LOCAL_CHAT_ID = "local";

function isLocalChat(id: string) {
  return id === LOCAL_CHAT_ID;
}

export interface IndexInitialChat {
  id: string;
  title: string;
  preview: string;
  shareId?: string | null;
  isPublic?: boolean;
  timestamp?: string | Date;
  messages?: Array<{ id: string; role: string; content: string; timestamp: string | Date; toolUsage?: unknown }>;
}

interface IndexProps {
  initialChatId?: string;
  initialChat?: IndexInitialChat;
}

export default function Index({ initialChatId, initialChat }: IndexProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ready, anonymousId, connectedWalletAddress, refetchBalance, reportDebit } = useAgentWallet();
  const walletConnected = !!connectedWalletAddress;
  /** Can chat (anonymous or wallet session); when false, show connect-wallet gate. When true but !walletConnected, prompt to connect for tools. */
  const sessionReady = ready && !!anonymousId;
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const chatInputRefDesktop = useRef<ChatInputHandle>(null);
  const chatInputRefMobile = useRef<ChatInputHandle>(null);
  const [chats, setChats] = useState<Chat[]>([]);

  const focusChatInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
        (isDesktop ? chatInputRefDesktop : chatInputRefMobile).current?.focus();
      });
    });
  }, []);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(defaultAgents[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const [apiConnectionError, setApiConnectionError] = useState<string | null>(null);

  // When wallet changes (anonymousId changes), clear chat state so we show the correct wallet's history.
  // Skip when restoring from /c/:shareId (initialChatId) so refresh on a chat link keeps that chat.
  const prevAnonymousIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!anonymousId) return;
    if (initialChatId) return; // restoring from share link, don't clear
    if (prevAnonymousIdRef.current === anonymousId) return; // same user, only skip clear on first mount
    prevAnonymousIdRef.current = anonymousId;
    setChats([]);
    setActiveChat(null);
    setChatMessages({});
  }, [anonymousId, initialChatId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const loadChats = useCallback(async () => {
    if (!anonymousId) return;
    setChatsLoading(true);
    setApiConnectionError(null);
    try {
      const { chats: list } = await chatApi.list(anonymousId);
      setChats(
        list.map((c) => ({
          id: c.id,
          title: c.title,
          preview: c.preview,
          timestamp: typeof c.timestamp === "string" ? new Date(c.timestamp) : new Date(c.timestamp),
          messages: [],
          shareId: c.shareId ?? null,
          isPublic: !!c.isPublic,
        }))
      );
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("Load failed"));
      if (isNetworkError) {
        setApiConnectionError(
          `Cannot connect to the API at ${getApiBaseUrl()}. Make sure the server is running.`
        );
      }
    } finally {
      setChatsLoading(false);
    }
  }, [anonymousId]);

  // Load chat list from server only when wallet is connected (history is saved). When not connected, use local-only chat.
  // When restoring from /c/:shareId we already have the chat; still load list so sidebar is full, but initial effect will set activeChat.
  useEffect(() => {
    if (ready && anonymousId && walletConnected) {
      loadChats();
    }
  }, [ready, anonymousId, walletConnected, loadChats]);

  // When session is ready but wallet not connected: use a single in-memory chat (history not saved).
  // Skip when restoring from /c/:shareId so we don't overwrite the restored chat with a new one.
  useEffect(() => {
    if (initialChatId) return;
    if (sessionReady && !walletConnected) {
      const localChat: Chat = {
        id: LOCAL_CHAT_ID,
        title: "Current conversation",
        timestamp: new Date(),
        preview: "",
        messages: [],
        shareId: null,
        isPublic: false,
      };
      setChats([localChat]);
      setActiveChat(LOCAL_CHAT_ID);
      setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: prev[LOCAL_CHAT_ID] ?? [] }));
    }
  }, [sessionReady, walletConnected, initialChatId]);

  const loadChatMessages = useCallback(async (id: string) => {
    if (!anonymousId) return;
    try {
      const chat = await chatApi.get(id, anonymousId);
      const msgs = (chat.messages || []).map(toMessage);
      setChatMessages((prev) => ({ ...prev, [id]: msgs }));
      setChats((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, shareId: chat.shareId ?? null, isPublic: !!chat.isPublic } : c
        )
      );
    } catch (err) {
      // Silently fail; messages may load on retry
    }
  }, [anonymousId]);

  useEffect(() => {
    if (activeChat && !isLocalChat(activeChat) && chatMessages[activeChat] === undefined) {
      loadChatMessages(activeChat);
    }
  }, [activeChat, chatMessages, loadChatMessages]);

  const currentChat = chats.find((c) => c.id === activeChat);
  const messages = activeChat ? (chatMessages[activeChat] ?? []) : [];

  const shareIdFromQuery = searchParams.get("shareId");

  // Apply initial chat when opened as owner from /c/:shareId
  const initialAppliedRef = useRef(false);
  useEffect(() => {
    if (!initialChatId || !initialChat || initialAppliedRef.current) return;
    initialAppliedRef.current = true;
    const ts =
      typeof initialChat.timestamp === "string"
        ? new Date(initialChat.timestamp)
        : initialChat.timestamp
          ? new Date(initialChat.timestamp)
          : new Date();
    const chatEntry: Chat = {
      id: initialChat.id,
      title: initialChat.title,
      preview: initialChat.preview,
      timestamp: ts,
      messages: [],
      shareId: initialChat.shareId ?? null,
      isPublic: !!initialChat.isPublic,
    };
    setChats((prev) => {
      const exists = prev.some((c) => c.id === initialChatId);
      if (exists) return prev.map((c) => (c.id === initialChatId ? chatEntry : c));
      return [chatEntry, ...prev];
    });
    const msgs = (initialChat.messages || []).map(toMessage);
    setChatMessages((prev) => ({ ...prev, [initialChatId]: msgs }));
    setActiveChat(initialChatId);
    setChatsLoading(false);
  }, [initialChatId, initialChat]);

  // When no chat or only local chat is selected, ensure URL is / (e.g. after deleting all chats).
  // Use window.location.pathname because we may have set URL via replaceState, so React Router still thinks we're at "/".
  useEffect(() => {
    if (activeChat !== null && !isLocalChat(activeChat)) return;
    const pathname = typeof window !== "undefined" ? window.location.pathname : location.pathname;
    if (pathname === "/" || !pathname.startsWith("/c/")) return;
    navigate("/", { replace: true });
  }, [activeChat, location.pathname, navigate]);

  // Update browser URL to current chat share link only after history exists (avoids blink: we use replaceState so we stay on same route and don't remount).
  useEffect(() => {
    if (!activeChat || isLocalChat(activeChat) || isLoading) return;
    const chat = chats.find((c) => c.id === activeChat);
    if (!chat?.shareId) return;
    const messages = chatMessages[activeChat] ?? [];
    // Only update URL after chat has at least user + assistant (history created); avoids link change before first response.
    if (messages.length < 2) return;
    const state = {
      fromOwner: true,
      chat: {
        id: chat.id,
        title: chat.title,
        preview: chat.preview,
        shareId: chat.shareId,
        isPublic: chat.isPublic,
        timestamp: chat.timestamp,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          toolUsage: m.toolUsage,
        })),
      },
    };
    window.history.replaceState(state, "", `/c/${chat.shareId}`);
  }, [activeChat, chats, chatMessages, isLoading]);

  // Owner opened /?shareId=xyz — load that chat and clear query
  useEffect(() => {
    if (!shareIdFromQuery?.trim() || !anonymousId || !ready) return;
    const sid = shareIdFromQuery.trim();
    let cancelled = false;
    chatApi.getByShareId(sid, anonymousId).then((result) => {
      if (cancelled) return;
      if (result.success && result.isOwner && result.chat) {
        const chat = result.chat;
        const chatId = chat.id;
        setChats((prev) => {
          const exists = prev.some((c) => c.id === chatId);
          if (exists) return prev.map((c) => (c.id === chatId ? { ...c, shareId: chat.shareId ?? null, isPublic: !!chat.isPublic } : c));
          return [
            {
              id: chatId,
              title: chat.title,
              preview: chat.preview,
              timestamp: typeof chat.timestamp === "string" ? new Date(chat.timestamp) : new Date(chat.timestamp),
              messages: [],
              shareId: chat.shareId ?? null,
              isPublic: !!chat.isPublic,
            },
            ...prev,
          ];
        });
        const msgs = (chat.messages || []).map(toMessage);
        setChatMessages((prev) => ({ ...prev, [chatId]: msgs }));
        setActiveChat(chatId);
        navigate(`/c/${chat.shareId ?? sid}`, {
          replace: true,
          state: { fromOwner: true, chat },
        });
      } else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("shareId");
          return next;
        }, { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shareIdFromQuery, anonymousId, ready, setSearchParams, navigate]);

  const handleNewChat = async () => {
    if (!anonymousId) return;
    if (!walletConnected) {
      setActiveChat(LOCAL_CHAT_ID);
      setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: [] }));
      setSidebarOpen(false);
      focusChatInput();
      return;
    }
    try {
      const { chat } = await chatApi.create(anonymousId, { title: "New Chat", preview: "" });
      const newChat: Chat = {
        id: chat.id,
        title: chat.title,
        timestamp: new Date(chat.timestamp),
        preview: chat.preview,
        messages: [],
        shareId: chat.shareId ?? null,
        isPublic: !!chat.isPublic,
      };
      setChats((prev) => [newChat, ...prev]);
      setChatMessages((prev) => ({ ...prev, [chat.id]: [] }));
      setActiveChat(chat.id);
      setSidebarOpen(false);
      focusChatInput();
    } catch (err) {
      // Silently fail; user can retry
    }
  };

  const handleDeleteChat = useCallback(async (id: string) => {
    if (isLocalChat(id)) {
      setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: [] }));
      setSidebarOpen(false);
      return;
    }
    if (!anonymousId) return;
    try {
      await chatApi.delete(id, anonymousId);
      const remaining = chats.filter((c) => c.id !== id);
      setChats(remaining);
      setChatMessages((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (activeChat === id) {
        setActiveChat(remaining[0]?.id ?? null);
      }
      setSidebarOpen(false);
    } catch (err) {
      // Silently fail; user can retry
    }
  }, [anonymousId, activeChat, chats]);

  const handleDeleteChats = useCallback(
    async (ids: string[]) => {
      const localIds = ids.filter((id) => isLocalChat(id));
      const remoteIds = ids.filter((id) => !isLocalChat(id));
      if (localIds.length > 0) {
        setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: [] }));
      }
      if (remoteIds.length > 0 && anonymousId) {
        try {
          await Promise.all(remoteIds.map((id) => chatApi.delete(id, anonymousId)));
        } catch {
          // Silently fail; user can retry
        }
      }
      const idSet = new Set(ids);
      const remaining = chats.filter((c) => !idSet.has(c.id));
      setChats(remaining);
      setChatMessages((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      if (activeChat && idSet.has(activeChat)) {
        setActiveChat(remaining[0]?.id ?? null);
      }
      setSidebarOpen(false);
    },
    [anonymousId, activeChat, chats]
  );

  const handleRenameChat = useCallback(async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    if (isLocalChat(id)) {
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );
      return;
    }
    if (!anonymousId) return;
    try {
      await chatApi.update(id, anonymousId, { title: trimmed });
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );
    } catch (err) {
      // Silently fail; user can retry
    }
  }, [anonymousId]);

  const handleToggleShareVisibility = useCallback(
    async (chatId: string, isPublic: boolean) => {
      if (isLocalChat(chatId) || !anonymousId) return;
      try {
        await chatApi.update(chatId, anonymousId, { isPublic });
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, isPublic } : c))
        );
      } catch (err) {
        // Silently fail; user can retry
      }
    },
    [anonymousId]
  );

  const handleSendMessage = async (content: string) => {
    if (!anonymousId) return;
    let chatId = activeChat;
    if (!walletConnected) {
      if (!chatId || !isLocalChat(chatId)) {
        chatId = LOCAL_CHAT_ID;
        setActiveChat(LOCAL_CHAT_ID);
        setChats((prev) =>
          prev.some((c) => c.id === LOCAL_CHAT_ID)
            ? prev
            : [{ id: LOCAL_CHAT_ID, title: "Current conversation", timestamp: new Date(), preview: "" }, ...prev]
        );
        setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: prev[LOCAL_CHAT_ID] ?? [] }));
      } else {
        chatId = LOCAL_CHAT_ID;
      }
    } else if (!chatId) {
      try {
        const { chat } = await chatApi.create(anonymousId, { title: "New Chat", preview: "" });
        chatId = chat.id;
        const newChat: Chat = {
          id: chat.id,
          title: chat.title,
          timestamp: new Date(chat.timestamp),
          preview: chat.preview,
          messages: [],
          shareId: chat.shareId ?? null,
          isPublic: !!chat.isPublic,
        };
        setChats((prev) => [newChat, ...prev]);
        setChatMessages((prev) => ({ ...prev, [chat.id]: [] }));
        setActiveChat(chat.id);
      } catch (err) {
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const prevMessages = chatMessages[chatId] ?? [];
    const nextMessages = [...prevMessages, userMessage];
    const isFirstMessage = prevMessages.length === 0;
    const newTitle = isFirstMessage ? content.slice(0, 30) : undefined;
    const newPreview = content.slice(0, 50);

    setChatMessages((prev) => ({ ...prev, [chatId!]: nextMessages }));
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, preview: newPreview, title: newTitle ?? c.title }
          : c
      )
    );

    // Persist title to DB only when wallet connected (history is saved)
    if (newTitle && anonymousId && walletConnected && !isLocalChat(chatId!)) {
      chatApi
        .update(chatId!, anonymousId, { title: newTitle, preview: newPreview })
        .catch(() => {});
    }

    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setChatMessages((prev) => ({
      ...prev,
      [chatId!]: [...nextMessages, assistantMessage],
    }));
    focusChatInput();

    const apiMessages = nextMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    try {
      const { response: responseText, amountChargedUsd } = await chatApi.completion({
        messages: apiMessages,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        anonymousId: anonymousId ?? undefined,
        walletConnected,
      });

      if (amountChargedUsd != null && amountChargedUsd > 0) {
        reportDebit(amountChargedUsd);
        refetchBalance();
      }

      let charIndex = 0;
      const chunkSize = 24;
      const streamInterval = setInterval(() => {
        charIndex += chunkSize;
        if (charIndex >= responseText.length) {
          clearInterval(streamInterval);
          const finalMessages: Message[] = [
            ...nextMessages,
            { ...assistantMessage, content: responseText, isStreaming: false },
          ];
          setChatMessages((prev) => ({ ...prev, [chatId!]: finalMessages }));
          setIsLoading(false);
          focusChatInput();
          if (anonymousId && walletConnected && !isLocalChat(chatId!)) {
            chatApi
              .putMessages(
                chatId!,
                anonymousId,
                finalMessages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                  toolUsage: m.toolUsage,
                })),
                newTitle ? { title: newTitle, preview: newPreview } : undefined
              )
              .catch(() => {});
          }
        } else {
          setChatMessages((prev) => ({
            ...prev,
            [chatId!]: [
              ...nextMessages,
              {
                ...assistantMessage,
                content: responseText.slice(0, charIndex),
              },
            ],
          }));
        }
      }, 8);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response from the agent.";
      const finalMessages: Message[] = [
        ...nextMessages,
        { ...assistantMessage, content: errorMessage, isStreaming: false },
      ];
      setChatMessages((prev) => ({ ...prev, [chatId!]: finalMessages }));
      setIsLoading(false);
      focusChatInput();
      if (anonymousId && walletConnected && !isLocalChat(chatId!)) {
        chatApi
          .putMessages(
            chatId!,
            anonymousId,
            finalMessages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
              toolUsage: m.toolUsage,
            })),
            newTitle ? { title: newTitle, preview: newPreview } : undefined
          )
          .catch(() => {});
      }
    }
  };

  const handleStopGeneration = () => {
    if (!activeChat) return;
    setIsLoading(false);
    setChatMessages((prev) => {
      const msgs = prev[activeChat] ?? [];
      return {
        ...prev,
        [activeChat]: msgs.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
      };
    });
  };

  const handleRegenerate = async (assistantMessageId: string) => {
    if (!anonymousId || !activeChat) return;
    const msgs = chatMessages[activeChat] ?? [];
    const idx = msgs.findIndex(
      (m) => m.id === assistantMessageId && m.role === "assistant"
    );
    if (idx < 0) return;
    const previousUser = msgs[idx - 1];
    if (!previousUser || previousUser.role !== "user") return;
    const truncated = msgs.slice(0, idx);
    const chatId = activeChat;

    setChatMessages((prev) => ({ ...prev, [chatId]: truncated }));

    const assistantMessage: Message = {
      id: `${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setChatMessages((prev) => ({
      ...prev,
      [chatId]: [...truncated, assistantMessage],
    }));

    const apiMessages = truncated.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    setIsLoading(true);
    try {
      const { response: responseText, amountChargedUsd } = await chatApi.completion({
        messages: apiMessages,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        anonymousId: anonymousId ?? undefined,
        walletConnected,
      });

      if (amountChargedUsd != null && amountChargedUsd > 0) {
        reportDebit(amountChargedUsd);
        refetchBalance();
      }

      let charIndex = 0;
      const chunkSize = 24;
      const streamInterval = setInterval(() => {
        charIndex += chunkSize;
        if (charIndex >= responseText.length) {
          clearInterval(streamInterval);
          const finalMessages: Message[] = [
            ...truncated,
            { ...assistantMessage, content: responseText, isStreaming: false },
          ];
          setChatMessages((prev) => ({ ...prev, [chatId]: finalMessages }));
          setIsLoading(false);
          focusChatInput();
          if (walletConnected && !isLocalChat(chatId)) {
            chatApi
              .putMessages(
                chatId,
                anonymousId,
                finalMessages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                  toolUsage: m.toolUsage,
                }))
              )
              .catch(() => {});
          }
        } else {
          setChatMessages((prev) => ({
            ...prev,
            [chatId]: [
              ...truncated,
              {
                ...assistantMessage,
                content: responseText.slice(0, charIndex),
              },
            ],
          }));
        }
      }, 8);
    } catch (err) {
      const errorContent =
        err instanceof Error ? err.message : "Failed to get response from the agent.";
      const finalMessages: Message[] = [
        ...truncated,
        { ...assistantMessage, content: errorContent, isStreaming: false },
      ];
      setChatMessages((prev) => ({ ...prev, [chatId]: finalMessages }));
      setIsLoading(false);
      focusChatInput();
      if (walletConnected && !isLocalChat(chatId)) {
        chatApi
          .putMessages(
            chatId,
            anonymousId,
            finalMessages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
              toolUsage: m.toolUsage,
            }))
          )
          .catch(() => {});
      }
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setSidebarOpen(false);
    focusChatInput();
  };

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      sidebarPanelRef.current?.expand();
    } else {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background min-h-0">
      {/* API connection error banner */}
      {apiConnectionError && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-words">{apiConnectionError}</span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => loadChats()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
      {/* Mobile: overlay when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile: fixed sidebar (overlay) */}
      <div className="lg:hidden">
        <Sidebar
          variant="overlay"
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onDeleteChats={handleDeleteChats}
          onRenameChat={handleRenameChat}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          chatsLoading={chatsLoading}
          sessionReady={sessionReady}
          walletConnected={walletConnected}
          onToggleShareVisibility={(chatId, isPublic) => !isLocalChat(chatId) && handleToggleShareVisibility(chatId, isPublic)}
        />
      </div>

      {/* Desktop: resizable layout (sidebar + handle + main) */}
      <div className="hidden lg:flex flex-1 min-h-0 min-w-0">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="ai-agent-sidebar"
          className="h-full w-full"
        >
          <ResizablePanel
            ref={sidebarPanelRef}
            defaultSize={18}
            minSize={12}
            maxSize={45}
            collapsible
            collapsedSize={0}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={cn(sidebarCollapsed && "min-w-0")}
          >
            <Sidebar
              variant="resizable"
              chats={chats}
              activeChat={activeChat}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onDeleteChat={handleDeleteChat}
              onDeleteChats={handleDeleteChats}
              onRenameChat={handleRenameChat}
              isOpen={true}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              onCollapse={() => sidebarPanelRef.current?.collapse()}
              chatsLoading={chatsLoading}
              sessionReady={sessionReady}
              walletConnected={walletConnected}
              onToggleShareVisibility={(chatId, isPublic) => !isLocalChat(chatId) && handleToggleShareVisibility(chatId, isPublic)}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border" />
          <ResizablePanel defaultSize={82} minSize={50} className="min-w-0">
            <main className="h-full flex flex-col min-w-0">
              <ChatArea
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onStopGeneration={handleStopGeneration}
                onRegenerate={handleRegenerate}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                systemPrompt={DEFAULT_SYSTEM_PROMPT}
                onToggleSidebar={handleToggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
                sessionReady={sessionReady}
                walletConnected={walletConnected}
                inputRef={chatInputRefDesktop}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              />
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: main content */}
      <main
        className={cn(
          "flex-1 flex flex-col min-h-0 min-w-0 lg:hidden",
          "transition-all duration-300"
        )}
      >
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          onRegenerate={handleRegenerate}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          systemPrompt={DEFAULT_SYSTEM_PROMPT}
          onToggleSidebar={() => setSidebarOpen(true)}
          sidebarCollapsed={false}
          sessionReady={sessionReady}
          walletConnected={walletConnected}
          inputRef={chatInputRefMobile}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </main>
      </div>
    </div>
  );
}
