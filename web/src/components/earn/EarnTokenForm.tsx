import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  launchEarnPumpfunToken,
  solToLamportsString,
  uploadEarnTokenMetadata,
} from "@/lib/earnPumpfunApi";

type EarnTokenFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLaunched: () => void;
};

export function EarnTokenForm({ open, onOpenChange, onLaunched }: EarnTokenFormProps) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [solAmount, setSolAmount] = useState("0.05");
  const [metadataUri, setMetadataUri] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setSymbol("");
    setDescription("");
    setSolAmount("0.05");
    setMetadataUri("");
    setImageFile(null);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      const s = symbol.trim().toUpperCase();
      const lamports = solToLamportsString(solAmount);
      if (!n) throw new Error("Name is required.");
      if (!s || s.length > 10) throw new Error("Symbol is required (max 10 chars).");
      if (!lamports) throw new Error("Enter a valid initial buy in SOL.");

      let uri = metadataUri.trim();
      if (!uri) {
        if (!imageFile) throw new Error("Upload an image or paste a metadata URI.");
        const uploaded = await uploadEarnTokenMetadata({
          file: imageFile,
          name: n,
          symbol: s,
          description: description.trim() || undefined,
        });
        uri = uploaded.metadataUri;
      } else if (!uri.startsWith("http") && !uri.startsWith("ipfs://")) {
        throw new Error("Metadata URI must start with http(s):// or ipfs://");
      }

      return launchEarnPumpfunToken({
        name: n,
        symbol: s,
        uri,
        solLamports: lamports,
      });
    },
    onSuccess: (data) => {
      if (data.submitError) {
        setError(data.submitError);
        onLaunched();
        return;
      }
      reset();
      onOpenChange(false);
      onLaunched();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Launch on pump.fun</DialogTitle>
          <DialogDescription>
            Uses your earn wallet. You receive creator fees from trades. Needs SOL for launch + a small USDC fee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="token-name">Name</Label>
              <Input
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Token"
                disabled={mutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-symbol">Symbol</Label>
              <Input
                id="token-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="TKN"
                maxLength={10}
                className="font-mono"
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-desc">Description</Label>
            <Textarea
              id="token-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              rows={2}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-image">Image</Label>
            <Input
              id="token-image"
              type="file"
              accept="image/*"
              disabled={mutation.isPending}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-uri">Metadata URI (optional)</Label>
            <Input
              id="token-uri"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="https://ipfs.io/ipfs/…"
              disabled={mutation.isPending}
            />
            <p className="text-xs text-muted-foreground">Skip if you uploaded an image above.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-sol">Initial buy (SOL)</Label>
            <Input
              id="token-sol"
              value={solAmount}
              onChange={(e) => setSolAmount(e.target.value)}
              placeholder="0.05"
              inputMode="decimal"
              className="max-w-[8rem] font-mono tabular-nums"
              disabled={mutation.isPending}
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching…
              </>
            ) : (
              "Launch"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
