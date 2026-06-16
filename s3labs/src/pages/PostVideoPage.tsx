import { Navigate, useParams } from "react-router-dom";
import { PostDeck } from "@/components/post/PostDeck";
import { getVideoPostByNumber } from "@/content/posts";
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

/** Fund brief video slides for X — 16:9 auto-play deck at /post/video/:updateNumber. */
export default function PostVideoPage() {
  const { isLoading } = usePostStudioQuery();
  const { updateNumber: raw } = useParams<{ updateNumber?: string }>();
  const updateNumber = parseUpdateNumber(raw);

  if (isLoading) return null;

  if (!updateNumber) {
    return <Navigate to={`/post/video/${getLatestVisiblePostUpdateNumber()}`} replace />;
  }

  if (!isPostVisible(updateNumber)) {
    return <Navigate to={`/post/video/${getLatestVisiblePostUpdateNumber()}`} replace />;
  }

  const post = getVideoPostByNumber(updateNumber);
  if (!post) {
    return <Navigate to={`/post/video/${getLatestVisiblePostUpdateNumber()}`} replace />;
  }

  return <PostDeck post={post} />;
}
