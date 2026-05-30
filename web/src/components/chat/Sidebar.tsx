"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Square,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { Button } from "@/components/ui/button";
import { ChatSidebarToggle } from "@/components/chat/ChatSidebarToggle";
import { DrawerDismissButton } from "@/components/ui/drawer-dismiss-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConnectWalletPrompt } from "./ConnectWalletPrompt";
import { ShareChatModal } from "./ShareChatModal";
import { ChatSidebarItem } from "./ChatSidebarItem";
import { ChatSidebarSkeleton } from "./ChatSidebarSkeleton";
import { cn } from "@/lib/utils";
import { CHAT_SIDEBAR_TRANSITION } from "@/lib/layoutConstants";

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
  shareId?: string | null;
  isPublic?: boolean;
}

function groupChatsByDate(chats: Chat[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; chats: Chat[] }[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "Previous 7 days", chats: [] },
    { label: "Older", chats: [] },
  ];

  for (const chat of chats) {
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
  }

  return groups.filter((g) => g.chats.length > 0);
}

interface SidebarProps {
  variant?: "overlay" | "resizable";
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat?: (id: string) => void;
  onDeleteChats?: (ids: string[]) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCollapse?: () => void;
  chatsLoading?: boolean;
  sessionReady?: boolean;
  walletConnected?: boolean;
  onToggleShareVisibility?: (chatId: string, isPublic: boolean) => void;
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
}: SidebarProps) {
  const { openConnectModal } = useConnectModal();
  const [shareModalChat, setShareModalChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const groupedChats = groupChatsByDate(filteredChats);
  const hasChats = groupedChats.length > 0;
  const isOverlay = variant === "overlay";
  const isResizable = variant === "resizable";

  useEffect(() => {
    if (!isOverlay) return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    document.body.style.overflow = "";
  }, [isOverlay, isOpen]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  return (
    <aside
      className={cn(
        "flex h-full flex-col text-foreground",
        isOverlay &&
          cn(
            "fixed left-0 z-40 w-[min(300px,calc(100vw-1rem))] max-w-[320px] overflow-hidden",
            "top-[var(--syra-global-nav-height,3.5rem)] h-[calc(100dvh-var(--syra-global-nav-height,3.5rem))]",
            "border-r border-border/60 bg-background/95 backdrop-blur-xl",
            "transition-[transform,box-shadow,visibility]",
            CHAT_SIDEBAR_TRANSITION,
            isOpen
              ? "visible translate-x-0 shadow-[4px_0_28px_-6px_rgba(0,0,0,0.22)] dark:shadow-[4px_0_36px_-8px_rgba(0,0,0,0.55)]"
              : "invisible -translate-x-full shadow-none"
          ),
        isResizable &&
          cn(
            "w-full min-w-0 border-r border-border/60 bg-background/95 backdrop-blur-xl",
            "transition-transform will-change-transform",
            CHAT_SIDEBAR_TRANSITION,
            isOpen ? "translate-x-0" : "-translate-x-3"
          )
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-3">
          {sessionReady ? (
            <Button
              type="button"
              variant="outline"
              onClick={onNewChat}
              className="h-9 flex-1 gap-2 rounded-lg border-dashed border-border/80 bg-transparent text-sm font-medium shadow-none hover:border-border hover:bg-accent/40"
            >
              <Plus className="h-4 w-4 opacity-80" strokeWidth={2} />
              New chat
            </Button>
          ) : (
            <span className="flex-1 px-1 text-sm font-semibold tracking-tight">Chats</span>
          )}
          {isOverlay ? <DrawerDismissButton label="Close" onClick={onToggle} /> : null}
          {isResizable && onCollapse ? (
            <ChatSidebarToggle
              mode="collapse"
              onClick={onCollapse}
              className="h-9 w-9 shrink-0 border-transparent bg-transparent shadow-none hover:bg-accent/50"
            />
          ) : null}
        </div>

        {sessionReady ? (
          <div className="shrink-0 px-3 pb-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border-0 bg-muted/35 py-2 pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/80 focus:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring/40"
              />
            </div>
          </div>
        ) : null}

        {/* Selection toolbar */}
        {sessionReady && walletConnected && hasChats && selectionMode && onDeleteChats ? (
          <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/25 p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={
                selectedIds.size === filteredChats.length
                  ? () => setSelectedIds(new Set())
                  : () => setSelectedIds(new Set(filteredChats.map((c) => c.id)))
              }
            >
              {selectedIds.size === filteredChats.length ? "Deselect" : "Select all"}
            </Button>
            {selectedIds.size > 0 ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {selectedIds.size}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={exitSelectionMode}>
              Done
            </Button>
          </div>
        ) : null}

        {sessionReady && walletConnected && hasChats && !selectionMode && onDeleteChats ? (
          <div className="px-3 pb-1">
            <button
              type="button"
              onClick={() => setSelectionMode(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              <Square className="h-3.5 w-3.5" strokeWidth={2} />
              Select multiple
            </button>
          </div>
        ) : null}

        {/* List */}
        <ScrollArea className="min-h-0 flex-1 px-2">
          <div className="space-y-4 pb-3 pt-1">
            {!sessionReady ? (
              <ConnectWalletPrompt variant="compact" onConnectClick={openConnectModal} />
            ) : !walletConnected ? (
              <div className="mx-1 rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[13px] leading-snug text-muted-foreground">
                      Connect a wallet to save chat history across devices.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-full text-xs"
                      onClick={openConnectModal}
                    >
                      Connect wallet
                    </Button>
                  </div>
                </div>
              </div>
            ) : chatsLoading ? (
              <ChatSidebarSkeleton />
            ) : !hasChats ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term."
                    : "Start a new chat to ask Syra anything."}
                </p>
                {!searchQuery ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 h-9 gap-1.5"
                    onClick={onNewChat}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New chat
                  </Button>
                ) : null}
              </div>
            ) : (
              groupedChats.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-2 text-[11px] font-medium text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.chats.map((chat) => (
                      <ChatSidebarItem
                        key={chat.id}
                        chat={chat}
                        isActive={activeChat === chat.id}
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(chat.id)}
                        isEditing={editingChatId === chat.id}
                        editingTitle={editingTitle}
                        onEditingTitleChange={setEditingTitle}
                        onCommitRename={() => {
                          const trimmed = editingTitle.trim();
                          if (trimmed && trimmed !== chat.title) {
                            onRenameChat?.(chat.id, trimmed);
                          }
                          setEditingChatId(null);
                        }}
                        onCancelRename={() => {
                          setEditingTitle(chat.title);
                          setEditingChatId(null);
                        }}
                        onSelect={() => {
                          if (selectionMode) toggleSelect(chat.id);
                          else onSelectChat(chat.id);
                        }}
                        onToggleSelect={() => toggleSelect(chat.id)}
                        onShare={() => setShareModalChat(chat)}
                        onStartRename={() => {
                          setEditingChatId(chat.id);
                          setEditingTitle(chat.title);
                        }}
                        onDelete={() => onDeleteChat?.(chat.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {shareModalChat?.shareId ? (
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
        ) : null}
      </div>
    </aside>
  );
}
