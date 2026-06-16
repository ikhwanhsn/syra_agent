import { LATEST_POST_UPDATE_NUMBER } from "@/content/posts";

export type PostRouteFormat = "hub" | "video" | "photo";

export function getPostRoutePath(
  format: PostRouteFormat = "hub",
  updateNumber: number = LATEST_POST_UPDATE_NUMBER,
): string {
  if (format === "hub") return "/post";
  return `/post/${format}/${updateNumber}`;
}
