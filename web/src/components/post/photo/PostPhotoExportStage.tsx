import { useCallback } from "react";
import type { PostPhotoCardDef } from "@/content/posts/photo/types";
import { renderPostPhotoTemplate } from "@/components/post/photo/PostPhotoTemplates";
import { POST_PHOTO_HEIGHT, POST_PHOTO_WIDTH } from "@/components/post/photo/postPhotoExport";

interface PostPhotoExportStageProps {
  card: PostPhotoCardDef;
  exportRef?: React.RefObject<HTMLDivElement | null>;
}

/** Off-screen 1200×675 stage — no CSS scale transform; matches PNG export pixel layout. */
export function PostPhotoExportStage({ card, exportRef }: PostPhotoExportStageProps) {
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (exportRef) {
        (exportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [exportRef],
  );

  return (
    <div ref={setRootRef} className="post-photo-export-root" aria-hidden>
      {renderPostPhotoTemplate(card.layout, card.content, card.role)}
    </div>
  );
}

export { POST_PHOTO_WIDTH, POST_PHOTO_HEIGHT };
