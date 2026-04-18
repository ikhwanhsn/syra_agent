import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Sparkles, MessageSquare, Search, TrendingUp, Shield, Zap, Newspaper, BarChart3, Gem, Hash, Sun, ShoppingCart, Star, Clock, User, Users, Heart, LayoutGrid, Plus, Loader2, Pencil, Trash2, Copy, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_PROMPTS,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { useToast } from "@/hooks/use-toast";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { marketplaceApi, userPromptsApi, type UserPromptItem } from "@/lib/chatApi";

const STORAGE_FAVORITES = "syra_marketplace_favorites";
const STORAGE_RECENT = "syra_marketplace_recent";
const STORAGE_CALL_COUNTS = "syra_marketplace_call_counts";
const MAX_RECENT = 10;
export const PROMPTS_PAGE_SIZE = 15;

function loadFavoritesFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFavoritesToStorage(ids: Set<string>) {
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify([...ids]));
}

function loadRecentFromStorage(): Array<{ id: string; title: string; prompt: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentToStorage(items: Array<{ id: string; title: string; prompt: string }>) {
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(items.slice(0, MAX_RECENT)));
}

function loadCallCountsFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_CALL_COUNTS);
    const obj = raw ? JSON.parse(raw) : {};
    return typeof obj === "object" && obj !== null ? obj : {};
  } catch {
    return {};
  }
}

function saveCallCountsToStorage(counts: Record<string, number>) {
  localStorage.setItem(STORAGE_CALL_COUNTS, JSON.stringify(counts));
}

export interface MarketplacePrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: "live_data" | "research" | "trading" | "learning" | "tools" | "general";
  icon: typeof FileText;
}

/** 11 prompts that trigger Syra agent tools (news, signal, sentiment, research, gems, x-search, trending-headline, sundown-digest, memecoin, Jupiter, Squid). Connect wallet to use. */
const TOOL_PROMPTS: MarketplacePrompt[] = [
  { id: "tool-news", title: "Latest crypto news", description: "Fetches latest crypto news (uses News tool).", prompt: "Get me the latest crypto news", category: "live_data", icon: Newspaper },
  { id: "tool-signal", title: "Trading signal for Solana", description: "Gets a trading signal for Solana (uses Signal tool).", prompt: "Give me a trading signal for Solana", category: "live_data", icon: BarChart3 },
  { id: "tool-sentiment", title: "Market sentiment", description: "Current market sentiment analysis (uses Sentiment tool).", prompt: "What's the current market sentiment?", category: "live_data", icon: BarChart3 },
  { id: "tool-research", title: "Deep research", description: "Runs deep research on a topic (uses Research tool).", prompt: "Run deep research on current DeFi and Layer 2 trends", category: "live_data", icon: Search },
  { id: "tool-gems", title: "Gems & curated insights", description: "Finds hidden gems and curated alpha (uses Gems tool).", prompt: "Find me gems or curated insights", category: "live_data", icon: Gem },
  { id: "tool-x-search", title: "Search X (Twitter)", description: "Searches X for crypto chatter (uses X Search tool).", prompt: "Search X for what people are saying about memecoins", category: "live_data", icon: Hash },
  { id: "tool-headlines", title: "Trending headlines", description: "Trending crypto headlines (uses Trending headline tool).", prompt: "What are the trending headlines in crypto?", category: "live_data", icon: TrendingUp },
  { id: "tool-sundown", title: "Sundown digest", description: "Today's daily digest (uses Sundown digest tool).", prompt: "Give me today's sundown digest", category: "live_data", icon: Sun },
  { id: "tool-memecoin-growth", title: "Memecoins: fastest holder growth", description: "Memecoins with fastest holder growth (uses Memecoin tool).", prompt: "Which memecoins have the fastest holder growth?", category: "live_data", icon: Zap },
  { id: "tool-jupiter", title: "Trending on Jupiter", description: "Tokens trending on Jupiter DEX (uses Jupiter tool).", prompt: "What tokens are trending on Jupiter?", category: "live_data", icon: ShoppingCart },
  { id: "tool-squid-route", title: "Cross-chain route (Squid)", description: "Get a cross-chain route/quote from Base to Arbitrum (uses Squid Router tool).", prompt: "Get a cross-chain route from Base to Arbitrum for 100 USDC", category: "live_data", icon: ShoppingCart },
];

const GENERAL_PROMPTS: MarketplacePrompt[] = [
  { id: "solana-dex", title: "Solana & DEX basics", description: "Understand how Solana DEXs work and how they differ from CEXs.", prompt: "Explain how Solana DEXs work and what makes them different from CEXs", category: "learning", icon: FileText },
  { id: "token-research", title: "Token & memecoin research", description: "What to look for when researching a new token or memecoin.", prompt: "What should I look for when researching a new token or memecoin?", category: "research", icon: Search },
  { id: "defi-overview", title: "DeFi basics", description: "Quick overview of DeFi concepts and common terms.", prompt: "Give me a quick overview of DeFi basics and common terms", category: "learning", icon: Sparkles },
  { id: "syra-tools", title: "Syra agent & tools", description: "What the Syra agent can do and when to connect a wallet.", prompt: "What can the Syra agent do? When do I need to connect a wallet?", category: "tools", icon: MessageSquare },
  { id: "security-scan", title: "Token security check", description: "Understand contract safety, liquidity locks, and rug risks.", prompt: "How do I check if a token is safe? What are liquidity locks and renounced mint?", category: "research", icon: Shield },
];

export const MARKETPLACE_PROMPTS: MarketplacePrompt[] = [...TOOL_PROMPTS, ...GENERAL_PROMPTS];

const CATEGORY_LABELS: Record<MarketplacePrompt["category"], string> = {
  live_data: "Live data & tools",
  research: "Research",
  trading: "Trading",
  learning: "Learning",
  tools: "Tools",
  general: "General",
};

