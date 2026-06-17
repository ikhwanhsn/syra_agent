import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePostStudioUpdates,
  fetchPostStudioState,
  isPostStudioFallbackError,
  migratePostStudioState,
  patchPostStudioPosted,
  type PostStudioState,
} from "@/lib/postStudioApi";
import {
  applyPostStudioState,
  clearLegacyLocalStorageState,
  getPostStudioState,
  getPostXStatus,
  readLegacyLocalStorageState,
  writeLegacyLocalStorageState,
} from "@/lib/postStudioState";
import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";

export const POST_STUDIO_QUERY_KEY = ["post-studio-state"] as const;

function hasLegacyLocalData(): boolean {
  const legacy = readLegacyLocalStorageState();
  return Object.keys(legacy.postedOnX).length > 0 || legacy.deleted.length > 0;
}

function isServerStateEmpty(state: { postedOnX: Record<string, boolean>; deleted: number[] }): boolean {
  return Object.keys(state.postedOnX).length === 0 && state.deleted.length === 0;
}

function fallbackPostStudioState(): PostStudioState {
  const legacy = readLegacyLocalStorageState();
  return {
    postedOnX: legacy.postedOnX,
    deleted: legacy.deleted,
    updatedAt: null,
  };
}

function persistLocalPostStudioState(state: PostStudioState): PostStudioState {
  const next = { ...state, updatedAt: state.updatedAt ?? new Date().toISOString() };
  applyPostStudioState(next);
  writeLegacyLocalStorageState(next);
  return next;
}

function patchPostedLocally(updateNumber: number, posted: boolean): PostStudioState {
  const current = getPostStudioState();
  return persistLocalPostStudioState({
    ...current,
    postedOnX: { ...current.postedOnX, [String(updateNumber)]: posted },
  });
}

function deleteUpdatesLocally(updateNumbers: number[]): PostStudioState {
  const current = getPostStudioState();
  return persistLocalPostStudioState({
    ...current,
    deleted: [...new Set([...current.deleted, ...updateNumbers])].sort((a, b) => a - b),
  });
}

async function patchPostStudioPostedWithFallback(
  updateNumber: number,
  posted: boolean,
): Promise<PostStudioState> {
  try {
    return await patchPostStudioPosted(updateNumber, posted);
  } catch (err) {
    if (!isPostStudioFallbackError(err)) throw err;
    return patchPostedLocally(updateNumber, posted);
  }
}

async function deletePostStudioUpdatesWithFallback(updateNumbers: number[]): Promise<PostStudioState> {
  try {
    return await deletePostStudioUpdates(updateNumbers);
  } catch (err) {
    if (!isPostStudioFallbackError(err)) throw err;
    return deleteUpdatesLocally(updateNumbers);
  }
}

function getCachedPostStudioQueryState(): PostStudioState {
  return getPostStudioState();
}

async function loadPostStudioState() {
  try {
    let state = await fetchPostStudioState();

    if (isServerStateEmpty(state) && hasLegacyLocalData()) {
      const legacy = readLegacyLocalStorageState();
      state = await migratePostStudioState(legacy);
      clearLegacyLocalStorageState();
    }

    applyPostStudioState(state);
    return state;
  } catch (err) {
    if (!isPostStudioFallbackError(err)) throw err;
    const state = fallbackPostStudioState();
    applyPostStudioState(state);
    return state;
  }
}

export function usePostStudioQuery() {
  return useQuery({
    queryKey: POST_STUDIO_QUERY_KEY,
    queryFn: loadPostStudioState,
    staleTime: 15_000,
    retry: (failureCount, error) => !isPostStudioFallbackError(error) && failureCount < 2,
  });
}

export function useSetPostPostedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ updateNumber, posted }: { updateNumber: number; posted: boolean }) =>
      patchPostStudioPostedWithFallback(updateNumber, posted),
    onMutate: async ({ updateNumber, posted }) => {
      await queryClient.cancelQueries({ queryKey: POST_STUDIO_QUERY_KEY });
      const previous =
        queryClient.getQueryData<Awaited<ReturnType<typeof loadPostStudioState>>>(
          POST_STUDIO_QUERY_KEY,
        ) ?? getCachedPostStudioQueryState();
      if (previous) {
        const optimistic = {
          ...previous,
          postedOnX: { ...previous.postedOnX, [String(updateNumber)]: posted },
        };
        applyPostStudioState(optimistic);
        queryClient.setQueryData(POST_STUDIO_QUERY_KEY, optimistic);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        applyPostStudioState(context.previous);
        queryClient.setQueryData(POST_STUDIO_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      applyPostStudioState(data);
      queryClient.setQueryData(POST_STUDIO_QUERY_KEY, data);
    },
  });
}

export function useDeletePostStudioUpdatesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateNumbers: number[]) => deletePostStudioUpdatesWithFallback(updateNumbers),
    onMutate: async (updateNumbers) => {
      await queryClient.cancelQueries({ queryKey: POST_STUDIO_QUERY_KEY });
      const previous =
        queryClient.getQueryData<Awaited<ReturnType<typeof loadPostStudioState>>>(
          POST_STUDIO_QUERY_KEY,
        ) ?? getCachedPostStudioQueryState();
      if (previous) {
        const optimistic = {
          ...previous,
          deleted: [...new Set([...previous.deleted, ...updateNumbers])].sort((a, b) => a - b),
        };
        applyPostStudioState(optimistic);
        queryClient.setQueryData(POST_STUDIO_QUERY_KEY, optimistic);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        applyPostStudioState(context.previous);
        queryClient.setQueryData(POST_STUDIO_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      applyPostStudioState(data);
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
