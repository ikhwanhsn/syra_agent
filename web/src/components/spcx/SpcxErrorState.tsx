import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SpcxErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:text-left">
        <AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">Could not load SPCX intelligence</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={onRetry} disabled={retrying}>
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
