import { Navigate, useParams } from "react-router-dom";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostPhotoDeck } from "@/components/post/photo/PostPhotoDeck";
import { PostStudioSkeleton } from "@/components/RouteFallback";
import { getPhotoPostByNumber } from "@/content/posts";
import { usePostStudioQuery } from "@/hooks/usePostStudio";
import {
  getLatestVisiblePostUpdateNumber,
  isPostVisible,
} from "@/lib/postRegistryVisibility";

function parseUpdateNumber(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Ship-log photo posts for X — static PNG templates at /post/photo/:updateNumber. */
export default function PostPhotoPage() {
  const { isLoading } = usePostStudioQuery();
  const { updateNumber: raw } = useParams<{ updateNumber?: string }>();
  const updateNumber = parseUpdateNumber(raw);

  if (isLoading) {
    return (
      <div className="post-root relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030303] text-white">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-4">
            <PostBackLink />
          </div>
          <PostStudioSkeleton />
        </div>
      </div>
    );
  }

  if (updateNumber == null) {
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
