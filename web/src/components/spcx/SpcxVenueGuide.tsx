import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { venueStatusLabel, type SpcxVenueQuote } from "@/lib/spcxApi";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

const VENUE_ORDER = ["xstocks", "backpack", "ondo"];

const REDEMPTION_LABELS: Record<string, string> = {
  xstocks: "Kraken / Bybit exchange",
  backpack: "Backpack brokerage (ACATS)",
  ondo: "Ondo custodied fund",
};

export function SpcxVenueGuide({ venues }: { venues: SpcxVenueQuote[] }) {
  const sorted = [...venues].sort(
    (a, b) => VENUE_ORDER.indexOf(a.venue) - VENUE_ORDER.indexOf(b.venue),
  );

  return (
    <Card className={spcxCardClass}>
      <CardHeader className="border-b border-border/40 bg-muted/[0.03]">
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Platform comparison table
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto pt-4">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 pr-4 font-semibold">Platform</th>
              <th className="pb-2 pr-4 font-semibold">Symbol</th>
              <th className="pb-2 pr-4 font-semibold">Status</th>
              <th className="pb-2 pr-4 font-semibold">How to access</th>
              <th className="pb-2 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v) => (
              <tr key={`${v.venue}-${v.symbol}`} className="border-b border-border/25 last:border-0">
                <td className="py-3 pr-4 font-medium capitalize">{v.venue}</td>
                <td className="py-3 pr-4 font-mono text-xs">{v.symbol}</td>
                <td className="py-3 pr-4">
                  <Badge variant="outline" className="rounded-lg text-[10px]">
                    {venueStatusLabel(v.status)}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">
                  {REDEMPTION_LABELS[v.venue] ?? "—"}
                </td>
                <td className="py-3 text-xs leading-relaxed text-muted-foreground">
                  {v.accessNote || v.description || v.statusNote}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
