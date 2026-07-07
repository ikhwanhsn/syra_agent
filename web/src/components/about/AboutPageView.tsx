"use client";

import { AboutSinglePage } from "@/components/about/AboutSinglePage";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";

export function AboutPageView() {
  return (
    <PlaygroundPageShell>
      <div className={cn(PLAYGROUND_PAGE_CLASS)}>
        <AboutSinglePage />
      </div>
    </PlaygroundPageShell>
  );
}
