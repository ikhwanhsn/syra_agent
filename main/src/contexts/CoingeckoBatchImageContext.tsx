import { createContext, useMemo, type ReactNode } from "react";

import { useCoinGeckoImageMap } from "@/hooks/useCoinGeckoImageMap";

export type CoingeckoBatchImageState = {
  map: Record<string, string>;
  isLoading: boolean;
};

export const CoingeckoBatchImageContext = createContext<CoingeckoBatchImageState | null>(null);

export function CoingeckoBatchImageProvider({
  symbols,
  children,
}: {
  symbols: readonly string[];
  children: ReactNode;
}) {
  const q = useCoinGeckoImageMap(symbols);
  const value = useMemo<CoingeckoBatchImageState>(
    () => ({
      map: q.data ?? {},
      isLoading: q.isLoading,
    }),
    [q.data, q.isLoading],
  );

  return <CoingeckoBatchImageContext.Provider value={value}>{children}</CoingeckoBatchImageContext.Provider>;
}
