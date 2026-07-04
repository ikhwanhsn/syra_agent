import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronDown, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  searchJupiterTokens,
  formatSwapAmount,
  type JupiterTokenInfo,
} from "@/lib/jupiterSwapApi";
import { SWAP_PRESET_TOKENS } from "@/lib/swapPresets";
import { isValidBase58Mint } from "@/lib/swapPresets";
import { SwapTokenLogo, type SwapTokenLogoSize } from "@/components/swap/SwapTokenLogo";

export interface SelectedSwapToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string | null;
  isVerified: boolean;
}

function presetToSelected(
  label: (typeof SWAP_PRESET_TOKENS)[number]["label"],
): SelectedSwapToken {
  const row = SWAP_PRESET_TOKENS.find((t) => t.label === label)!;
  return {
    mint: row.mint,
    symbol: row.label,
    name: row.label,
    decimals: row.decimals,
    icon: row.icon,
    isVerified: true,
  };
}

function tokenInfoToSelected(t: JupiterTokenInfo): SelectedSwapToken {
  return {
    mint: t.id,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    icon: t.icon,
    isVerified: t.isVerified,
  };
}

export const DEFAULT_INPUT_TOKEN = presetToSelected("SOL");
export const DEFAULT_OUTPUT_TOKEN = presetToSelected("USDC");

export interface TokenSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (token: SelectedSwapToken) => void;
  excludeMint?: string | null;
  balances?: Record<string, number>;
}

/** First paint + each scroll batch size for verified / search results. */
const TOKEN_LIST_INITIAL = 12;
const TOKEN_LIST_STEP = 16;
/** Fixed list body height — modal must not resize when search results load or clear. */
const TOKEN_LIST_MIN_H = "min-h-[min(400px,55dvh)]";
/** Avoid skeleton blink on fast API responses — keep visible at least this long once shown. */
const LIST_SKELETON_MIN_MS = 450;

/** Once active, show immediately; stay visible for minMs after active ends. */
function useMinDurationVisible(active: boolean, minMs: number): boolean {
  const [shown, setShown] = useState(false);
  const activeSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      activeSinceRef.current = Date.now();
      setShown(true);
      return;
    }

    if (!shown) return;

    const elapsed =
      activeSinceRef.current != null ? Date.now() - activeSinceRef.current : minMs;
    const remaining = Math.max(0, minMs - elapsed);
    const id = window.setTimeout(() => {
      setShown(false);
      activeSinceRef.current = null;
    }, remaining);

    return () => window.clearTimeout(id);
  }, [active, minMs, shown]);

  return shown;
}

function LazyTokenList({
  tokens,
  label,
  balances,
  onSelect,
}: {
  tokens: SelectedSwapToken[];
  label?: string;
  balances: Record<string, number>;
  onSelect: (token: SelectedSwapToken) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(TOKEN_LIST_INITIAL);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listKey = useMemo(() => tokens.map((t) => t.mint).join(","), [tokens]);

  useEffect(() => {
    setVisibleCount(TOKEN_LIST_INITIAL);
  }, [listKey]);

  const visible = useMemo(() => tokens.slice(0, visibleCount), [tokens, visibleCount]);
  const hasMore = visibleCount < tokens.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const root = sentinel.closest("[data-radix-scroll-area-viewport]");

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + TOKEN_LIST_STEP, tokens.length));
        }
      },
      { root: root instanceof Element ? root : null, rootMargin: "120px", threshold: 0.05 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, tokens.length, visibleCount]);

  if (tokens.length === 0) return null;

  return (
    <>
      {label ? (
        <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
          {hasMore ? (
            <span className="ml-1.5 font-normal normal-case text-muted-foreground/70">
              · {visible.length} of {tokens.length}
            </span>
          ) : null}
        </p>
      ) : null}
      {visible.map((token) => (
        <TokenRow
          key={token.mint}
          token={token}
          balance={balances[token.mint]}
          onSelect={() => onSelect(token)}
        />
      ))}
      {hasMore ? (
        <div className="py-1">
          <TokenRowSkeleton delay={0} />
          <div ref={sentinelRef} className="h-2 w-full" aria-hidden />
          <p className="pb-2 text-center text-[11px] text-muted-foreground/60">Scroll for more</p>
        </div>
      ) : null}
    </>
  );
}

function TokenRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-[5.5rem] rounded-md" />
        <Skeleton className="h-3 w-28 rounded-md" />
      </div>
      <Skeleton className="h-3 w-10 shrink-0 rounded-md" />
    </div>
  );
}

function TokenListLoading({ count = 6, label }: { count?: number; label?: string }) {
  return (
    <div className="space-y-0.5 py-1">
      {label ? (
        <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
      ) : null}
      {Array.from({ length: count }, (_, i) => (
        <TokenRowSkeleton key={i} delay={i * 45} />
      ))}
    </div>
  );
}

