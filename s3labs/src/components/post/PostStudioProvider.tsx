import type { ReactNode } from "react";
import { usePostStudioQuery } from "@/hooks/usePostStudio";

/** Loads growth brief studio state for all /post routes. */
export function PostStudioProvider({ children }: { children: ReactNode }) {
  usePostStudioQuery();
  return children;
}
