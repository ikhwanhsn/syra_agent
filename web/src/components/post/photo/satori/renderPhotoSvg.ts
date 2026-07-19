import satori from "satori";
import type { PostPhotoCardDef } from "@/content/posts/photo/types";
import { loadPhotoFonts } from "@/components/post/photo/satori/fonts";
import { preloadPhotoAssets } from "@/components/post/photo/satori/assets";
import { buildPhotoTemplate } from "@/components/post/photo/satori/templates";
import { PHOTO_SIZE } from "@/components/post/photo/satori/tokens";

export async function renderPhotoSvg(card: PostPhotoCardDef): Promise<string> {
  const [fonts, assets] = await Promise.all([
    loadPhotoFonts(),
    preloadPhotoAssets(
      [card.content.partnerLogo].filter((p): p is string => Boolean(p)),
    ),
  ]);

  const node = buildPhotoTemplate(card, assets);
  return satori(node, {
    width: PHOTO_SIZE.width,
    height: PHOTO_SIZE.height,
    fonts,
  });
}
