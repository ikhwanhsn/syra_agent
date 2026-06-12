import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpcxIntelligenceReport } from "@/lib/spcxApi";
import { cn } from "@/lib/utils";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

export function SpcxRiskCard({ report }: { report: SpcxIntelligenceReport }) {
  if (!report.riskNotes.length) return null;

  return (
    <Card
      className={cn(
        spcxCardClass,
        "border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] to-transparent",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold text-amber-800 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4" />
          Things to know before investing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {report.riskNotes.map((n) => (
          <p key={n.slice(0, 48)} className="text-sm leading-relaxed text-muted-foreground">
            {n}
          </p>
        ))}
        <p className="pt-2 text-xs italic text-muted-foreground/80">{report.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
