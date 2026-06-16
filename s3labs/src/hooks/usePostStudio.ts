import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyPostStudioState,
  getPostXStatus,
  readLegacyLocalStorageState,
} from "@/lib/postStudioState";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import type { PostStudioState } from "@/lib/postStudioApi";

export const POST_STUDIO_QUERY_KEY = ["s3-post-studio-state"] as const;

function loadPostStudioState(): PostStudioState {
  const state = readLegacyLocalStorageState();
  applyPostStudioState(state);
  return state;
}

function patchPosted(state: PostStudioState, updateNumber: number, posted: boolean): PostStudioState {
  return {
    ...state,
    postedOnX: { ...state.postedOnX, [String(updateNumber)]: posted },
    updatedAt: new Date().toISOString(),
  };
}

function deleteUpdates(state: PostStudioState, updateNumbers: number[]): PostStudioState {
  return {
    ...state,
    deleted: [...new Set([...state.deleted, ...updateNumbers])].sort((a, b) => a - b),
    updatedAt: new Date().toISOString(),
  };
}

export function usePostStudioQuery() {
  return useQuery({
    queryKey: POST_STUDIO_QUERY_KEY,
    queryFn: loadPostStudioState,
    staleTime: Infinity,
  });
}

export function useSetPostPostedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updateNumber, posted }: { updateNumber: number; posted: boolean }) => {
      const current = loadPostStudioState();
      const next = patchPosted(current, updateNumber, posted);
      applyPostStudioState(next);
      return next;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(POST_STUDIO_QUERY_KEY, data);
    },
  });
}

export function useDeletePostStudioUpdatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateNumbers: number[]) => {
      const current = loadPostStudioState();
      const next = deleteUpdates(current, updateNumbers);
      applyPostStudioState(next);
      return next;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(POST_STUDIO_QUERY_KEY, data);
    },
  });
}

export function usePostXStatus(updateNumber: number, defaultPosted = false) {
  usePostStudioQuery();
  const refreshTick = usePostRegistryRefresh();
  const setPostedM = useSetPostPostedMutation();

  const posted = useMemo(
    () => getPostXStatus(updateNumber, defaultPosted),
    [updateNumber, defaultPosted, refreshTick],
  );

  const toggle = useCallback(async () => {
    const next = !getPostXStatus(updateNumber, defaultPosted);
    await setPostedM.mutateAsync({ updateNumber, posted: next });
  }, [updateNumber, defaultPosted, setPostedM]);

  const setStatus = useCallback(
    async (value: boolean) => {
      await setPostedM.mutateAsync({ updateNumber, posted: value });
    },
    [updateNumber, setPostedM],
  );

  return { posted, toggle, setPosted: setStatus, isPending: setPostedM.isPending };
}
