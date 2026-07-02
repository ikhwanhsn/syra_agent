import { useCallback, useState } from "react";
import { Copy, Download, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { revealMultiWalletSecret } from "@/lib/multiWalletApi";

interface MultiWalletExportKeyDialogProps {
  publicKey: string | null;
  label?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiWalletExportKeyDialog({
  publicKey,
  label,
  open,
  onOpenChange,
}: MultiWalletExportKeyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);

  const handleReveal = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setSecretKey(null);
    try {
      const data = await revealMultiWalletSecret(publicKey);
      setSecretKey(data.secretKey);
    } catch (err) {
      notify.error("Export failed", err instanceof Error ? err.message : "Could not reveal key");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [onOpenChange, publicKey]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSecretKey(null);
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const copySecret = useCallback(async () => {
    if (!secretKey) return;
    await navigator.clipboard.writeText(secretKey);
    notify.success("Copied", "Private key copied to clipboard");
  }, [secretKey]);

  const downloadSecret = useCallback(() => {
    if (!secretKey || !publicKey) return;
    const blob = new Blob(
      [JSON.stringify({ publicKey, secretKey, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `syra-multiwallet-${publicKey.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [publicKey, secretKey]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Export private key</AlertDialogTitle>
          <AlertDialogDescription>
            {label ? `${label} · ` : ""}
            <span className="font-mono text-xs">{publicKey}</span>
            <br />
            <br />
            Never share this key. Anyone with it controls the wallet and its funds.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Decrypting key…
            </div>
          ) : secretKey ? (
            <code className="block break-all text-xs text-foreground">{secretKey}</code>
          ) : (
            <p className="text-sm text-muted-foreground">Key will appear here after confirmation.</p>
          )}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel>Close</AlertDialogCancel>
          {secretKey ? (
            <>
              <Button type="button" variant="outline" onClick={() => void copySecret()}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <AlertDialogAction type="button" onClick={downloadSecret}>
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction type="button" disabled={loading} onClick={() => void handleReveal()}>
              <Eye className="mr-2 h-4 w-4" />
              Reveal key
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
