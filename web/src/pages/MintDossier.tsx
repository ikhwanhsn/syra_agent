import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileSearch, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewAccentBackground, overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { fetchMintDossier } from "@/lib/tokensDossierApi";
import { MintDossierView } from "@/components/dossier/MintDossierView";

const STALE_MS = 60_000;

function parseDossierQueryParams(searchParams: URLSearchParams): {
  ref?: string;
  mint?: string;
  assetId?: string;
  q?: string;
} | null {
  const ref = searchParams.get("ref")?.trim();
  const mint = searchParams.get("mint")?.trim();
  const assetId = searchParams.get("assetId")?.trim();
  const q = searchParams.get("q")?.trim();
  if (ref || mint || assetId || q) {
    return {
      ...(ref && { ref }),
      ...(mint && { mint }),
      ...(assetId && { assetId }),
      ...(q && { q }),
    };
  }
  return null;
}

export default function MintDossier({ embedded }: { embedded?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const queryFromUrl = useMemo(() => parseDossierQueryParams(searchParams), [searchParams]);

  useEffect(() => {
    if (!queryFromUrl) return;
    const display =
      queryFromUrl.q || queryFromUrl.mint || queryFromUrl.ref || queryFromUrl.assetId || "";
    setInput(display);
  }, [queryFromUrl]);

  const dossierQ = useQuery({
    queryKey: ["mint-dossier", queryFromUrl],
    queryFn: () => fetchMintDossier(queryFromUrl!),
    enabled: queryFromUrl != null,
    staleTime: STALE_MS,
    retry: 1,
  });

  const submit = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      const next = new URLSearchParams();
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) {
        next.set("mint", q);
      } else if (q.startsWith("solana-") && q.includes("-")) {
        next.set("assetId", q);
      } else if (q.includes("/") || q.includes(".")) {
        next.set("q", q);
      } else {
        next.set("ref", q);
      }
      setSearchParams(next, { replace: false });
    },
    [setSearchParams],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const showEmpty = !queryFromUrl;
  const showLoading = queryFromUrl != null && dossierQ.isLoading;
  const showError = queryFromUrl != null && dossierQ.isError;
  const showResult = queryFromUrl != null && dossierQ.data;

  return (
    <div className={cn("relative min-h-full", embedded && "min-h-0")}>
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] pb-16",
        )}
      >
        <header className="mb-8 max-w-3xl">
          <p className={overviewKickerClass}>Intelligence</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-1">Token check</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base leading-relaxed">
            Look up any token by ticker or Solana mint. See price, risk grade, top pools, and a chart before you trade.
          </p>
        </header>

        <Card className={cn(overviewCardShell, "mb-8 max-w-3xl")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Look up asset
            </CardTitle>
            <CardDescription>
              Examples: <span className="font-mono text-foreground/80">btc</span>,{" "}
              <span className="font-mono text-foreground/80">sol</span>,{" "}
              <span className="font-mono text-foreground/80">bonk</span>, or a full mint address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ticker, assetId, or Solana mint…"
                className="font-mono text-sm h-11 flex-1"
                autoComplete="off"
                spellCheck={false}
              />
              <Button type="submit" className="h-11 gap-2 shrink-0" disabled={!input.trim()}>
                {dossierQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                Check token
              </Button>
            </form>
          </CardContent>
        </Card>

        {showEmpty ? (
          <div className="grid gap-3 sm:grid-cols-3 max-w-3xl">
            {[
              { label: "Bitcoin", ref: "btc" },
              { label: "Solana", ref: "sol" },
              { label: "Majors desk", ref: "ethereum" },
            ].map((s) => (
              <button
                key={s.ref}
                type="button"
                className={cn(
                  overviewCardShell,
                  "text-left px-4 py-3 text-sm font-medium hover:border-foreground/25 transition-colors",
                )}
                style={{ backgroundImage: overviewAccentBackground("alpha") }}
                onClick={() => submit(s.ref)}
              >
                {s.label}
                <span className="block font-mono text-xs text-muted-foreground mt-0.5">{s.ref}</span>
              </button>
            ))}
          </div>
        ) : null}

        {showLoading ? (
          <div className="space-y-4 max-w-4xl">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : null}

        {showError ? (
          <Card className={cn(overviewCardShell, "max-w-xl border-destructive/40")}>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive font-medium">
                {dossierQ.error instanceof Error ? dossierQ.error.message : "Could not load token check"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/token-check")}
              >
                Clear search
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {showResult ? <MintDossierView data={dossierQ.data} /> : null}
      </div>
    </div>
  );
}
