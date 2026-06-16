import { useCallback, useEffect, useRef, useState } from "react";
import {
  POST_PHOTO_CARD_COUNT,
  POST_PHOTO_CARD_SLOT_BY_ROLE,
  POST_PHOTO_LAYOUT_LABELS,
  shareCopyHasLink,
  type PostPhotoUpdate,
} from "@/content/posts/photo";
import { getPostShareCopyWithUrl } from "@/lib/postShare";
import { PostPhotoFrame } from "@/components/post/photo/PostPhotoFrame";
import { PostShareCopyPanel } from "@/components/post/PostShareCopyPanel";
import { PostStudioHeader } from "@/components/post/PostStudioHeader";
import { PostStudioShell } from "@/components/post/PostStudioShell";
import { renderPostPhotoTemplate } from "@/components/post/photo/PostPhotoTemplates";
import {
  buildPostPhotoFilename,
  copyPostPhotoToClipboard,
  exportPostPhotoPng,
} from "@/components/post/photo/postPhotoExport";
import { cn } from "@/lib/utils";
import { Check, Copy, Download } from "lucide-react";
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
        "post-studio-card-btn",
        active && "post-studio-card-btn--active",
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
  const slotLabel = POST_PHOTO_CARD_SLOT_BY_ROLE.get(activeCard.role)?.label ?? activeCard.role;

  useEffect(() => {
    document.title = `Up Only Fund · ${meta.title} · Photo`;
    return () => {
      document.title = "Up Only Fund | Onchain Capital for High Conviction Bets";
    };
  }, [meta.title]);

  const getExportNode = useCallback(() => exportRef.current, []);

  const handleDownload = useCallback(async () => {
    const node = getExportNode();
    if (!node || exporting) return;
    setExporting(true);
    try {
      await exportPostPhotoPng(node, buildPostPhotoFilename(meta.id, activeCard.role));
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
    <PostStudioShell className="post-photo-root">
      <PostStudioHeader
        meta={meta}
        format="photo"
        toolbar={
          <>
            <PostShareCopyPanel meta={meta} format="photo" photoPost={post} photoCardIndex={cardIndex} />

            <button
              type="button"
              onClick={handleCopy}
              disabled={exporting}
              className="post-studio-btn"
            >
              {imageCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{imageCopied ? "Copied" : "Copy image"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={exporting}
              className="post-studio-btn post-studio-btn--primary"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </>
        }
      />

      <div className="flex min-h-0 w-full flex-1 flex-col lg:flex-row">
        <aside className="post-studio-rail post-photo-sidebar flex flex-col">
          <div className="post-studio-rail-header">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400/75">
              {POST_PHOTO_CARD_COUNT} cards · {POST_PHOTO_CARD_COUNT} X posts
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{meta.tagline}</p>
          </div>

          <div className="post-photo-template-list max-h-52 overflow-y-auto px-2 py-2 lg:max-h-none lg:flex-1">
            <p className="px-2.5 pb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
              Card library
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

          <div className="border-t border-emerald-500/10 px-3 py-3 sm:px-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-400/70">
              X post for this card
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-white/55">{cardShareText}</p>
            <p className="mt-2 font-mono text-[10px] text-white/25">
              {shareCopyHasLink(cardShareText) ? "Each card uses its own copy + link" : "Unique footer link on copy"}
            </p>
          </div>
        </aside>

        <div className="post-studio-stage post-chrome-stage flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative z-10 mb-3 flex flex-wrap items-center justify-center gap-2">
            <span className="post-studio-meta-chip">{slotLabel}</span>
            <span className="post-studio-meta-chip">{POST_PHOTO_LAYOUT_LABELS[activeCard.layout]}</span>
            <span className="post-studio-meta-chip">
              {String(cardIndex + 1).padStart(2, "0")}/{String(POST_PHOTO_CARD_COUNT).padStart(2, "0")}
            </span>
            <span className="post-studio-meta-chip">1200×675</span>
          </div>

          <div className="post-studio-stage-frame relative z-10 w-full">
            <PostPhotoFrame exportRef={exportRef}>
              {renderPostPhotoTemplate(activeCard.layout, activeCard.content, activeCard.role)}
            </PostPhotoFrame>
          </div>

          <p className="post-footer-hint relative z-10 mt-4 hidden text-center font-mono text-[10px] text-white/30 sm:block">
            Export each card as PNG, then paste the matching X post — 15 posts per fund brief
          </p>
        </div>
      </div>
    </PostStudioShell>
  );
}