function TokenRow({
  token,
  balance,
  onSelect,
}: {
  token: SelectedSwapToken;
  balance?: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    >
      <TokenIcon token={token} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold tracking-tight">{token.symbol}</span>
          {token.isVerified ? (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Verified" />
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{token.name}</p>
      </div>
      {balance != null && balance > 0 ? (
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {formatSwapAmount(balance)}
        </span>
      ) : null}
    </button>
  );
}

export function TokenIcon({
  token,
  size = "md",
  className,
}: {
  token: SelectedSwapToken;
  size?: SwapTokenLogoSize;
  className?: string;
}) {
  return (
    <SwapTokenLogo
      symbol={token.symbol}
      mint={token.mint}
      icon={token.icon}
      size={size}
      className={className}
    />
  );
}

export function TokenSelectDialog({
  open,
  onOpenChange,
  onSelect,
  excludeMint,
  balances = {},
}: TokenSelectDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  const tokensQ = useQuery({
    queryKey: ["jupiter-tokens", debouncedSearch],
    queryFn: async () => {
      const res = await searchJupiterTokens(debouncedSearch || undefined);
      if (!res.success) throw new Error(res.error);
      return res.data.tokens;
    },
    enabled: open,
    staleTime: 60_000,
    retry: 1,
  });

  const presetTokens = useMemo(
    () =>
      SWAP_PRESET_TOKENS.map((p) => presetToSelected(p.label)).filter(
        (t) => t.mint !== excludeMint,
      ),
    [excludeMint],
  );

  /** Merge Jupiter metadata (icons) into preset rows when the verified list loads. */
  const popularTokens = useMemo(() => {
    const apiTokens = tokensQ.data ?? [];
    return presetTokens.map((p) => {
      const match = apiTokens.find((t) => t.id === p.mint);
      if (!match) return p;
      return {
        ...p,
        icon: match.icon ?? p.icon,
        name: match.name || p.name,
        isVerified: match.isVerified || p.isVerified,
      };
    });
  }, [presetTokens, tokensQ.data]);

  const searchResults = useMemo(() => {
    const raw = tokensQ.data ?? [];
    return raw
      .slice()
      .sort((a, b) => (b.usdPrice ?? 0) - (a.usdPrice ?? 0))
      .map(tokenInfoToSelected)
      .filter((t) => t.mint !== excludeMint)
      .filter((t) => !presetTokens.some((p) => p.mint === t.mint));
  }, [tokensQ.data, excludeMint, presetTokens]);

  const trimmedSearch = search.trim();
  const trimmedDebounced = debouncedSearch.trim();
  const isAwaitingDebounce = trimmedSearch !== trimmedDebounced;
  const isSearchMode = trimmedSearch.length > 0;

  const isSearchListBusy =
    isSearchMode &&
    (isAwaitingDebounce || tokensQ.isFetching || tokensQ.isPending);

  const isVerifiedListBusy =
    !trimmedDebounced && (tokensQ.isLoading || tokensQ.isPending);

  const listSkeletonActive =
    !tokensQ.isError && (isSearchListBusy || isVerifiedListBusy);

  const showListSkeleton = useMinDurationVisible(listSkeletonActive, LIST_SKELETON_MIN_MS);

  const handleSelect = useCallback(
    (token: SelectedSwapToken) => {
      onSelect(token);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  const handlePasteMint = useCallback(() => {
    const mint = debouncedSearch.trim();
    if (!isValidBase58Mint(mint)) return;
    handleSelect({
      mint,
      symbol: mint.slice(0, 4) + "…",
      name: "Custom token",
      decimals: 9,
      icon: null,
      isVerified: false,
    });
  }, [debouncedSearch, handleSelect]);

  const showPasteMint =
    debouncedSearch.trim().length >= 32 && isValidBase58Mint(debouncedSearch.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))]",
          "h-[min(540px,70dvh)] max-w-md flex-col gap-0 overflow-hidden rounded-2xl p-0",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-border/50 px-4 py-4">
          <DialogTitle className="text-base font-semibold">Select token</DialogTitle>
        </DialogHeader>
        <div className="shrink-0 border-b border-border/50 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, symbol, or paste mint"
              className="h-10 rounded-xl pl-9"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className={cn("space-y-1 p-2", TOKEN_LIST_MIN_H)}>
            {tokensQ.isError ? (
              <div className="mx-2 my-4 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-5 text-center">
                <p className="text-sm font-medium text-destructive">Could not load tokens</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tokensQ.error instanceof Error ? tokensQ.error.message : "Network error"}
                </p>
                <button
                  type="button"
                  onClick={() => void tokensQ.refetch()}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {!isSearchMode && popularTokens.length > 0 ? (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Popular
                </p>
                {popularTokens.map((token) => (
                  <TokenRow
                    key={token.mint}
                    token={token}
                    balance={balances[token.mint]}
                    onSelect={() => handleSelect(token)}
                  />
                ))}
              </>
            ) : null}

            {showListSkeleton ? (
              <TokenListLoading
                count={6}
                label={isSearchMode ? "Searching" : "Verified"}
              />
            ) : null}

            {!showListSkeleton && !tokensQ.isError && searchResults.length > 0 ? (
              <LazyTokenList
                tokens={searchResults}
                label={debouncedSearch ? "Results" : "Verified"}
                balances={balances}
                onSelect={handleSelect}
              />
            ) : null}
            {showPasteMint ? (
              <button
                type="button"
                onClick={handlePasteMint}
                className="mx-2 mb-2 w-[calc(100%-1rem)] rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-left text-sm hover:bg-primary/10"
              >
                Use mint address
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  {debouncedSearch.trim()}
                </p>
              </button>
            ) : null}
            {!showListSkeleton &&
            !listSkeletonActive &&
            !tokensQ.isError &&
            searchResults.length === 0 &&
            trimmedDebounced &&
            !showPasteMint ? (
              <p className="flex min-h-[12rem] items-center justify-center px-3 py-8 text-center text-sm text-muted-foreground">
                No tokens found
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function TokenSelectButton({
  token,
  onClick,
  disabled,
}: {
  token: SelectedSwapToken;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-0 bg-background/70 px-2.5 py-1.5 pl-2",
        "shadow-none ring-1 ring-border/50 transition-[box-shadow,background-color]",
        "hover:bg-background/90 hover:ring-border focus:ring-2 focus:ring-ring/40",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <TokenIcon token={token} size="sm" />
      <span className="text-[15px] font-semibold tracking-tight">{token.symbol}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
