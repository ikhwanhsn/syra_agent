import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, MessageSquare } from "lucide-react";
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
import { agentWalletApi, marketplaceApi, userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { PromptCard, PROMPTS_GRID, type MarketplacePrompt } from "@/pages/MarketplacePrompts";

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

function formatCreatorDisplayId(anonymousId: string): string {
  const m = anonymousId.match(/^wallet:([^:]+)/);
  if (m?.[1]) {
    const addr = m[1];
    if (addr.length > 14) return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    return addr;
  }
  if (anonymousId.length > 22) return `${anonymousId.slice(0, 10)}…${anonymousId.slice(-6)}`;
  return anonymousId;
}

export default function MarketplacePromptCreatorProfile() {
  const { encodedAnonymousId = "" } = useParams<{ encodedAnonymousId: string }>();
  const profileAnonymousId = useMemo(() => {
    try {
      const decoded = decodeURIComponent(encodedAnonymousId);
      return decoded.trim() || "";
    } catch {
      return "";
    }
  }, [encodedAnonymousId]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { anonymousId: viewerAnonymousId, connectedWalletAddress } = useAgentWallet();
  const walletConnected = !!connectedWalletAddress;

  const [favorites, setFavorites] = useState<Set<string>>(loadFavoritesFromStorage);
  const [recent, setRecent] = useState(loadRecentFromStorage);

  const [prompts, setPrompts] = useState<UserPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<string | null>(null);

  const [detailsPrompt, setDetailsPrompt] = useState<{
    title: string;
    description: string;
    prompt: string;
    category?: string;
  } | null>(null);
  const [detailsOnUse, setDetailsOnUse] = useState<(() => void) | null>(null);

  const isOwnProfile =
    !!viewerAnonymousId?.trim() && viewerAnonymousId.trim() === profileAnonymousId;

  useEffect(() => {
    if (!profileAnonymousId) {
      setLoading(false);
      setError("Invalid profile link.");
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      userPromptsApi.list({ anonymousId: profileAnonymousId, limit: 100 }).catch(() => ({ prompts: [] as UserPromptItem[] })),
      agentWalletApi.get(profileAnonymousId).catch(() => null),
    ])
      .then(([{ prompts: list }, wallet]) => {
        setPrompts(list);
        if (wallet && typeof wallet === "object" && "agentAddress" in wallet) {
          setAgentAddress(wallet.agentAddress ?? null);
          setAvatarUrl(wallet.avatarUrl ?? null);
        } else {
          setAgentAddress(null);
          setAvatarUrl(null);
        }
      })
      .catch((err) => setError(err?.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [profileAnonymousId]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavoritesToStorage(next);
      return next;
    });
  }, []);

  const handleUseUserPrompt = useCallback(
    (item: UserPromptItem) => {
      userPromptsApi.recordUse(item.id).catch(() => {});
      const nextRecent = [
        { id: item.id, title: item.title, prompt: item.prompt },
        ...recent.filter((r) => r.id !== item.id),
      ].slice(0, MAX_RECENT);
      setRecent(nextRecent);
      saveRecentToStorage(nextRecent);
      if (viewerAnonymousId?.trim()) {
        marketplaceApi
          .put(viewerAnonymousId, {
            favorites: [...favorites],
            recent: nextRecent,
            callCounts: loadCallCountsFromStorage(),
          })
          .catch(() => {});
      }
      navigate("/", { state: { prompt: item.prompt } });
    },
    [navigate, viewerAnonymousId, favorites, recent]
  );

  const handleDuplicatePrompt = useCallback(
    (payload: { title: string; description: string; prompt: string; category: MarketplacePrompt["category"] }) => {
      if (!walletConnected || !viewerAnonymousId?.trim()) {
        toast({
          title: "Wallet required",
          description: "Connect your wallet to duplicate prompts.",
          variant: "destructive",
        });
        return;
      }
      userPromptsApi
        .create(viewerAnonymousId, {
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
    [walletConnected, viewerAnonymousId, toast]
  );

  const openDetails = useCallback(
    (item: { title: string; description?: string; prompt: string; category?: string }, onUse: () => void) => {
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
    },
    []
  );

  if (!profileAnonymousId) {
    return (
      <div className={cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_PROMPTS, PAGE_SAFE_AREA_BOTTOM)}>
        <p className="text-sm text-muted-foreground">This profile link is invalid.</p>
        <Button asChild variant="outline" className="mt-4 rounded-lg">
          <Link to="/dashboard/marketplace/prompts">Back to prompts</Link>
        </Button>
      </div>
    );
  }

  const totalUses = prompts.reduce((s, p) => s + (p.useCount ?? 0), 0);
  const displayHandle = formatCreatorDisplayId(profileAnonymousId);

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
              Prompts
            </Link>
          </Button>
        </div>

        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-9 w-9 text-muted-foreground/80" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Creator</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{displayHandle}</h1>
            <p className="break-all font-mono text-xs text-muted-foreground" title={profileAnonymousId}>
              {profileAnonymousId}
            </p>
            {agentAddress ? (
              <p className="text-xs text-muted-foreground">
                Agent wallet:{" "}
                <span className="font-mono text-foreground/90">
                  {agentAddress.length > 16 ? `${agentAddress.slice(0, 8)}…${agentAddress.slice(-6)}` : agentAddress}
                </span>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{prompts.length}</span> prompts
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-medium text-foreground">{totalUses}</span> uses across prompts
              </span>
              {isOwnProfile ? (
                <>
                  <span className="text-border">·</span>
                  <span className="text-accent">This is you</span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-foreground">Published prompts</h2>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : prompts.length === 0 ? (
            <p className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
              This creator has not published any prompts yet.
            </p>
          ) : (
            <div className={PROMPTS_GRID}>
              {prompts.map((item) => (
                <PromptCard
                  key={item.id}
                  item={{ ...item, icon: FileText }}
                  isFavorite={favorites.has(item.id)}
                  useCount={item.useCount ?? 0}
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
                  onShowDetails={() => openDetails(item, () => handleUseUserPrompt(item))}
                />
              ))}
            </div>
          )}
        </section>

        <Dialog open={!!detailsPrompt} onOpenChange={(open) => { if (!open) { setDetailsPrompt(null); setDetailsOnUse(null); } }}>
          <DialogContent className="border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">{detailsPrompt?.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground">By this creator</DialogDescription>
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
