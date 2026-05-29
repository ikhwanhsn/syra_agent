"use client";

import "@/polyfills";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletContextProvider } from "@/contexts/WalletContext";
import { SyraAuthProvider } from "@/contexts/SyraAuthContext";
import { ConnectModalProvider } from "@/contexts/ConnectModalContext";
import { AgentWalletProvider } from "@/contexts/AgentWalletContext";
import { AppShell } from "@/components/layout/AppShell";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <WalletContextProvider>
          <SyraAuthProvider>
            <ConnectModalProvider>
              <AgentWalletProvider>
                <TooltipProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
              </AgentWalletProvider>
            </ConnectModalProvider>
          </SyraAuthProvider>
        </WalletContextProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
