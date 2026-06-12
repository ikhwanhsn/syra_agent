import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpcxIntelligenceReport } from "@/lib/spcxApi";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

export function SpcxAgentTake({ report }: { report: SpcxIntelligenceReport }) {
  return (
    <Card className={spcxCardClass}>
      <CardHeader className="border-b border-border/40 bg-muted/[0.03] pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="font-display text-base font-semibold">What our agent sees right now</CardTitle>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {report.agentTake}
        </CardDescription>
      </CardHeader>
      {report.opportunities.length > 0 && (
        <CardContent className="pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Worth watching
          </p>
          <ul className="space-y-2.5">
            {report.opportunities.map((o) => (
              <li
                key={o.slice(0, 48)}
                className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-primary/50"
              >
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
