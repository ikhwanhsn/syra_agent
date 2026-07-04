import { useMutation } from "@tanstack/react-query";
import { Loader2, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import {
  EarnDialogError,
  EarnDialogField,
  EarnDialogSection,
  EarnDialogShell,
  earnFieldControlClass,
  earnTextareaClass,
} from "@/components/earn/EarnDialogShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  launchEarnPumpfunToken,
  solToLamportsString,
  uploadEarnTokenMetadata,
} from "@/lib/earnPumpfunApi";
import { cn } from "@/lib/utils";

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

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

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
    <EarnDialogShell
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      icon={Rocket}
      title="Launch on pump.fun"
      description="Uses your earn wallet. You receive creator fees from trades."
      className="sm:max-w-md"
      bodyClassName="max-h-[min(62dvh,560px)]"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/60"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="neon"
            className="h-10 rounded-xl"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching…
              </>
            ) : (
              "Launch token"
            )}
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-border/45 bg-muted/15 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
        Needs SOL for the initial buy plus a small USDC fee from your earn wallet.
      </div>

      <EarnDialogSection title="Token identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <EarnDialogField label="Name" htmlFor="token-name">
            <Input
              id="token-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Token"
              disabled={mutation.isPending}
              className={earnFieldControlClass}
            />
          </EarnDialogField>
          <EarnDialogField label="Symbol" htmlFor="token-symbol">
            <Input
              id="token-symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="TKN"
              maxLength={10}
              disabled={mutation.isPending}
              className={cn(earnFieldControlClass, "font-mono tracking-wide")}
            />
          </EarnDialogField>
        </div>

        <EarnDialogField label="Description" htmlFor="token-desc" optional>
          <Textarea
            id="token-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            rows={2}
            disabled={mutation.isPending}
            className={cn(earnTextareaClass, "min-h-[4.5rem]")}
          />
        </EarnDialogField>
      </EarnDialogSection>

      <EarnDialogSection title="Metadata" description="Upload artwork or paste an existing URI.">
        <EarnDialogField
          label="Image"
          htmlFor="token-image"
          hint="Required unless you paste a metadata URI below."
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/30",
                imagePreviewUrl
                  ? "p-0"
                  : "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70",
              )}
            >
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                "Art"
              )}
            </div>
            <Input
              id="token-image"
              type="file"
              accept="image/*"
              disabled={mutation.isPending}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className={cn(
                earnFieldControlClass,
                "h-auto py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary",
              )}
            />
          </div>
        </EarnDialogField>

        <EarnDialogField
          label="Metadata URI"
          htmlFor="token-uri"
          optional
          hint="Skip if you uploaded an image above."
        >
          <Input
            id="token-uri"
            value={metadataUri}
            onChange={(e) => setMetadataUri(e.target.value)}
            placeholder="https://ipfs.io/ipfs/…"
            disabled={mutation.isPending}
            className={cn(earnFieldControlClass, "font-mono text-[13px]")}
          />
        </EarnDialogField>
      </EarnDialogSection>

      <EarnDialogField label="Initial buy (SOL)" htmlFor="token-sol">
        <Input
          id="token-sol"
          value={solAmount}
          onChange={(e) => setSolAmount(e.target.value)}
          placeholder="0.05"
          inputMode="decimal"
          disabled={mutation.isPending}
          className={cn(earnFieldControlClass, "max-w-[9rem] font-mono tabular-nums")}
        />
      </EarnDialogField>

      {error ? <EarnDialogError message={error} /> : null}
    </EarnDialogShell>
  );
}
