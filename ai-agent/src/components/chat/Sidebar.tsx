import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  MoreHorizontal,
  Pencil,
  PanelLeftClose,
  Square,
  Share2,
  Lock,
  Globe,
  Twitter,
  BookOpen,
  ExternalLink,
  Mail,
  Send,
} from "lucide-react";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
import { ShareChatModal } from "./ShareChatModal";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  shareId?: string | null;
  isPublic?: boolean;
}

/** Community & support — aligned with landing `config/global.ts`. */
const LINK_SYRA_TELEGRAM = "https://t.me/syra_ai";
const SYRA_SUPPORT_EMAIL = "support@syraa.fun";

const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 42;
const MIN_PREVIEW_LENGTH = 10;
const MAX_PREVIEW_LENGTH = 55;
/** Approximate px per character for title (text-sm) and preview (text-xs) */
const PX_PER_TITLE_CHAR = 7;
const PX_PER_PREVIEW_CHAR = 6;
/** Space reserved for icon pill, padding, and floating menu (px) */
const RESERVED_PX = 112;

function truncateWithEllipsis(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trim() + "…";
}

function getMaxLengthsFromWidth(width: number): { title: number; preview: number } {
  if (width <= 0) return { title: MIN_TITLE_LENGTH, preview: MIN_PREVIEW_LENGTH };
  const available = Math.max(0, width - RESERVED_PX);
  const title = Math.round(
    Math.min(MAX_TITLE_LENGTH, Math.max(MIN_TITLE_LENGTH, available / PX_PER_TITLE_CHAR))
  );
  const preview = Math.round(
    Math.min(MAX_PREVIEW_LENGTH, Math.max(MIN_PREVIEW_LENGTH, available / PX_PER_PREVIEW_CHAR))
  );
  return { title, preview };
}

interface SidebarProps {
  variant?: "overlay" | "resizable";
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (id: string) => void;
  /** Bulk delete: called with array of chat ids when user confirms "Delete selected". */
  onDeleteChats?: (ids: string[]) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCollapse?: () => void;
  chatsLoading?: boolean;
  /** When false, show connect-wallet prompt (session not ready). When true, show New Chat, search, list. */
  sessionReady?: boolean;
  /** For future use (e.g. show "connect for tools" in sidebar) */
  walletConnected?: boolean;
  /** Toggle public/private for a chat (per-chat share in list) */
  onToggleShareVisibility?: (chatId: string, isPublic: boolean) => void;
  /** When provided, logo click calls this instead of only navigating to / (resets chat to default screen) */
  onLogoClick?: () => void;
}

