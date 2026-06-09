import { Navigate, useParams } from "react-router-dom";
import { PostPhotoDeck } from "@/components/post/photo/PostPhotoDeck";
import {
  getPhotoPostByNumber,
  LATEST_POST_UPDATE_NUMBER,
} from "@/content/posts";

function parseUpdateNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Fund brief photo templates for X — PNG export at /post/photo/:updateNumber. */
export default function PostPhotoPage() {
  const { updateNumber: raw } = useParams<{ updateNumber?: string }>();
  const updateNumber = parseUpdateNumber(raw);

  if (!updateNumber) {
    return <Navigate to={`/post/photo/${LATEST_POST_UPDATE_NUMBER}`} replace />;
  }

  const post = getPhotoPostByNumber(updateNumber);
  if (!post) {
    return <Navigate to={`/post/photo/${LATEST_POST_UPDATE_NUMBER}`} replace />;
  }

  return <PostPhotoDeck post={post} />;
}
