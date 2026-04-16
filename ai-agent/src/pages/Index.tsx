import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import type { ChatInputHandle } from "@/components/chat/ChatInput";
import { Agent, defaultAgents } from "@/components/chat/AgentSelector";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { SIDEBAR_PANEL, MAIN_PANEL, SIDEBAR_AUTO_SAVE_ID } from "@/lib/layoutConstants";
import { chatApi, getApiBaseUrl, type AgentInlineUiPayload } from "@/lib/chatApi";
import { resolveAssistantSwapInlineUi } from "@/lib/swapIntentFromMessage";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Menu, Moon, RefreshCw, Sun } from "lucide-react";
import DashboardSettings from "@/pages/DashboardSettings";
import { WalletNav } from "@/components/chat/WalletNav";
import { AppTopNavLinks } from "@/components/chat/AppTopNavLinks";

/** Dedupes `?q=` auto-send across React Strict Mode double-invoke in dev. */
let lastConsumedUrlPromptParam: string | null = null;

export type ToolUsageEntry = {
  name: string;
  status: "running" | "complete" | "error" | "skipped";
  /** Tool price in USD (from server catalog / effective price). */
  costUsd?: number;
  /** Treasury-covered call (user not charged USDC). */
  included?: boolean;
  chartMint?: string;
  chartCoinId?: string;
  chartSymbol?: string;
  chartName?: string;
  pumpfunCreateMint?: string;
  pumpfunCreateSignature?: string;
  pumpfunCreateSymbol?: string;
  pumpfunCreateName?: string;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUsage?: ToolUsageEntry;
  /** Multiple tools used in one assistant turn (optional chartMint / chartCoinId for price chart). */
  toolUsages?: ToolUsageEntry[];
  inlineUi?: AgentInlineUiPayload;
  inlineUiDismissed?: boolean;
  swapActionsHidden?: boolean;
  swapInlineStatus?: "cancelled" | "submitted";
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

function toMessage(m: {
  id: string;
  role: string;
  content: string;
  timestamp: string | Date;
  toolUsage?: {
    name: string;
    status: string;
    costUsd?: number;
    included?: boolean;
    chartMint?: string;
    chartCoinId?: string;
    chartSymbol?: string;
    chartName?: string;
  };
  toolUsages?: Array<{
    name: string;
    status: string;
    costUsd?: number;
    included?: boolean;
    chartMint?: string;
    chartCoinId?: string;
    chartSymbol?: string;
    chartName?: string;
    pumpfunCreateMint?: string;
    pumpfunCreateSignature?: string;
    pumpfunCreateSymbol?: string;
    pumpfunCreateName?: string;
  }>;
  inlineUi?: AgentInlineUiPayload;
  inlineUiDismissed?: boolean;
  swapActionsHidden?: boolean;
  swapInlineStatus?: "cancelled" | "submitted";
}): Message {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    timestamp: typeof m.timestamp === "string" ? new Date(m.timestamp) : m.timestamp,
    toolUsage: m.toolUsage as Message["toolUsage"],
    toolUsages: m.toolUsages as Message["toolUsages"],
    ...(m.inlineUi ? { inlineUi: m.inlineUi } : {}),
    ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
    ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
    ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
  };
}

function serializeToolUsage(u: ToolUsageEntry): ToolUsageEntry {
  return {
    name: u.name,
    status: u.status,
    ...(u.costUsd != null ? { costUsd: u.costUsd } : {}),
    ...(u.included ? { included: true } : {}),
    ...(u.chartMint ? { chartMint: u.chartMint } : {}),
    ...(u.chartCoinId ? { chartCoinId: u.chartCoinId } : {}),
    ...(u.chartSymbol ? { chartSymbol: u.chartSymbol } : {}),
    ...(u.chartName ? { chartName: u.chartName } : {}),
    ...(u.pumpfunCreateMint ? { pumpfunCreateMint: u.pumpfunCreateMint } : {}),
    ...(u.pumpfunCreateSignature ? { pumpfunCreateSignature: u.pumpfunCreateSignature } : {}),
    ...(u.pumpfunCreateSymbol ? { pumpfunCreateSymbol: u.pumpfunCreateSymbol } : {}),
    ...(u.pumpfunCreateName ? { pumpfunCreateName: u.pumpfunCreateName } : {}),
  };
}

