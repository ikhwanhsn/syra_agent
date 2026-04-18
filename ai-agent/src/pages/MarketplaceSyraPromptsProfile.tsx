import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_PROMPTS,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { useToast } from "@/hooks/use-toast";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { marketplaceApi, userPromptsApi } from "@/lib/chatApi";
import {
  MARKETPLACE_PROMPTS,
  PaginationBar,
  PromptCard,
  PROMPTS_GRID,
  PROMPTS_PAGE_SIZE,
  type MarketplacePrompt,
} from "@/pages/MarketplacePrompts";

const STORAGE_FAVORITES = "syra_marketplace_favorites";
const STORAGE_RECENT = "syra_marketplace_recent";
const STORAGE_CALL_COUNTS = "syra_marketplace_call_counts";
const MAX_RECENT = 10;

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

export default function MarketplaceSyraPromptsProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { anonymousId, connectedWalletAddress } = useAgentWallet();
  const walletConnected = !!connectedWalletAddress;

  const [favorites, setFavorites] = useState<Set<string>>(loadFavoritesFromStorage);
  const [recent, setRecent] = useState(loadRecentFromStorage);
  const [callCounts, setCallCounts] = useState(loadCallCountsFromStorage);
  const [promptPage, setPromptPage] = useState(1);

  const [detailsPrompt, setDetailsPrompt] = useState<{
    title: string;
    description: string;
    prompt: string;
    category?: string;
  } | null>(null);
  const [detailsOnUse, setDetailsOnUse] = useState<(() => void) | null>(null);

  const syraPromptsFlat = useMemo(() => {
    const byCategory = MARKETPLACE_PROMPTS.reduce(
      (acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      },
      {} as Record<MarketplacePrompt["category"], MarketplacePrompt[]>
    );
    const categoryOrder: MarketplacePrompt["category"][] = [
      "live_data",
      "research",
      "trading",
      "learning",
      "tools",
      "general",
    ];
    return categoryOrder.flatMap((cat) => byCategory[cat] ?? []);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavoritesToStorage(next);
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
        .then(() => {
          toast({ title: "Prompt duplicated", description: "Added to your prompts in the library." });
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

  const openDetails = useCallback((item: MarketplacePrompt, onUse: () => void) => {
    setDetailsPrompt({
      title: item.title,
      description: item.description ?? "",
      prompt: item.prompt,
      category: item.category,
    });
    setDetailsOnUse(() => () => {
      onUse();
      setDetailsPrompt(null);
      setDetailsOnUse(null);
    });
  }, []);

  const total = syraPromptsFlat.length;
  const start = (promptPage - 1) * PROMPTS_PAGE_SIZE;
  const pageItems = syraPromptsFlat.slice(start, start + PROMPTS_PAGE_SIZE);

  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, "relative", PAGE_PADDING_TOP_PROMPTS, PAGE_SAFE_AREA_BOTTOM)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(24rem,45vh)] max-w-4xl bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--accent)/0.12),transparent_65%)]"
        aria-hidden
      />
      <div className="relative z-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <Link to="/dashboard/marketplace/prompts">
              <ArrowLeft className="h-4 w-4" />
              All prompts
            </Link>
          </Button>
        </div>

        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/20 via-transparent to-transparent shadow-inner">
            <Sparkles className="h-10 w-10 text-accent" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Official library</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Syra</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Curated starter prompts from Syra: live data and tools (connect your wallet to run paid tools), plus general
              research and learning prompts. Star any prompt on the main library to save it to Favorites.
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{total}</span> official prompts
            </p>
          </div>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">Syra prompts</h2>
          <div className={PROMPTS_GRID}>
            {pageItems.map((item) => (
              <div key={item.id}>
                <PromptCard
                  item={item}
                  isFavorite={favorites.has(item.id)}
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
                  onShowDetails={() => openDetails(item, () => handleUseInAgent(item))}
                />
              </div>
            ))}
          </div>
          <PaginationBar page={promptPage} totalItems={total} pageSize={PROMPTS_PAGE_SIZE} onPageChange={setPromptPage} />
        </section>

        <Dialog open={!!detailsPrompt} onOpenChange={(open) => { if (!open) { setDetailsPrompt(null); setDetailsOnUse(null); } }}>
          <DialogContent className="border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">{detailsPrompt?.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground">
                  <span>By Syra</span>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <Link
                    to="/dashboard/marketplace/prompts"
                    className="font-medium text-accent underline-offset-4 hover:underline"
                    onClick={() => {
                      setDetailsPrompt(null);
                      setDetailsOnUse(null);
                    }}
                  >
                    Full library
                  </Link>
                </div>
              </DialogDescription>
            </DialogHeader>
            {detailsPrompt && (
              <div className="grid gap-3 py-2 text-sm">
                {detailsPrompt.description ? (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</p>
                    <p className="whitespace-pre-wrap break-words text-foreground">{detailsPrompt.description}</p>
                  </div>
                ) : null}
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Prompt</p>
                  <p className="whitespace-pre-wrap break-words rounded-md bg-muted/50 p-2.5 text-foreground">{detailsPrompt.prompt}</p>
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
      </div>
    </div>
  );
}
