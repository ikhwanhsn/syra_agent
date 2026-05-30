"use client";

import { useRef, useEffect } from "react";
import {
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { capitalizeFirstLetter, cn } from "@/lib/utils";

export interface ChatSidebarChat {
  id: string;
  title: string;
  preview: string;
  shareId?: string | null;
  isPublic?: boolean;
}

interface ChatSidebarItemProps {
  chat: ChatSidebarChat;
  isActive: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editingTitle: string;
  onEditingTitleChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onSelect: () => void;
  onToggleSelect: () => void;
  onShare: () => void;
  onStartRename: () => void;
  onDelete: () => void;
}

export function ChatSidebarItem({
  chat,
  isActive,
  selectionMode,
  isSelected,
  isEditing,
  editingTitle,
  onEditingTitleChange,
  onCommitRename,
  onCancelRename,
  onSelect,
  onToggleSelect,
  onShare,
  onStartRename,
  onDelete,
}: ChatSidebarItemProps) {
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const title = capitalizeFirstLetter(chat.title);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isEditing) return;
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isEditing) onSelect();
        }
      }}
      className={cn(
        "group/chat relative flex min-h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
        isActive && !selectionMode && "bg-accent/80 text-foreground",
        !isActive && !selectionMode && "hover:bg-accent/45",
        selectionMode && isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/20",
        selectionMode && !isSelected && "hover:bg-accent/40"
      )}
    >
      {selectionMode ? (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
      ) : (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground transition-opacity",
            isActive ? "opacity-100" : "opacity-0 group-hover/chat:opacity-40"
          )}
          aria-hidden
        />
      )}

      <div className="min-w-0 flex-1 pl-0.5">
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editingTitle}
            onChange={(e) => onEditingTitleChange(e.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                onCommitRename();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                onCancelRename();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-[13px] font-medium leading-snug tracking-tight">
                {title}
              </p>
              {chat.shareId ? (
                <span
                  className="shrink-0 text-muted-foreground/70"
                  title={chat.isPublic ? "Public link" : "Private"}
                >
                  {chat.isPublic ? (
                    <Globe className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <Lock className="h-3 w-3" strokeWidth={2} />
                  )}
                </span>
              ) : null}
            </div>
            {chat.preview ? (
              <p className="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground">
                {capitalizeFirstLetter(chat.preview)}
              </p>
            ) : null}
          </>
        )}
      </div>

      {!isEditing && !selectionMode ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0 rounded-md text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/chat:opacity-100",
                isActive && "opacity-70 group-hover/chat:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label="Chat options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-40">
            {chat.shareId ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onStartRename();
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
