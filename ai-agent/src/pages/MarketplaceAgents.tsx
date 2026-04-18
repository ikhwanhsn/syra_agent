import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bot,
  Plus,
  Loader2,
  ExternalLink,
  Activity,
  ShieldCheck,
  RefreshCw,
  Settings2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  agent8004Api,
  type Agent8004SearchResult,
  type Agent8004Detail,
  type LivenessReport,
  type IntegrityResult,
  type RegisterAgentPayload,
} from "@/lib/agent8004Api";
import { generateAgentDescription, generateAgentImage } from "@/lib/chatApi";

/** Fallback when dev endpoint does not return Syra collection (e.g. production). */
const FALLBACK_SYRA_COLLECTION = "c1:bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm";

/** 8004market collection page for Syra agents. */
const SYRA_8004_MARKET_URL =
  "https://8004market.io/collection/solana/mainnet-beta/bafkreid3g6kogo55n5iob7pi36xppcycynn7m64pds7wshnankxjo52mfm?creator=53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";

/** 8004market agent detail page uses token ID (agent_id from 8004 index), not asset address. */
function get8004MarketAgentUrl(tokenId: string): string {
  return `https://8004market.io/agent/solana/mainnet-beta/${encodeURIComponent(String(tokenId).trim())}`;
}

/** Max agents a user can create (enforced in API). */
const MAX_AGENTS_PER_USER = 3;

/** Agents per page for pagination. */
const AGENTS_PER_PAGE = 12;

/** Generate image in create-agent dialog; set to true when ready. */
const GENERATE_IMAGE_AVAILABLE = false;

