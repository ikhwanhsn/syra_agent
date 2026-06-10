import type { PostPhotoContent } from "@/content/posts/photo/types";
import type { PostPhotoLayoutTemplate } from "@/content/posts/photo/layouts";
import {
  PostPhotoBadge,
  PostPhotoBody,
  PostPhotoCardGrid,
  PostPhotoChrome,
  PostPhotoHeadline,
  PostPhotoHighlightList,
  PostPhotoKicker,
  PostPhotoLinks,
  PostPhotoStatGrid,
  PostPhotoSteps,
  PostPhotoTitle,
} from "@/components/post/photo/PostPhotoChrome";
import type { PhotoBlockId, PhotoTemplateDef } from "@/components/post/photo/postPhotoLayoutRegistry";
import { POST_PHOTO_LAYOUT_REGISTRY_MAP } from "@/components/post/photo/postPhotoLayoutRegistry";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function statGridVariant(def: PhotoTemplateDef): "default" | "counter" | "orbit" | "facet" | "halo" | "podium" {
  if (def.id === "photo-stat-counter-row") return "counter";
  if (def.id === "photo-stat-orbit") return "orbit";
  if (def.id === "photo-stat-facet") return "facet";
  if (def.id === "photo-stat-halo") return "halo";
  if (def.id === "photo-stat-podium") return "podium";
  return "default";
}

function cardGridVariant(def: PhotoTemplateDef): "default" | "stack" | "bento" | "spotlight" | "glass" | "marquee" {
  if (def.id === "photo-cards-stack") return "stack";
  if (def.id === "photo-cards-bento") return "bento";
  if (def.id === "photo-cards-spotlight") return "spotlight";
  if (def.id === "photo-cards-glass-duo" || def.id === "photo-cards-glass-quad") return "glass";
  if (def.id === "photo-cards-marquee") return "marquee";
  return "default";
}

