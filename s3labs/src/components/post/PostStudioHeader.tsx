import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ImageIcon, Video } from "lucide-react";
import type { PostUpdateMeta } from "@/content/posts";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostUpdateNav } from "@/components/post/PostUpdateNav";
import { PostXStatusControl } from "@/components/post/PostXStatusControl";
import { cn } from "@/lib/utils";

interface PostStudioHeaderProps {
  meta: PostUpdateMeta;
  format: "video" | "photo";
  toolbar: ReactNode;
}

export function PostStudioHeader({ meta, format, toolbar }: PostStudioHeaderProps) {
  return (
    <header className="post-studio-header relative z-20 shrink-0 px-3 py-3 sm:px-5 sm:py-4 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <PostBackLink
            to="/post"
            className="mt-0.5 rounded-full border-primary/25 bg-primary/[0.06] hover:border-primary/40 hover:bg-primary/10"
          />
          <div className="post-studio-title-block min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <img
                src="/images/logo.png"
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg border border-cyan-500/25 object-cover ring-1 ring-cyan-500/10"
              />
              <span className="post-studio-format-badge">{format}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
                #{meta.updateNumber}
              </span>
            </div>
            <h1 className="mt-1.5 truncate font-display text-base font-semibold tracking-tight text-white/95 sm:text-lg">
              {meta.title}
            </h1>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-primary/55">
              {meta.published} · Growth brief
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <PostUpdateNav updateNumber={meta.updateNumber} format={format} />
            <PostXStatusControl updateNumber={meta.updateNumber} defaultPosted={meta.postedOnX} />

            <nav className="post-studio-mode-nav flex items-center gap-0.5 p-0.5">
              {format === "video" ? (
                <>
                  <span className="post-studio-mode-tab post-studio-mode-tab--active">
                    <Video className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Video</span>
                  </span>
                  <Link to={`/post/photo/${meta.updateNumber}`} className="post-studio-mode-tab">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Photo</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={`/post/video/${meta.updateNumber}`} className="post-studio-mode-tab">
                    <Video className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Video</span>
                  </Link>
                  <span className="post-studio-mode-tab post-studio-mode-tab--active">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Photo</span>
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className={cn("post-studio-toolbar flex flex-wrap items-center gap-1.5 sm:justify-end")}>
            {toolbar}
          </div>
        </div>
      </div>
    </header>
  );
}
