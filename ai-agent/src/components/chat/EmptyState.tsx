import { Sparkles, Code, Lightbulb, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center glow">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-[hsl(199,89%,48%)]/20 rounded-3xl blur-xl -z-10" />
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-2">
        How can I help you today?
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-3">
        Chat casually about crypto, web3, and blockchain—no wallet needed. Syra builds trading infrastructure powered by AI. Connect a wallet when you want to use tools and realtime data.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8 text-sm">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(suggestion.prompt)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl text-left",
                "bg-card border border-border",
                "hover:bg-secondary/50 hover:border-primary/20 hover:shadow-soft",
                "transition-all duration-200 group"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground mb-1">{suggestion.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {suggestion.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