function renderBlock(block: PhotoBlockId, content: PostPhotoContent, def: PhotoTemplateDef): ReactNode {
  switch (block) {
    case "eyebrow":
      return <PostPhotoKicker key={block}>{content.eyebrow}</PostPhotoKicker>;
    case "badge":
      return <PostPhotoBadge key={block} text={content.badge} />;
    case "title":
      return <PostPhotoTitle key={block}>{content.title}</PostPhotoTitle>;
    case "subtitle":
      return <PostPhotoBody key={block}>{content.subtitle}</PostPhotoBody>;
    case "kicker":
      return <PostPhotoKicker key={block}>{content.kicker}</PostPhotoKicker>;
    case "headline":
      return (
        <PostPhotoHeadline
          key={block}
          large={def.id.includes("large") || def.id.includes("type-hero") || def.id.includes("editorial")}
          className={
            def.id === "photo-statement-underline" || def.id === "photo-statement-neon"
              ? "post-photo-headline--underline"
              : undefined
          }
        >
          {content.headline}
        </PostPhotoHeadline>
      );
    case "body":
      return <PostPhotoBody key={block}>{content.body}</PostPhotoBody>;
    case "quote":
      return (
        <blockquote
          key={block}
          className={cn(
            "post-photo-quote",
            def.id === "photo-quote-centered" && "post-photo-quote--centered",
            def.id === "photo-quote-gilded" && "post-photo-quote--gilded",
          )}
        >
          {content.quote}
        </blockquote>
      );
    case "narrative":
      return <PostPhotoBody key={block}>{content.narrative}</PostPhotoBody>;
    case "logo-lockup":
      return (
        <div key={block} className="post-photo-cover-lockup">
          <img src="/images/logo.jpg" alt="" className="post-photo-cover-logo" />
          <PostPhotoTitle>{content.title}</PostPhotoTitle>
        </div>
      );
    case "logo-hero":
      return <img key={block} src="/images/logo.jpg" alt="" className="post-photo-cover-logo post-photo-cover-logo--lg" />;
    case "brand-name":
      return (
        <p key={block} className="post-photo-brand-hero-name">
          Syra
        </p>
      );
    case "highlights-all":
      return <PostPhotoHighlightList key={block} items={content.highlights} />;
    case "highlights-3":
      return <PostPhotoHighlightList key={block} items={content.highlights.slice(0, 3)} />;
    case "highlights-4":
      return (
        <PostPhotoHighlightList
          key={block}
          items={content.highlights.slice(0, 4)}
          className={
            def.id === "photo-hero-numbered"
              ? "post-photo-list--numbered"
              : def.id === "photo-hero-masonry"
                ? "post-photo-list--masonry"
                : def.id === "photo-hero-tiered"
                  ? "post-photo-list--tiered"
                  : undefined
          }
        />
      );
    case "stats-all":
      return (
        <PostPhotoStatGrid
          key={block}
          stats={content.stats}
          featured={def.id === "photo-stat-featured"}
          variant={statGridVariant(def)}
        />
      );
    case "stats-2":
      return <PostPhotoStatGrid key={block} stats={content.stats.slice(0, 2)} />;
    case "stats-1":
      return <PostPhotoStatGrid key={block} stats={[content.stats[0]]} featured />;
    case "stats-strip":
      return (
        <div key={block} className="post-photo-metric-strip">
          {content.stats.map((stat) => (
            <div key={stat.label} className="post-photo-metric-chip">
              <span className="post-photo-stat-value">{stat.value}</span>
              <span className="post-photo-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      );
    case "cards-2":
      return (
        <PostPhotoCardGrid
          key={block}
          cards={content.cards.slice(0, 2)}
          cols={2}
          variant={cardGridVariant(def)}
        />
      );
    case "cards-4":
      return (
        <PostPhotoCardGrid
          key={block}
          cards={content.cards.slice(0, 4)}
          cols={4}
          variant={cardGridVariant(def)}
        />
      );
    case "steps-timeline":
      return <PostPhotoSteps key={block} steps={content.steps} variant="timeline" />;
    case "steps-pipeline":
      return <PostPhotoSteps key={block} steps={content.steps} variant="pipeline" />;
    case "steps-numbered":
      return <PostPhotoSteps key={block} steps={content.steps} variant="numbered" />;
    case "steps-zigzag":
      return <PostPhotoSteps key={block} steps={content.steps} variant="zigzag" />;
    case "steps-arrows":
      return <PostPhotoSteps key={block} steps={content.steps} variant="arrows" />;
    case "compare":
      return (
        <div
          key={block}
          className={cn(
            "post-photo-compare",
            def.id === "photo-compare-gradient" && "post-photo-compare--gradient",
            def.id === "photo-compare-slide" && "post-photo-compare--slide",
          )}
        >
          <div className="post-photo-compare-col">
            <p className="post-photo-compare-label">{content.compareLeft.title}</p>
            <PostPhotoBody>{content.compareLeft.body}</PostPhotoBody>
          </div>
          <div className="post-photo-compare-col post-photo-compare-col--now">
            <p className="post-photo-compare-label">{content.compareRight.title}</p>
            <PostPhotoBody>{content.compareRight.body}</PostPhotoBody>
          </div>
        </div>
      );
    case "links":
      return <PostPhotoLinks key={block} links={content.links} />;
    case "items-all":
      return (
        <ul key={block} className="post-photo-items-grid">
          {content.items.map((item) => (
            <li key={item} className="post-photo-items-grid-item">
              {item}
            </li>
          ))}
        </ul>
      );
    case "terminal":
      return (
        <div key={block} className="post-photo-terminal-wrap">
          <div className="post-photo-terminal-bar">
            <span className="post-photo-terminal-dot" />
            <span className="post-photo-terminal-dot" />
            <span className="post-photo-terminal-dot" />
            <span className="post-photo-terminal-title">syra · b402</span>
          </div>
          <pre className="post-photo-terminal">
            {content.terminalLines.map((line) => (
              <code key={line}>{line}{"\n"}</code>
            ))}
          </pre>
        </div>
      );
    case "url-inline":
      return (
        <p key={block} className="post-photo-url post-photo-url--inline">
          syraa.fun
        </p>
      );
    default:
      return null;
  }
}

function renderBlocks(blocks: PhotoBlockId[], content: PostPhotoContent, def: PhotoTemplateDef): ReactNode {
  return blocks.map((block) => renderBlock(block, content, def));
}

function renderBody(def: PhotoTemplateDef, content: PostPhotoContent): ReactNode {
  const stackClass = cn("post-photo-stack", def.bodyClassName, {
    "post-photo-stack--center": def.align === "center" || def.align === "box" || def.align === "banner" || def.align === "editorial",
    "post-photo-stack--left": def.align === "left",
  });

  switch (def.align) {
    case "split":
      return (
        <div className={cn("post-photo-split", def.bodyClassName)}>
          <div className="post-photo-stack post-photo-stack--left">{renderBlocks(def.blocks, content, def)}</div>
          <div className="post-photo-split-aside">{renderBlocks(def.asideBlocks ?? [], content, def)}</div>
        </div>
      );
    case "split-balanced":
      return (
        <div className={cn("post-photo-split post-photo-split--balanced", def.bodyClassName)}>
          <div className="post-photo-stack post-photo-stack--left">{renderBlocks(def.blocks, content, def)}</div>
          <div className={cn("post-photo-stack", def.id === "photo-closing-split" ? "post-photo-stack--left" : "")}>
            {renderBlocks(def.asideBlocks ?? [], content, def)}
          </div>
        </div>
      );
    case "accent":
      return <div className={cn("post-photo-accent-panel", def.bodyClassName)}>{renderBlocks(def.blocks, content, def)}</div>;
    case "box":
      return <div className={cn("post-photo-box", def.bodyClassName)}>{renderBlocks(def.blocks, content, def)}</div>;
    case "compare":
      return <div className={stackClass}>{renderBlocks(def.blocks, content, def)}</div>;
    case "terminal":
      return renderBlock("terminal", content, def);
    case "banner":
      return <div className={cn("post-photo-closing-banner", def.bodyClassName)}>{renderBlocks(def.blocks, content, def)}</div>;
    case "editorial":
      return <div className={cn("post-photo-editorial", def.bodyClassName)}>{renderBlocks(def.blocks, content, def)}</div>;
    default:
      return <div className={stackClass}>{renderBlocks(def.blocks, content, def)}</div>;
  }
}

export function renderPostPhotoTemplate(layout: PostPhotoLayoutTemplate, content: PostPhotoContent): ReactNode {
  const def = POST_PHOTO_LAYOUT_REGISTRY_MAP.get(layout);
  if (!def) return null;

  return (
    <PostPhotoChrome
      hideBrand={def.chrome?.hideBrand}
      hideFooter={def.chrome?.hideFooter}
      className={def.chrome?.className}
    >
      {renderBody(def, content)}
    </PostPhotoChrome>
  );
}
