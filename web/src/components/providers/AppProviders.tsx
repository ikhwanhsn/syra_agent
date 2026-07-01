import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConnectModalProvider } from "@/contexts/ConnectModalContext";
import { SyraAuthProvider } from "@/contexts/SyraAuthContext";
import { WalletContextProvider } from "@/contexts/WalletContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

/** Root providers for wallet, auth, and UI primitives. Agent wallet lives in AppShell (wraps GlobalNav). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <WalletContextProvider>
          <SyraAuthProvider>
            <ConnectModalProvider>
              <TooltipProvider>
                {children}
                <Toaster />
                <Sonner />
                <Analytics />
              </TooltipProvider>
            </ConnectModalProvider>
          </SyraAuthProvider>
        </WalletContextProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
