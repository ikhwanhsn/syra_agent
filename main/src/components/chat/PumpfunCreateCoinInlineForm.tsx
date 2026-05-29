import { useState, useCallback } from "react";
import { Sparkles, Link2, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function solToLamportsString(solRaw: string): string | null {
  const sol = solRaw.trim().replace(/,/g, "");
  const n = Number(sol);
  if (!Number.isFinite(n) || n <= 0) return null;
  const lamports = Math.round(n * 1e9);
  if (!Number.isFinite(lamports) || lamports <= 0) return null;
  return String(lamports);
}

function isReasonableUri(uri: string): boolean {
  const u = uri.trim();
  if (u.length < 8) return false;
  return /^https?:\/\//i.test(u) || /^ipfs:\/\//i.test(u);
}

export interface PumpfunCreateCoinInlineFormProps {
  assistantMessageId: string;
  readOnly?: boolean;
  onCreate: (payload: { assistantMessageId: string; prompt: string }) => void;
  onCancel: (assistantMessageId: string) => void;
}

export function PumpfunCreateCoinInlineForm({
  assistantMessageId,
  readOnly = false,
  onCreate,
  onCancel,
}: PumpfunCreateCoinInlineFormProps) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [solAmount, setSolAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(() => {
    setError(null);
    const n = name.trim();
    const s = symbol.trim().toUpperCase();
    const u = uri.trim();
    const sol = solAmount.trim();
    if (!n) {
      setError("Enter a token name.");
      return;
    }
    if (!s || s.length > 10) {
      setError("Enter a ticker symbol (up to 10 characters).");
      return;
    }
    if (!isReasonableUri(u)) {
      setError("Metadata URI must start with http(s):// or ipfs://");
      return;
    }
    const lamports = solToLamportsString(sol);
    if (!lamports) {
      setError("Enter initial buy size in SOL (e.g. 0.05).");
      return;
    }
    const prompt = [
      "Launch a new coin on pump.fun using the pumpfun-agents-create-coin tool with exactly these parameters:",
      `- name: ${n}`,
      `- symbol: ${s}`,
      `- uri: ${u}`,
      `- solLamports: ${lamports}`,
      "Call the tool with these values and report the outcome (mint address, transaction status, or any error).",
    ].join("\n");
    onCreate({ assistantMessageId, prompt });
  }, [assistantMessageId, name, onCreate, solAmount, symbol, uri]);

  if (readOnly) {
    return (
      <div className="mt-4 rounded-2xl border border-border/50 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
        An interactive pump.fun launch form was available in the original chat.
      </div>
    );
  }

  return (
    <div className="mt-4 w-full min-w-0">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-card/95 via-card/80 to-card/60",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_64px_-32px_rgba(0,0,0,0.85)]",
        )}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/[0.12] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-500/[0.08] blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-violet-500/20 ring-1 ring-white/10">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-[17px]">
                  Launch on pump.fun
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  Metadata JSON at your URI should include image and description. Initial SOL is used for creation
                  plus your first buy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor={`pf-name-${assistantMessageId}`} className="text-xs font-medium text-muted-foreground">
                Token name
              </Label>
              <Input
                id={`pf-name-${assistantMessageId}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Moonrocket"
                className="h-11 rounded-xl border-border/60 bg-background/80 text-[15px] shadow-sm transition-colors focus-visible:border-primary/40 focus-visible:ring-primary/25"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor={`pf-sym-${assistantMessageId}`} className="text-xs font-medium text-muted-foreground">
                Symbol
              </Label>
              <Input
                id={`pf-sym-${assistantMessageId}`}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. MOON"
                maxLength={10}
                className="h-11 rounded-xl border-border/60 bg-background/80 font-mono text-[15px] tracking-wide shadow-sm focus-visible:border-primary/40 focus-visible:ring-primary/25"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`pf-uri-${assistantMessageId}`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Link2 className="h-3 w-3 opacity-70" aria-hidden />
                Metadata URI
              </Label>
              <Textarea
                id={`pf-uri-${assistantMessageId}`}
                value={uri}
                onChange={(e) => setUri(e.target.value)}
                placeholder="https://… or ipfs://… (JSON with name, symbol, image, description)"
                rows={2}
                className="min-h-[72px] resize-y rounded-xl border-border/60 bg-background/80 text-[15px] leading-snug shadow-sm focus-visible:border-primary/40 focus-visible:ring-primary/25"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`pf-sol-${assistantMessageId}`} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Coins className="h-3 w-3 opacity-70" aria-hidden />
                Initial buy (SOL)
              </Label>
              <Input
                id={`pf-sol-${assistantMessageId}`}
                type="text"
                inputMode="decimal"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                placeholder="e.g. 0.05"
                className="h-11 max-w-xs rounded-xl border-border/60 bg-background/80 font-mono text-[15px] tabular-nums shadow-sm focus-visible:border-primary/40 focus-visible:ring-primary/25"
                autoComplete="off"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-10"
              onClick={() => onCancel(assistantMessageId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 font-semibold shadow-lg shadow-primary/20 hover:from-primary/95 hover:to-primary/85 sm:h-10"
              onClick={handleSubmit}
            >
              Create token
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
