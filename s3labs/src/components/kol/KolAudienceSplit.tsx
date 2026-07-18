import { Building2, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KolAudienceSplitProps {
  onCreate: () => void;
  onBrowse: () => void;
  className?: string;
}

export function KolAudienceSplit({
  onCreate,
  onBrowse,
  className,
}: KolAudienceSplitProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <div className="rounded-2xl border border-border/60 bg-muted/15 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <p className="font-semibold tracking-tight">For projects</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fund a SOL pool on your X post. Top engagers compete automatically —
          unused pool is refunded when the campaign ends.
        </p>
        <Button variant="hero" className="rounded-full w-full sm:w-auto" onClick={onCreate}>
          Create campaign
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/15 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Coins className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <p className="font-semibold tracking-tight">For KOLs</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Reply or quote a live campaign post. We scan about every 24 hours —
          earn a pro-rata share of the pool when it ends.
        </p>
        <Button variant="outline" className="rounded-full w-full sm:w-auto" onClick={onBrowse}>
          Browse &amp; earn
        </Button>
      </div>
    </div>
  );
}
