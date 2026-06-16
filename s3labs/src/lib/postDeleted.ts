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
  const { deletePostStudioUpdates } = await import("@/lib/postStudioApi");
  const { applyPostStudioState } = await import("@/lib/postStudioState");
  const state = await deletePostStudioUpdates([updateNumber]);
  applyPostStudioState(state);
}

export async function deletePosts(updateNumbers: number[]): Promise<void> {
  const { deletePostStudioUpdates } = await import("@/lib/postStudioApi");
  const { applyPostStudioState } = await import("@/lib/postStudioState");
  const state = await deletePostStudioUpdates(updateNumbers);
  applyPostStudioState(state);
}

export function useDeletePosts() {
  return useDeletePostStudioUpdatesMutation();
}
