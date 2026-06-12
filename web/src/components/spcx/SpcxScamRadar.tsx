import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dexScreenerTokenUrl,
  formatUsd,
  impersonatorVenues,
  solscanAccountUrl,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { SpcxSection } from "@/components/spcx/SpcxSection";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

export function SpcxScamRadar({ report }: { report: SpcxIntelligenceReport }) {
  const scams = impersonatorVenues(report);

  return (
    <SpcxSection
      id="spcx-scam-radar"
      kicker="Safety first"
      title="Fake token radar"
      description="Scammers create copycat tokens with similar names. We flag anything that doesn't match the real stock price."
      icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
    >
      <Card className={scams.length > 0 ? `${spcxCardClass} border-destructive/25` : spcxCardClass}>
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {scams.length > 0 ? (
              <>
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">
                  {scams.length} fake token{scams.length === 1 ? "" : "s"} detected — do not buy
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-foreground">No fakes detected right now</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {scams.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              We automatically hide tokens whose price is too far from the real SpaceX stock price.
              Still always double-check with the mint verifier before buying.
            </p>
          ) : (
            scams.map((venue) => (
              <div
                key={`${venue.venue}-${venue.mint}`}
                className="rounded-xl border border-destructive/25 bg-background/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive" className="rounded-lg">
                    Fake — do not buy
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{venue.symbol}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{venue.statusNote}</p>
                {venue.priceUsd != null ? (
                  <p className="mt-1 font-mono text-xs text-destructive">
                    Suspicious price: {formatUsd(venue.priceUsd)}
                  </p>
                ) : null}
                {venue.mint ? (
                  <>
                    <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground" title={venue.mint}>
                      {venue.mint}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg px-2 text-[11px]" asChild>
                        <a href={solscanAccountUrl(venue.mint)} target="_blank" rel="noopener noreferrer">
                          Solscan <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg px-2 text-[11px]" asChild>
                        <a href={dexScreenerTokenUrl(venue.mint)} target="_blank" rel="noopener noreferrer">
                          DexScreener <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </SpcxSection>
  );
}
