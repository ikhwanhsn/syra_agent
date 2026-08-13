import satori from "satori";
import type { PostPhotoCardDef } from "@/content/posts/photo/types";
import { loadPhotoFonts } from "@/components/post/photo/satori/fonts";
import { preloadPhotoAssets } from "@/components/post/photo/satori/assets";
import { buildPhotoTemplate } from "@/components/post/photo/satori/templates";
import { sanitizePhotoValue } from "@/components/post/photo/satori/sanitizePhotoText";
import {
  PHOTO_SIZE,
  type PhotoCanvasSize,
} from "@/components/post/photo/satori/tokens";
import type { PhotoLayoutVariant } from "@/components/post/photo/satori/variants";

export interface RenderPhotoSvgOptions {
  /** Override canvas size. Defaults to ship-log 1200×675. */
  size?: PhotoCanvasSize;
}

export async function renderPhotoSvg(
  card: PostPhotoCardDef,
  variant: PhotoLayoutVariant = 0,
  options: RenderPhotoSvgOptions = {},
): Promise<string> {
  const size = options.size ?? PHOTO_SIZE;
  const [fonts, assets] = await Promise.all([
    loadPhotoFonts(),
    preloadPhotoAssets(
      [card.content.partnerLogo].filter((p): p is string => Boolean(p)),
    ),
  ]);

  const safeCard: PostPhotoCardDef = {
    ...card,
    content: sanitizePhotoValue(card.content),
  };

  const node = buildPhotoTemplate(safeCard, assets, variant);
  return satori(node, {
    width: size.width,
    height: size.height,
    fonts,
  });
}
