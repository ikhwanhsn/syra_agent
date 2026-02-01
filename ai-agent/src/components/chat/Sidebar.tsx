import { useState, useRef, useEffect } from "react";
import { Plus, MessageSquare, Settings, Sparkles, Search, Trash2, MoreHorizontal, Moon, Sun, Pencil, PanelLeftClose } from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
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
  onRenameChat?: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCollapse?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  chatsLoading?: boolean;
  /** When false, show connect-wallet prompt instead of chat list */
  walletConnected?: boolean;
}

export function Sidebar({
  variant = "overlay",
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isOpen,
  onToggle,
  onCollapse,
  isDarkMode,
  onToggleDarkMode,
  chatsLoading = false,
  walletConnected = true,
}: SidebarProps) {
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const editInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
        isOverlay && "fixed left-0 top-0 z-40 w-[280px] transition-transform duration-300 ease-out",
        isOverlay && (isOpen ? "translate-x-0" : "-translate-x-full"),
        isResizable && "w-full min-w-0"
      )}
    >
      <div ref={sidebarRef} className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border shrink-0">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] glow-sm shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">Syra Agent</h1>
          <p className="text-xs text-muted-foreground truncate">Intelligent Assistant</p>
        </div>
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

      {/* New Chat Button – only when wallet connected */}
      {walletConnected && (
        <div className="p-3">
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

      {/* Search – only when wallet connected */}
      {walletConnected && (
        <div className="px-3 pb-2">
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

      {/* Chat List or Connect Wallet */}
      <ScrollArea className="flex-1 min-w-0 px-2">
        <div className="space-y-4 py-2 min-w-0">
          {!walletConnected ? (
            <ConnectWalletPrompt
              variant="compact"
              onConnectClick={() => setWalletModalVisible(true)}
            />
          ) : chatsLoading ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">Loading chats...</p>
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
                        activeChat === chat.id && "bg-secondary",
                        editingChatId !== chat.id && "cursor-pointer hover:bg-secondary/80 active:bg-secondary/80"
                      )}
                      onClick={() => editingChatId !== chat.id && onSelectChat(chat.id)}
                    >
                      <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
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
                            <p
                              className="text-sm font-medium truncate text-foreground"
                              title={chat.title}
                            >
                              {truncateWithEllipsis(chat.title, maxTitleLen)}
                            </p>
                            <p
                              className="text-xs text-muted-foreground truncate"
                              title={chat.preview}
                            >
                              {truncateWithEllipsis(chat.preview, maxPreviewLen)}
                            </p>
                          </>
                        )}
                      </div>
                      {/* Floating ⋯ button: always on top, never clipped */}
                      {editingChatId !== chat.id && (
                        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end w-12 pl-2 bg-card">
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

      {/* Footer – only when wallet connected */}
      {walletConnected && (
        <div className="p-3 border-t border-border space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={onToggleDarkMode}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      )}
      </div>
    </aside>
  );
}
