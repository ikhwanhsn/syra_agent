import satori from "satori";
import type { ReactNode } from "react";
import type { XLayerCardDef } from "@/content/announce/xlayerCards";
import { loadPhotoFonts } from "@/components/post/photo/satori/fonts";
import { preloadPhotoAssets } from "@/components/post/photo/satori/assets";
import { buildXLayerTemplate } from "@/components/post/photo/satori/templatesXLayer";
import { PHOTO_SQUARE } from "@/components/post/photo/satori/tokens";

export async function renderXLayerSvg(card: XLayerCardDef): Promise<string> {
  const extraPaths = [card.bgImage, card.partnerLogo].filter(
    (p): p is string => Boolean(p),
  );
  const [fonts, assets] = await Promise.all([
    loadPhotoFonts(),
    preloadPhotoAssets(extraPaths),
  ]);

  const node = buildXLayerTemplate(card, assets) as ReactNode;
  return satori(node, {
    width: PHOTO_SQUARE.width,
    height: PHOTO_SQUARE.height,
    fonts,
  });
}
