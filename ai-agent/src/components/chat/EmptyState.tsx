import { useState, useEffect } from "react";
import { Sparkles, Code, Lightbulb, FileText, ExternalLink, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { agentToolsApi, type AgentTool } from "@/lib/chatApi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

const PLAYGROUND_URL = "https://playground.syraa.fun";
const DOCS_URL = "https://docs.syraa.fun";

interface SuggestionCard {
  icon: typeof Sparkles;
  title: string;
  prompt: string;
}

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const suggestions: SuggestionCard[] = [
  {
    icon: Code,
    title: "Solana & DEX",
    prompt: "Explain how Solana DEXs work and what makes them different from CEXs",
  },
  {
    icon: Lightbulb,
    title: "Market & tokens",
    prompt: "What should I look for when researching a new token or memecoin?",
  },
  {
    icon: FileText,
    title: "Web3 & DeFi",
    prompt: "Give me a quick overview of DeFi basics and common terms",
  },
  {
    icon: Sparkles,
    title: "Syra & tools",
    prompt: "What can the Syra agent do? When do I need to connect a wallet?",
  },
];

/** Group tools by category to match API v2 structure (core, partner, memecoin). */
function groupTools(tools: AgentTool[]): { core: AgentTool[]; partner: AgentTool[]; memecoin: AgentTool[] } {
  const coreIds = new Set([
    "check-status", "news", "signal", "sentiment", "event", "browse", "x-search",
    "research", "gems", "x-kol", "crypto-kol", "trending-headline", "sundown-digest", "analytics-summary",
  ]);
  const core: AgentTool[] = [];
  const partner: AgentTool[] = [];
  const memecoin: AgentTool[] = [];
  for (const t of tools) {
    if (t.id.startsWith("memecoin-")) memecoin.push(t);
    else if (coreIds.has(t.id)) core.push(t);
    else partner.push(t);
  }
  return { core, partner, memecoin };
}

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(true);

  useEffect(() => {
    agentToolsApi
      .list()
      .then(({ tools: list }) => setTools(list))
      .catch(() => setTools([]))
      .finally(() => setToolsLoading(false));
  }, []);

  const { core, partner, memecoin } = groupTools(tools);
  const hasTools = core.length > 0 || partner.length > 0 || memecoin.length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full max-w-full px-3 py-8 sm:px-4 sm:py-12 animate-fade-in overflow-x-hidden">
      <div className="relative mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-card border border-border flex items-center justify-center glow">
          <img src="/logo.jpg" alt="Syra" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-[hsl(199,89%,48%)]/20 rounded-3xl blur-xl -z-10" />
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 text-center px-2">
        How can I help you today?
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-3 px-2 text-sm sm:text-base">
        Chat casually about crypto, web3, and blockchain—no wallet needed. Syra builds trading infrastructure powered by AI. Connect a wallet when you want to use tools and realtime data.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-sm">
        <a
          href={PLAYGROUND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline"
        >
          API playground <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
        >
          Documentation <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl px-1 mb-6">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(suggestion.prompt)}
              className={cn(
                "flex items-start gap-3 p-3 sm:p-4 rounded-xl text-left min-w-0",
                "bg-card border border-border",
                "hover:bg-secondary/50 hover:border-primary/20 hover:shadow-soft",
                "transition-all duration-200 group touch-manipulation"
              )}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-medium text-foreground mb-0.5 sm:mb-1 text-sm sm:text-base truncate">{suggestion.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                  {suggestion.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {hasTools && (
        <Collapsible open={toolsOpen} onOpenChange={setToolsOpen} className="w-full max-w-2xl">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm font-medium",
                "bg-secondary/60 hover:bg-secondary border border-border text-foreground",
                "transition-colors touch-manipulation"
              )}
            >
              <Wrench className="w-4 h-4" />
              Available tools ({tools.length})
              {toolsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="mt-2 h-64 rounded-xl border border-border bg-card/80">
              <div className="p-3 space-y-4">
                {core.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Core</p>
                    <ul className="space-y-1.5">
                      {core.filter((t) => t.id !== "check-status").map((t) => (
                        <li key={t.id} className="text-sm">
                          <span className="font-medium text-foreground">{t.name}</span>
                          <span className="text-muted-foreground"> — {t.description}</span>
                          <span className="text-muted-foreground text-xs ml-1">(${t.priceUsd.toFixed(4)})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {partner.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Partner</p>
                    <ul className="space-y-1.5">
                      {partner.map((t) => (
                        <li key={t.id} className="text-sm">
                          <span className="font-medium text-foreground">{t.name}</span>
                          <span className="text-muted-foreground"> — {t.description}</span>
                          <span className="text-muted-foreground text-xs ml-1">(${t.priceUsd.toFixed(4)})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {memecoin.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Memecoin</p>
                    <ul className="space-y-1.5">
                      {memecoin.map((t) => (
                        <li key={t.id} className="text-sm">
                          <span className="font-medium text-foreground">{t.name}</span>
                          <span className="text-muted-foreground"> — {t.description}</span>
                          <span className="text-muted-foreground text-xs ml-1">(${t.priceUsd.toFixed(4)})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}

      {!toolsLoading && !hasTools && (
        <p className="text-xs text-muted-foreground text-center mt-2">Unable to load tools list. Ask: &quot;What can Syra do?&quot;</p>
      )}
    </div>
  );
}