/** Persist assistant tool rows + first tool for legacy `toolUsage` readers. */
function messageToApiPayload(m: Message) {
  const usages = m.toolUsages?.map(serializeToolUsage);
  const first = usages?.[0] ?? (m.toolUsage ? serializeToolUsage(m.toolUsage) : undefined);
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    toolUsage: first,
    ...(usages?.length ? { toolUsages: usages } : {}),
    ...(m.inlineUi ? { inlineUi: m.inlineUi } : {}),
    ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
    ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
    ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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

interface AgentSettingsViewProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

function AgentSettingsView({
  onToggleSidebar,
  sidebarCollapsed,
  isDarkMode,
  onToggleDarkMode,
}: AgentSettingsViewProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <header className="flex min-h-[56px] shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-xl sm:min-h-[52px] sm:flex-nowrap sm:gap-4 sm:px-4 sm:py-3 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className={
              (sidebarCollapsed ? "" : "lg:hidden ") +
              "h-10 w-10 shrink-0 touch-manipulation min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0"
            }
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Show sidebar" : "Open menu"}
            aria-label={sidebarCollapsed ? "Show sidebar" : "Open menu"}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <AppTopNavLinks />
        </div>
        <div className="flex max-w-full min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 min-h-[44px] min-w-[44px] shrink-0 touch-manipulation rounded-xl border border-border/50 bg-muted/20 shadow-sm hover:bg-muted/35 lg:inline-flex sm:h-9 sm:min-h-0 sm:min-w-0"
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Light mode" : "Dark mode"}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </Button>
          <WalletNav isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />
        </div>
      </header>
      <div className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <DashboardSettings layout="agent" />
      </div>
    </div>
  );
}

