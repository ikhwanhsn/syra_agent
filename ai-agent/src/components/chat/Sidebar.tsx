import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, MessageSquare, Settings, Search, Trash2, MoreHorizontal, Pencil, PanelLeftClose, Square, Store, Share2, Lock, Globe, Twitter, Send, BookOpen, ExternalLink } from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
import { ShareChatModal } from "./ShareChatModal";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

const MIN_TITLE_LENGTH = 8;
const MAX_TITLE_LENGTH = 42;
const MIN_PREVIEW_LENGTH = 10;
const MAX_PREVIEW_LENGTH = 55;
/** Approximate px per character for title (text-sm) and preview (text-xs) */
const PX_PER_TITLE_CHAR = 7;
const PX_PER_PREVIEW_CHAR = 6;
/** Space reserved for icon, padding, and floating button (px) */
const RESERVED_PX = 100;

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
  const { setVisible: setWalletModalVisible } = useWalletModal();
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
        "flex flex-col h-full bg-card border-r border-border",
        isOverlay && "fixed left-0 top-0 z-40 w-[280px] max-w-[85vw] sm:max-w-[90vw] h-screen transition-transform duration-300 ease-out safe-area-top safe-area-bottom",
        isOverlay && (isOpen ? "translate-x-0" : "-translate-x-full"),
        isResizable && "w-full min-w-0"
      )}
    >
      <div ref={sidebarRef} className="flex flex-col flex-1 min-w-0 overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border shrink-0">
        {onLogoClick ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit hover:opacity-90 transition-opacity cursor-pointer bg-transparent border-0 text-left p-0"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-card shrink-0">
              <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground truncate">Syra Agent</h1>
              <p className="text-xs text-muted-foreground truncate">Intelligent Assistant</p>
            </div>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit hover:opacity-90 transition-opacity">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden bg-card shrink-0">
              <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground truncate">Syra Agent</h1>
              <p className="text-xs text-muted-foreground truncate">Intelligent Assistant</p>
            </div>
          </Link>
        )}
        {isResizable && onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onCollapse}
            title="Hide sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* New Chat – when session ready */}
      {sessionReady && (
        <div className="p-2 sm:p-3">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 transition-all"
            variant="ghost"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
      )}

      {/* Search – when session ready */}
      {sessionReady && (
        <div className="px-2 sm:px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Selection mode bar – when wallet connected, has chats, and selection mode on */}
      {sessionReady && walletConnected && groupedChats.length > 0 && selectionMode && onDeleteChats && (
        <div className="px-2 sm:px-3 pb-2 flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={selectedIds.size === filteredChats.length ? deselectAll : selectAllFiltered}
          >
            {selectedIds.size === filteredChats.length ? "Deselect all" : "Select all"}
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 text-xs ml-auto" onClick={exitSelectionMode}>
            Cancel
          </Button>
        </div>
      )}

      {/* "Select" to enter selection mode – when wallet connected and has chats */}
      {sessionReady && walletConnected && groupedChats.length > 0 && !selectionMode && onDeleteChats && (
        <div className="px-2 sm:px-3 pb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            onClick={() => setSelectionMode(true)}
          >
            <Square className="w-3.5 h-3.5" />
            Select chats to delete
          </Button>
        </div>
      )}

      {/* Chat List or Connect Wallet (when session not ready) */}
      <ScrollArea className="flex-1 min-h-0 min-w-0 px-2">
        <div className="space-y-4 py-2 min-w-0">
          {!sessionReady ? (
            <ConnectWalletPrompt
              variant="compact"
              onConnectClick={() => setWalletModalVisible(true)}
            />
          ) : sessionReady && !walletConnected ? (
            <div className="mx-2 mt-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-4">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Connect your wallet to see your chat history.
                </p>
              </div>
            </div>
          ) : chatsLoading && walletConnected ? (
            <div className="px-2 py-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Loading chats</span>
              <span className="flex items-center gap-1" aria-hidden>
                <span className="loader-dot" />
                <span className="loader-dot" />
                <span className="loader-dot" />
              </span>
            </div>
          ) : groupedChats.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">No chats yet. Start a new one.</p>
          ) : (
            groupedChats.map((group) => (
              <div key={group.label}>
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group relative flex items-center gap-2 px-2 sm:px-3 py-2.5 rounded-lg transition-all min-h-[44px] min-w-0 overflow-visible",
                        activeChat === chat.id && !selectionMode && "bg-secondary",
                        editingChatId !== chat.id && "cursor-pointer hover:bg-secondary/80 active:bg-secondary/80",
                        selectionMode && selectedIds.has(chat.id) && "bg-primary/10 ring-1 ring-primary/30"
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
                        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      {/* Text area: overflow hidden so long text truncates; padding so it never goes under the floating button */}
                      <div className="flex-1 min-w-0 overflow-hidden pr-12">
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
                            className="w-full text-sm font-medium bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                          />
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p
                                className="text-sm font-medium truncate text-foreground"
                                title={chat.title}
                              >
                                {truncateWithEllipsis(chat.title, maxTitleLen)}
                              </p>
                              {chat.shareId && (
                                <span
                                  className="shrink-0 flex items-center text-muted-foreground"
                                  title={chat.isPublic ? "Public – anyone with link can view" : "Private – only you can view"}
                                  aria-label={chat.isPublic ? "Public chat" : "Private chat"}
                                >
                                  {chat.isPublic ? (
                                    <Globe className="w-3.5 h-3.5" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs text-muted-foreground truncate"
                              title={chat.preview}
                            >
                              {truncateWithEllipsis(chat.preview, maxPreviewLen)}
                            </p>
                          </>
                        )}
                      </div>
                      {/* Floating ⋯ menu (hidden in selection mode) */}
                      {editingChatId !== chat.id && !selectionMode && (
                        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end pl-2 bg-card">
                          <div className="flex items-center bg-background rounded-md shadow-sm border border-border">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 touch-manipulation"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Chat options"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
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
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat?.(chat.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
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
        <div className="p-2 sm:p-3 border-t border-border space-y-2 shrink-0">
          <Link to="/marketplace">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <Store className="w-4 h-4" />
              <span className="flex-1 text-left">Marketplace</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <div className="pt-2 border-t border-border/60">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Connect
            </p>
            <div className="flex flex-wrap gap-1 px-1">
              <a
                href="https://x.com/syra_agent"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Official X"
                aria-label="Official X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/syra_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Telegram"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://docs.syraa.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Documentation"
                aria-label="Docs"
              >
                <BookOpen className="w-4 h-4" />
              </a>
              <a
                href="https://syraa.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Website"
                aria-label="Website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
      </div>
    </aside>
  );
}
