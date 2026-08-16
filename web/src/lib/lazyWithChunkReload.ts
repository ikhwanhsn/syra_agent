import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import {
  clearStaleChunkReloadFlag,
  isStaleChunkError,
  reloadOnceForStaleChunk,
} from "@/lib/staleChunk";

/**
 * React.lazy that recovers from hashed-chunk 404s after a production deploy.
 * A successful import clears the one-shot reload guard so a later deploy can recover again.
 */
export function lazyWithChunkReload<T extends ComponentType>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory()
      .then((mod) => {
        clearStaleChunkReloadFlag();
        return mod;
      })
      .catch((error: unknown) => {
        if (isStaleChunkError(error) && reloadOnceForStaleChunk()) {
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }),
  );
}
