import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import type { PostUpdate } from "@/content/posts";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostShareCopyPanel } from "@/components/post/PostShareCopyPanel";
import { PostUpdateNav } from "@/components/post/PostUpdateNav";
import { PostXStatusControl } from "@/components/post/PostXStatusControl";
import {
  PostVideoExportModal,
  type PostVideoExportSelection,
} from "@/components/post/PostVideoExportModal";
import {
  renderPostVideoOnWeb,
  type PostVideoExportFormat,
} from "@/video/render/renderPostVideoOnWeb";
import { PostVideoPlayer } from "@/video/preview/PostVideoPlayer";
import { SYRA_DOCUMENT_TITLE } from "@/lib/syraBranding";
import { Download, ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

interface PostDeckProps {
  post: PostUpdate;
}

export function PostDeck({ post }: PostDeckProps) {
  const { meta, slides } = post;
  const slideCount = slides.length;
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<PostVideoExportFormat>("mp4");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSlideIndex, setExportSlideIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExportVideo = useCallback(
    async ({ format }: PostVideoExportSelection) => {
      if (exporting) return;

      setExportFormat(format);
      setExporting(true);
      setExportProgress(0);
      setExportSlideIndex(0);

      try {
        await renderPostVideoOnWeb(slides, meta.id, format, {
          onSlideChange: (nextIndex) => {
            flushSync(() => {
              setExportSlideIndex(nextIndex);
            });
          },
          onProgress: (progress) => setExportProgress(progress),
        });
        toast.success(`${format.toUpperCase()} downloaded`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Video download failed";
        toast.error(message);
      } finally {
        setExporting(false);
        setExportProgress(0);
      }
    },
    [exporting, meta.id, slides],
  );

  useEffect(() => {
    document.title = `Syra · ${meta.title} · Video`;
    return () => {
      document.title = SYRA_DOCUMENT_TITLE;
    };
  }, [meta.title]);

  return (
    <div
      ref={containerRef}
      className="post-root relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-[#030303] text-white"
    >
      <header className="post-chrome-header relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 sm:px-6 sm:py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <PostBackLink to="/post" />
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-7 w-7 shrink-0 rounded-lg border border-white/10 object-cover sm:h-8 sm:w-8"
          />
          <div className="min-w-0">
            <span className="font-display text-sm font-medium tracking-tight text-white/90">Syra</span>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              {meta.published} · Remotion
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <PostUpdateNav updateNumber={meta.updateNumber} format="video" />
          <PostXStatusControl updateNumber={meta.updateNumber} defaultPosted={meta.postedOnX} />

          <nav className="post-photo-mode-nav flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F3BA2F]/15 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F] sm:px-3">
              <Video className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Video</span>
            </span>
            <Link
              to={`/post/photo/${meta.updateNumber}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-white/70 sm:px-3"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Photo</span>
            </Link>
          </nav>

          <PostShareCopyPanel meta={meta} format="video" />

          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#F3BA2F]/30 bg-[#F3BA2F]/15 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/25 disabled:opacity-50 sm:h-10 sm:gap-2 sm:px-4"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">
              {exporting ? `${Math.round(exportProgress * 100)}%` : "Download"}
            </span>
            <span className="sm:hidden">
              {exporting ? `${Math.round(exportProgress * 100)}%` : "Export"}
            </span>
          </button>
        </div>
      </header>

      <div className="post-chrome-stage relative z-10 flex min-h-0 w-full min-w-0 flex-1 items-center justify-center px-2 py-2 sm:px-4 sm:py-3 md:px-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
          <PostVideoPlayer slides={slides} autoPlay loop controls initiallyMuted />
        </div>
      </div>

      <footer className="post-chrome-footer relative z-20 shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
        <p className="text-center font-mono text-[10px] text-white/35 sm:text-[11px]">
          Syra cinematic · {slideCount} slides · Remotion preview (same as download)
        </p>
      </footer>

      <PostVideoExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        slides={slides}
        onExport={handleExportVideo}
      />

      {exporting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#030303]/80 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 text-center shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F3BA2F]/80">
              Rendering video
            </p>
            <p className="mt-2 font-display text-lg text-white/90">
              Full HD · 30fps · {exportFormat.toUpperCase()}
            </p>
            <div className="post-progress-track mx-auto mt-5 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="post-progress-fill h-full rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${Math.round(exportProgress * 100)}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-xs tabular-nums text-white/45">
              {Math.round(exportProgress * 100)}% · slide{" "}
              {String(exportSlideIndex + 1).padStart(2, "0")} /{" "}
              {String(slideCount).padStart(2, "0")}
            </p>
            <p className="mt-2 text-xs text-white/35">Keep this tab open until the download starts</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
