import { usePostRegistryRefresh } from "@/lib/usePostRegistryRefresh";
import { isPostDeleted as isPostDeletedFromState } from "@/lib/postStudioState";
import { useDeletePostStudioUpdatesMutation, usePostStudioQuery } from "@/hooks/usePostStudio";

export {
  isPostDeleted,
  getDeletedPostNumbers,
} from "@/lib/postStudioState";

export function usePostDeleted(updateNumber: number): boolean {
  usePostStudioQuery();
  const refreshTick = usePostRegistryRefresh();
  void refreshTick;
  return isPostDeletedFromState(updateNumber);
}

export async function deletePost(updateNumber: number): Promise<void> {
  const { filterDeletableUpdateNumbers } = await import("@/lib/postLocked");
  const deletable = filterDeletableUpdateNumbers([updateNumber]);
  if (deletable.length === 0) return;
  const { deletePostStudioUpdates } = await import("@/lib/postStudioApi");
  const { applyPostStudioState } = await import("@/lib/postStudioState");
  const state = await deletePostStudioUpdates(deletable);
  applyPostStudioState(state);
}

export async function deletePosts(updateNumbers: number[]): Promise<void> {
  const { filterDeletableUpdateNumbers } = await import("@/lib/postLocked");
  const deletable = filterDeletableUpdateNumbers(updateNumbers);
  if (deletable.length === 0) return;
  const { deletePostStudioUpdates } = await import("@/lib/postStudioApi");
  const { applyPostStudioState } = await import("@/lib/postStudioState");
  const state = await deletePostStudioUpdates(deletable);
  applyPostStudioState(state);
}

export function useDeletePosts() {
  return useDeletePostStudioUpdatesMutation();
}
