import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ACTIVE_PHOTO_POST,
  getPostPhotoLibraryRest,
  getPostPhotoPicks,
  POST_PHOTO_LAYOUT_COUNT,
  POST_PHOTO_LAYOUT_LABELS,
  type PostPhotoLayoutTemplate,
} from "@/content/posts/photo";
import { PostPhotoFrame } from "@/components/post/photo/PostPhotoFrame";
import { PostShareCopyPanel } from "@/components/post/PostShareCopyPanel";
import { renderPostPhotoTemplate } from "@/components/post/photo/PostPhotoTemplates";
import {
  buildPostPhotoFilename,
  copyPostPhotoToClipboard,
  exportPostPhotoPng,
} from "@/components/post/photo/postPhotoExport";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Copy, Download, ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

function TemplateButton({
  template,
  index,
  active,
  onSelect,
}: {
  template: PostPhotoLayoutTemplate;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "post-photo-template-btn flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
        active
          ? "bg-[#F3BA2F]/12 text-[#F3BA2F]"
          : "text-white/60 hover:bg-white/[0.04] hover:text-white/85",
      )}
    >
      <span className="font-mono text-[10px] tabular-nums text-white/30">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-xs">{POST_PHOTO_LAYOUT_LABELS[template]}</span>
    </button>
  );
}

export function PostPhotoDeck() {
  const post = ACTIVE_PHOTO_POST;
  const { meta, content } = post;
  const picks = getPostPhotoPicks(post);
  const libraryRest = getPostPhotoLibraryRest(post);

  const [layout, setLayout] = useState<PostPhotoLayoutTemplate>(picks[0]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const visibleTemplates = showLibrary ? [...picks, ...libraryRest] : picks;
  const layoutIndexInView = visibleTemplates.indexOf(layout) + 1;
  const layoutCountInView = visibleTemplates.length;

  useEffect(() => {
    if (libraryRest.includes(layout)) {
      setShowLibrary(true);
    }
  }, [layout, libraryRest]);

  useEffect(() => {
    document.title = `Syra · ${meta.title} · Photo`;
    return () => {
      document.title = "Syra | Smart Intelligence Agent for Traders";
    };
  }, [meta.title]);

  const getExportNode = useCallback(() => exportRef.current, []);

  const handleDownload = useCallback(async () => {
    const node = getExportNode();
    if (!node || exporting) return;
    setExporting(true);
    try {
      await exportPostPhotoPng(node, buildPostPhotoFilename(meta.id, layout));
      toast.success("Image downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setExporting(false);
    }
  }, [exporting, getExportNode, layout, meta.id]);

  const handleCopy = useCallback(async () => {
    const node = getExportNode();
    if (!node || exporting) return;
    setExporting(true);
    try {
      const ok = await copyPostPhotoToClipboard(node);
      if (ok) {
        setImageCopied(true);
        toast.success("Image copied to clipboard");
        window.setTimeout(() => setImageCopied(false), 2000);
      } else {
        toast.error("Copy not supported in this browser");
      }
    } catch {
      toast.error("Copy failed");
    } finally {
      setExporting(false);
    }
  }, [exporting, getExportNode]);

  return (
    <div className="post-root post-photo-root relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden bg-[#030303] text-white">
      <header className="post-chrome-header relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-3 sm:px-6 sm:py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-7 w-7 shrink-0 rounded-lg border border-white/10 object-cover sm:h-8 sm:w-8"
          />
          <div className="min-w-0">
            <span className="font-display text-sm font-medium tracking-tight text-white/90">Syra</span>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              {meta.published} · Photo
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <nav className="post-photo-mode-nav flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            <Link
              to="/post/video"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-white/70 sm:px-3"
            >
              <Video className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Video</span>
            </Link>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F3BA2F]/15 px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F] sm:px-3">
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Photo</span>
            </span>
          </nav>

          <PostShareCopyPanel meta={meta} format="photo" />

          <button
            type="button"
            onClick={handleCopy}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/15 disabled:opacity-50 sm:h-10 sm:gap-2 sm:px-4"
          >
            {imageCopied ? <Check className="h-4 w-4 text-[#F3BA2F]" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{imageCopied ? "Copied" : "Copy image"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="post-play-btn inline-flex h-9 items-center gap-1.5 rounded-full border border-[#F3BA2F]/30 bg-[#F3BA2F]/15 px-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F3BA2F] transition-colors hover:bg-[#F3BA2F]/25 disabled:opacity-50 sm:h-10 sm:gap-2 sm:px-5"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col lg:flex-row">
        <aside className="post-photo-sidebar shrink-0 border-b border-white/[0.06] lg:w-72 lg:border-b-0 lg:border-r">
          <div className="px-3 py-3 sm:px-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F3BA2F]/70">
              {picks.length} picks · {POST_PHOTO_LAYOUT_COUNT} in library
            </p>
            <p className="mt-1 text-xs text-white/50">{meta.tagline}</p>
          </div>

          <div className="post-photo-template-list max-h-56 overflow-y-auto px-2 pb-2 lg:max-h-none lg:flex-1">
            <p className="px-2.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
              Best for this update
            </p>
            {picks.map((template, i) => (
              <TemplateButton
                key={template}
                template={template}
                index={i}
                active={layout === template}
                onSelect={() => setLayout(template)}
              />
            ))}

            {libraryRest.length > 0 ? (
              <div className="mt-2 border-t border-white/[0.06] pt-2">
                <button
                  type="button"
                  onClick={() => setShowLibrary((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                    More templates ({libraryRest.length})
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-white/35 transition-transform",
                      showLibrary && "rotate-180",
                    )}
                  />
                </button>
                {showLibrary
                  ? libraryRest.map((template, i) => (
                      <TemplateButton
                        key={template}
                        template={template}
                        index={picks.length + i}
                        active={layout === template}
                        onSelect={() => setLayout(template)}
                      />
                    ))
                  : null}
              </div>
            ) : null}
          </div>
        </aside>

        <div className="post-chrome-stage flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-2 py-3 sm:px-6 sm:py-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            {POST_PHOTO_LAYOUT_LABELS[layout]}
            {picks.includes(layout) ? " · pick" : " · library"}
            {" · "}
            {layoutIndexInView > 0
              ? `${String(layoutIndexInView).padStart(2, "0")}/${String(layoutCountInView).padStart(2, "0")}`
              : "—"}
            {" · 1200×675"}
          </p>
          <PostPhotoFrame exportRef={exportRef}>
            {renderPostPhotoTemplate(layout, content)}
          </PostPhotoFrame>
          <p className="post-footer-hint mt-3 hidden text-center font-mono text-[10px] text-white/30 sm:block">
            Start with the picks for this update, then copy or download as PNG for X
          </p>
        </div>
      </div>
    </div>
  );
}
