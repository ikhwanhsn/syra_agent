import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { GitCompareArrows, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useHolderOverlap } from "@/hooks/useHolderOverlap";
import {
  MAX_HOLDER_OVERLAP_COMPARE_MINTS,
  parseMintAddressList,
  type HolderOverlapBatchPayload,
  type HolderOverlapPayload,
  type HolderOverlapTone,
} from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function truncateWallet(wallet: string): string {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function verdictClass(tone: HolderOverlapTone): string {
  if (tone === "warning") return "text-red-500";
  if (tone === "caution") return "text-amber-500";
  return "text-muted-foreground";
}

export interface PumpfunHolderOverlapPanelProps {
  baseMint: string;
  baseSymbol: string;
  className?: string;
}

export function PumpfunHolderOverlapPanel({
  baseMint,
  baseSymbol,
  className,
}: PumpfunHolderOverlapPanelProps) {
  const [inputText, setInputText] = useState("");
  const overlapQ = useHolderOverlap();

  useEffect(() => {
    setInputText("");
    overlapQ.reset();
  }, [baseMint]); // eslint-disable-line react-hooks/exhaustive-deps

  const compareMints = useMemo(
    () =>
      parseMintAddressList(inputText)
        .filter((m) => m !== baseMint.trim())
        .slice(0, MAX_HOLDER_OVERLAP_COMPARE_MINTS),
    [inputText, baseMint],
  );

  const submit = useCallback(() => {
    if (compareMints.length === 0) return;
    void overlapQ.mutateAsync({ mintA: baseMint.trim(), mintBs: compareMints });
  }, [baseMint, compareMints, overlapQ]);

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <GitCompareArrows className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Shared holders</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            See which top wallets hold {baseSymbol} and other tokens
          </h3>
          <p className="mt-1 text-xs text-muted-foreground/90">
            Free · does not use scan quota · compares top ~50 holders per token
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Paste other token mints to compare with ${baseSymbol}\nOne per line, or separated by comma / space`}
          className="min-h-[80px] resize-y font-mono text-xs sm:text-sm"
          disabled={overlapQ.isPending}
        />

        {compareMints.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {compareMints.length} token{compareMints.length === 1 ? "" : "s"} ready to compare
          </p>
        ) : inputText.trim() ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            No valid mint addresses found. Check the format and try again.
          </p>
        ) : null}

        <Button
          type="button"
          variant="neon"
          disabled={overlapQ.isPending || compareMints.length === 0}
          onClick={submit}
        >
          {overlapQ.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Comparing…
            </>
          ) : (
            `Compare holders${compareMints.length > 0 ? ` (${compareMints.length})` : ""}`
          )}
        </Button>

        {overlapQ.isError ? (
          <p className="text-sm text-destructive">
            {overlapQ.error instanceof Error
              ? overlapQ.error.message
              : "Comparison failed"}
          </p>
        ) : null}
      </div>

      {overlapQ.data ? (
        <HolderOverlapResults data={overlapQ.data} baseSymbol={baseSymbol} />
      ) : null}
    </section>
  );
}

function HolderOverlapResults({
  data,
  baseSymbol,
}: {
  data: HolderOverlapBatchPayload;
  baseSymbol: string;
}) {
  const { comparisons, aggregate } = data;

  return (
    <div className="mt-6 space-y-6 border-t border-border/40 pt-6">
      {aggregate && aggregate.compareTokenCount > 1 ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Across all {aggregate.compareTokenCount} tokens</p>
            <p className="text-xs text-muted-foreground">
              Summary of {baseSymbol} wallets that also appear in your compare list
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <SimpleStat
              label="Shared with any token"
              value={String(aggregate.unionOverlapCount)}
            />
            <SimpleStat
              label="Shared with all tokens"
              value={String(aggregate.fullOverlapCount)}
            />
            <SimpleStat
              label="In 2+ compare tokens"
              value={String(aggregate.multiTokenHolders.filter((h) => h.tokensMatched >= 2).length)}
            />
          </div>
          {aggregate.multiTokenHolders.length > 0 ? (
            <SharedWalletTable
              rows={aggregate.multiTokenHolders.map((row) => ({
                wallet: row.wallet,
                rankA: row.rankA,
                sharePctA: row.sharePctA,
                extra: (
                  <div className="flex flex-wrap gap-1">
                    {row.tokenSymbols.map((sym, i) => (
                      <Badge key={row.mints[i] ?? sym} variant="outline" className="text-[10px]">
                        {sym}
                      </Badge>
                    ))}
                  </div>
                ),
                trailing: `${row.tokensMatched}/${aggregate.compareTokenCount}`,
              }))}
              symbolA={baseSymbol}
            />
          ) : null}
        </div>
      ) : null}

      {comparisons.map((comparison) => (
        <ComparisonBlock key={comparison.mintB} comparison={comparison} />
      ))}
    </div>
  );
}

function ComparisonBlock({ comparison }: { comparison: HolderOverlapPayload }) {
  const { summary, tokenA, tokenB, sharedHolders } = comparison;

  return (
    <div className="space-y-4 rounded-xl border border-border/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {tokenA.symbol} ↔ {tokenB.symbol}
          </p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", verdictClass(summary.tone))}>
            {summary.overlapCount} shared wallet{summary.overlapCount === 1 ? "" : "s"}
          </p>
        </div>
        <Badge variant="outline" className={verdictClass(summary.tone)}>
          {summary.verdict}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">{summary.interpretation}</p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SimpleStat
          label={`${tokenA.symbol} top holders matched`}
          value={`${summary.overlapCount} / ${summary.comparedA}`}
        />
        <SimpleStat
          label={`${tokenB.symbol} top holders matched`}
          value={`${summary.overlapCount} / ${summary.comparedB}`}
        />
        <SimpleStat label={`${tokenA.symbol} shared supply`} value={formatPct(summary.sharedSupplyPctA)} />
        <SimpleStat label={`${tokenB.symbol} shared supply`} value={formatPct(summary.sharedSupplyPctB)} />
      </div>

      {summary.sharedUsdValueTotal != null ? (
        <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Combined USD (shared wallets)</span>
          <span className="font-mono font-semibold tabular-nums">
            {formatUsd(summary.sharedUsdValueTotal)}
          </span>
        </div>
      ) : null}

      {summary.overlapCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No shared wallets found among the top holders of either token.
        </p>
      ) : (
        <SharedWalletTable
          rows={sharedHolders.map((row) => ({
            wallet: row.wallet,
            rankA: row.rankA,
            rankB: row.rankB,
            balanceA: row.balanceHumanA,
            balanceB: row.balanceHumanB,
            sharePctA: row.sharePctA,
            sharePctB: row.sharePctB,
            usd: row.combinedUsdValue,
            topTenBoth: row.flags.includes("topTenBoth"),
          }))}
          symbolA={tokenA.symbol}
          symbolB={tokenB.symbol}
        />
      )}
    </div>
  );
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

type SharedRow = {
  wallet: string;
  rankA: number;
  rankB?: number;
  sharePctA?: number | null;
  sharePctB?: number | null;
  balanceA?: number | null;
  balanceB?: number | null;
  usd?: number | null;
  extra?: ReactNode;
  trailing?: string;
  topTenBoth?: boolean;
};

function SharedWalletTable({
  rows,
  symbolA,
  symbolB,
}: {
  rows: SharedRow[];
  symbolA: string;
  symbolB?: string;
}) {
  const isPair = Boolean(symbolB);

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wallet</TableHead>
            <TableHead className="text-right">Rank · {symbolA}</TableHead>
            {isPair ? <TableHead className="text-right">Rank · {symbolB}</TableHead> : null}
            {isPair ? (
              <>
                <TableHead className="text-right">{symbolA}</TableHead>
                <TableHead className="text-right">{symbolB}</TableHead>
                <TableHead className="text-right">USD</TableHead>
              </>
            ) : (
              <>
                <TableHead className="text-right">Share · {symbolA}</TableHead>
                <TableHead>Also in</TableHead>
                <TableHead className="text-right">Match</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.wallet}>
              <TableCell className="font-mono text-xs">
                <span className="inline-flex items-center gap-2">
                  {truncateWallet(row.wallet)}
                  {row.topTenBoth ? (
                    <Badge variant="outline" className="text-[10px]">
                      Top 10 both
                    </Badge>
                  ) : null}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums">#{row.rankA}</TableCell>
              {isPair ? (
                <>
                  <TableCell className="text-right font-mono text-xs tabular-nums">#{row.rankB}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatNumber(row.balanceA)}
                    <span className="block text-[10px] text-muted-foreground">
                      {formatPct(row.sharePctA)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatNumber(row.balanceB)}
                    <span className="block text-[10px] text-muted-foreground">
                      {formatPct(row.sharePctB)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatUsd(row.usd)}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatPct(row.sharePctA)}
                  </TableCell>
                  <TableCell>{row.extra}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {row.trailing}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
