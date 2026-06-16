import type { ReactNode } from "react";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

/** Loads ship-log studio state from the API for all /post routes. */
export function PostStudioProvider({ children }: { children: ReactNode }) {
  usePostStudioQuery();
  return children;
}
