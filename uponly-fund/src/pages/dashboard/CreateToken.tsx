import { useCallback, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Rocket, Wallet } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ConnectWalletButton } from "@/components/dashboard/ConnectWalletButton";
import { CreateTokenBackingPicker } from "@/components/create-token/CreateTokenBackingPicker";
import { CreateTokenImageUpload } from "@/components/create-token/CreateTokenImageUpload";
import { CreateTokenLaunchRail } from "@/components/create-token/CreateTokenLaunchRail";
import { CreateTokenPreview } from "@/components/create-token/CreateTokenPreview";
import { CreateTokenSection } from "@/components/create-token/CreateTokenSection";
import { CreateTokenSuccess } from "@/components/create-token/CreateTokenSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { useWallet } from "@/lib/WalletContext";
import { useDocumentMeta } from "@/lib/useDocumentMeta";
import {
  postRiseCreateTransactions,
  uploadRiseCreateImage,
  uploadRiseCreateMetadata,
  RiseTradeApiError,
} from "@/lib/riseTradeApi";
import { submitOrderedBase64Txs } from "@/lib/solanaTx";
import { USDC_MAINNET, WSOL_MAINNET } from "@/lib/riseAmounts";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

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

const PAGE_GRADIENT =
  "pointer-events-none absolute inset-x-0 -top-32 z-0 h-[30rem] bg-[radial-gradient(ellipse_68%_54%_at_50%_-8%,hsl(var(--uof)_/_0.15),transparent_56%),radial-gradient(ellipse_44%_40%_at_86%_22%,hsl(215_85%_55%/0.08),transparent_52%),radial-gradient(ellipse_38%_34%_at_12%_28%,hsl(280_70%_50%/0.06),transparent_50%)]";

