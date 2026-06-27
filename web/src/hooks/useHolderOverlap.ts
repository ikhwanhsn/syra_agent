import { useMutation } from "@tanstack/react-query";
import {
  fetchHolderOverlapBatch,
  type HolderOverlapBatchPayload,
} from "@/lib/pumpfunAnalysisApi";

export function useHolderOverlap() {
  return useMutation({
    mutationFn: async ({
      mintA,
      mintBs,
      signal,
    }: {
      mintA: string;
      mintBs: string[];
      signal?: AbortSignal;
    }): Promise<HolderOverlapBatchPayload> => fetchHolderOverlapBatch(mintA, mintBs, { signal }),
  });
}
