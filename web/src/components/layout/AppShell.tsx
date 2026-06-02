"use client";

import { GlobalNav } from "@/components/layout/GlobalNav";
import { AgentWalletProvider } from "@/contexts/AgentWalletContext";
/** Site-wide shell: GlobalNav + scrollable main content. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AgentWalletProvider>
      <div className="flex min-h-[100dvh] flex-col">
        <GlobalNav />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </AgentWalletProvider>
  );
}
