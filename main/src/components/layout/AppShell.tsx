"use client";

import { GlobalNav } from "@/components/layout/GlobalNav";

/** Site-wide shell: Jupiter-style global nav on every page. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <GlobalNav />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
