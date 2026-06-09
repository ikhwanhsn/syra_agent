import { Navigate, useParams } from "react-router-dom";
import { PostDeck } from "@/components/post/PostDeck";
import {
  getVideoPostByNumber,
  LATEST_POST_UPDATE_NUMBER,
} from "@/content/posts";

function parseUpdateNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Ship-log video slides for X — 16:9 auto-play deck at /post/video/:updateNumber. */
export default function PostVideoPage() {
  const { updateNumber: raw } = useParams<{ updateNumber?: string }>();
  const updateNumber = parseUpdateNumber(raw);

  if (!updateNumber) {
    return <Navigate to={`/post/video/${LATEST_POST_UPDATE_NUMBER}`} replace />;
  }

  const post = getVideoPostByNumber(updateNumber);
  if (!post) {
    return <Navigate to={`/post/video/${LATEST_POST_UPDATE_NUMBER}`} replace />;
  }

  return <PostDeck post={post} />;
}
