import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchSpcxTelegramPreview } from "@/lib/spcxApi";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

export function SpcxShareIntel() {
  const [copied, setCopied] = useState(false);
  const previewQ = useQuery({
    queryKey: ["spcx-telegram-preview"],
    queryFn: fetchSpcxTelegramPreview,
    staleTime: 60_000,
  });

  const message = previewQ.data?.message ?? "";

  const copy = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card id="spcx-share" className={`${spcxCardClass} scroll-mt-28`}>
      <CardHeader className="border-b border-border/40 bg-muted/[0.03] pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          Share with friends
        </CardTitle>
        <CardDescription>Copy a ready-made summary for Telegram or X</CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/40 bg-muted/20 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {previewQ.isLoading ? "Loading…" : message || "No preview available"}
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 gap-2 rounded-xl"
          onClick={copy}
          disabled={!message}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          Copy summary
        </Button>
      </CardContent>
    </Card>
  );
}