export default function CreateTokenPage() {
  const { language } = useLanguage();
  const p = DASHBOARD_COPY[language].pages;
  const ct = DASHBOARD_COPY[language].createTokenPage;
  const { publicKey, signAllTransactions } = useWallet();
  const reduceMotion = useReducedMotion() ?? false;

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

  const watched = form.watch();
  const backing = watched.backing;
  const creatorFee = watched.creatorFeePercent;

  const hasIdentity = Boolean(watched.name.trim() && watched.symbol.trim());

  const processSubmit = form.handleSubmit(async (values) => {
    if (!publicKey) {
      toast.error(ct.connectWalletPrompt);
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

  const resetLaunch = useCallback(() => {
    setDoneMint(null);
    setDoneSigs([]);
    form.reset();
    setImageFile(null);
  }, [form]);

  if (doneSigs.length > 0) {
    return (
      <CreateTokenSuccess pages={p} copy={ct} mint={doneMint} signatures={doneSigs} onReset={resetLaunch} />
    );
  }

  return (
    <div className="relative flex flex-col gap-8">
      <div className={PAGE_GRADIENT} aria-hidden />

      <div className="relative z-[1] flex flex-col gap-6">
        <DashboardPageHeader
          eyebrow={p.createTokenEyebrow}
          title={p.createTokenTitle}
          description={p.createTokenDescription}
          emphasis="hero"
        />

        {!publicKey ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.04] to-transparent px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                <Wallet className="h-5 w-5 text-amber-400" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{ct.connectBannerTitle}</p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{ct.connectBannerBody}</p>
              </div>
            </div>
            <ConnectWalletButton />
          </motion.div>
        ) : null}

        <form onSubmit={(e) => void processSubmit(e)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] xl:items-start xl:gap-8">
          <div className="flex flex-col gap-5">
            <CreateTokenSection title={ct.sectionIdentity} hint={ct.sectionIdentityHint} delay={0}>
              <CreateTokenImageUpload copy={ct} file={imageFile} onFileChange={setImageFile} disabled={busy} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ct.nameLabel} error={form.formState.errors.name?.message}>
                  <Input
                    id="ct-name"
                    className="h-11 rounded-xl border-border/55 bg-background/40 shadow-inner"
                    placeholder="Up Only"
                    disabled={busy}
                    {...form.register("name")}
                  />
                </Field>
                <Field label={ct.symbolLabel} error={form.formState.errors.symbol?.message}>
                  <Input
                    id="ct-symbol"
                    className="h-11 rounded-xl border-border/55 bg-background/40 font-mono uppercase shadow-inner"
                    placeholder="UPONLY"
                    disabled={busy}
                    {...form.register("symbol")}
                  />
                </Field>
              </div>
            </CreateTokenSection>

            <CreateTokenSection title={ct.sectionStory} hint={ct.sectionStoryHint} delay={0.05}>
              <Field label={ct.descriptionLabel}>
                <Textarea
                  id="ct-desc"
                  className="min-h-[100px] rounded-xl border-border/55 bg-background/40 shadow-inner"
                  placeholder="What makes this token unique on Rise?"
                  disabled={busy}
                  {...form.register("description")}
                />
              </Field>
              <motion.div className="grid gap-4 sm:grid-cols-2">
                <Field label={ct.twitterLabel}>
                  <Input
                    id="ct-tw"
                    className="h-11 rounded-xl border-border/55 bg-background/40 shadow-inner"
                    placeholder="https://x.com/..."
                    disabled={busy}
                    {...form.register("twitter")}
                  />
                </Field>
                <Field label={ct.telegramLabel}>
                  <Input
                    id="ct-tg"
                    className="h-11 rounded-xl border-border/55 bg-background/40 shadow-inner"
                    placeholder="https://t.me/..."
                    disabled={busy}
                    {...form.register("telegram")}
                  />
                </Field>
              </motion.div>
            </CreateTokenSection>

            <CreateTokenSection title={ct.sectionEconomics} hint={ct.sectionEconomicsHint} delay={0.1}>
              <div>
                <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {ct.backingLabel}
                </p>
                <CreateTokenBackingPicker
                  copy={ct}
                  value={backing}
                  onChange={(v) => form.setValue("backing", v)}
                  disabled={busy}
                />
              </div>
              <div>
                <motion.div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <Label htmlFor="ct-fee" className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {ct.feeLabel}
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">{ct.feeHint}</p>
                  </div>
                  <span className="rounded-lg border border-border/50 bg-muted/25 px-2.5 py-1 font-mono text-sm font-semibold tabular-nums">
                    {creatorFee}%
                  </span>
                </motion.div>
                <Slider
                  id="ct-fee"
                  min={0}
                  max={10}
                  step={1}
                  value={[creatorFee]}
                  onValueChange={([v]) => form.setValue("creatorFeePercent", v ?? 0)}
                  disabled={busy}
                  className="py-2"
                />
              </div>
            </CreateTokenSection>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <Button
                type="submit"
                size="lg"
                className={cn(
                  "h-12 w-full rounded-xl text-sm font-semibold shadow-[0_16px_40px_-18px_hsl(var(--uof)/0.55)]",
                  "transition-[transform,box-shadow] duration-200 hover:shadow-[0_20px_48px_-16px_hsl(var(--uof)/0.65)]",
                )}
                disabled={busy || !publicKey}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {ct.uploading}
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" aria-hidden />
                    {ct.submit}
                  </>
                )}
              </Button>
              {!publicKey ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">{ct.connectWalletPrompt}</p>
              ) : null}
            </motion.div>
          </div>

          <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
            <CreateTokenPreview
              copy={ct}
              name={watched.name}
              symbol={watched.symbol}
              description={watched.description ?? ""}
              twitter={watched.twitter ?? ""}
              telegram={watched.telegram ?? ""}
              backing={backing}
              creatorFeePercent={creatorFee}
              imageFile={imageFile}
            />
            <CreateTokenLaunchRail
              copy={ct}
              busy={busy}
              hasImage={Boolean(imageFile)}
              hasIdentity={hasIdentity}
              walletConnected={Boolean(publicKey)}
            />
          </aside>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-2 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