/** Resolve ipfs:// or /ipfs/ image URLs to HTTPS gateway so <img> can load. */
function imageUrlForDisplay(url: string): string {
  const u = url.trim();
  if (u.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${u.slice(7).replace(/^\/+/, "")}`;
  if (u.startsWith("/ipfs/")) return `https://ipfs.io${u}`;
  return u;
}

export interface AgentListItem {
  asset?: string;
  owner?: string;
  agent_uri?: string | null;
  nft_name?: string | null;
  description?: string | null;
  image?: string | null;
  /** 8004 index token ID (used by 8004market URL). */
  agent_id?: string | null;
  [key: string]: unknown;
}

export interface AgentRegistrationMeta {
  name: string | null;
  description: string | null;
  image: string | null;
}

/** Truncate base58 address for display (first 8 + … + last 8). */
function truncateAddress(addr: string, head = 8, tail = 8): string {
  if (!addr || addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function AgentCard({
  agent,
  metadata,
  onManage,
  onLoadMetadata,
  canManage = true,
}: {
  agent: AgentListItem;
  metadata?: AgentRegistrationMeta | null;
  onManage: () => void;
  onLoadMetadata: (asset: string) => void;
  canManage?: boolean;
}) {
  const asset = typeof agent.asset === "string" ? agent.asset : "";
  const displayName =
    metadata?.name?.trim() ||
    agent.nft_name?.trim() ||
    (asset ? truncateAddress(asset) : "") ||
    "8004 Agent";
  const description =
    metadata?.description?.trim() || (typeof agent.description === "string" ? agent.description.trim() : "") || "";
  const rawImage = metadata?.image?.trim() || (typeof agent.image === "string" ? agent.image.trim() : "") || "";
  const imageUrl = rawImage ? imageUrlForDisplay(rawImage) : "";
  const [imageError, setImageError] = useState(false);
  const showImage = imageUrl && !imageError;
  const hasCustomName = !!(metadata?.name?.trim() || agent.nft_name?.trim());

  // Load from 8004 when missing name, image, or description.
  useEffect(() => {
    if (!asset) return;
    const hasName = !!(metadata?.name?.trim() || agent.nft_name?.trim());
    const hasImage = !!(metadata?.image?.trim() || (typeof agent.image === "string" && agent.image.trim()));
    const hasDescription = !!(metadata?.description?.trim() || (typeof agent.description === "string" && agent.description.trim()));
    if (hasName && hasImage && hasDescription) return;
    onLoadMetadata(asset);
  }, [asset, metadata?.name, metadata?.image, metadata?.description, agent.nft_name, agent.image, agent.description, onLoadMetadata]);

  return (
    <Card
      className="group cursor-pointer flex flex-col h-full overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
      onClick={onManage}
    >
      {/* Hero image – square */}
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/10 to-transparent">
            <Bot className="h-12 w-12 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0 bg-background/80 backdrop-blur-sm border-0">
            8004
          </Badge>
          {agent.agent_id && (
            <span className="text-[10px] font-mono text-muted-foreground/90 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5">
              #{agent.agent_id}
            </span>
          )}
        </div>
      </div>

      <CardHeader className="pb-3 pt-4 px-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-bold tracking-tight truncate leading-tight text-foreground">
              {displayName}
            </CardTitle>
            {asset && (
              <CardDescription className="text-[11px] font-mono truncate mt-1 text-muted-foreground/80" title={asset}>
                {hasCustomName ? truncateAddress(asset) : "8004 Agent"}
              </CardDescription>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 mt-0.5" />
        </div>
        <div className="mt-3 min-h-[3rem]">
          <p
            className={`text-xs text-muted-foreground line-clamp-3 leading-relaxed ${!description ? "italic text-muted-foreground/70" : ""}`}
          >
            {description || "No description"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-4 shrink-0">
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 rounded-xl font-medium shadow-sm"
            disabled={!canManage}
            title={!canManage ? "Connect wallet to manage agents" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onManage();
            }}
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            Manage
          </Button>
          {asset && agent.agent_id && (
            <Button variant="outline" size="sm" asChild className="shrink-0 rounded-xl border-border/80">
              <a
                href={get8004MarketAgentUrl(agent.agent_id)}
                target="_blank"
                rel="noopener noreferrer"
                title="View on 8004market"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Default OASF skills/domains for Syra agents (match Node script register-8004-agent-with-collection). */
const DEFAULT_AGENT_SKILLS = [
  "natural_language_processing/text_classification/sentiment_analysis",
  "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
  "natural_language_processing/analytical_reasoning/problem_solving",
  "tool_interaction/tool_use_planning",
];
const DEFAULT_AGENT_DOMAINS = ["finance_and_business/finance"];

function CreateAgentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after create; pass the new agent asset so the list can show it immediately (indexer may lag). */
  onSuccess: (newAsset?: string) => void;
}) {
  const { toast } = useToast();
  const { anonymousId } = useAgentWallet();
  const [submitting, setSubmitting] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [mcpUrl, setMcpUrl] = useState("https://api.syraa.fun");

  const handleGenerateDescription = async () => {
    if (!anonymousId?.trim()) {
      toast({
        title: "Agent wallet required",
        description: "Connect your agent wallet first. AI description uses your wallet, not the system.",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the agent name first, then click AI generate.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingDesc(true);
    try {
      const text = await generateAgentDescription(name, anonymousId);
      if (text) setDescription(text);
      else toast({ title: "No description generated", description: "Try again or enter one manually.", variant: "destructive" });
    } catch (err) {
      toast({
        title: "Could not generate description",
        description: err instanceof Error ? err.message : "Check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!anonymousId?.trim()) {
      toast({
        title: "Agent wallet required",
        description: "Connect your agent wallet first. Image generation uses your wallet (x402).",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Enter the agent name first, then click Generate image.",
        variant: "destructive",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Enter the agent description first for a better image prompt.",
        variant: "destructive",
      });
      return;
    }
    setGeneratingImage(true);
    try {
      const imageUrl = await generateAgentImage(name, description, anonymousId);
      if (imageUrl) setImage(imageUrl);
      else toast({ title: "No image generated", description: "Try again or paste an image URL.", variant: "destructive" });
    } catch (err) {
      toast({
        title: "Could not generate image",
        description: err instanceof Error ? err.message : "Check balance and try again (x402 ~$0.04).",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const reset = useCallback(() => {
    setName("");
    setDescription("");
    setImage("");
    setMcpUrl("https://api.syraa.fun");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    if (!trimmedName || !trimmedDesc) {
      toast({ title: "Validation", description: "Name and description are required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: RegisterAgentPayload = {
        name: trimmedName,
        description: trimmedDesc,
        image: image.trim() || undefined,
        services: [{ type: "MCP", value: mcpUrl.trim() || "https://api.syraa.fun" }],
        skills: DEFAULT_AGENT_SKILLS,
        domains: DEFAULT_AGENT_DOMAINS,
        x402Support: true,
        ...(anonymousId ? { anonymousId } : {}),
      };
      const result = await agent8004Api.registerAgent(payload);
      toast({
        title: "Agent created",
        description: `Asset: ${result.asset.slice(0, 8)}… — added to Syra collection. It may take a few minutes to appear${anonymousId ? " under Your Agents." : "."}`,
      });
      reset();
      onOpenChange(false);
      onSuccess(result.asset);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create agent";
      const code = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : undefined;
      const isTopUpRequired = code === "INSUFFICIENT_SOL" || /top up|insufficient.*sol/i.test(msg);
      toast({
        title: isTopUpRequired ? "Top up required" : "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%,24rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create 8004 Agent in Syra Collection
          </DialogTitle>
          <DialogDescription>
            Register a new agent in the Syra collection. Your agent wallet signs on the backend (no browser popup). Max {MAX_AGENTS_PER_USER} agents per user. Name and description are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Name</Label>
            <Input
              id="agent-name"
              placeholder="e.g. Syra Research Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <Label htmlFor="agent-desc">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={!anonymousId || submitting || generatingDesc}
                className="w-full shrink-0 sm:w-auto"
                title={!anonymousId ? "Connect your agent wallet to use AI generate (uses your wallet)" : undefined}
              >
                {generatingDesc ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI generate
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="agent-desc"
              placeholder="Short description of what this agent does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <Label htmlFor="agent-image">Image URL (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={GENERATE_IMAGE_AVAILABLE ? handleGenerateImage : undefined}
                disabled={!GENERATE_IMAGE_AVAILABLE || !anonymousId || submitting || generatingImage}
                className="w-full shrink-0 sm:w-auto"
                title={GENERATE_IMAGE_AVAILABLE ? (!anonymousId ? "Connect your agent wallet to generate image (x402, ~$0.04)" : "Generate unique image with Xona (paid from your wallet)") : "Coming soon"}
              >
                {generatingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : GENERATE_IMAGE_AVAILABLE ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate image
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Available soon
                  </>
                )}
              </Button>
            </div>
            <Input
              id="agent-image"
              type="url"
              placeholder="https://..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            {image && (
              <div className="relative aspect-video max-h-24 w-full overflow-hidden rounded-md border bg-muted">
                <img src={image} alt="Agent preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-mcp">MCP endpoint URL</Label>
            <Input
              id="agent-mcp"
              type="url"
              placeholder="https://api.syraa.fun"
              value={mcpUrl}
              readOnly
              className="bg-muted cursor-not-allowed"
              title="This endpoint is fixed for all agents."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create agent
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgentDetailSheet({
  asset,
  fallbackAgent,
  agentsMetadata = {},
  open,
  onOpenChange,
}: {
  asset: string | null;
  fallbackAgent?: AgentListItem | null;
  agentsMetadata?: Record<string, AgentRegistrationMeta | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<Agent8004Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [sheetMeta, setSheetMeta] = useState<AgentRegistrationMeta | null>(null);
  const [liveness, setLiveness] = useState<LivenessReport | null>(null);
  const [livenessLoading, setLivenessLoading] = useState(false);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);
  const [sheet8004MarketUrl, setSheet8004MarketUrl] = useState<string | null>(null);

  const meta = asset ? agentsMetadata[asset] : null;
  const displayMeta = meta || sheetMeta;
  const displayName =
    displayMeta?.name?.trim() ||
    fallbackAgent?.nft_name?.trim() ||
    (asset ? truncateAddress(asset) : "") ||
    "8004 Agent";
  const displayDescription =
    displayMeta?.description?.trim() ||
    fallbackAgent?.description?.trim() ||
    "";
  const displayImageRaw =
    displayMeta?.image?.trim() ||
    (typeof fallbackAgent?.image === "string" ? fallbackAgent.image.trim() : "") ||
    "";
  const displayImageUrl = displayImageRaw ? imageUrlForDisplay(displayImageRaw) : "";
  const fallbackUri =
    typeof fallbackAgent?.agent_uri === "string"
      ? fallbackAgent.agent_uri.trim()
      : detail?.agent_uri?.trim() ||
        null;
  const hasFallback = !detail && (loadFailed || !!displayName || !!displayDescription || !!fallbackUri);

  const copyToClipboard = useCallback(
    (text: string, label: string, id: string) => {
      navigator.clipboard?.writeText(text).then(
        () => {
          toast({ title: "Copied", description: `${label} copied to clipboard.` });
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        },
        () => toast({ title: "Copy failed", variant: "destructive" })
      );
    },
    [toast]
  );

  const loadDetail = useCallback(async () => {
    if (!asset) return;
    setLoadingDetail(true);
    setLoadFailed(false);
    try {
      const d = await agent8004Api.getAgent(asset);
      setDetail(d);
    } catch {
      setDetail(null);
      setLoadFailed(true);
      toast({
        title: "Full agent details unavailable",
        description: "Showing info from list. If RPC returns 403, set SOLANA_RPC_8004_URL in the API .env. Liveness and Integrity may still work.",
        variant: "default",
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [asset, toast]);

  const tokenIdFromList = fallbackAgent?.agent_id && String(fallbackAgent.agent_id).trim() ? String(fallbackAgent.agent_id).trim() : null;
  const resolved8004MarketUrl = tokenIdFromList ? get8004MarketAgentUrl(tokenIdFromList) : sheet8004MarketUrl;

  useEffect(() => {
    if (open && asset) {
      loadDetail();
      setLiveness(null);
      setIntegrity(null);
      setSheetMeta(null);
      setSheet8004MarketUrl(null);
      setHeroImageError(false);
      agent8004Api.getAgentRegistrationMetadata(asset).then(setSheetMeta).catch(() => setSheetMeta(null));
      if (!tokenIdFromList) {
        agent8004Api.get8004MarketUrl(asset).then((r) => setSheet8004MarketUrl(r.url)).catch(() => setSheet8004MarketUrl(null));
      }
    }
  }, [open, asset, loadDetail, tokenIdFromList]);

  const runLiveness = async () => {
    if (!asset) return;
    setLivenessLoading(true);
    setLiveness(null);
    try {
      const report = await agent8004Api.liveness(asset);
      setLiveness(report);
      const alive = (report as LivenessReport).alive === true || (report as { status?: string }).status?.toLowerCase() === "live";
      if (alive) toast({ title: "Agent is live", description: "Endpoints are reachable.", duration: 3000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Liveness check failed";
      toast({ title: "Liveness", description: msg, variant: "destructive" });
    } finally {
      setLivenessLoading(false);
    }
  };

  const runIntegrity = async () => {
    if (!asset) return;
    setIntegrityLoading(true);
    setIntegrity(null);
    try {
      const result = await agent8004Api.integrity(asset);
      setIntegrity(result);
      if (result.valid === true) toast({ title: "Integrity verified", description: "Indexer and chain are in sync.", duration: 3000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Integrity check failed";
      toast({ title: "Integrity", description: msg, variant: "destructive" });
    } finally {
      setIntegrityLoading(false);
    }
  };

  const explorerUrl = asset
    ? `https://explorer.solana.com/address/${asset}`
    : "";

  const owner = detail?.owner ?? fallbackAgent?.owner;
  const assetDisplay = asset ?? detail?.asset ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-[100dvh] max-h-[100dvh] w-[min(100vw,100%)] max-w-full flex-col border-l p-0 pt-[max(0.5rem,env(safe-area-inset-top))] sm:h-full sm:max-h-none sm:max-w-lg">
        <SheetHeader className="space-y-1 px-4 pb-4 pt-2 sm:px-6 sm:pt-6">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Agent details
          </SheetTitle>
          <SheetDescription>
            View and maintain your 8004 agent: identity, on-chain data, and health checks.
          </SheetDescription>
        </SheetHeader>
        {!asset ? (
          <div className="px-4 pb-6 sm:px-6">
            <p className="text-sm text-muted-foreground">No agent selected.</p>
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-6 px-4 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1.5rem))] sm:px-6 sm:pb-8">
              {/* Hero: image, name, description */}
              <div className="overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/60 to-muted/20 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-2 ring-border/50 sm:mx-0 sm:h-24 sm:w-24">
                    {displayImageUrl && !heroImageError ? (
                      <img
                        src={displayImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImageError(true)}
                      />
                    ) : (
                      <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5 text-center sm:text-left">
                    <h3 className="truncate text-xl font-bold tracking-tight">{displayName}</h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {displayDescription || "No description."}
                    </p>
                  </div>
                </div>
              </div>

              {loadingDetail && !detail && !hasFallback ? (
                <Skeleton className="h-32 w-full rounded-xl" />
              ) : (
                <>
                  {(
                    <>
                      {detail?._rpcUnavailable && (
                        <p className="text-xs text-muted-foreground rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                          On-chain details temporarily unavailable (RPC restricted). Identity and list info are still shown.
                        </p>
                      )}
                      {/* On-chain: copyable Asset & Owner */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground">On-chain</h4>
                        <div className="rounded-xl border bg-card p-4 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Asset (NFT)</p>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(assetDisplay, "Asset", "asset")}
                              className="flex items-center gap-2 w-full text-left font-mono text-sm rounded-lg px-3 py-2 bg-muted/50 hover:bg-muted transition-colors group"
                            >
                              <span className="truncate">{truncateAddress(assetDisplay)}</span>
                              {copiedId === "asset" ? (
                                <Check className="w-4 h-4 shrink-0 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>
                          </div>
                          {owner && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Owner</p>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(owner, "Owner", "owner")}
                                className="flex items-center gap-2 w-full text-left font-mono text-sm rounded-lg px-3 py-2 bg-muted/50 hover:bg-muted transition-colors group"
                              >
                                <span className="truncate">{truncateAddress(owner)}</span>
                                {copiedId === "owner" ? (
                                  <Check className="w-4 h-4 shrink-0 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100" />
                                )}
                              </button>
                            </div>
                          )}
                          {fallbackUri && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
                              <a
                                href={
                                  fallbackUri.startsWith("ipfs://")
                                    ? `https://ipfs.io/ipfs/${fallbackUri.slice(7).replace(/^\/+/, "")}`
                                    : fallbackUri
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-mono"
                              >
                                {truncateAddress(fallbackUri.replace(/^ipfs:\/\//, ""), 12, 12)}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {resolved8004MarketUrl && (
                          <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <a href={resolved8004MarketUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              View on 8004market
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            View on Explorer
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={loadDetail}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Refresh
                        </Button>
                      </div>
                      {loadFailed && !hasFallback && (
                        <p className="text-xs text-muted-foreground">
                          Full on-chain details could not be loaded. You can still run Liveness or Integrity below.
                        </p>
                      )}
                    </>
                  )}

              {/* Maintenance */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Maintenance</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-lg"
                    onClick={runLiveness}
                    disabled={livenessLoading || !asset}
                  >
                    {livenessLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Liveness
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-lg"
                    onClick={runIntegrity}
                    disabled={integrityLoading || !asset}
                  >
                    {integrityLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Integrity
                  </Button>
                </div>
              </div>

              {liveness != null && (() => {
                const report = liveness as LivenessReport & { status?: string; okCount?: number; totalPinged?: number };
                const isLive = report.alive === true || (report.status && String(report.status).toLowerCase() === "live");
                return (
                  <div className={`rounded-xl border-2 overflow-hidden ${isLive ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}>
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className={`shrink-0 rounded-full p-2 ${isLive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                          {isLive ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">
                            {isLive ? "Agent is live" : "Not live"}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {isLive
                              ? "Endpoints are reachable and responding."
                              : "One or more endpoints could not be reached."}
                          </p>
                          {(report.okCount != null || report.totalPinged != null) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {report.okCount != null && report.totalPinged != null
                                ? `${report.okCount} of ${report.totalPinged} endpoint${report.totalPinged !== 1 ? "s" : ""} reached`
                                : report.status != null
                                  ? `Status: ${report.status}`
                                  : null}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={isLive ? "default" : "destructive"} className="w-fit shrink-0 self-start sm:self-auto">
                        {isLive ? "Live" : "Not alive"}
                      </Badge>
                    </div>
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger asChild>
                        <button type="button" className="w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-1">
                          <ChevronDown className="w-3.5 h-3.5" />
                          View raw response
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="text-xs bg-muted/50 p-3 overflow-auto max-h-40 border-t">
                          {JSON.stringify(liveness, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })()}

              {integrity != null && (() => {
                const status = integrity.status ? String(integrity.status).toLowerCase() : "";
                const isValid = integrity.valid === true || status === "valid";
                const isSyncing = status === "syncing";
                const err = integrity.error as { message?: string; recommendation?: string } | undefined;
                const errMsg = err?.message ?? "";
                const isRpc403 = /403|not allowed to access blockchain/i.test(errMsg);
                const title = isValid
                  ? "Integrity verified"
                  : isSyncing
                    ? "Indexer syncing"
                    : "Integrity check failed";
                const description = isValid
                  ? "Indexer and on-chain data are consistent."
                  : errMsg
                    ? errMsg
                    : isSyncing
                      ? "The indexer is slightly behind chain. You can try again in a moment."
                      : "There may be a mismatch between indexer and chain.";
                const recommendation = !isValid
                  ? isRpc403
                    ? "The API's Solana RPC key cannot access the blockchain. In the API server .env set SOLANA_RPC_8004_URL (or SOLANA_RPC_BLOCKCHAIN_URL) to an RPC URL that allows getAccountInfo (e.g. Helius, Ankr paid, or https://rpc.ankr.com/solana)."
                    : err?.recommendation ?? null
                  : null;
                return (
                  <div className={`rounded-xl border-2 overflow-hidden ${isValid ? "border-primary/50 bg-primary/5" : isSyncing ? "border-amber-500/50 bg-amber-500/5" : "border-destructive/50 bg-destructive/5"}`}>
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className={`shrink-0 rounded-full p-2 ${isValid ? "bg-primary/20 text-primary" : isSyncing ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-destructive/20 text-destructive"}`}>
                          {isValid ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">
                            {title}
                          </p>
                          <p className="mt-0.5 break-words text-sm text-muted-foreground">
                            {description}
                          </p>
                          {recommendation && (
                            <p className="mt-2 text-xs italic text-muted-foreground">
                              {recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={isValid ? "default" : isSyncing ? "secondary" : "destructive"} className="w-fit shrink-0 self-start sm:self-auto">
                        {isValid ? "Valid" : isSyncing ? "Syncing" : "Invalid"}
                      </Badge>
                    </div>
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger asChild>
                        <button type="button" className="w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-1">
                          <ChevronDown className="w-3.5 h-3.5" />
                          View raw response
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="text-xs bg-muted/50 p-3 overflow-auto max-h-40 border-t">
                          {JSON.stringify(integrity, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })()}
            </>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

type AgentsTab = "all" | "your";

export default function MarketplaceAgents() {
  const { toast } = useToast();
  const { anonymousId } = useAgentWallet();
  const { connected: isWalletConnected } = useWalletContext();
  const [syraCollection, setSyraCollection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgentsTab>("all");
  const [agents, setAgents] = useState<Agent8004SearchResult | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailAsset, setDetailAsset] = useState<string | null>(null);
  const [detailAgentFromList, setDetailAgentFromList] = useState<AgentListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchSyraPointer = useCallback(async () => {
    try {
      const p = await agent8004Api.getSyraCollectionPointer();
      setSyraCollection(p || FALLBACK_SYRA_COLLECTION);
    } catch {
      setSyraCollection(FALLBACK_SYRA_COLLECTION);
    }
  }, []);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [agentsMetadata, setAgentsMetadata] = useState<Record<string, AgentRegistrationMeta | null>>({});
  const metadataRequestedRef = useRef<Set<string>>(new Set());

  const loadAgentMetadata = useCallback(async (asset: string) => {
    if (!asset || metadataRequestedRef.current.has(asset)) return;
    metadataRequestedRef.current.add(asset);
    try {
      const meta = await agent8004Api.getAgentRegistrationMetadata(asset);
      setAgentsMetadata((prev) => ({ ...prev, [asset]: meta }));
    } catch {
      // Don't overwrite existing metadata (e.g. from DB for Your Agents) when 8004 fails (e.g. new agent not indexed yet)
      setAgentsMetadata((prev) => {
        if (prev[asset] != null) return prev;
        return { ...prev, [asset]: null };
      });
    }
  }, []);

  const fetchAgents = useCallback(
    async (owner?: string | null) => {
      setLoadingList(true);
      setFetchError(null);
      try {
        const collection = syraCollection || FALLBACK_SYRA_COLLECTION;
        const result = await agent8004Api.search({
          collection,
          ...(owner ? { owner } : {}),
          limit: 50,
        });
        const list = Array.isArray(result) ? result : (result?.agents ?? []);
        const total = typeof result?.total === "number" ? result.total : list.length;
        setAgents({ agents: list, total });

        // For "All Agents": merge DB metadata (name, description, image) for user's own agents so new agents show image before 8004 indexer has them
        if (!owner && anonymousId && list.length > 0) {
          try {
            const myResult = await agent8004Api.getMyAgents(anonymousId);
            const myList = myResult.agents ?? [];
            if (myList.length > 0) {
              const myByAsset = new Map(myList.map((a) => [a.asset, a]));
              setAgentsMetadata((prev) => {
                const next = { ...prev };
                list.forEach((a) => {
                  const asset = typeof a.asset === "string" ? a.asset : "";
                  if (!asset) return;
                  const dbAgent = myByAsset.get(asset);
                  if (dbAgent)
                    next[asset] = {
                      name: dbAgent.name,
                      description: dbAgent.description ?? null,
                      image: dbAgent.image ?? null,
                    };
                });
                return next;
              });
            }
          } catch {
            // ignore; 8004 metadata will load per-card where possible
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load agents";
        setFetchError(msg);
        toast({ title: "Error loading agents", description: msg, variant: "destructive" });
        setAgents({ agents: [], total: 0 });
      } finally {
        setLoadingList(false);
      }
    },
    [syraCollection, anonymousId, toast]
  );

  /** Fetch "Your Agents" from MongoDB (saved on create). */
  const fetchMyAgents = useCallback(async () => {
    if (!anonymousId) return;
    setLoadingList(true);
    setFetchError(null);
    try {
      const result = await agent8004Api.getMyAgents(anonymousId);
      const list = (result.agents ?? []).map((a) => ({ asset: a.asset }));
      setAgents({ agents: list, total: result.total ?? list.length });
      setAgentsMetadata((prev) => {
        const next = { ...prev };
        (result.agents ?? []).forEach((a) => {
          next[a.asset] = { name: a.name, description: a.description ?? null, image: a.image ?? null };
        });
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load your agents";
      setFetchError(msg);
      toast({ title: "Error loading your agents", description: msg, variant: "destructive" });
      setAgents({ agents: [], total: 0 });
    } finally {
      setLoadingList(false);
    }
  }, [anonymousId, toast]);

  /** Add a newly created agent to the list (from DB) and refresh Your Agents. */
  const addAgentToList = useCallback(
    (newAsset: string) => {
      if (activeTab === "your" && anonymousId) fetchMyAgents();
      else
        setAgents((prev) => {
          const list = prev?.agents ?? [];
          if (list.some((a) => (typeof a.asset === "string" ? a.asset : (a as { asset?: string }).asset) === newAsset))
            return prev;
          return { agents: [{ asset: newAsset }, ...list], total: (prev?.total ?? list.length) + 1 };
        });
    },
    [activeTab, anonymousId, fetchMyAgents]
  );

  useEffect(() => {
    fetchSyraPointer();
  }, [fetchSyraPointer]);

  useEffect(() => {
    if (activeTab === "all") {
      if (!syraCollection) return;
      fetchAgents();
    } else {
      if (anonymousId) fetchMyAgents();
      else {
        setAgents({ agents: [], total: 0 });
        setLoadingList(false);
      }
    }
  }, [syraCollection, activeTab, anonymousId, fetchAgents, fetchMyAgents]);

  const agentList = agents?.agents ?? [];

  const openDetail = useCallback((asset: string, agentFromList?: AgentListItem | null) => {
    setDetailAsset(asset);
    setDetailAgentFromList(agentFromList ?? agentList.find((a) => (typeof a.asset === "string" ? a.asset : "") === asset) ?? null);
    setDetailOpen(true);
  }, [agentList]);

  const handleManageAgent = useCallback(
    (asset: string, agentFromList?: AgentListItem | null) => {
      if (!isWalletConnected) {
        toast({
          title: "Wallet required",
          description: "Connect your wallet to create or manage agents.",
          variant: "destructive",
        });
        return;
      }
      openDetail(asset, agentFromList);
    },
    [isWalletConnected, toast, openDetail]
  );

  const hasAgents = agentList.length > 0;
  const refreshCurrentTab = () => (activeTab === "your" ? fetchMyAgents() : fetchAgents());

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agentList;
    return agentList.filter((a) => {
      const asset = typeof a.asset === "string" ? a.asset : "";
      const meta = agentsMetadata[asset];
      const name = (meta?.name?.trim() || (a as AgentListItem).nft_name?.trim() || (asset ? `${asset.slice(0, 8)}…${asset.slice(-6)}` : "")).toLowerCase();
      const desc = (meta?.description?.trim() || (typeof (a as AgentListItem).description === "string" ? (a as AgentListItem).description?.trim() : "") || "").toLowerCase();
      const assetLower = asset.toLowerCase();
      return name.includes(q) || desc.includes(q) || assetLower.includes(q);
    });
  }, [agentList, searchQuery, agentsMetadata]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / AGENTS_PER_PAGE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const paginatedAgents = useMemo(
    () => filteredAgents.slice((pageSafe - 1) * AGENTS_PER_PAGE, pageSafe * AGENTS_PER_PAGE),
    [filteredAgents, pageSafe]
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const renderListContent = () => {
    if (loadingList) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: AGENTS_PER_PAGE }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      );
    }
    if (fetchError) {
      return (
        <Card className="border-dashed border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Failed to load agents</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">{fetchError}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" onClick={refreshCurrentTab}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={() => setCreateOpen(true)}
                disabled={!isWalletConnected || !anonymousId}
                title={
                  !isWalletConnected
                    ? "Connect your wallet to create agents"
                    : !anonymousId
                      ? "Create or connect an agent wallet (e.g. in chat) to create agents"
                      : undefined
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Create agent
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    if (!hasAgents) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {activeTab === "your" ? "No agents under your wallet" : "No agents yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              {activeTab === "your"
                ? "Agents you create in the Syra collection will appear here."
                : "Create your first 8004 agent in the Syra collection to get started."}
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              disabled={!isWalletConnected || !anonymousId}
              title={
                !isWalletConnected
                  ? "Connect your wallet to create agents"
                  : !anonymousId
                    ? "Create or connect an agent wallet (e.g. in chat) to create agents"
                    : undefined
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Create agent
            </Button>
          </CardContent>
        </Card>
      );
    }
    const start = (pageSafe - 1) * AGENTS_PER_PAGE + 1;
    const end = Math.min(pageSafe * AGENTS_PER_PAGE, filteredAgents.length);
    const showPagination = filteredAgents.length > AGENTS_PER_PAGE || pageSafe > 1;

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedAgents.map((a) => {
            const agentItem: AgentListItem = a as AgentListItem;
            const asset = typeof agentItem.asset === "string" ? agentItem.asset : "";
            if (!asset) return null;
            return (
              <AgentCard
                key={asset}
                agent={agentItem}
                metadata={agentsMetadata[asset]}
                onManage={() => handleManageAgent(asset, agentItem)}
                onLoadMetadata={loadAgentMetadata}
                canManage={isWalletConnected}
              />
            );
          })}
        </div>
        {showPagination && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              Showing {filteredAgents.length === 0 ? 0 : start}–{end} of {filteredAgents.length}
            </p>
            <div className="flex items-center justify-center gap-1 sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2 min-w-[4rem] text-center">
                {pageSafe} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={cn(DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_STANDARD, PAGE_SAFE_AREA_BOTTOM, "min-w-0")}>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="mb-0.5 text-base font-semibold text-foreground">Agents</h2>
          <p className="text-pretty text-sm text-muted-foreground">
            8004 agents in the Syra collection. Create and maintain agents on the Trustless Agent Registry.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button variant="outline" size="sm" asChild className="w-full justify-center sm:w-auto">
            <a
              href={SYRA_8004_MARKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="View Syra agents on 8004market"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">Syra on 8004market</span>
              <span className="hidden sm:inline">View on 8004market</span>
            </a>
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setCreateOpen(true)}
            disabled={!isWalletConnected || !anonymousId}
            title={
              !isWalletConnected
                ? "Connect your wallet to create agents"
                : !anonymousId
                  ? "Create or connect an agent wallet (e.g. in chat) to create agents"
                  : undefined
            }
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" />
            Create agent
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AgentsTab)} className="w-full min-w-0">
        <div className="mt-4 flex min-w-0 flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <TabsList className="grid h-auto w-full grid-cols-2 sm:w-auto sm:shrink-0">
              <TabsTrigger value="all" className="min-h-[44px] px-2 text-xs sm:min-h-9 sm:px-3 sm:text-sm">
                All Agents
              </TabsTrigger>
              <TabsTrigger value="your" className="min-h-[44px] px-2 text-xs sm:min-h-9 sm:px-3 sm:text-sm">
                Your Agents
              </TabsTrigger>
            </TabsList>
            <p className="text-xs leading-snug text-muted-foreground sm:max-w-[min(100%,20rem)] sm:whitespace-nowrap">
              {filteredAgents.length === agentList.length
                ? activeTab === "your"
                  ? `${agentList.length} of your agent${agentList.length !== 1 ? "s" : ""}`
                  : `${agentList.length} agent${agentList.length !== 1 ? "s" : ""} in Syra collection`
                : `${filteredAgents.length} of ${agentList.length} agent${agentList.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="relative w-full min-w-0 sm:max-w-xs sm:shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search name, description, ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 min-h-[44px] pl-8 sm:h-9 sm:min-h-0"
              aria-label="Search agents"
            />
          </div>
        </div>
        <TabsContent value="all" className="mt-3">
          {renderListContent()}
        </TabsContent>
        <TabsContent value="your" className="mt-3">
          {!anonymousId ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Sign in to see your agents</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create or connect an agent wallet (e.g. in chat) to create and list your agents here. Max {MAX_AGENTS_PER_USER} per user.
                </p>
              </CardContent>
            </Card>
          ) : (
            renderListContent()
          )}
        </TabsContent>
      </Tabs>

      <CreateAgentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(newAsset) => {
          if (newAsset) addAgentToList(newAsset);
          else fetchAgents();
        }}
      />
      <AgentDetailSheet
        asset={detailAsset}
        fallbackAgent={detailAgentFromList}
        agentsMetadata={agentsMetadata}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
