import type { PostPhotoLayoutTemplate } from "./layouts";
import { POST_PHOTO_LAYOUT_LABELS } from "./layouts";
import type { PostPhotoUpdate } from "./types";

function buildPhotoShareCopyFallback(
  layout: PostPhotoLayoutTemplate,
  post: PostPhotoUpdate,
): string {
  const { content } = post;
  const label = POST_PHOTO_LAYOUT_LABELS[layout];

  const lines: string[] = [`INVESTOR BRIEF · ${content.title}`];

  if (layout.includes("comparison") || layout.includes("compare")) {
    lines.push("", content.compareRight.body, "", `Before: ${content.compareLeft.body}`);
  } else if (
    layout.includes("timeline") ||
    layout.includes("pipeline") ||
    layout.includes("flow") ||
    layout.includes("numbered-list")
  ) {
    lines.push("", content.headline);
    for (const step of content.steps.slice(0, 4)) {
      lines.push(`→ ${step.title}: ${step.description}`);
    }
  } else if (layout.includes("cards")) {
    const cardCount = layout.includes("quad") || layout.includes("bento") || layout.includes("spotlight") ? 4 : 2;
    lines.push("", content.headline);
    for (const card of content.cards.slice(0, cardCount)) {
      lines.push(`→ ${card.title}: ${card.detail ?? card.subtitle}`);
    }
  } else if (layout.includes("stat") || layout.includes("metric")) {
    lines.push("", content.headline);
    for (const stat of content.stats) {
      lines.push(`→ ${stat.value} ${stat.label}`);
    }
    if (content.narrative) lines.push("", content.narrative);
  } else if (layout.includes("hero") || layout.includes("checklist")) {
    lines.push("", content.headline);
    const count = layout.includes("quad") || layout.includes("masonry") || layout.includes("numbered") ? 4 : 3;
    for (const item of content.highlights.slice(0, count)) {
      lines.push(`→ ${item}`);
    }
  } else if (layout.includes("terminal")) {
    lines.push("", "Onchain verification. Published mandate. No hidden rugs.");
    lines.push("", content.narrative);
  } else if (layout.includes("quote")) {
    lines.push("", `"${content.quote}"`, "", content.narrative);
  } else if (layout.includes("closing") || layout.includes("cta")) {
    lines.push("", content.headline, "", content.subtitle);
    const primary = content.links[0];
    if (primary) lines.push("", `Start here → ${primary.value}`);
  } else if (layout.includes("cover")) {
    lines.push("", content.subtitle);
  } else {
    lines.push("", content.headline, "", content.body);
  }

  lines.push("", `(${label} card · Up Only Fund brief)`);
  return lines.join("\n").trim();
}

/** Ready-to-post X copy for a specific photo template in an update. */
export function getPostPhotoShareCopy(
  post: PostPhotoUpdate,
  layout: PostPhotoLayoutTemplate,
): string {
  const explicit = post.shareCopyByLayout?.[layout];
  if (explicit?.trim()) return explicit.trim();
  return buildPhotoShareCopyFallback(layout, post);
}
