import { ExternalLink, Megaphone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { MemecoinAnalysisPayload, TokenKolRow } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function promotionBadge(type: TokenKolRow["promotionType"]) {
  if (type === "direct") {
    return (
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
        Shill
      </Badge>
    );
  }
  if (type === "warning") {
    return (
      <Badge variant="outline" className="border-red-500/40 text-red-500">
        Warning
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Mention
    </Badge>
  );
}

export interface PumpfunKolPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunKolPanel({ data, className }: PumpfunKolPanelProps) {
  const kol = data.kolShills.ok ? data.kolShills.data : null;

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Megaphone className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>KOL radar</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            X accounts mentioning this token by contract, $ticker, name, or official account
          </h3>
        </div>
      </div>

      {!kol ? (
        <p className="text-sm text-muted-foreground">
          KOL data unavailable
          {data.kolShills.error ? `: ${data.kolShills.error}` : ""}
        </p>
      ) : kol.topKols.length === 0 ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>No X posts found for this token in recent search results.</p>
          {kol.searchTerms?.symbol || kol.searchTerms?.name ? (
            <p className="text-xs">
              Searched: contract
              {kol.searchTerms.symbol ? ` · $${kol.searchTerms.symbol}` : ""}
              {kol.searchTerms.name ? ` · "${kol.searchTerms.name}"` : ""}
              {kol.searchTerms.twitter ? ` · @${kol.searchTerms.twitter}` : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Accounts found</p>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {kol.summary.totalAccountsFound}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Combined reach</p>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {formatFollowers(kol.summary.combinedReach)}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Sentiment</p>
              <p className="text-lg font-semibold capitalize">{kol.summary.overallSentiment}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/40">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="min-w-[200px]">Sample</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kol.topKols.map((row) => (
                  <TableRow key={row.username || row.rank}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.profileImageUrl ? (
                          <img
                            src={row.profileImageUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <a
                            href={`https://x.com/${row.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs font-medium hover:underline"
                          >
                            @{row.username}
                            {row.verified ? " ✓" : ""}
                          </a>
                          {row.displayName ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {row.displayName}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {formatFollowers(row.followers)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {row.tweetsAboutToken}
                    </TableCell>
                    <TableCell>{promotionBadge(row.promotionType)}</TableCell>
                    <TableCell>
                      {row.sampleTweet ? (
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {row.sampleTweet.text}
                          </p>
                          <a
                            href={row.sampleTweet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View post
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
