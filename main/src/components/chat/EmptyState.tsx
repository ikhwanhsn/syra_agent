"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const STARTERS = [
  {
    title: "Solana DEX basics",
    prompt: "Explain how Solana DEXs work and what makes them different from CEXs",
  },
  {
    title: "Research a token",
    prompt: "What should I look for when researching a new token or memecoin?",
  },
  {
    title: "DeFi primer",
    prompt: "Give me a quick overview of DeFi basics and common terms",
  },
  {
    title: "What Syra can do",
    prompt: "What can the Syra agent do? When do I need to connect a wallet?",
  },
] as const;

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-2xl animate-fade-in">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          How can I help you today?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          Ask about markets, Solana, and trading. Connect a wallet when you need on-chain tools and live data.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
          {STARTERS.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className={cn(
                "group rounded-xl border border-border/70 bg-card/40 px-4 py-3.5 text-left transition-all duration-200",
                "hover:border-border hover:bg-accent/40 hover:shadow-soft",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground group-hover:text-muted-foreground/90">
                {item.prompt}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link
            href="/playground"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            API playground
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          <Link
            href="https://docs.syraa.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Documentation
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
