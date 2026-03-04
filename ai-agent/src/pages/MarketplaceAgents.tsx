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
  [key: string]: unknown;
}

export interface AgentRegistrationMeta {
  name: string | null;
  description: string | null;
  image: string | null;
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
    (asset ? "8004 Agent" : "");
  const description = metadata?.description?.trim() || "";
  const rawImage = metadata?.image?.trim() || "";
  const imageUrl = rawImage ? imageUrlForDisplay(rawImage) : "";
  const [imageError, setImageError] = useState(false);
  const showImage = imageUrl && !imageError;

  // Load from 8004 when missing metadata or image. Skip if we already have an image (e.g. from DB for Your Agents) so we don't overwrite with failed 8004 for new agents.
  useEffect(() => {
    if (!asset) return;
    const hasImage = metadata?.image?.trim();
    if (hasImage) return;
    onLoadMetadata(asset);
  }, [asset, metadata?.image, onLoadMetadata]);

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md flex flex-col h-full"
      onClick={onManage}
    >
      <CardHeader className="pb-2 flex-1 flex flex-col min-h-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-lg bg-muted shrink-0 overflow-hidden flex items-center justify-center">
              {showImage ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">{displayName}</CardTitle>
              <CardDescription className="text-xs font-mono truncate" title={asset}>
                {asset ? `${asset.slice(0, 8)}…${asset.slice(-6)}` : ""}
              </CardDescription>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!canManage}
          title={!canManage ? "Connect wallet to manage agents" : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onManage();
          }}
        >
          <Settings2 className="w-3.5 h-3.5 mr-1.5" />
          Manage
        </Button>
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
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="agent-desc">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={!anonymousId || submitting || generatingDesc}
                className="shrink-0"
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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="agent-image">Image URL (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={GENERATE_IMAGE_AVAILABLE ? handleGenerateImage : undefined}
                disabled={!GENERATE_IMAGE_AVAILABLE || !anonymousId || submitting || generatingImage}
                className="shrink-0"
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
  open,
  onOpenChange,
}: {
  asset: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<Agent8004Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [liveness, setLiveness] = useState<LivenessReport | null>(null);
  const [livenessLoading, setLivenessLoading] = useState(false);
  const [integrity, setIntegrity] = useState<IntegrityResult | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!asset) return;
    setLoadingDetail(true);
    try {
      const d = await agent8004Api.getAgent(asset);
      setDetail(d);
    } catch {
      setDetail(null);
      toast({ title: "Failed to load agent", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  }, [asset, toast]);

  useEffect(() => {
    if (open && asset) {
      loadDetail();
      setLiveness(null);
      setIntegrity(null);
    }
  }, [open, asset, loadDetail]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Agent details
          </SheetTitle>
          <SheetDescription>
            View and maintain your 8004 agent: liveness and integrity checks.
          </SheetDescription>
        </SheetHeader>
        {!asset ? (
          <p className="text-sm text-muted-foreground">No agent selected.</p>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-6">
              {loadingDetail ? (
                <Skeleton className="h-24 w-full" />
              ) : detail ? (
                <>
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Asset (NFT)</p>
                    <p className="text-sm font-mono break-all">{detail.asset}</p>
                    {detail.owner && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Owner</p>
                        <p className="text-sm font-mono break-all">{detail.owner}</p>
                      </>
                    )}
                    {detail.agent_uri && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground mt-2">Metadata URI</p>
                        <p className="text-xs font-mono break-all">{detail.agent_uri}</p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        View on Explorer
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadDetail}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Refresh
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Could not load agent.</p>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Maintenance</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
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
                    <div className="p-4 flex items-start gap-3">
                      <div className={`rounded-full p-2 shrink-0 ${isLive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                        {isLive ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {isLive ? "Agent is live" : "Not live"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {isLive
                            ? "Endpoints are reachable and responding."
                            : "One or more endpoints could not be reached."}
                        </p>
                        {(report.okCount != null || report.totalPinged != null) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {report.okCount != null && report.totalPinged != null
                              ? `${report.okCount} of ${report.totalPinged} endpoint${report.totalPinged !== 1 ? "s" : ""} reached`
                              : report.status != null
                                ? `Status: ${report.status}`
                                : null}
                          </p>
                        )}
                      </div>
                      <Badge variant={isLive ? "default" : "destructive"} className="shrink-0">
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
                const isValid = integrity.valid === true || (integrity.status && String(integrity.status).toLowerCase() === "valid");
                return (
                  <div className={`rounded-xl border-2 overflow-hidden ${isValid ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}>
                    <div className="p-4 flex items-start gap-3">
                      <div className={`rounded-full p-2 shrink-0 ${isValid ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                        {isValid ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {isValid ? "Integrity verified" : "Integrity check failed"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {isValid
                            ? "Indexer and on-chain data are consistent."
                            : "There may be a mismatch between indexer and chain."}
                        </p>
                      </div>
                      <Badge variant={isValid ? "default" : "destructive"} className="shrink-0">
                        {isValid ? "Valid" : "Invalid"}
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

  const openDetail = (asset: string) => {
    setDetailAsset(asset);
    setDetailOpen(true);
  };

  const handleManageAgent = useCallback(
    (asset: string) => {
      if (!isWalletConnected) {
        toast({
          title: "Wallet required",
          description: "Connect your wallet to create or manage agents.",
          variant: "destructive",
        });
        return;
      }
      openDetail(asset);
    },
    [isWalletConnected, toast]
  );

  const agentList = agents?.agents ?? [];
  const hasAgents = agentList.length > 0;
  const refreshCurrentTab = () => (activeTab === "your" ? fetchMyAgents() : fetchAgents());

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agentList;
    return agentList.filter((a) => {
      const asset = typeof a.asset === "string" ? a.asset : "";
      const meta = agentsMetadata[asset];
      const name = (meta?.name?.trim() || (a as AgentListItem).nft_name?.trim() || (asset ? "8004 Agent" : "")).toLowerCase();
      const desc = (meta?.description?.trim() || "").toLowerCase();
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: AGENTS_PER_PAGE }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedAgents.map((a) => {
            const agentItem: AgentListItem = a as AgentListItem;
            const asset = typeof agentItem.asset === "string" ? agentItem.asset : "";
            if (!asset) return null;
            return (
              <AgentCard
                key={asset}
                agent={agentItem}
                metadata={agentsMetadata[asset]}
                onManage={() => handleManageAgent(asset)}
                onLoadMetadata={loadAgentMetadata}
                canManage={isWalletConnected}
              />
            );
          })}
        </div>
        {showPagination && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {filteredAgents.length === 0 ? 0 : start}–{end} of {filteredAgents.length}
            </p>
            <div className="flex items-center gap-1">
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
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-0.5">Agents</h2>
          <p className="text-sm text-muted-foreground">
            8004 agents in the Syra collection. Create and maintain agents on the Trustless Agent Registry.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <a
              href={SYRA_8004_MARKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="View Syra agents on 8004market"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View on 8004market
            </a>
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
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AgentsTab)} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-3 min-w-0">
            <TabsList className="grid w-auto grid-cols-2 shrink-0">
              <TabsTrigger value="all">All Agents</TabsTrigger>
              <TabsTrigger value="your">Your Agents</TabsTrigger>
            </TabsList>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {filteredAgents.length === agentList.length
                ? activeTab === "your"
                  ? `${agentList.length} of your agent${agentList.length !== 1 ? "s" : ""}`
                  : `${agentList.length} agent${agentList.length !== 1 ? "s" : ""} in Syra collection`
                : `${filteredAgents.length} of ${agentList.length} agent${agentList.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="relative w-full min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
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
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
