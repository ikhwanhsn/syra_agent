import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  POST_PHOTO_CARD_COUNT,
  POST_PHOTO_CARD_SLOT_BY_ROLE,
  POST_PHOTO_LAYOUT_LABELS,
  shareCopyHasLink,
  type PostPhotoUpdate,
} from "@/content/posts/photo";
import { getPostShareCopyWithUrl } from "@/lib/postShare";
import { PostBackLink } from "@/components/post/PostBackLink";
import { PostPhotoExportStage } from "@/components/post/photo/PostPhotoExportStage";
import { PostPhotoFrame } from "@/components/post/photo/PostPhotoFrame";
import { PostShareCopyPanel } from "@/components/post/PostShareCopyPanel";
import { PostUpdateNav } from "@/components/post/PostUpdateNav";
import { PostXStatusControl } from "@/components/post/PostXStatusControl";
import { renderPostPhotoTemplate } from "@/components/post/photo/PostPhotoTemplates";
import {
  buildPostPhotoFilename,
  copyPostPhotoToClipboard,
  exportPostPhotoPng,
} from "@/components/post/photo/postPhotoExport";
import { cn } from "@/lib/utils";
import { SYRA_TAGLINE } from "@/lib/syraBranding";
import { Check, Copy, Download, ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";

function CardButton({
  label,
  sublabel,
  active,
  onSelect,
}: {
  label: string;
  sublabel: string;
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
      <span className="min-w-0 flex-1 text-xs">{label}</span>
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
        {sublabel}
      </span>
    </button>
  );
}

interface PostPhotoDeckProps {
  post: PostPhotoUpdate;
}

export function PostPhotoDeck({ post }: PostPhotoDeckProps) {
  const { meta, cards } = post;

  const [cardIndex, setCardIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const activeCard = cards[cardIndex];
  const cardShareText = getPostShareCopyWithUrl(post.meta, "photo", {
    photoPost: post,
    photoCardIndex: cardIndex,
  });
  const slotLabel =
    POST_PHOTO_CARD_SLOT_BY_ROLE.get(activeCard.role)?.label ?? activeCard.role;

  useEffect(() => {
    document.title = `Syra · ${meta.title} · Photo`;
    return () => {
      document.title = `Syra | ${SYRA_TAGLINE}`;
    };
  }, [meta.title]);

  const getExportNode = useCallback(() => exportRef.current, []);

  const handleDownload = useCallback(async () => {
    const node = getExportNode();
    if (!node || exporting) return;
    setExporting(true);
    try {
      await exportPostPhotoPng(
        node,
        buildPostPhotoFilename(meta.id, activeCard.role),
      );
      toast.success("Image downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setExporting(false);
    }
  }, [exporting, getExportNode, activeCard.role, meta.id]);

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
          <PostBackLink to="/post" />
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-7 w-7 shrink-0 rounded-lg border border-white/10 object-cover sm:h-8 sm:w-8"
          />
          <div className="min-w-0">
            <span className="font-display text-sm font-medium tracking-tight text-white/90">
              Syra
            </span>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              {meta.published} · Photo
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <PostUpdateNav updateNumber={meta.updateNumber} format="photo" />
          <PostXStatusControl
            updateNumber={meta.updateNumber}
            defaultPosted={meta.postedOnX}
          />

          <nav className="post-photo-mode-nav flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
            <Link
              to={`/post/video/${meta.updateNumber}`}
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

          <PostShareCopyPanel
            meta={meta}
            format="photo"
            photoPost={post}
            photoCardIndex={cardIndex}
          />

          <button
            type="button"
            onClick={handleCopy}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-white/15 disabled:opacity-50 sm:h-10 sm:gap-2 sm:px-4"
          >
            {imageCopied ? (
              <Check className="h-4 w-4 text-[#F3BA2F]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {imageCopied ? "Copied" : "Copy image"}
            </span>
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
              {POST_PHOTO_CARD_COUNT} cards · {POST_PHOTO_CARD_COUNT} X posts
            </p>
            <p className="mt-1 text-xs text-white/50">{meta.tagline}</p>
          </div>

          <div className="post-photo-template-list max-h-56 overflow-y-auto px-2 pb-2 lg:max-h-none lg:flex-1">
            <p className="px-2.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
              Ship log deck
            </p>
            {cards.map((card, index) => {
              const slot = POST_PHOTO_CARD_SLOT_BY_ROLE.get(card.role);
              return (
                <CardButton
                  key={card.role}
                  label={slot?.label ?? card.role}
                  sublabel={POST_PHOTO_LAYOUT_LABELS[card.layout]}
                  active={cardIndex === index}
                  onSelect={() => setCardIndex(index)}
                />
              );
            })}
          </div>

          <div className="border-t border-white/[0.06] px-3 py-3 sm:px-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#F3BA2F]/70">
              X post for this card
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/55">
              {cardShareText}
            </p>
            <p className="mt-2 font-mono text-[10px] text-white/25">
              {shareCopyHasLink(cardShareText)
                ? "Each card uses its own copy + link"
                : "Unique footer link on copy"}
            </p>
          </div>
        </aside>

        <div className="post-chrome-stage relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden px-2 py-3 sm:px-6 sm:py-4">
          <div
            className="post-ambient pointer-events-none absolute inset-0"
            aria-hidden
          />
          <div
            className="post-orb post-orb-a pointer-events-none absolute rounded-full scale-75"
            aria-hidden
          />
          <div
            className="post-orb post-orb-b pointer-events-none absolute rounded-full scale-75"
            aria-hidden
          />
          <p className="relative z-10 mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            {slotLabel}
            {" · "}
            {POST_PHOTO_LAYOUT_LABELS[activeCard.layout]}
            {" · "}
            {String(cardIndex + 1).padStart(2, "0")}/
            {String(POST_PHOTO_CARD_COUNT).padStart(2, "0")}
            {" · 1200×675"}
          </p>
          <div className="relative z-10 w-full">
            <PostPhotoFrame>
              {renderPostPhotoTemplate(
                activeCard.layout,
                activeCard.content,
                activeCard.role,
              )}
            </PostPhotoFrame>
          </div>
          <p className="post-footer-hint relative z-10 mt-3 hidden text-center font-mono text-[10px] text-white/30 sm:block">
            Export each card as PNG, then paste the matching X post — 15 posts
            per ship log
          </p>
        </div>
      </div>

      <PostPhotoExportStage card={activeCard} exportRef={exportRef} />
    </div>
  );
}
