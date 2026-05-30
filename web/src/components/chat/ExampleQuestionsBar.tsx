"use client";

import { useMemo } from "react";
import { EXAMPLE_QUESTIONS, shuffleExampleQuestions } from "@/lib/exampleQuestions";
import { cn } from "@/lib/utils";

interface ExampleQuestionsBarProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

const SCROLLBAR_HIDDEN = cn(
  "overflow-x-auto overflow-y-hidden",
  "[-ms-overflow-style:none] [scrollbar-width:none]",
  "[&::-webkit-scrollbar]:hidden",
);

export function ExampleQuestionsBar({ onSelect, disabled = false }: ExampleQuestionsBarProps) {
  const questions = useMemo(() => shuffleExampleQuestions(EXAMPLE_QUESTIONS), []);

  return (
    <div className="pointer-events-auto relative mb-2.5 w-full min-w-0" aria-label="Example questions">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-5 bg-gradient-to-r from-background to-transparent sm:w-6"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-5 bg-gradient-to-l from-background to-transparent sm:w-6"
        aria-hidden
      />

      <div
        className={cn(
          "flex flex-nowrap gap-2 px-0.5 py-0.5",
          SCROLLBAR_HIDDEN,
          "touch-pan-x overscroll-x-contain",
        )}
      >
        {questions.map((question, index) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            style={{ animationDelay: `${index * 30}ms` }}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2",
              "border-border/50 bg-card/40 text-[13px] leading-none text-foreground/88",
              "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-md backdrop-saturate-150",
              "transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out",
              "hover:border-border/80 hover:bg-card/60 hover:text-foreground hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.35)]",
              "active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-50",
              "animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300",
            )}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
