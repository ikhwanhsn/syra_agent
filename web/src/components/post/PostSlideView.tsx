import type { PostSlide } from "@/content/posts/types";
import { PostSlideCanvas } from "@/components/post/PostSlideLayout";
import { renderPostSlideTemplate } from "@/components/post/PostSlideTemplates";
import { cn } from "@/lib/utils";

interface PostSlideViewProps {
  slide: PostSlide;
  isActive: boolean;
  direction: "forward" | "back";
}

export function PostSlideView({ slide, isActive, direction }: PostSlideViewProps) {
  return (
    <article
      aria-hidden={!isActive}
      className={cn(
        "post-slide absolute inset-0 overflow-hidden",
        isActive ? "post-slide-active z-10" : "post-slide-idle z-0 pointer-events-none",
        direction === "forward" ? "post-slide-from-forward" : "post-slide-from-back",
      )}
    >
      <div className="post-slide-scanline pointer-events-none absolute inset-0 opacity-0" aria-hidden />
      <PostSlideCanvas isActive={isActive}>{renderPostSlideTemplate(slide, isActive)}</PostSlideCanvas>
    </article>
  );
}