export function Sidebar({
  variant = "overlay",
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onDeleteChats,
  onRenameChat,
  isOpen,
  onToggle,
  onCollapse,
  chatsLoading = false,
  sessionReady = true,
  walletConnected = true,
  onToggleShareVisibility,
  onLogoClick,
}: SidebarProps) {
  const { openConnectModal } = useConnectModal();
  /** Chat for which the share modal is open; null when closed */
  const [shareModalChat, setShareModalChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  /** When true, show checkboxes and allow multi-delete. */
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const editInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const ids = new Set(filteredChats.map((c) => c.id));
    setSelectedIds(ids);
  };

  const deselectAll = () => setSelectedIds(new Set());

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    onDeleteChats?.(ids);
    exitSelectionMode();
  };

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSidebarWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setSidebarWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupChatsByDate = (chats: Chat[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: { label: string; chats: Chat[] }[] = [
      { label: "Today", chats: [] },
      { label: "Yesterday", chats: [] },
      { label: "Previous 7 Days", chats: [] },
      { label: "Older", chats: [] },
    ];

    chats.forEach(chat => {
      const chatDate = new Date(chat.timestamp);
      if (chatDate.toDateString() === today.toDateString()) {
        groups[0].chats.push(chat);
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        groups[1].chats.push(chat);
      } else if (chatDate > weekAgo) {
        groups[2].chats.push(chat);
      } else {
        groups[3].chats.push(chat);
      }
    });

    return groups.filter(g => g.chats.length > 0);
  };

  const groupedChats = groupChatsByDate(filteredChats);
  const { title: maxTitleLen, preview: maxPreviewLen } = getMaxLengthsFromWidth(sidebarWidth);

  const isOverlay = variant === "overlay";
  const isResizable = variant === "resizable";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground supports-[backdrop-filter]:bg-sidebar/95",
        isOverlay &&
          "fixed left-0 top-0 z-40 w-[min(280px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] max-w-[min(320px,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1rem))] h-dvh max-h-dvh transition-transform duration-300 ease-out safe-area-top safe-area-bottom overflow-y-auto overflow-x-hidden",
        isOverlay && (isOpen ? "translate-x-0" : "-translate-x-full"),
        isResizable && "w-full min-w-0"
      )}
    >
      <div ref={sidebarRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header — safe area for notch on mobile */}
      <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border/90 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/98 px-4 py-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-4">
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="group/brand flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-transparent p-1 -m-1 text-left text-inherit no-underline transition-colors hover:border-border/40 hover:bg-muted/20"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/25 shadow-sm ring-1 ring-white/[0.04] transition-all duration-200 group-hover/brand:border-accent/30 group-hover/brand:shadow-md">
              <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">Syra Agent</h1>
              <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground/85">Intelligent Assistant</p>
            </div>
          </button>
        ) : (
          <Link
            to="/"
            className="group/brand flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-transparent p-1 -m-1 text-inherit no-underline transition-colors hover:border-border/40 hover:bg-muted/20"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/25 shadow-sm ring-1 ring-white/[0.04] transition-all duration-200 group-hover/brand:border-accent/30 group-hover/brand:shadow-md">
              <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">Syra Agent</h1>
              <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground/85">Intelligent Assistant</p>
            </div>
          </Link>
        )}
        {isResizable && onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            onClick={onCollapse}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* New Chat – when session ready */}
      {sessionReady && (
        <div className="px-3 pb-2 pt-3 sm:px-4 sm:pb-2.5 sm:pt-4">
          <Button
            onClick={onNewChat}
            className="h-11 w-full gap-2 rounded-xl font-medium tracking-tight shadow-sm shadow-primary/15 transition-all duration-200 hover:shadow-md"
          >
            <Plus className="h-[17px] w-[17px]" strokeWidth={2.25} aria-hidden />
            New chat
          </Button>
        </div>
      )}

      {/* Search – when session ready */}
      {sessionReady && (
        <div className="px-3 pb-3 sm:px-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" aria-hidden />
            <input
              type="search"
              placeholder="Search chats…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/70 bg-muted/25 py-2 pl-10 pr-3.5 text-[13px] text-foreground shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)] transition-all placeholder:text-muted-foreground/70 focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
      )}

      {/* Selection mode bar – when wallet connected, has chats, and selection mode on */}
      {sessionReady && walletConnected && groupedChats.length > 0 && selectionMode && onDeleteChats && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/45 hover:text-foreground"
            onClick={selectedIds.size === filteredChats.length ? deselectAll : selectAllFiltered}
          >
            {selectedIds.size === filteredChats.length ? "Deselect all" : "Select all"}
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-9 gap-1.5 rounded-lg text-xs font-medium"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-9 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/45 hover:text-foreground"
            onClick={exitSelectionMode}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* "Select" to enter selection mode – when wallet connected and has chats */}
      {sessionReady && walletConnected && groupedChats.length > 0 && !selectionMode && onDeleteChats && (
        <div className="px-3 pb-2 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start gap-2 rounded-xl px-2.5 text-[12px] font-medium text-muted-foreground/90 transition-colors hover:bg-muted/35 hover:text-foreground"
            onClick={() => setSelectionMode(true)}
          >
            <Square className="h-3.5 w-3.5 opacity-80" strokeWidth={2} />
            Select chats to delete
          </Button>
        </div>
      )}

      {/* Chat List or Connect Wallet (when session not ready) */}
      <ScrollArea className="min-h-0 min-w-0 flex-1 px-2.5 sm:px-3">
        <div className="min-w-0 space-y-5 py-1 pb-3">
          {!sessionReady ? (
            <ConnectWalletPrompt
              variant="compact"
              onConnectClick={openConnectModal}
            />
          ) : sessionReady && !walletConnected ? (
            <div className="mx-0.5 rounded-xl border border-border/50 bg-muted/20 p-4 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.25)] ring-1 ring-white/[0.03] dark:ring-white/[0.05]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-background/40">
                  <MessageSquare className="h-4 w-4 text-primary" strokeWidth={2} />
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Connect your wallet to sync and keep your chat history.
                </p>
              </div>
            </div>
          ) : chatsLoading && walletConnected ? (
            <div className="flex items-center gap-2.5 px-1 py-6 text-[13px] font-medium text-muted-foreground">
              <span>Loading chats</span>
              <span className="flex items-center gap-1" aria-hidden>
                <span className="loader-dot" />
                <span className="loader-dot" />
                <span className="loader-dot" />
              </span>
            </div>
          ) : groupedChats.length === 0 ? (
            <p className="px-1 py-8 text-center text-[13px] leading-relaxed text-muted-foreground/90">
              No chats yet. Start with <span className="text-foreground/90">New chat</span>.
            </p>
          ) : (
            groupedChats.map((group) => (
              <div key={group.label}>
                <p className="px-1.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group/chat relative flex min-h-[48px] min-w-0 items-center gap-2.5 overflow-visible rounded-xl border border-transparent px-2.5 py-2 transition-all duration-200 sm:px-3",
                        activeChat === chat.id &&
                          !selectionMode &&
                          "border-sidebar-border/70 bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm shadow-black/10 dark:shadow-black/25",
                        editingChatId !== chat.id &&
                          (selectionMode || activeChat !== chat.id) &&
                          "cursor-pointer hover:border-border/50 hover:bg-muted/40 hover:text-foreground active:scale-[0.99]",
                        selectionMode && selectedIds.has(chat.id) && "border-primary/25 bg-primary/10 ring-1 ring-primary/25"
                      )}
                      onClick={() => {
                        if (editingChatId === chat.id) return;
                        if (selectionMode) {
                          toggleSelect(chat.id);
                        } else {
                          onSelectChat(chat.id);
                        }
                      }}
                    >
                      {selectionMode ? (
                        <Checkbox
                          checked={selectedIds.has(chat.id)}
                          onCheckedChange={() => toggleSelect(chat.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        />
                      ) : (
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
                            activeChat === chat.id
                              ? "border-sidebar-border/50 bg-background/20 text-sidebar-accent-foreground"
                              : "border-transparent bg-muted/35 text-muted-foreground group-hover/chat:border-border/45 group-hover/chat:bg-muted/55 group-hover/chat:text-foreground",
                          )}
                        >
                          <MessageSquare className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
                        </span>
                      )}
                      {/* Text area: overflow hidden so long text truncates; padding so it never goes under the floating button */}
                      <div className="min-w-0 flex-1 overflow-hidden pr-11 sm:pr-12">
                        {editingChatId === chat.id ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={(e) => {
                              const currentValue = (e.target as HTMLInputElement).value;
                              const trimmed = currentValue.trim();
                              if (trimmed && trimmed !== chat.title) {
                                onRenameChat?.(chat.id, trimmed);
                              }
                              setEditingChatId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                const currentValue = (e.target as HTMLInputElement).value;
                                const trimmed = currentValue.trim();
                                if (trimmed && trimmed !== chat.title) {
                                  onRenameChat?.(chat.id, trimmed);
                                }
                                setEditingChatId(null);
                              }
                              if (e.key === "Escape") {
                                setEditingTitle(chat.title);
                                setEditingChatId(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        ) : (
                          <>
                            <div className="flex min-w-0 items-center gap-1.5">
                              <p
                                className={cn(
                                  "truncate text-[13px] font-medium leading-tight tracking-tight text-foreground",
                                  activeChat === chat.id && !selectionMode && "text-sidebar-accent-foreground",
                                )}
                                title={capitalizeFirstLetter(chat.title)}
                              >
                                {truncateWithEllipsis(capitalizeFirstLetter(chat.title), maxTitleLen)}
                              </p>
                              {chat.shareId && (
                                <span
                                  className={cn(
                                    "flex shrink-0 items-center text-muted-foreground/85",
                                    activeChat === chat.id && !selectionMode && "text-sidebar-accent-foreground/80",
                                  )}
                                  title={chat.isPublic ? "Public – anyone with link can view" : "Private – only you can view"}
                                  aria-label={chat.isPublic ? "Public chat" : "Private chat"}
                                >
                                  {chat.isPublic ? (
                                    <Globe className="h-3.5 w-3.5" strokeWidth={2} />
                                  ) : (
                                    <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                                  )}
                                </span>
                              )}
                            </div>
                            <p
                              className={cn(
                                "mt-0.5 truncate text-[11px] leading-snug text-muted-foreground/88",
                                activeChat === chat.id && !selectionMode && "text-sidebar-accent-foreground/75",
                              )}
                              title={capitalizeFirstLetter(chat.preview)}
                            >
                              {truncateWithEllipsis(capitalizeFirstLetter(chat.preview), maxPreviewLen)}
                            </p>
                          </>
                        )}
                      </div>
                      {/* Floating ⋯ menu (hidden in selection mode) */}
                      {editingChatId !== chat.id && !selectionMode && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex w-16 items-center justify-end bg-gradient-to-l from-sidebar from-40% via-sidebar/85 to-transparent pl-6">
                          <div className="pointer-events-auto flex items-center rounded-lg border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm dark:bg-background/80">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 touch-manipulation rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Chat options"
                                >
                                  <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 z-50">
                                {chat.shareId && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShareModalChat(chat);
                                    }}
                                  >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingChatId(chat.id);
                                    setEditingTitle(chat.title);
                                  }}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="mx-1 my-1 bg-border/60" />
                                <DropdownMenuItem
                                  className={cn(
                                    "font-medium",
                                    "text-red-600 dark:text-red-400",
                                    "focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-400",
                                    "data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-600 dark:data-[highlighted]:text-red-400",
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat?.(chat.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2 opacity-90" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Share modal for the selected chat */}
      {shareModalChat?.shareId && (
        <ShareChatModal
          open={!!shareModalChat}
          onOpenChange={(open) => !open && setShareModalChat(null)}
          shareLink={`${typeof window !== "undefined" ? window.location.origin : ""}/c/${shareModalChat.shareId}`}
          isSharePublic={!!shareModalChat.isPublic}
          onVisibilityChange={(isPublic) => {
            onToggleShareVisibility?.(shareModalChat.id, isPublic);
            setShareModalChat((prev) => (prev ? { ...prev, isPublic } : null));
          }}
        />
      )}

      {/* Footer – when session ready */}
      {sessionReady && (
        <div className="shrink-0 border-t border-sidebar-border/90 bg-muted/[0.12] px-3 py-4 sm:px-4">
          <p className="px-1 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
            Connect
          </p>
          <div className="flex flex-wrap gap-1.5 px-0.5">
            <a
              href="https://x.com/syra_agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/80 hover:text-foreground hover:shadow-sm"
              title="Official X"
              aria-label="Official X"
            >
              <Twitter className="h-4 w-4" strokeWidth={2} />
            </a>
            <a
              href={LINK_SYRA_TELEGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/80 hover:text-foreground hover:shadow-sm"
              title="Telegram community"
              aria-label="Telegram community"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </a>
            <a
              href="https://docs.syraa.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/80 hover:text-foreground hover:shadow-sm"
              title="Documentation"
              aria-label="Docs"
            >
              <BookOpen className="h-4 w-4" strokeWidth={2} />
            </a>
            <a
              href={`mailto:${SYRA_SUPPORT_EMAIL}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/80 hover:text-foreground hover:shadow-sm"
              title={`Email ${SYRA_SUPPORT_EMAIL}`}
              aria-label={`Email ${SYRA_SUPPORT_EMAIL}`}
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
            </a>
            <a
              href="https://syraa.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition-all duration-200 hover:border-border/60 hover:bg-background/80 hover:text-foreground hover:shadow-sm"
              title="Website"
              aria-label="Website"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2} />
            </a>
          </div>
        </div>
      )}
      </div>
    </aside>
  );
}
