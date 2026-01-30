import { useState } from "react";
import { Plus, MessageSquare, Settings, User, ChevronDown, Sparkles, Search, Trash2, MoreHorizontal, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface SidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Sidebar({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  isOpen,
  isDarkMode,
  onToggleDarkMode,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-full w-[280px] flex flex-col",
        "bg-card border-r border-border",
        "transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] glow-sm">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">NexusAI</h1>
          <p className="text-xs text-muted-foreground">Intelligent Assistant</p>
        </div>
      </div>

      {/* New Chat Button */}
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

      {/* Search */}
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

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-2">
          {groupedChats.map((group) => (
            <div key={group.label}>
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                      "hover:bg-secondary/80",
                      activeChat === chat.id && "bg-secondary"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.preview}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
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
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground">Pro Plan</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}
