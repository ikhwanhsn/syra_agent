import { PostReveal, PostStagger } from "@/components/post/PostStagger";
import { getPostGridCols, isPostSlideDense } from "@/components/post/postSlideGrid";
import { PostSlideFit } from "@/components/post/PostSlideFit";
import type { PostSlideLayoutTemplate } from "@/content/posts/layouts";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type PostSlideLayoutVariant = "cover" | "stack" | "grid";
export type PostSlideContentAlign = "center" | "left";

interface PostSlideLayoutProps {
  isActive: boolean;
  template: PostSlideLayoutTemplate;
  variant?: PostSlideLayoutVariant;
  itemCount?: number;
  className?: string;
  children: ReactNode;
}

export function PostSlideLayout({
  isActive,
  template,
  variant = "stack",
  itemCount = 0,
  className,
  children,
}: PostSlideLayoutProps) {
  const dense = itemCount > 0 && isPostSlideDense(itemCount);

  return (
    <PostStagger
      isActive={isActive}
      className={cn(
        "post-slide-body",
        `post-tmpl-${template}`,
        `post-s3-slide--${template}`,
        variant === "cover" && "post-slide-body--cover",
        variant === "grid" && "post-slide-body--grid",
        variant === "stack" && "post-slide-body--stack",
        dense && "post-slide-body--dense",
        className,
      )}
    >
      {children}
    </PostStagger>
  );
}

interface PostHeaderProps {
  isActive: boolean;
  kicker: string;
  headline: string;
  compact?: boolean;
  centered?: boolean;
}

export function PostHeader({
  isActive,
  kicker,
  headline,
  compact = false,
  centered = false,
}: PostHeaderProps) {
  return (
    <header className={cn("post-slide-header shrink-0", centered && "text-center")}>
      <PostReveal isActive={isActive} delayMs={0}>
        <p className="post-slide-kicker">{kicker}</p>
      </PostReveal>
      <PostReveal isActive={isActive} delayMs={100}>
        <h2 className={cn("post-slide-headline", compact && "post-slide-headline--compact")}>{headline}</h2>
      </PostReveal>
    </header>
  );
}

interface PostSlideGridProps {
  count: number;
  className?: string;
  children: ReactNode;
}

/** Responsive grid — column count follows item count; reflows inside the frame via container queries. */
export function PostSlideGrid({ count, className, children }: PostSlideGridProps) {
  const cols = getPostGridCols(count);
  return (
    <div className={cn("post-slide-grid", className)} data-cols={cols} data-count={count}>
      {children}
    </div>
  );
}

interface PostSlideCanvasProps {
  isActive: boolean;
  children: ReactNode;
}

export function PostSlideCanvas({ isActive, children }: PostSlideCanvasProps) {
  return (
    <div className="post-slide-canvas">
      <PostSlideFit isActive={isActive}>
        <div className="post-slide-inner">{children}</div>
      </PostSlideFit>
    </div>
  );
}

interface PostSlideContentProps {
  align?: PostSlideContentAlign;
  className?: string;
  children: ReactNode;
}

/**
 * Single content column inside the 16:9 frame.
 * Wrap kicker, title, badge, and body together so they share one alignment axis.
 */
export function PostSlideContent({
  align = "center",
  className,
  children,
}: PostSlideContentProps) {
  return (
    <div
      className={cn(
        "post-slide-content",
        align === "left" && "post-slide-content--left",
        className,
      )}
    >
      {children}
    </div>
  );
}
