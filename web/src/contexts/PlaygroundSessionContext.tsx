import { createContext, useContext, type ReactNode } from "react";
import { useApiPlayground } from "@/hooks/useApiPlayground";

export type PlaygroundSession = ReturnType<typeof useApiPlayground>;

const PlaygroundSessionContext = createContext<PlaygroundSession | null>(null);

export function PlaygroundSessionProvider({ children }: { children: ReactNode }) {
  const session = useApiPlayground();
  return (
    <PlaygroundSessionContext.Provider value={session}>
      {children}
    </PlaygroundSessionContext.Provider>
  );
}

export function usePlaygroundSession(): PlaygroundSession {
  const ctx = useContext(PlaygroundSessionContext);
  if (!ctx) {
    throw new Error("usePlaygroundSession must be used within PlaygroundSessionProvider");
  }
  return ctx;
}