export const PROMPTS_GRID =
  "grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

/** MongoDB ObjectId-style id (24 hex chars) = user-created prompt */
function isUserPromptId(id: string): boolean {
  return Boolean(id && id.length === 24 && /^[a-f0-9]+$/i.test(id));
}

export function PromptCard({
  item,
  isFavorite,
  useCount = 0,
  onToggleFavorite,
  onUseInAgent,
  onDuplicate,
  ownerActions,
  isBlinking,
  ownerLabel,
  onShowDetails,
  creatorAnonymousId,
  syraOwnerProfileLink,
}: {
  item: MarketplacePrompt | (Pick<MarketplacePrompt, "id" | "title" | "prompt" | "icon"> & { description?: string; category?: MarketplacePrompt["category"]; anonymousId?: string });
  isFavorite: boolean;
  useCount?: number;
  onToggleFavorite: () => void;
  onUseInAgent: () => void;
  onDuplicate?: () => void;
  ownerActions?: { onEdit: () => void; onDelete: () => void };
  isBlinking?: boolean;
  /** Owner display: "Syra" for system prompts, "User" for user prompts. */
  ownerLabel?: string;
  /** Opens a modal with full prompt details. */
  onShowDetails?: () => void;
  /** When set, owner chip links to this creator's public profile. */
  creatorAnonymousId?: string;
  /** When true and owner is Syra, owner chip links to the official Syra prompts profile. */
  syraOwnerProfileLink?: boolean;
}) {
  const Icon = item.icon;
  const description = "description" in item ? item.description : "";
  const favoriteCount = isFavorite ? 1 : 0;
  const peopleCount = useCount > 0 ? 1 : 0;
  const displayOwner = ownerLabel ?? (isUserPromptId(item.id) ? "User" : "Syra");

  const rawCategory = "category" in item ? item.category : undefined;
  const category =
    rawCategory && rawCategory in CATEGORY_LABELS
      ? CATEGORY_LABELS[rawCategory as MarketplacePrompt["category"]]
      : null;

  return (
    <div
      className={cn(
        "group relative flex h-full min-h-[11rem] flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/75 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/35 before:to-transparent",
        "hover:border-accent/25 hover:bg-card/95 hover:shadow-[0_12px_40px_-16px_hsl(0_0%_0%/0.45)]",
        isBlinking && "prompt-card-blink"
      )}
    >
      {/* Title row: icon + title/description + action buttons */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-gradient-to-br from-accent/15 via-transparent to-transparent shadow-inner">
          <Icon className="h-4 w-4 text-accent" aria-hidden />
        </div>
        <div className="min-h-[3.25rem] min-w-0 flex-1 pr-1">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h3 className="truncate text-[0.9375rem] font-semibold leading-snug tracking-tight text-foreground">
              {item.title}
            </h3>
            {category ? (
              <span className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {category}
              </span>
            ) : null}
          </div>
          <p
            className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground"
            title={description || undefined}
          >
            {description || "\u00A0"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
          {ownerActions ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground opacity-80 transition-opacity hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); ownerActions.onEdit(); }}
                title="Edit prompt"
                aria-label="Edit prompt"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground opacity-80 transition-opacity hover:text-destructive hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); ownerActions.onDelete(); }}
                title="Delete prompt"
                aria-label="Delete prompt"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : null}
          {onDuplicate ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground opacity-80 transition-opacity hover:text-foreground hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              title="Duplicate to your prompts"
              aria-label="Duplicate to your prompts"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg text-muted-foreground opacity-80 transition-all hover:opacity-100",
              isFavorite && "text-amber-500 hover:text-amber-400"
            )}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        {creatorAnonymousId?.trim() ? (
          <Link
            to={`/dashboard/marketplace/prompts/user/${encodeURIComponent(creatorAnonymousId.trim())}`}
            className="inline-flex items-center gap-1 rounded-md bg-muted/35 px-2 py-0.5 tabular-nums text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground"
            title="View creator profile"
            onClick={(e) => e.stopPropagation()}
          >
            <User className="h-3 w-3 shrink-0 opacity-70" />
            {displayOwner}
          </Link>
        ) : syraOwnerProfileLink && displayOwner === "Syra" ? (
          <Link
            to="/dashboard/marketplace/prompts/syra"
            className="inline-flex items-center gap-1 rounded-md bg-muted/35 px-2 py-0.5 tabular-nums text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground"
            title="View Syra official prompts"
            onClick={(e) => e.stopPropagation()}
          >
            <User className="h-3 w-3 shrink-0 opacity-70" />
            {displayOwner}
          </Link>
        ) : (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-muted/35 px-2 py-0.5 tabular-nums"
            title={displayOwner === "User" && "anonymousId" in item && item.anonymousId ? "User: " + item.anonymousId : undefined}
          >
            <User className="h-3 w-3 shrink-0 opacity-70" />
            {displayOwner}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/35 px-2 py-0.5 tabular-nums" title="People who used">
          <Users className="h-3 w-3 shrink-0 opacity-70" />
          {peopleCount} people
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/35 px-2 py-0.5 tabular-nums" title="Times used">
          <Zap className="h-3 w-3 shrink-0 text-accent/80" />
          {useCount} used
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-muted/35 px-2 py-0.5 tabular-nums",
            isFavorite && "font-medium text-amber-600 dark:text-amber-400"
          )}
          title="Favorites"
        >
          <Heart className={cn("h-3 w-3 shrink-0 opacity-70", isFavorite && "fill-current opacity-100")} />
          {favoriteCount} favorite
        </span>
      </div>
      <div className="mt-auto flex w-full gap-2">
        <Button
          variant="default"
          size="sm"
          className="h-9 min-w-0 flex-1 rounded-lg border-0 bg-accent text-xs font-medium text-accent-foreground shadow-[0_0_28px_-10px_hsl(var(--accent)/0.75)] transition-shadow hover:bg-accent/92 hover:shadow-[0_0_32px_-8px_hsl(var(--accent)/0.65)]"
          onClick={onUseInAgent}
          title={item.prompt}
        >
          <MessageSquare className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          Use in agent
        </Button>
        {onShowDetails ? (
          <Button
            variant="outline"
            size="sm"
            className="h-9 min-w-0 flex-1 rounded-lg border-border/70 bg-background/50 text-xs font-medium text-foreground backdrop-blur-sm hover:bg-muted/50"
            onClick={(e) => { e.stopPropagation(); onShowDetails(); }}
            title="View prompt details"
          >
            <Info className="mr-1.5 h-3.5 w-3.5 shrink-0" />
            Details
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type SectionId = "all" | "my_prompt" | "recent" | "favorite";

export function PaginationBar({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
      <p className="text-xs tabular-nums text-muted-foreground">
        Showing <span className="font-medium text-foreground/90">{start}</span>–
        <span className="font-medium text-foreground/90">{end}</span> of {totalItems}
      </p>
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/20 p-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-lg p-0 hover:bg-background/80"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[5.5rem] px-2 text-center text-xs tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-lg p-0 hover:bg-background/80"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const SECTIONS: { id: SectionId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "my_prompt", label: "My prompt", icon: FileText },
  { id: "recent", label: "Recently used", icon: Clock },
  { id: "favorite", label: "Favorite", icon: Heart },
];

export default function MarketplacePrompts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openConnectModal } = useConnectModal();
  const { anonymousId, connectedWalletAddress } = useAgentWallet();
  /** Only sync preferences / user prompts with DB when wallet is connected. */
  const walletConnected = !!connectedWalletAddress;
  const [connectWalletForCreateOpen, setConnectWalletForCreateOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavoritesFromStorage);
  const [recent, setRecent] = useState<Array<{ id: string; title: string; prompt: string }>>(loadRecentFromStorage);
  const [callCounts, setCallCounts] = useState<Record<string, number>>(loadCallCountsFromStorage);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const putTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // User-created prompts (from API / MongoDB)
  const [userPromptsList, setUserPromptsList] = useState<UserPromptItem[]>([]);
  const [userPromptsLoading, setUserPromptsLoading] = useState(false);
  const [userPromptsError, setUserPromptsError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createPrompt, setCreatePrompt] = useState("");
  const [createCategory, setCreateCategory] = useState<MarketplacePrompt["category"]>("general");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit prompt
  const [editingPrompt, setEditingPrompt] = useState<UserPromptItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editCategory, setEditCategory] = useState<MarketplacePrompt["category"]>("general");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete (single)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /** Newly created prompt id to show blink in Your prompts after duplicate/redirect. */
  const [newlyCreatedPromptId, setNewlyCreatedPromptId] = useState<string | null>(null);

  /** Details modal: prompt info to show and handler to run when "Use in agent" is clicked. */
  const [detailsPrompt, setDetailsPrompt] = useState<{
    title: string;
    description: string;
    prompt: string;
    category?: string;
    owner: string;
    creatorAnonymousId?: string | null;
  } | null>(null);
  const [detailsOnUse, setDetailsOnUse] = useState<(() => void) | null>(null);

  const openDetails = useCallback(
    (
      item: { title: string; description?: string; prompt: string; category?: string },
      owner: string,
      onUse: () => void,
      creatorAnonymousId?: string | null
    ) => {
      setDetailsPrompt({
        title: item.title,
        description: item.description ?? "",
        prompt: item.prompt,
        category: item.category,
        owner,
        creatorAnonymousId: creatorAnonymousId?.trim() || null,
      });
      setDetailsOnUse(() => () => {
        onUse();
        setDetailsPrompt(null);
        setDetailsOnUse(null);
      });
    },
    []
  );

  // Fetch user-created prompts (community prompts from MongoDB)
  const fetchUserPrompts = useCallback(() => {
    setUserPromptsLoading(true);
    setUserPromptsError(null);
    userPromptsApi
      .list({ limit: 100 })
      .then(({ prompts }) => setUserPromptsList(prompts))
      .catch((err) => setUserPromptsError(err?.message ?? "Failed to load community prompts"))
      .finally(() => setUserPromptsLoading(false));
  }, []);

  useEffect(() => {
    fetchUserPrompts();
  }, [fetchUserPrompts]);

  // Load from API only when wallet is connected (DB access requires wallet)
  useEffect(() => {
    if (!walletConnected || !anonymousId?.trim()) {
      setPrefsLoaded(true);
      return;
    }
    setPrefsLoaded(false);
    const localFav = loadFavoritesFromStorage();
    const localRecent = loadRecentFromStorage();
    const localCounts = loadCallCountsFromStorage();
    const hasLocal = localFav.size > 0 || localRecent.length > 0 || Object.keys(localCounts).length > 0;

    marketplaceApi
      .get(anonymousId)
      .then((prefs) => {
        const apiEmpty =
          (prefs.favorites?.length ?? 0) === 0 &&
          (prefs.recent?.length ?? 0) === 0 &&
          Object.keys(prefs.callCounts ?? {}).length === 0;
        if (apiEmpty && hasLocal) {
          return marketplaceApi
            .put(anonymousId, {
              favorites: [...localFav],
              recent: localRecent,
              callCounts: localCounts,
            })
            .then((updated) => updated);
        }
        return prefs;
      })
      .then((prefs) => {
        const f = Array.isArray(prefs.favorites) ? prefs.favorites : [];
        const r = Array.isArray(prefs.recent) ? prefs.recent.slice(0, MAX_RECENT) : [];
        const c = prefs.callCounts && typeof prefs.callCounts === "object" ? prefs.callCounts : {};
        setFavorites(new Set(f));
        setRecent(r);
        setCallCounts(c);
      })
      .catch(() => {
        if (hasLocal) {
          setFavorites(localFav);
          setRecent(localRecent);
          setCallCounts(localCounts);
        }
      })
      .finally(() => setPrefsLoaded(true));
  }, [anonymousId, walletConnected]);

  // Persist: to API (debounced) only when wallet connected; otherwise localStorage only
  const schedulePut = useCallback(() => {
    if (!walletConnected || !anonymousId?.trim()) return;
    if (putTimeoutRef.current) clearTimeout(putTimeoutRef.current);
    putTimeoutRef.current = setTimeout(() => {
      putTimeoutRef.current = null;
      marketplaceApi
        .put(anonymousId, {
          favorites: [...favorites],
          recent: recent.slice(0, MAX_RECENT),
          callCounts,
        })
        .catch(() => {});
    }, 400);
  }, [walletConnected, anonymousId, favorites, recent, callCounts]);

  useEffect(() => {
    if (!prefsLoaded) return;
    if (walletConnected && anonymousId?.trim()) {
      schedulePut();
      return () => {
        if (putTimeoutRef.current) clearTimeout(putTimeoutRef.current);
      };
    }
    saveFavoritesToStorage(favorites);
  }, [favorites, walletConnected, anonymousId, prefsLoaded, schedulePut]);

  useEffect(() => {
    if (!prefsLoaded) return;
    if (walletConnected && anonymousId?.trim()) {
      schedulePut();
      return () => {
        if (putTimeoutRef.current) clearTimeout(putTimeoutRef.current);
      };
    }
    saveRecentToStorage(recent);
  }, [recent, walletConnected, anonymousId, prefsLoaded, schedulePut]);

  useEffect(() => {
    if (!prefsLoaded) return;
    if (walletConnected && anonymousId?.trim()) {
      schedulePut();
      return () => {
        if (putTimeoutRef.current) clearTimeout(putTimeoutRef.current);
      };
    }
    saveCallCountsToStorage(callCounts);
  }, [callCounts, walletConnected, anonymousId, prefsLoaded, schedulePut]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleUseInAgent = useCallback(
    (item: MarketplacePrompt) => {
      const nextCallCounts = { ...callCounts, [item.id]: (callCounts[item.id] ?? 0) + 1 };
      const nextRecent = [
        { id: item.id, title: item.title, prompt: item.prompt },
        ...recent.filter((r) => r.id !== item.id),
      ].slice(0, MAX_RECENT);

      setCallCounts(nextCallCounts);
      setRecent(nextRecent);
      saveCallCountsToStorage(nextCallCounts);
      saveRecentToStorage(nextRecent);

      if (walletConnected && anonymousId?.trim()) {
        marketplaceApi
          .put(anonymousId, {
            favorites: [...favorites],
            recent: nextRecent,
            callCounts: nextCallCounts,
          })
          .catch(() => {});
      }

      navigate("/", { state: { prompt: item.prompt } });
    },
    [navigate, walletConnected, anonymousId, favorites, recent, callCounts]
  );

  const recordRecentAndNavigate = useCallback(
    (prompt: string, title: string, id: string) => {
      const nextCallCounts = { ...callCounts, [id]: (callCounts[id] ?? 0) + 1 };
      const nextRecent = [
        { id, title, prompt },
        ...recent.filter((r) => r.id !== id),
      ].slice(0, MAX_RECENT);

      setCallCounts(nextCallCounts);
      setRecent(nextRecent);
      saveCallCountsToStorage(nextCallCounts);
      saveRecentToStorage(nextRecent);

      if (walletConnected && anonymousId?.trim()) {
        marketplaceApi
          .put(anonymousId, {
            favorites: [...favorites],
            recent: nextRecent,
            callCounts: nextCallCounts,
          })
          .catch(() => {});
      }

      navigate("/", { state: { prompt } });
    },
    [navigate, walletConnected, anonymousId, favorites, recent, callCounts]
  );

  const handleUseUserPrompt = useCallback(
    (item: UserPromptItem) => {
      userPromptsApi.recordUse(item.id).catch(() => {});
      const nextRecent = [
        { id: item.id, title: item.title, prompt: item.prompt },
        ...recent.filter((r) => r.id !== item.id),
      ].slice(0, MAX_RECENT);
      setRecent(nextRecent);
      saveRecentToStorage(nextRecent);
      if (anonymousId?.trim()) {
        marketplaceApi
          .put(anonymousId, {
            favorites: [...favorites],
            recent: nextRecent,
            callCounts,
          })
          .catch(() => {});
      }
      navigate("/", { state: { prompt: item.prompt } });
    },
    [navigate, anonymousId, favorites, recent, callCounts]
  );

  const handleCreatePrompt = useCallback(() => {
    if (!walletConnected || !anonymousId?.trim()) {
      setCreateError("Connect your wallet to create prompts.");
      return;
    }
    const title = createTitle.trim();
    const promptText = createPrompt.trim();
    if (!title || !promptText) {
      setCreateError("Title and prompt text are required.");
      return;
    }
    setCreateError(null);
    setCreateSubmitting(true);
    userPromptsApi
      .create(anonymousId, {
        title,
        description: createDescription.trim() || undefined,
        prompt: promptText,
        category: createCategory,
      })
      .then(({ prompt: created }) => {
        setUserPromptsList((prev) => [created, ...prev]);
        setCreateTitle("");
        setCreateDescription("");
        setCreatePrompt("");
        setCreateCategory("general");
        setCreateModalOpen(false);
      })
      .catch((err) => setCreateError(err?.message ?? "Failed to create prompt"))
      .finally(() => setCreateSubmitting(false));
  }, [walletConnected, anonymousId, createTitle, createDescription, createPrompt, createCategory]);

  /** Opens create modal when signed in; otherwise shows connect-wallet alert. */
  const beginCreatePrompt = useCallback(() => {
    if (!walletConnected) {
      setConnectWalletForCreateOpen(true);
      return;
    }
    if (!anonymousId?.trim()) {
      toast({
        title: "Session not ready",
        description: "Please wait a moment and try again.",
      });
      return;
    }
    setCreateError(null);
    setCreateModalOpen(true);
  }, [walletConnected, anonymousId, toast]);

  // Sync edit form when editingPrompt changes
  useEffect(() => {
    if (editingPrompt) {
      setEditTitle(editingPrompt.title);
      setEditDescription(editingPrompt.description ?? "");
      setEditPrompt(editingPrompt.prompt);
      setEditCategory((editingPrompt.category as MarketplacePrompt["category"]) ?? "general");
      setEditError(null);
    }
  }, [editingPrompt]);

  const handleSaveEdit = useCallback(() => {
    if (!editingPrompt || !walletConnected || !anonymousId?.trim()) return;
    const title = editTitle.trim();
    const promptText = editPrompt.trim();
    if (!title || !promptText) {
      setEditError("Title and prompt text are required.");
      return;
    }
    setEditError(null);
    setEditSubmitting(true);
    userPromptsApi
      .update(editingPrompt.id, anonymousId, {
        title,
        description: editDescription.trim() || undefined,
        prompt: promptText,
        category: editCategory,
      })
      .then(({ prompt: updated }) => {
        setUserPromptsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setEditingPrompt(null);
      })
      .catch((err) => setEditError(err?.message ?? "Failed to update prompt"))
      .finally(() => setEditSubmitting(false));
  }, [editingPrompt, walletConnected, anonymousId, editTitle, editDescription, editPrompt, editCategory]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmId || !walletConnected || !anonymousId?.trim()) return;
    userPromptsApi.delete(deleteConfirmId, anonymousId).then(() => {
      setUserPromptsList((prev) => prev.filter((p) => p.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    });
  }, [deleteConfirmId, walletConnected, anonymousId]);

  const handleDuplicatePrompt = useCallback(
    (payload: { title: string; description: string; prompt: string; category: MarketplacePrompt["category"] }) => {
      if (!walletConnected || !anonymousId?.trim()) {
        toast({
          title: "Wallet required",
          description: "Connect your wallet to duplicate prompts.",
          variant: "destructive",
        });
        return;
      }
      userPromptsApi
        .create(anonymousId, {
          title: payload.title,
          description: payload.description || undefined,
          prompt: payload.prompt,
          category: payload.category,
        })
        .then(({ prompt: created }) => {
          setUserPromptsList((prev) => [created, ...prev]);
          setActiveSection("my_prompt");
          setNewlyCreatedPromptId(created.id);
          setTimeout(() => setNewlyCreatedPromptId(null), 600);
          toast({
            title: "Prompt duplicated",
            description: "Added under My prompt.",
          });
        })
        .catch(() => {
          toast({
            title: "Duplicate failed",
            description: "Failed to duplicate prompt. Please try again.",
            variant: "destructive",
          });
        });
    },
    [walletConnected, anonymousId, toast]
  );

  const categoryOrder: MarketplacePrompt["category"][] = ["live_data", "research", "trading", "learning", "tools", "general"];

  const favoritePrompts = MARKETPLACE_PROMPTS.filter((p) => favorites.has(p.id));
  const recentPrompts = recent.map((r) => {
    const found = MARKETPLACE_PROMPTS.find((p) => p.id === r.id);
    if (found) return found;
    return { id: r.id, title: r.title, description: "", prompt: r.prompt, category: "general" as const, icon: Clock };
  });

  const [activeSection, setActiveSection] = useState<SectionId>("all");
  const [allSortBy, setAllSortBy] = useState<"popular" | "used" | "newest">("used");
  const [promptPage, setPromptPage] = useState(1);

  useEffect(() => {
    setPromptPage(1);
  }, [activeSection]);

  /** Combined list for All section: system + user prompts, with useCount and createdAt for sorting */
  type AllPromptEntry =
    | { type: "system"; item: MarketplacePrompt; useCount: number; createdAt: number }
    | { type: "user"; item: UserPromptItem; useCount: number; createdAt: string };
  const allPromptsCombined: AllPromptEntry[] = [
    ...MARKETPLACE_PROMPTS.map((p) => ({
      type: "system" as const,
      item: p,
      useCount: callCounts[p.id] ?? 0,
      createdAt: 0,
    })),
    ...userPromptsList.map((p) => ({
      type: "user" as const,
      item: p,
      useCount: p.useCount ?? 0,
      createdAt: p.createdAt ?? "",
    })),
  ];
  const allPromptsSorted = [...allPromptsCombined].sort((a, b) => {
    if (allSortBy === "popular" || allSortBy === "used") {
      return b.useCount - a.useCount;
    }
    if (allSortBy === "newest") {
      const dateA = a.createdAt === 0 || a.createdAt === "" ? 0 : new Date(a.createdAt as string).getTime();
      const dateB = b.createdAt === 0 || b.createdAt === "" ? 0 : new Date(b.createdAt as string).getTime();
      return dateB - dateA;
    }
    return 0;
  });

  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, "relative", PAGE_PADDING_TOP_PROMPTS, PAGE_SAFE_AREA_BOTTOM)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(28rem,50vh)] max-w-4xl bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--accent)/0.14),transparent_65%)]"
        aria-hidden
      />
      <div className="relative z-10 space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Library</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Prompts</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use a prompt in the agent to start a conversation. Live data prompts trigger paid tools—connect your wallet to use them.
              Connect your wallet to sync favorites and create or edit prompts. On official Syra cards, click the Syra owner chip to open all Syra prompts.
            </p>
          </div>
          <Button
            type="button"
            onClick={beginCreatePrompt}
            className="shrink-0 gap-2 rounded-xl border-0 bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create prompt
          </Button>
        </div>
      </header>

      {/* Section tabs at top */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-border/50 bg-muted/20 p-1 shadow-inner backdrop-blur-sm">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const count =
            id === "all"
              ? allPromptsSorted.length
              : id === "my_prompt"
                ? anonymousId?.trim()
                  ? userPromptsList.filter((p) => p.anonymousId === anonymousId).length
                  : 0
                : id === "favorite"
                  ? favoritePrompts.length
                  : id === "recent"
                    ? recentPrompts.length
                    : undefined;
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={cn(
                "flex min-h-[2.5rem] items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "bg-background/95 text-foreground shadow-md ring-1 ring-border/70"
                  : "text-muted-foreground hover:bg-background/45 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive && "text-accent")} />
              <span>{label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[11px] tabular-nums",
                    isActive ? "bg-muted/80 text-muted-foreground" : "bg-muted/40 text-muted-foreground/90"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content for active section */}
      <div className="min-h-[200px]">
        {activeSection === "all" && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Official Syra prompts and community prompts. Use sort to surface what you need.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/40 px-2 py-1 backdrop-blur-sm">
                <span className="whitespace-nowrap pl-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sort
                </span>
                <Select value={allSortBy} onValueChange={(v) => setAllSortBy(v as "popular" | "used" | "newest")}>
                  <SelectTrigger className="h-9 w-[10.5rem] rounded-lg border-0 bg-transparent text-xs shadow-none ring-0 focus:ring-0" aria-label="Sort prompts">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border-border">
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="used">Most used</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {userPromptsError && userPromptsList.length === 0 && (
              <p className="text-sm text-destructive py-2 mb-2">{userPromptsError}</p>
            )}
            {userPromptsLoading && (
              <p className="text-xs text-muted-foreground py-1 flex items-center gap-2 mb-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading community prompts…
              </p>
            )}
            {(() => {
              const total = allPromptsSorted.length;
              const start = (promptPage - 1) * PROMPTS_PAGE_SIZE;
              const pageItems = allPromptsSorted.slice(start, start + PROMPTS_PAGE_SIZE);
              return (
                <>
                  <div className={PROMPTS_GRID}>
                {pageItems.map((entry) =>
                  entry.type === "system" ? (
                    <div key={entry.item.id}>
                      <PromptCard
                        item={entry.item}
                        isFavorite={favorites.has(entry.item.id)}
                        useCount={entry.useCount}
                        onToggleFavorite={() => toggleFavorite(entry.item.id)}
                        onUseInAgent={() => handleUseInAgent(entry.item)}
                        onDuplicate={() =>
                          handleDuplicatePrompt({
                            title: entry.item.title,
                            description: entry.item.description ?? "",
                            prompt: entry.item.prompt,
                            category: entry.item.category,
                          })
                        }
                        isBlinking={newlyCreatedPromptId === entry.item.id}
                        syraOwnerProfileLink
                        onShowDetails={() => openDetails(entry.item, "Syra", () => handleUseInAgent(entry.item))}
                      />
                    </div>
                  ) : (
                    <div key={entry.item.id}>
                      <PromptCard
                        item={{ ...entry.item, icon: FileText }}
                        isFavorite={favorites.has(entry.item.id)}
                        useCount={entry.useCount}
                        onToggleFavorite={() => toggleFavorite(entry.item.id)}
                        onUseInAgent={() => handleUseUserPrompt(entry.item)}
                        onDuplicate={() =>
                          handleDuplicatePrompt({
                            title: entry.item.title,
                            description: entry.item.description ?? "",
                            prompt: entry.item.prompt,
                            category: (entry.item.category as MarketplacePrompt["category"]) ?? "general",
                          })
                        }
                        isBlinking={newlyCreatedPromptId === entry.item.id}
                        ownerActions={
                          anonymousId?.trim() && entry.item.anonymousId === anonymousId
                            ? {
                                onEdit: () => setEditingPrompt(entry.item),
                                onDelete: () => setDeleteConfirmId(entry.item.id),
                              }
                            : undefined
                        }
                        creatorAnonymousId={entry.item.anonymousId}
                        onShowDetails={() =>
                          openDetails(entry.item, "User", () => handleUseUserPrompt(entry.item), entry.item.anonymousId)
                        }
                      />
                    </div>
                  )
                )}
                  </div>
                  <PaginationBar
                    page={promptPage}
                    totalItems={total}
                    pageSize={PROMPTS_PAGE_SIZE}
                    onPageChange={setPromptPage}
                  />
                </>
              );
            })()}
          </section>
        )}

        {activeSection === "my_prompt" && (
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prompts you created and published. Open <span className="font-medium text-foreground/90">All</span> to browse
              everyone&apos;s prompts, including community entries.
            </p>

            {!anonymousId?.trim() && (
              <p className="text-sm text-muted-foreground py-3 px-3 rounded-lg bg-muted/30 border border-border/50">
                Connect your wallet to create prompts and see them here.
              </p>
            )}

            <div>
              {!anonymousId?.trim() ? (
                <p className="text-sm text-muted-foreground py-3 px-3 rounded-lg bg-muted/30 border border-border/50">
                  Sign in to see prompts you have created.
                </p>
              ) : userPromptsLoading ? (
                <p className="text-sm text-muted-foreground py-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </p>
              ) : userPromptsError ? (
                <p className="text-sm text-destructive py-3">{userPromptsError}</p>
              ) : (() => {
                const myPrompts = userPromptsList.filter((p) => p.anonymousId === anonymousId);
                if (myPrompts.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground py-3 px-3 rounded-lg bg-muted/30 border border-border/50">
                      You haven&apos;t created any prompts yet. Use the <span className="font-medium text-foreground/90">Create prompt</span>{" "}
                      button at the top to add one.
                    </p>
                  );
                }
                const total = myPrompts.length;
                const start = (promptPage - 1) * PROMPTS_PAGE_SIZE;
                const pageItems = myPrompts.slice(start, start + PROMPTS_PAGE_SIZE);
                return (
                  <>
                    <div className={PROMPTS_GRID}>
                      {pageItems.map((item) => (
                        <PromptCard
                          key={item.id}
                          item={{ ...item, icon: FileText }}
                          isFavorite={favorites.has(item.id)}
                          useCount={item.useCount}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onUseInAgent={() => handleUseUserPrompt(item)}
                          onDuplicate={() =>
                            handleDuplicatePrompt({
                              title: item.title,
                              description: item.description ?? "",
                              prompt: item.prompt,
                              category: (item.category as MarketplacePrompt["category"]) ?? "general",
                            })
                          }
                          isBlinking={newlyCreatedPromptId === item.id}
                          ownerActions={{
                            onEdit: () => setEditingPrompt(item),
                            onDelete: () => setDeleteConfirmId(item.id),
                          }}
                          onShowDetails={() =>
                            openDetails(item, "User", () => handleUseUserPrompt(item), item.anonymousId)
                          }
                        />
                      ))}
                    </div>
                    <PaginationBar
                      page={promptPage}
                      totalItems={total}
                      pageSize={PROMPTS_PAGE_SIZE}
                      onPageChange={setPromptPage}
                    />
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* Prompt details modal */}
        <Dialog open={!!detailsPrompt} onOpenChange={(open) => { if (!open) { setDetailsPrompt(null); setDetailsOnUse(null); } }}>
          <DialogContent className="border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">{detailsPrompt?.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground">
                  <span>By {detailsPrompt?.owner}</span>
                  {detailsPrompt?.owner === "Syra" ? (
                    <>
                      <span className="text-muted-foreground/40" aria-hidden>
                        ·
                      </span>
                      <Link
                        to="/dashboard/marketplace/prompts/syra"
                        className="font-medium text-accent underline-offset-4 hover:underline"
                        onClick={() => {
                          setDetailsPrompt(null);
                          setDetailsOnUse(null);
                        }}
                      >
                        Syra profile
                      </Link>
                    </>
                  ) : null}
                  {detailsPrompt?.creatorAnonymousId ? (
                    <>
                      <span className="text-muted-foreground/40" aria-hidden>
                        ·
                      </span>
                      <Link
                        to={`/dashboard/marketplace/prompts/user/${encodeURIComponent(detailsPrompt.creatorAnonymousId)}`}
                        className="font-medium text-accent underline-offset-4 hover:underline"
                        onClick={() => {
                          setDetailsPrompt(null);
                          setDetailsOnUse(null);
                        }}
                      >
                        Creator profile
                      </Link>
                    </>
                  ) : null}
                </div>
              </DialogDescription>
            </DialogHeader>
            {detailsPrompt && (
              <div className="grid gap-3 py-2 text-sm">
                {detailsPrompt.description ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                    <p className="text-foreground whitespace-pre-wrap break-words">{detailsPrompt.description}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Prompt</p>
                  <p className="text-foreground whitespace-pre-wrap break-words rounded-md bg-muted/50 p-2.5">{detailsPrompt.prompt}</p>
                </div>
                {detailsPrompt.category ? (
                  <p className="text-xs text-muted-foreground">
                    Category: <span className="capitalize">{detailsPrompt.category.replace("_", " ")}</span>
                  </p>
                ) : null}
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" className="rounded-lg border-border/70" onClick={() => { setDetailsPrompt(null); setDetailsOnUse(null); }}>
                Close
              </Button>
              <Button
                onClick={() => detailsOnUse?.()}
                className="gap-2 rounded-lg border-0 bg-accent text-accent-foreground shadow-md hover:bg-accent/90"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Use in agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create prompt modal */}
        <Dialog open={createModalOpen} onOpenChange={(open) => { setCreateModalOpen(open); if (!open) setCreateError(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create prompt</DialogTitle>
              <DialogDescription>
                Add a prompt that you and others can use in the agent. Title and prompt text are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <Label htmlFor="modal-create-title" className="text-xs">Title</Label>
                <Input
                  id="modal-create-title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Explain Solana staking"
                  className="mt-1"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="modal-create-description" className="text-xs">Description (optional)</Label>
                <Input
                  id="modal-create-description"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Short description for others"
                  className="mt-1"
                  maxLength={200}
                />
              </div>
              <div>
                <Label htmlFor="modal-create-prompt" className="text-xs">Prompt text</Label>
                <Textarea
                  id="modal-create-prompt"
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="The exact text to send to the agent when someone uses this prompt"
                  className="mt-1 min-h-[80px] resize-y"
                  maxLength={2000}
                />
              </div>
              <div>
                <Label htmlFor="modal-create-category" className="text-xs">Category</Label>
                <Select
                  value={createCategory}
                  onValueChange={(v) => setCreateCategory(v as MarketplacePrompt["category"])}
                >
                  <SelectTrigger id="modal-create-category" className="mt-1 h-9 w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border-border">
                    {categoryOrder.map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {createError && (
                <p className="text-xs text-destructive">{createError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={createSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePrompt}
                disabled={createSubmitting || !createTitle.trim() || !createPrompt.trim()}
                className="gap-2"
              >
                {createSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {createSubmitting ? "Creating…" : "Create prompt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={connectWalletForCreateOpen} onOpenChange={setConnectWalletForCreateOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Connect your wallet</AlertDialogTitle>
              <AlertDialogDescription>
                You need a connected wallet to create prompts. Your prompts are tied to your account and appear in the
                community library after you publish them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel className="mt-0">Not now</AlertDialogCancel>
              <Button
                type="button"
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => {
                  setConnectWalletForCreateOpen(false);
                  openConnectModal();
                }}
              >
                Connect wallet
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit prompt modal */}
        <Dialog open={!!editingPrompt} onOpenChange={(open) => { if (!open) { setEditingPrompt(null); setEditError(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit prompt</DialogTitle>
              <DialogDescription>
                Update the title, description, prompt text, or category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <Label htmlFor="modal-edit-title" className="text-xs">Title</Label>
                <Input
                  id="modal-edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Explain Solana staking"
                  className="mt-1"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="modal-edit-description" className="text-xs">Description (optional)</Label>
                <Input
                  id="modal-edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Short description for others"
                  className="mt-1"
                  maxLength={200}
                />
              </div>
              <div>
                <Label htmlFor="modal-edit-prompt" className="text-xs">Prompt text</Label>
                <Textarea
                  id="modal-edit-prompt"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="The exact text to send to the agent"
                  className="mt-1 min-h-[80px] resize-y"
                  maxLength={2000}
                />
              </div>
              <div>
                <Label htmlFor="modal-edit-category" className="text-xs">Category</Label>
                <Select
                  value={editCategory}
                  onValueChange={(v) => setEditCategory(v as MarketplacePrompt["category"])}
                >
                  <SelectTrigger id="modal-edit-category" className="mt-1 h-9 w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border-border">
                    {categoryOrder.map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editError && (
                <p className="text-xs text-destructive">{editError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingPrompt(null)}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editSubmitting || !editTitle.trim() || !editPrompt.trim()}
                className="gap-2"
              >
                {editSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {editSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Single delete confirm */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this prompt?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The prompt will be removed for everyone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {activeSection === "recent" && (
          <section>
            {recentPrompts.length > 0 ? (
              <>
                <div className={PROMPTS_GRID}>
                  {recentPrompts
                    .slice((promptPage - 1) * PROMPTS_PAGE_SIZE, promptPage * PROMPTS_PAGE_SIZE)
                    .map((item) => (
                      <div key={item.id}>
                        <PromptCard
                          item={item}
                          isFavorite={favorites.has(item.id)}
                          useCount={callCounts[item.id] ?? 0}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onUseInAgent={() => {
                            if ("category" in item && item.category && MARKETPLACE_PROMPTS.some((p) => p.id === item.id)) {
                              handleUseInAgent(item as MarketplacePrompt);
                            } else {
                              if (walletConnected && isUserPromptId(item.id)) userPromptsApi.recordUse(item.id).catch(() => {});
                              recordRecentAndNavigate(item.prompt, item.title, item.id);
                            }
                          }}
                          onDuplicate={() =>
                            handleDuplicatePrompt({
                              title: item.title,
                              description: "description" in item ? (item.description ?? "") : "",
                              prompt: item.prompt,
                              category: "category" in item && item.category ? item.category : "general",
                            })
                          }
                          isBlinking={newlyCreatedPromptId === item.id}
                          syraOwnerProfileLink={MARKETPLACE_PROMPTS.some((p) => p.id === item.id)}
                          onShowDetails={() => {
                            const owner = MARKETPLACE_PROMPTS.some((p) => p.id === item.id) ? "Syra" : "User";
                            const onUse = () => {
                              if ("category" in item && item.category && MARKETPLACE_PROMPTS.some((p) => p.id === item.id)) {
                                handleUseInAgent(item as MarketplacePrompt);
                              } else {
                                if (walletConnected && isUserPromptId(item.id)) userPromptsApi.recordUse(item.id).catch(() => {});
                                recordRecentAndNavigate(item.prompt, item.title, item.id);
                              }
                            };
                            openDetails(
                              {
                                title: item.title,
                                description: "description" in item ? (item.description ?? "") : "",
                                prompt: item.prompt,
                                category: "category" in item && item.category ? item.category : undefined,
                              },
                              owner,
                              onUse
                            );
                          }}
                        />
                      </div>
                    ))}
                </div>
                <PaginationBar
                  page={promptPage}
                  totalItems={recentPrompts.length}
                  pageSize={PROMPTS_PAGE_SIZE}
                  onPageChange={setPromptPage}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-3 px-3 rounded-lg bg-muted/30 border border-border/50">
                No recently used prompts. Use a prompt in the agent to see it here.
              </p>
            )}
          </section>
        )}

        {activeSection === "favorite" && (
          <section>
            {favoritePrompts.length > 0 ? (
              <>
                <div className={PROMPTS_GRID}>
                  {favoritePrompts
                    .slice((promptPage - 1) * PROMPTS_PAGE_SIZE, promptPage * PROMPTS_PAGE_SIZE)
                    .map((item) => (
                      <div key={item.id}>
                        <PromptCard
                          item={item}
                          isFavorite={true}
                          useCount={callCounts[item.id] ?? 0}
                          onToggleFavorite={() => toggleFavorite(item.id)}
                          onUseInAgent={() => handleUseInAgent(item)}
                          onDuplicate={() =>
                            handleDuplicatePrompt({
                              title: item.title,
                              description: item.description ?? "",
                              prompt: item.prompt,
                              category: item.category,
                            })
                          }
                          isBlinking={newlyCreatedPromptId === item.id}
                          syraOwnerProfileLink
                          onShowDetails={() => openDetails(item, "Syra", () => handleUseInAgent(item))}
                        />
                      </div>
                    ))}
                </div>
                <PaginationBar
                  page={promptPage}
                  totalItems={favoritePrompts.length}
                  pageSize={PROMPTS_PAGE_SIZE}
                  onPageChange={setPromptPage}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-3 px-3 rounded-lg bg-muted/30 border border-border/50">
                No favorites yet.{" "}
                <Link to="/dashboard/marketplace/prompts/syra" className="font-medium text-accent underline-offset-4 hover:underline">
                  Browse Syra prompts
                </Link>{" "}
                or star any prompt to add it here.
              </p>
            )}
          </section>
        )}
      </div>
      </div>
    </div>
  );
}
