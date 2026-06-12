import { useMemo, useState } from "react";
import { CheckCircle2, Search, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  officialVenues,
  venueStatusLabel,
  verifyMintAddress,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { SpcxSection } from "@/components/spcx/SpcxSection";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

export function SpcxMintVerifier({ report }: { report: SpcxIntelligenceReport }) {
  const [mintInput, setMintInput] = useState("");
  const [checked, setChecked] = useState(false);

  const result = useMemo(() => {
    if (!checked || !mintInput.trim()) return null;
    return verifyMintAddress(report, mintInput);
  }, [checked, mintInput, report]);

  const official = officialVenues(report);

  const handleVerify = () => setChecked(true);

  return (
    <SpcxSection
      id="spcx-verify"
      kicker="Step 2"
      title="Check your token is real"
      description="Every token has a unique ID (mint address). Paste yours here before spending money — takes 5 seconds."
      icon={<ShieldCheck className="h-4 w-4 text-primary" />}
    >
      <Card className={spcxCardClass}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="spcx-mint-verify">Token ID (mint address)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="spcx-mint-verify"
                value={mintInput}
                onChange={(e) => {
                  setMintInput(e.target.value);
                  setChecked(false);
                }}
                placeholder="Paste the long address from your wallet or DexScreener…"
                className="rounded-xl font-mono text-sm"
              />
              <Button type="button" className="shrink-0 gap-2 rounded-xl" onClick={handleVerify}>
                <Search className="h-4 w-4" />
                Check
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Not sure where to find it? Copy it from DexScreener or your wallet&apos;s token details.
            </p>
          </div>

          {result ? (
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3.5",
                result.verdict === "official" &&
                  "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
                result.verdict === "impersonator" &&
                  "border-destructive/30 bg-destructive/5 text-destructive",
                result.verdict === "unknown" &&
                  "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-200",
              )}
            >
              {result.verdict === "official" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : result.verdict === "impersonator" ? (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div className="min-w-0 text-sm">
                {result.verdict === "official" ? (
                  <>
                    <p className="font-semibold">This is an official token</p>
                    <p className="mt-1 text-muted-foreground">
                      Matches {result.venue.symbol} from {result.venue.venue} (
                      {venueStatusLabel(result.venue.status)}).
                    </p>
                  </>
                ) : result.verdict === "impersonator" ? (
                  <>
                    <p className="font-semibold">This is a fake — do not buy</p>
                    <p className="mt-1">{result.venue.statusNote}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Not recognized</p>
                    <p className="mt-1 text-muted-foreground">
                      This ID is not in our list of official tokens. Use one of the verified IDs below
                      or pick a different buying route.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {official.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-border/40 bg-muted/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verified token IDs right now
              </p>
              <ul className="space-y-2">
                {official.map((v) => (
                  <li
                    key={`${v.venue}-${v.mint}`}
                    className="rounded-lg border border-border/35 bg-background/50 px-3 py-2"
                  >
                    <p className="text-xs font-medium capitalize text-foreground">
                      {v.symbol} · {v.venue} · {venueStatusLabel(v.status)}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{v.mint}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </SpcxSection>
  );
}