export default function Index({ initialChatId, initialChat }: IndexProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ready, anonymousId, connectedWalletAddress, refetchBalance, reportDebit, avatarUrl, getAgentWalletBalances, agentUsdcBalance, agentSolBalance } = useAgentWallet();
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
  const chatMessagesRef = useRef<Record<string, Message[]>>({});
  const [apiConnectionError, setApiConnectionError] = useState<string | null>(null);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  const isSettingsRoute = location.pathname === "/settings";

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
          title: capitalizeFirstLetter(c.title),
          preview: capitalizeFirstLetter(c.preview),
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
      title: capitalizeFirstLetter(initialChat.title),
      preview: capitalizeFirstLetter(initialChat.preview),
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
  // Skip when we have initialChatId: owner opened /c/:shareId and we're about to restore that chat (don't navigate away).
  // Use window.location.pathname because we may have set URL via replaceState, so React Router still thinks we're at "/".
  useEffect(() => {
    if (initialChatId) return;
    if (activeChat !== null && !isLocalChat(activeChat)) return;
    const pathname = typeof window !== "undefined" ? window.location.pathname : location.pathname;
    if (pathname === "/" || !pathname.startsWith("/c/")) return;
    navigate("/", { replace: true });
  }, [initialChatId, activeChat, location.pathname, navigate]);

  // Update browser URL to current chat share link only after history exists (avoids blink: we use replaceState so we stay on same route and don't remount).
  useEffect(() => {
    if (location.pathname === "/settings") return;
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
        title: capitalizeFirstLetter(chat.title),
        preview: capitalizeFirstLetter(chat.preview),
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
  }, [activeChat, chats, chatMessages, isLoading, location.pathname]);

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
          const entry = {
            id: chatId,
            title: capitalizeFirstLetter(chat.title),
            preview: capitalizeFirstLetter(chat.preview),
            timestamp: typeof chat.timestamp === "string" ? new Date(chat.timestamp) : new Date(chat.timestamp),
            messages: [],
            shareId: chat.shareId ?? null,
            isPublic: !!chat.isPublic,
          };
          if (exists) return prev.map((c) => (c.id === chatId ? { ...c, ...entry } : c));
          return [entry, ...prev];
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
    if (location.pathname === "/settings") {
      navigate("/", { replace: true });
    }
    if (!anonymousId) return;
    if (!walletConnected) {
      setActiveChat(LOCAL_CHAT_ID);
      setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: [] }));
      setSidebarOpen(false);
      focusChatInput();
      return;
    }
    try {
      const { chat } = await chatApi.create(anonymousId, {
        title: "New Chat",
        preview: "",
      });
      const newChat: Chat = {
        id: chat.id,
        title: capitalizeFirstLetter(chat.title),
        timestamp: new Date(chat.timestamp),
        preview: capitalizeFirstLetter(chat.preview),
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

  /** Reset to default screen (empty state) when user clicks logo in sidebar */
  const handleLogoClick = useCallback(() => {
    setActiveChat(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("shareId");
      return next;
    }, { replace: true });
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
    setSidebarOpen(false);
  }, [navigate, location.pathname, setSearchParams]);

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
        setActiveChat(null);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("shareId");
          return next;
        }, { replace: true });
        navigate("/", { replace: true });
      }
      setSidebarOpen(false);
    } catch (err) {
      // Silently fail; user can retry
    }
  }, [anonymousId, activeChat, chats, navigate, setSearchParams]);

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
        setActiveChat(null);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("shareId");
          return next;
        }, { replace: true });
        navigate("/", { replace: true });
      }
      setSidebarOpen(false);
    },
    [anonymousId, activeChat, chats, navigate, setSearchParams]
  );

  const handleRenameChat = useCallback(async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const normalized = capitalizeFirstLetter(trimmed);
    if (isLocalChat(id)) {
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: normalized } : c))
      );
      return;
    }
    if (!anonymousId) return;
    try {
      await chatApi.update(id, anonymousId, { title: normalized });
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: normalized } : c))
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

  const handleSendMessage = async (
    content: string,
    options?: {
      replaceHistory?: Message[];
      dismissInlineUiAssistantMessageId?: string;
      hideSwapActionsAssistantMessageId?: string;
    }
  ) => {
    if (!anonymousId) return;
    let chatId = activeChat;
    if (!walletConnected) {
      if (!chatId || !isLocalChat(chatId)) {
        chatId = LOCAL_CHAT_ID;
        setActiveChat(LOCAL_CHAT_ID);
        setChats((prev) =>
          prev.some((c) => c.id === LOCAL_CHAT_ID)
            ? prev
            : [
                {
                  id: LOCAL_CHAT_ID,
                  title: "Current conversation",
                  timestamp: new Date(),
                  preview: "",
                  messages: [],
                },
                ...prev,
              ]
        );
        setChatMessages((prev) => ({ ...prev, [LOCAL_CHAT_ID]: prev[LOCAL_CHAT_ID] ?? [] }));
      } else {
        chatId = LOCAL_CHAT_ID;
      }
    } else if (!chatId) {
      try {
        const { chat } = await chatApi.create(anonymousId, {
          title: "New Chat",
          preview: "",
        });
        chatId = chat.id;
        const newChat: Chat = {
          id: chat.id,
          title: capitalizeFirstLetter(chat.title),
          timestamp: new Date(chat.timestamp),
          preview: capitalizeFirstLetter(chat.preview),
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

    const prevRaw = options?.replaceHistory ?? (chatMessagesRef.current[chatId] ?? []);
    let prevMessages = prevRaw;
    if (options?.dismissInlineUiAssistantMessageId) {
      prevMessages = prevRaw.map((m) =>
        m.id === options.dismissInlineUiAssistantMessageId && m.role === "assistant"
          ? { ...m, inlineUiDismissed: true, inlineUi: undefined }
          : m
      );
    } else if (options?.hideSwapActionsAssistantMessageId) {
      prevMessages = prevRaw.map((m) =>
        m.id === options.hideSwapActionsAssistantMessageId && m.role === "assistant"
          ? { ...m, swapActionsHidden: true, swapInlineStatus: "submitted" as const }
          : m
      );
    }
    const nextMessages = [...prevMessages, userMessage];
    const isFirstMessage = prevMessages.length === 0;
    const newTitle = isFirstMessage ? capitalizeFirstLetter(content.slice(0, 30)) : undefined;
    const newPreview = capitalizeFirstLetter(content.slice(0, 50));

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
      let agentWalletBalances = await getAgentWalletBalances();
      // If fresh fetch failed but navbar has balance, send displayed values so API matches UI
      if (agentWalletBalances == null && typeof agentUsdcBalance === "number" && typeof agentSolBalance === "number") {
        agentWalletBalances = { usdcBalance: agentUsdcBalance, solBalance: agentSolBalance };
      }
      const { response: responseText, amountChargedUsd, toolUsages, inlineUi } = await chatApi.completion({
        messages: apiMessages,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        chatId:
          walletConnected && chatId && !isLocalChat(chatId) ? chatId : undefined,
        anonymousId: anonymousId ?? undefined,
        walletConnected,
        agentWalletBalances: agentWalletBalances ?? undefined,
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
          const mergedInlineUi = resolveAssistantSwapInlineUi(inlineUi, nextMessages);
          const finalMessages: Message[] = [
            ...nextMessages,
            {
              ...assistantMessage,
              content: responseText,
              isStreaming: false,
              ...(toolUsages?.length ? { toolUsages } : {}),
              ...(mergedInlineUi ? { inlineUi: mergedInlineUi } : {}),
            },
          ];
          setChatMessages((prev) => ({ ...prev, [chatId!]: finalMessages }));
          setIsLoading(false);
          focusChatInput();
          if (anonymousId && walletConnected && !isLocalChat(chatId!)) {
            chatApi
              .putMessages(
                chatId!,
                anonymousId,
                finalMessages.map(messageToApiPayload),
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
      const mergedInlineUi = resolveAssistantSwapInlineUi(undefined, nextMessages);
      const finalMessages: Message[] = [
        ...nextMessages,
        {
          ...assistantMessage,
          content: errorMessage,
          isStreaming: false,
          ...(mergedInlineUi ? { inlineUi: mergedInlineUi } : {}),
        },
      ];
      setChatMessages((prev) => ({ ...prev, [chatId!]: finalMessages }));
      setIsLoading(false);
      focusChatInput();
      if (anonymousId && walletConnected && !isLocalChat(chatId!)) {
        chatApi
          .putMessages(
            chatId!,
            anonymousId,
            finalMessages.map(messageToApiPayload),
            newTitle ? { title: newTitle, preview: newPreview } : undefined
          )
          .catch(() => {});
      }
    }
  };

  const handleSendMessageRef = useRef(handleSendMessage);
  handleSendMessageRef.current = handleSendMessage;

  const handleDismissPumpfunCreateForm = useCallback(
    (assistantMessageId: string) => {
      if (!activeChat || !anonymousId) return;
      const chatId = activeChat;
      setChatMessages((prev) => {
        const list = prev[chatId] ?? [];
        const next = list.map((m) => {
          if (m.id !== assistantMessageId || m.role !== "assistant") return m;
          const t = m.inlineUi?.type;
          if (t === "jupiter-swap" || t === "pumpfun-swap") {
            return { ...m, swapActionsHidden: true, swapInlineStatus: "cancelled" as const };
          }
          return { ...m, inlineUiDismissed: true };
        });
        if (walletConnected && !isLocalChat(chatId)) {
          queueMicrotask(() => {
            chatApi.putMessages(chatId, anonymousId, next.map(messageToApiPayload)).catch(() => {});
          });
        }
        return { ...prev, [chatId]: next };
      });
    },
    [activeChat, anonymousId, walletConnected]
  );

  const handlePumpfunCreateFormSubmit = useCallback(
    (payload: { assistantMessageId: string; prompt: string }) => {
      const chatId = activeChat;
      if (!chatId) return;
      const list = chatMessagesRef.current[chatId] ?? [];
      const msg = list.find((x) => x.id === payload.assistantMessageId && x.role === "assistant");
      const isSwap =
        msg?.inlineUi?.type === "jupiter-swap" || msg?.inlineUi?.type === "pumpfun-swap";
      void handleSendMessageRef.current(
        payload.prompt,
        isSwap
          ? { hideSwapActionsAssistantMessageId: payload.assistantMessageId }
          : { dismissInlineUiAssistantMessageId: payload.assistantMessageId }
      );
    },
    [activeChat]
  );

  const urlPromptParam =
    searchParams.get("q")?.trim() ||
    searchParams.get("query")?.trim() ||
    searchParams.get("prompt")?.trim() ||
    "";

  useEffect(() => {
    if (!ready || !anonymousId || !urlPromptParam) return;
    const hasQParam =
      searchParams.has("q") || searchParams.has("query") || searchParams.has("prompt");
    if (lastConsumedUrlPromptParam === urlPromptParam) {
      if (hasQParam) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("q");
            next.delete("query");
            next.delete("prompt");
            return next;
          },
          { replace: true },
        );
      }
      return;
    }
    lastConsumedUrlPromptParam = urlPromptParam;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("q");
        next.delete("query");
        next.delete("prompt");
        return next;
      },
      { replace: true },
    );
    void handleSendMessageRef.current(urlPromptParam);
  }, [ready, anonymousId, urlPromptParam, searchParams, setSearchParams]);

  const handleUpdateUserMessage = useCallback(
    (messageId: string, content: string) => {
      if (!activeChat) return;
      const list = chatMessages[activeChat] ?? [];
      const editIndex = list.findIndex((m) => m.id === messageId && m.role === "user");
      if (editIndex === -1) return;
      const truncated = list.slice(0, editIndex);
      handleSendMessage(content, { replaceHistory: truncated });
    },
    [activeChat, chatMessages, handleSendMessage]
  );

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
      let agentWalletBalances = await getAgentWalletBalances();
      if (agentWalletBalances == null && typeof agentUsdcBalance === "number" && typeof agentSolBalance === "number") {
        agentWalletBalances = { usdcBalance: agentUsdcBalance, solBalance: agentSolBalance };
      }
      const { response: responseText, amountChargedUsd, toolUsages, inlineUi } = await chatApi.completion({
        messages: apiMessages,
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        chatId: walletConnected && !isLocalChat(chatId) ? chatId : undefined,
        anonymousId: anonymousId ?? undefined,
        walletConnected,
        agentWalletBalances: agentWalletBalances ?? undefined,
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
          const mergedInlineUi = resolveAssistantSwapInlineUi(inlineUi, truncated);
          const finalMessages: Message[] = [
            ...truncated,
            {
              ...assistantMessage,
              content: responseText,
              isStreaming: false,
              ...(toolUsages?.length ? { toolUsages } : {}),
              ...(mergedInlineUi ? { inlineUi: mergedInlineUi } : {}),
            },
          ];
          setChatMessages((prev) => ({ ...prev, [chatId]: finalMessages }));
          setIsLoading(false);
          focusChatInput();
          if (walletConnected && !isLocalChat(chatId)) {
            chatApi
              .putMessages(
                chatId,
                anonymousId,
                finalMessages.map(messageToApiPayload)
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
      const mergedInlineUi = resolveAssistantSwapInlineUi(undefined, truncated);
      const finalMessages: Message[] = [
        ...truncated,
        {
          ...assistantMessage,
          content: errorContent,
          isStreaming: false,
          ...(mergedInlineUi ? { inlineUi: mergedInlineUi } : {}),
        },
      ];
      setChatMessages((prev) => ({ ...prev, [chatId]: finalMessages }));
      setIsLoading(false);
      focusChatInput();
      if (walletConnected && !isLocalChat(chatId)) {
        chatApi
          .putMessages(
            chatId,
            anonymousId,
            finalMessages.map(messageToApiPayload)
          )
          .catch(() => {});
      }
    }
  };

  // When navigating from Marketplace with a prompt, send it to the agent and clear state
  const lastAppliedPromptRef = useRef<string | null>(null);
  useEffect(() => {
    if (location.pathname === "/settings") return;
    const prompt = location.state?.prompt;
    if (typeof prompt !== "string" || !prompt.trim()) return;
    if (lastAppliedPromptRef.current === prompt) return;
    lastAppliedPromptRef.current = prompt;
    navigate(location.pathname, { replace: true, state: {} });
    handleSendMessage(prompt.trim());
  }, [location.state?.prompt, location.pathname, navigate]);

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 overflow-hidden">
        {/* Animated rings */}
        <div className="relative flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40">
          <div className="absolute inset-0 rounded-full border-2 border-accent/30 loader-app-glow" />
          <div className="absolute w-full h-full rounded-full border-2 border-dashed border-primary/30 loader-app-ring" />
          <div className="absolute w-[70%] h-[70%] rounded-full border border-primary/20 loader-app-ring-slow" />
          {/* Center orb with logo */}
          <div className="relative z-10 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-card border border-border shadow-xl loader-app-orb overflow-hidden">
            <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
          </div>
        </div>
        <p className="mt-8 text-sm font-medium text-foreground loader-text-fade">
          Preparing your experience...
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Just a moment</p>
        <div className="mt-6 flex items-center gap-1.5 text-muted-foreground">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>
      </div>
    );
  }

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setSidebarOpen(false);
    if (location.pathname === "/settings") {
      navigate("/", { replace: true });
    }
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
    <div className="h-dvh min-h-dvh max-h-dvh flex flex-col overflow-hidden bg-background overscroll-none">
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
          onLogoClick={handleLogoClick}
        />
      </div>

      {/* Desktop: resizable layout (sidebar + handle + main) */}
      <div className="hidden lg:flex flex-1 min-h-0 min-w-0">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId={SIDEBAR_AUTO_SAVE_ID}
          className="h-full w-full"
        >
          <ResizablePanel
            ref={sidebarPanelRef}
            defaultSize={SIDEBAR_PANEL.defaultSize}
            minSize={SIDEBAR_PANEL.minSize}
            maxSize={SIDEBAR_PANEL.maxSize}
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
              onLogoClick={handleLogoClick}
            />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border" />
          <ResizablePanel defaultSize={MAIN_PANEL.defaultSize} minSize={MAIN_PANEL.minSize} className="min-w-0">
            <main className="flex h-full min-w-0 flex-col">
              {isSettingsRoute ? (
                <AgentSettingsView
                  onToggleSidebar={handleToggleSidebar}
                  sidebarCollapsed={sidebarCollapsed}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                />
              ) : (
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
                  userAvatarUrl={avatarUrl}
                  onUpdateUserMessage={handleUpdateUserMessage}
                  onDismissPumpfunCreateForm={handleDismissPumpfunCreateForm}
                  onSubmitPumpfunCreateForm={handlePumpfunCreateFormSubmit}
                />
              )}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: main content — full width, proper flex for keyboard */}
      <main
        className={cn(
          "flex-1 flex flex-col min-h-0 min-w-0 w-full lg:hidden",
          "transition-all duration-300 overflow-hidden"
        )}
      >
        {isSettingsRoute ? (
          <AgentSettingsView
            onToggleSidebar={() => setSidebarOpen(true)}
            sidebarCollapsed={false}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          />
        ) : (
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
            userAvatarUrl={avatarUrl}
            onUpdateUserMessage={handleUpdateUserMessage}
            onDismissPumpfunCreateForm={handleDismissPumpfunCreateForm}
            onSubmitPumpfunCreateForm={handlePumpfunCreateFormSubmit}
          />
        )}
      </main>
      </div>
    </div>
  );
}
