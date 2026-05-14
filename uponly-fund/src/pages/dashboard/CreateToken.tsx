import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GlassCard } from "@/components/rise/RiseShared";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useWallet } from "@/lib/WalletContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import { postRiseCreateTransactions, uploadRiseCreateImage, uploadRiseCreateMetadata, RiseTradeApiError } from "@/lib/riseTradeApi";
import { submitOrderedBase64Txs } from "@/lib/solanaTx";
import { USDC_MAINNET, WSOL_MAINNET } from "@/lib/riseAmounts";
import { buildSolscanTxUrl } from "@/lib/riseDashboardApi";
import { toast } from "@/components/ui/sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name required").max(64),
  symbol: z.string().min(1, "Symbol required").max(10),
  description: z.string().max(2000).optional().default(""),
  twitter: z.string().max(512).optional().default(""),
  telegram: z.string().max(512).optional().default(""),
  backing: z.enum(["sol", "usdc"]),
  creatorFeePercent: z.coerce.number().int().min(0).max(10),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTokenPage() {
  const { language } = useLanguage();
  const p = DASHBOARD_COPY[language].pages;
  const ct = DASHBOARD_COPY[language].createTokenPage;
  const { publicKey, signAllTransactions } = useWallet();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneMint, setDoneMint] = useState<string | null>(null);
  const [doneSigs, setDoneSigs] = useState<string[]>([]);

  useDocumentMeta({
    title: `${p.createTokenTitle} · Up Only Fund`,
    description: p.createTokenDescription,
    canonicalPath: "/create-token",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      twitter: "",
      telegram: "",
      backing: "sol",
      creatorFeePercent: 5,
    },
  });

  const backing = form.watch("backing");

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) setImageFile(f);
  }, []);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImageFile(f);
  }, []);

  const processSubmit = form.handleSubmit(async (values) => {
    if (!publicKey) {
      toast.error("Connect Phantom first");
      return;
    }
    if (!imageFile) {
      toast.error("Image required");
      return;
    }
    setBusy(true);
    setDoneMint(null);
    setDoneSigs([]);
    try {
      const imgRes = await uploadRiseCreateImage(imageFile);
      const metaRes = await uploadRiseCreateMetadata({
        name: values.name,
        symbol: values.symbol,
        description: values.description?.trim() || `${values.name} (${values.symbol}) on Rise`,
        image: imgRes.url,
        external_url: values.twitter?.trim() || undefined,
        twitter: values.twitter?.trim() || undefined,
        telegram: values.telegram?.trim() || undefined,
      });
      const mintMain = values.backing === "usdc" ? USDC_MAINNET : WSOL_MAINNET;
      const txRes = await postRiseCreateTransactions({
        wallet: publicKey,
        tokenName: values.name,
        tokenSymbol: values.symbol,
        tokenUri: metaRes.url,
        mintMain,
        creatorFeePercent: values.creatorFeePercent,
      });
      const sigs = await submitOrderedBase64Txs(txRes.transactions, signAllTransactions);
      setDoneSigs(sigs);
      const mint =
        typeof txRes.addresses?.mintToken === "string"
          ? txRes.addresses.mintToken
          : typeof txRes.addresses?.mint_token === "string"
            ? txRes.addresses.mint_token
            : null;
      setDoneMint(mint);
      toast.success(ct.successTitle);
    } catch (e) {
      const msg = e instanceof RiseTradeApiError ? e.message : e instanceof Error ? e.message : "Failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  });

  if (doneSigs.length > 0) {
    return (
      <div className="relative flex flex-col gap-8">
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-6">
          <DashboardPageHeader eyebrow={p.createTokenEyebrow} title={ct.successTitle} description={ct.successBody} />
          <GlassCard className="max-w-xl space-y-4">
            {doneMint ? (
              <p className="font-mono text-sm break-all">
                <span className="text-muted-foreground">Mint: </span>
                {doneMint}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Mint address was not returned by the API; check Solscan for your signatures.</p>
            )}
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{ct.signaturesTitle}</p>
              <ul className="mt-2 space-y-2">
                {doneSigs.map((sig) => {
                  const url = buildSolscanTxUrl(sig);
                  return (
                    <li key={sig}>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary underline">
                          {sig.slice(0, 10)}…
                        </a>
                      ) : (
                        <span className="font-mono text-xs">{sig}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {doneMint ? (
                <Button asChild>
                  <Link to={`/token/${encodeURIComponent(doneMint)}`}>{ct.viewToken}</Link>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDoneMint(null);
                  setDoneSigs([]);
                  form.reset();
                  setImageFile(null);
                }}
              >
                {ct.reset}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[26rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.13),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.07),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col gap-6">
        <DashboardPageHeader eyebrow={p.createTokenEyebrow} title={p.createTokenTitle} description={p.createTokenDescription} />

        <form onSubmit={(e) => void processSubmit(e)} className="mx-auto w-full max-w-xl space-y-6">
          <GlassCard className="space-y-4">
            <Label className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{ct.imageLabel}</Label>
            <label
              htmlFor="create-token-image"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <Upload className="h-8 w-8 opacity-50" />
              <span>{imageFile ? imageFile.name : ct.dropHint}</span>
              <input id="create-token-image" type="file" accept="image/png,image/jpeg,image/jpg,image/gif" className="sr-only" onChange={onPick} />
            </label>

            <div>
              <Label htmlFor="ct-name">{ct.nameLabel}</Label>
              <Input id="ct-name" className="mt-1.5" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="ct-symbol">{ct.symbolLabel}</Label>
              <Input id="ct-symbol" className="mt-1.5" {...form.register("symbol")} />
              {form.formState.errors.symbol ? (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.symbol.message}</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="ct-desc">{ct.descriptionLabel}</Label>
              <Textarea id="ct-desc" className="mt-1.5 min-h-[88px]" {...form.register("description")} />
            </div>
            <div>
              <Label htmlFor="ct-tw">{ct.twitterLabel}</Label>
              <Input id="ct-tw" className="mt-1.5" placeholder="https://x.com/..." {...form.register("twitter")} />
            </div>
            <div>
              <Label htmlFor="ct-tg">{ct.telegramLabel}</Label>
              <Input id="ct-tg" className="mt-1.5" placeholder="https://t.me/..." {...form.register("telegram")} />
            </div>

            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{ct.backingLabel}</p>
              <ToggleGroup
                type="single"
                value={backing}
                onValueChange={(v) => {
                  if (v === "sol" || v === "usdc") form.setValue("backing", v);
                }}
                className="mt-2 justify-start gap-1"
              >
                <ToggleGroupItem value="sol" className="px-3 text-xs">
                  {ct.backingSol}
                </ToggleGroupItem>
                <ToggleGroupItem value="usdc" className="px-3 text-xs">
                  {ct.backingUsdc}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label htmlFor="ct-fee">{ct.feeLabel}</Label>
              <Input id="ct-fee" type="number" min={0} max={10} className="mt-1.5" {...form.register("creatorFeePercent")} />
            </div>

            <Button type="submit" className="w-full" disabled={busy || !publicKey}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ct.uploading}
                </>
              ) : (
                ct.submit
              )}
            </Button>
            {!publicKey ? <p className="text-center text-xs text-muted-foreground">Connect Phantom to continue.</p> : null}
          </GlassCard>
        </form>
      </div>
    </div>
  );
}
