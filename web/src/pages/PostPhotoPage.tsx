import { Navigate, useParams } from "react-router-dom";
import { PostPhotoDeck } from "@/components/post/photo/PostPhotoDeck";
import { getPhotoPostByNumber } from "@/content/posts";
import { usePostStudioQuery } from "@/hooks/usePostStudio";
import {
  getLatestVisiblePostUpdateNumber,
  isPostVisible,
} from "@/lib/postRegistryVisibility";

function parseUpdateNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Ship-log photo posts for X — static PNG templates at /post/photo/:updateNumber. */
export default function PostPhotoPage() {
  const { isLoading } = usePostStudioQuery();
  const { updateNumber: raw } = useParams<{ updateNumber?: string }>();
  const updateNumber = parseUpdateNumber(raw);

  if (isLoading) return null;

  if (!updateNumber) {
    return <Navigate to={`/post/photo/${getLatestVisiblePostUpdateNumber()}`} replace />;
  }

  if (!isPostVisible(updateNumber)) {
    return <Navigate to={`/post/photo/${getLatestVisiblePostUpdateNumber()}`} replace />;
  }

  const post = getPhotoPostByNumber(updateNumber);
  if (!post) {
    return <Navigate to={`/post/photo/${getLatestVisiblePostUpdateNumber()}`} replace />;
  }

  return <PostPhotoDeck post={post} />;
}
