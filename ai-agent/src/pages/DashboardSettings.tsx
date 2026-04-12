import { useCallback, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, Loader2, Shield, SlidersHorizontal, Sparkles, User, UserRound, Wallet2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";

const LS_DISPLAY_NAME = "syra.settings.displayName";
const LS_PREF_PRODUCT_UPDATES = "syra.settings.pref.productUpdates";
const LS_PREF_USAGE_INSIGHTS = "syra.settings.pref.usageInsights";
const LS_PREF_COMPACT = "syra.settings.pref.compactDensity";

function readString(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "1" || v === "true";
  } catch {
    return fallback;
  }
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* quota / private mode */
  }
}

function maskAnonymousId(id: string): string {
  if (!id) return "—";
  if (id.startsWith("wallet:")) {
    const pubkey = id.slice(7).trim();
    if (pubkey.length <= 8) return pubkey;
    return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
  }
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function formatTokenAmount(value: number | null | undefined, maxDecimals: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}k`;
  if (value >= 1) return value.toFixed(maxDecimals);
  return value.toFixed(Math.min(6, maxDecimals));
}

function FieldShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full items-center rounded-lg border border-border/80 bg-muted/20 px-3.5 py-2.5 text-[13px] text-muted-foreground/90 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DashboardSettingsProps {
  /** When embedded in the agent app (`/settings`), use tighter top rhythm and copy. */
  layout?: "dashboard" | "agent";
}

const RESOURCE_LINKS = [
  { href: "https://docs.syraa.fun", label: "Help & documentation" },
  { href: "https://syraa.fun", label: "Syra website" },
  { href: "https://x.com/syra_agent", label: "Syra on X" },
] as const;

export default function DashboardSettings({ layout = "dashboard" }: DashboardSettingsProps) {
  const { toast } = useToast();
  const { connected, shortAddress, baseConnected, baseShortAddress } = useWalletContext();
  const {
    ready,
    anonymousId,
    agentAddress,
    agentShortAddress,
    agentSolBalance,
    agentUsdcBalance,
    agentBaseEthBalance,
    agentBaseUsdcBalance,
    connectedWalletAddress,
    connectedChain,
    refetchBalance,
    avatarUrl,
    updateAvatarUrl,
  } = useAgentWallet();

  const [displayName, setDisplayName] = useState(() => readString(LS_DISPLAY_NAME, ""));
  const [productUpdates, setProductUpdates] = useState(() => readBool(LS_PREF_PRODUCT_UPDATES, true));
  const [usageInsights, setUsageInsights] = useState(() => readBool(LS_PREF_USAGE_INSIGHTS, false));
  const [compactDensity, setCompactDensity] = useState(() => readBool(LS_PREF_COMPACT, false));
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  const saveDisplayName = useCallback(() => {
    const trimmed = displayName.trim();
    writeString(LS_DISPLAY_NAME, trimmed);
    toast({
      title: "Profile saved",
      description: "Display name is stored on this device only.",
    });
  }, [displayName, toast]);

  const setProductUpdatesPref = useCallback((v: boolean) => {
    setProductUpdates(v);
    writeBool(LS_PREF_PRODUCT_UPDATES, v);
  }, []);

  const setUsageInsightsPref = useCallback((v: boolean) => {
    setUsageInsights(v);
    writeBool(LS_PREF_USAGE_INSIGHTS, v);
  }, []);

  const setCompactPref = useCallback((v: boolean) => {
    setCompactDensity(v);
    writeBool(LS_PREF_COMPACT, v);
  }, []);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      void navigator.clipboard?.writeText(text).then(
        () => {
          toast({ title: "Copied", description: `${label} copied to clipboard.` });
          setCopiedField(label);
          window.setTimeout(() => setCopiedField(null), 2000);
        },
        () => toast({ title: "Could not copy", description: "Select the text and copy manually.", variant: "destructive" }),
      );
    },
    [toast],
  );

  const handleRefreshBalances = useCallback(async () => {
    if (!agentAddress) return;
    setRefreshingBalances(true);
    try {
      await refetchBalance();
      toast({ title: "Balances updated", description: "Loaded the latest amounts from the network." });
    } finally {
      setRefreshingBalances(false);
    }
  }, [agentAddress, refetchBalance, toast]);

  const handleGenerateAvatar = useCallback(async () => {
    if (!anonymousId) {
      toast({
        title: "Session not ready",
        description: "Connect a wallet and wait for the session to load, then try again.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingAvatar(true);
    try {
      const result = await agentWalletApi.generateAvatar(anonymousId);
      if (updateAvatarUrl && result.avatarUrl) {
        updateAvatarUrl(result.avatarUrl);
      }
      toast({ title: "Avatar updated", description: "A new random avatar has been generated." });
    } catch (err) {
      toast({
        title: "Could not generate avatar",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAvatar(false);
    }
  }, [anonymousId, toast, updateAvatarUrl]);

  const identityParts: string[] = [];
  if (connected && shortAddress) identityParts.push(`Solana · ${shortAddress}`);
  if (baseConnected && baseShortAddress) identityParts.push(`Base · ${baseShortAddress}`);
  const identityLine =
    identityParts.length > 0 ? identityParts.join(" · ") : "Connect a wallet from the agent to link your session.";

  const walletLinkSummary =
    connectedWalletAddress && connectedChain === "solana"
      ? "Linked with Solana"
      : connectedWalletAddress && connectedChain === "base"
        ? "Linked with Base"
        : "Browsing without a linked wallet (guest session)";

  const topPadding = layout === "agent" ? PAGE_PADDING_TOP_STANDARD : PAGE_PADDING_TOP_MEDIUM;

  const isBaseAgent = connectedChain === "base";

  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, topPadding, PAGE_SAFE_AREA_BOTTOM, "space-y-10 pb-6")}>
      <header className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
          {layout === "agent" ? "Agent" : "Workspace"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">Profile & settings</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground/90">
          Your avatar, display name, wallets, and preferences for this browser. With a connected wallet, chats can sync
          to Syra and your agent wallet pays for on-chain tools.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/80 bg-card/40 shadow-none ring-1 ring-white/[0.04] dark:ring-white/[0.06]">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                  <UserRound className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">Profile</CardTitle>
                  <CardDescription className="text-[13px]">
                    Avatar, display name, and how you appear in Syra on this device.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Avatar</Label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-card shadow-md">
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" draggable={false} />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-muted to-muted-foreground/20 shadow-md">
                        <User className="h-10 w-10 text-muted-foreground" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => void handleGenerateAvatar()}
                      disabled={generatingAvatar || !anonymousId}
                    >
                      {generatingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                          Generate random avatar
                        </>
                      )}
                    </Button>
                    <p className="text-xs leading-relaxed text-muted-foreground/90">
                      Random avatars are tied to your Syra session and appear in chat right away.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-display-name" className="text-xs font-medium text-muted-foreground">
                  Display name
                </Label>
                <Input
                  id="settings-display-name"
                  autoComplete="nickname"
                  placeholder="Your name or handle"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-10 border-border/80 bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Wallets</Label>
                <FieldShell className="text-[12px] leading-relaxed">{identityLine}</FieldShell>
              </div>
              <Button type="button" onClick={saveDisplayName} className="w-full sm:w-auto">
                Save profile
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/80 bg-card/40 shadow-none ring-1 ring-white/[0.04] dark:ring-white/[0.06]">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                  <Wallet2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">Agent wallet</CardTitle>
                  <CardDescription className="text-[13px]">
                    Your Syra agent has its own address for tools and USDC payments. Fund it from the wallet menu in chat
                    when you use paid features.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Connection</Label>
                <FieldShell className="text-[12px] leading-relaxed text-foreground/90">{walletLinkSummary}</FieldShell>
              </div>

              {!ready ? (
                <p className="text-sm text-muted-foreground/90">Loading your session…</p>
              ) : !agentAddress ? (
                <p className="text-sm leading-relaxed text-muted-foreground/90">
                  Your agent address will appear here once the wallet session is ready. If this persists, open the wallet
                  menu in the chat header and try again.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Agent address</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <FieldShell className="min-w-0 flex-1 font-mono text-[12px] tracking-tight text-foreground/90">
                        <span className="truncate">{agentShortAddress ?? agentAddress}</span>
                      </FieldShell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-border/80 bg-background/50"
                        onClick={() => copyToClipboard(agentAddress, "Agent address")}
                      >
                        {copiedField === "Agent address" ? (
                          <>
                            <Check className="mr-2 h-4 w-4" aria-hidden />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" aria-hidden />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Balances</Label>
                    {isBaseAgent ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <FieldShell className="justify-between text-[12px] text-foreground/90">
                          <span className="text-muted-foreground">ETH (Base)</span>
                          <span className="font-medium tabular-nums">{formatTokenAmount(agentBaseEthBalance, 5)}</span>
                        </FieldShell>
                        <FieldShell className="justify-between text-[12px] text-foreground/90">
                          <span className="text-muted-foreground">USDC (Base)</span>
                          <span className="font-medium tabular-nums">{formatTokenAmount(agentBaseUsdcBalance, 2)}</span>
                        </FieldShell>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <FieldShell className="justify-between text-[12px] text-foreground/90">
                          <span className="text-muted-foreground">SOL</span>
                          <span className="font-medium tabular-nums">{formatTokenAmount(agentSolBalance, 4)}</span>
                        </FieldShell>
                        <FieldShell className="justify-between text-[12px] text-foreground/90">
                          <span className="text-muted-foreground">USDC</span>
                          <span className="font-medium tabular-nums">{formatTokenAmount(agentUsdcBalance, 2)}</span>
                        </FieldShell>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={refreshingBalances}
                    onClick={() => void handleRefreshBalances()}
                  >
                    {refreshingBalances ? "Refreshing…" : "Refresh balances"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/80 bg-card/40 shadow-none ring-1 ring-white/[0.04] dark:ring-white/[0.06]">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                  <Shield className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">Privacy & session</CardTitle>
                  <CardDescription className="text-[13px]">
                    What Syra stores and where your data lives, in plain language.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Session ID (masked)</Label>
                <FieldShell className="font-mono text-[12px] text-foreground/90">
                  {anonymousId ? maskAnonymousId(anonymousId) : "—"}
                </FieldShell>
                <p className="text-xs leading-relaxed text-muted-foreground/85">
                  This id groups your agent wallet and chat usage. It is not your seed phrase and should not be shared
                  publicly.
                </p>
              </div>
              {anonymousId ? (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Session ID (full)</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <FieldShell className="min-w-0 flex-1 font-mono text-[11px] leading-snug text-foreground/90">
                      <span className="min-w-0 break-all">{anonymousId}</span>
                    </FieldShell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-border/80 bg-background/50"
                      onClick={() => copyToClipboard(anonymousId, "Session ID")}
                    >
                      {copiedField === "Session ID" ? (
                        <>
                          <Check className="mr-2 h-4 w-4" aria-hidden />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" aria-hidden />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
              <ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground/90">
                <li>Your display name above is saved only in this browser.</li>
                <li>
                  When a wallet is connected, chat titles and messages can be saved to your Syra account so you can pick
                  up where you left off on this device.
                </li>
                <li>Paid tools use USDC (and network fees) from your agent wallet—never from your personal wallet without your action in the app.</li>
              </ul>
              <Separator className="bg-border/60" />
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Resources</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {RESOURCE_LINKS.map((link) => (
                    <Button key={link.href} type="button" variant="outline" size="sm" className="justify-start border-border/80 bg-background/50" asChild>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                        {link.label}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 bg-card/40 shadow-none ring-1 ring-white/[0.04] dark:ring-white/[0.06] lg:sticky lg:top-6">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight">Preferences</CardTitle>
                <CardDescription className="text-[13px]">Stored locally; used as defaults where supported.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="pref-product" className="text-sm font-medium text-foreground/95">
                  Product updates
                </Label>
                <p id="pref-product-desc" className="text-xs leading-relaxed text-muted-foreground/85">
                  In-app tips and release highlights.
                </p>
              </div>
              <Switch
                id="pref-product"
                checked={productUpdates}
                onCheckedChange={setProductUpdatesPref}
                className="shrink-0 data-[state=checked]:bg-primary"
                aria-describedby="pref-product-desc"
              />
            </div>
            <Separator className="my-4 bg-border/60" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="pref-usage" className="text-sm font-medium text-foreground/95">
                  Usage insights
                </Label>
                <p id="pref-usage-desc" className="text-xs leading-relaxed text-muted-foreground/85">
                  Optional local flags for future analytics toggles.
                </p>
              </div>
              <Switch
                id="pref-usage"
                checked={usageInsights}
                onCheckedChange={setUsageInsightsPref}
                className="shrink-0 data-[state=checked]:bg-primary"
                aria-describedby="pref-usage-desc"
              />
            </div>
            <Separator className="my-4 bg-border/60" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="pref-compact" className="text-sm font-medium text-foreground/95">
                  Compact density
                </Label>
                <p id="pref-compact-desc" className="text-xs leading-relaxed text-muted-foreground/85">
                  Tighter spacing in lists when the app reads this preference.
                </p>
              </div>
              <Switch
                id="pref-compact"
                checked={compactDensity}
                onCheckedChange={setCompactPref}
                className="shrink-0 data-[state=checked]:bg-primary"
                aria-describedby="pref-compact-desc"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
