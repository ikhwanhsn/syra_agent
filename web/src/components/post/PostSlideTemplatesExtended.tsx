import { SYRA_POST_STUDIO_LOGO } from "@/lib/syraBranding";
import type { PostSlideLayoutTemplateExtended } from "@/content/posts/layoutsExtended";
import {
  renderCardsBatch3,
  renderClosingBatch3,
  renderCoverBatch3,
  renderFlowBatch3,
  renderHeroBatch3,
  renderImpactBatch3,
  renderStatementBatch3,
  renderSurfacesBatch3,
} from "@/components/post/PostSlideTemplatesBatch3";
import type {
  PostCardsSlide,
  PostClosingSlide,
  PostCoverSlide,
  PostFlowSlide,
  PostHeroSlide,
  PostImpactSlide,
  PostStatementSlide,
  PostSurfacesSlide,
} from "@/content/posts/types";
import { PostHeader, PostSlideGrid, PostSlideLayout } from "@/components/post/PostSlideLayout";
import { PostReveal } from "@/components/post/PostStagger";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

function CoverBadge({ text, isActive, delayMs = 80 }: { text: string; isActive: boolean; delayMs?: number }) {
  return (
    <PostReveal isActive={isActive} delayMs={delayMs}>
      <span className="post-badge-bnb inline-flex items-center gap-2 rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#F3BA2F]/90">
        <span className="post-pulse-dot h-1.5 w-1.5 rounded-full bg-[#F3BA2F]" aria-hidden />
        {text}
      </span>
    </PostReveal>
  );
}

function TokenCard({ card, className }: { card: PostCardsSlide["cards"][number]; className?: string }) {
  return (
    <div
      className={cn(
        "post-token-card post-slide-card h-full",
        card.accent === "gold"
          ? "border-[#F3BA2F]/20 bg-gradient-to-br from-[#F3BA2F]/12 via-white/[0.04] to-transparent"
          : "border-white/[0.08] bg-white/[0.03]",
        className,
      )}
    >
      <h3 className="post-slide-card-title-lg">{card.title}</h3>
      <p className="post-slide-meta mt-0.5">{card.subtitle}</p>
      <p className="post-slide-card-copy mt-2">{card.detail}</p>
    </div>
  );
}

export function renderCoverExtended(slide: PostCoverSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "cover-brand-lockup":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <img src={SYRA_POST_STUDIO_LOGO} alt="" className="post-cover-logo post-studio-logo-mark mx-auto h-16 w-16 rounded-2xl object-cover sm:h-[4.5rem] sm:w-[4.5rem]" />
          </PostReveal>
          <CoverBadge text={slide.badge} isActive={isActive} delayMs={100} />
          <PostReveal isActive={isActive} delayMs={200}>
            <h1 className="post-slide-title post-slide-balance">{slide.title}</h1>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={300}>
            <p className="post-slide-kicker">{slide.eyebrow}</p>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={400}>
            <p className="post-slide-copy post-slide-prose">{slide.subtitle}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    case "cover-tagline-stack":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" className="post-tmpl-tight-stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <p className="post-slide-kicker">{slide.eyebrow}</p>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={80}>
            <h1 className="post-slide-title post-slide-title--xl post-slide-balance">{slide.title}</h1>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={160}>
            <p className="post-slide-lead post-slide-prose">{slide.subtitle}</p>
          </PostReveal>
          <CoverBadge text={slide.badge} isActive={isActive} delayMs={240} />
        </PostSlideLayout>
      );
    case "cover-hero-type":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <h1 className="post-slide-title post-slide-title--hero post-slide-balance">{slide.title}</h1>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={150}>
            <p className="post-slide-meta mt-3">{slide.badge}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    default:
      return renderCoverBatch3(slide, isActive);
  }
}

export function renderStatementExtended(slide: PostStatementSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "statement-boxed":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-boxed-panel">
              <p className="post-slide-kicker">{slide.kicker}</p>
              <h2 className="post-slide-headline mt-2">{slide.headline}</h2>
              <p className="post-slide-copy post-slide-prose mt-3">{slide.body}</p>
            </div>
          </PostReveal>
        </PostSlideLayout>
      );
    case "statement-kicker-bottom":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <h2 className="post-slide-headline post-slide-headline--display post-slide-balance">{slide.headline}</h2>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={120}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.body}</p>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={220}>
            <p className="post-slide-kicker">{slide.kicker}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    case "statement-highlight-line":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <p className="post-slide-kicker">{slide.kicker}</p>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={100}>
            <h2 className="post-slide-headline post-slide-headline--underline post-slide-balance">{slide.headline}</h2>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={200}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.body}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    case "statement-narrow-column":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack">
          <div className="post-narrow-column">
            <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
            <PostReveal isActive={isActive} delayMs={200}>
              <p className="post-slide-copy text-center">{slide.body}</p>
            </PostReveal>
          </div>
        </PostSlideLayout>
      );
    default:
      return renderStatementBatch3(slide, isActive);
  }
}

export function renderHeroExtended(slide: PostHeroSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "hero-masonry":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostReveal isActive={isActive} delayMs={160}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.body}</p>
          </PostReveal>
          <div className="post-masonry">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={240 + i * 70}>
                <div className="post-slide-card post-slide-card-copy">{item}</div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "hero-numbered-cards":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostSlideGrid count={slide.highlights.length}>
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={200 + i * 80}>
                <div className="post-slide-card text-center">
                  <p className="font-mono text-lg text-[#F3BA2F]/80">{String(i + 1).padStart(2, "0")}</p>
                  <p className="post-slide-card-copy mt-2">{item}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );
    case "hero-quote-body":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostReveal isActive={isActive} delayMs={180}>
            <blockquote className="post-quote-block">{slide.body}</blockquote>
          </PostReveal>
          <ul className="post-slide-list w-full">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={300 + i * 70}>
                <li className="post-slide-meta text-center">{item}</li>
              </PostReveal>
            ))}
          </ul>
        </PostSlideLayout>
      );
    default:
      return renderHeroBatch3(slide, isActive);
  }
}

export function renderFlowExtended(slide: PostFlowSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "flow-zigzag":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <ol className="post-zigzag">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={160 + index * 80}>
                <li className={cn("post-zigzag-item", index % 2 === 1 && "post-zigzag-item--right")}>
                  <span className="post-timeline-dot">{step.step}</span>
                  <div className="post-slide-card min-w-0 flex-1">
                    <h3 className="post-slide-card-title">{step.title}</h3>
                    <p className="post-slide-card-copy mt-0.5">{step.description}</p>
                  </div>
                </li>
              </PostReveal>
            ))}
          </ol>
        </PostSlideLayout>
      );
    case "flow-arrow-chain":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-arrow-chain">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={140 + index * 70} className="post-arrow-chain-segment">
                <div className="post-slide-card h-full text-center">
                  <p className="post-slide-meta">{step.step}</p>
                  <p className="post-slide-card-title mt-1">{step.title}</p>
                </div>
                {index < slide.steps.length - 1 ? <ArrowRight className="post-arrow-chain-icon hidden sm:block" aria-hidden /> : null}
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "flow-compact-row":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-compact-flow-row">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={120 + index * 60}>
                <div className="post-compact-flow-chip">
                  <span className="post-slide-meta">{step.step}</span>
                  <span className="post-slide-card-title ml-1">{step.title}</span>
                </div>
              </PostReveal>
            ))}
          </div>
          <PostReveal isActive={isActive} delayMs={400}>
            <p className="post-slide-card-copy text-center">{slide.steps.at(-1)?.description}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    default:
      return renderFlowBatch3(slide, isActive);
  }
}

export function renderCardsExtended(slide: PostCardsSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "cards-stack":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-cards-stack">
            {slide.cards.map((card, index) => (
              <PostReveal key={card.title} isActive={isActive} delayMs={140 + index * 70}>
                <TokenCard card={card} />
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "cards-mosaic": {
      const isQuad = slide.cards.length === 4;
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className={cn("post-mosaic", isQuad && "post-mosaic--quad")}>
            {slide.cards.map((card, index) => (
              <PostReveal
                key={card.title}
                isActive={isActive}
                delayMs={160 + index * 70}
                className={cn(!isQuad && index === 0 && "post-mosaic-lead")}
              >
                <TokenCard card={card} />
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    }
    case "cards-spotlight-one":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-spotlight-cards">
            {slide.cards[0] ? (
              <PostReveal isActive={isActive} delayMs={160} className="post-spotlight-cards-featured">
                <TokenCard card={slide.cards[0]} />
              </PostReveal>
            ) : null}
            <div className="post-spotlight-cards-rest">
              {slide.cards.slice(1).map((card, index) => (
                <PostReveal key={card.title} isActive={isActive} delayMs={260 + index * 60}>
                  <TokenCard card={card} className="text-center" />
                </PostReveal>
              ))}
            </div>
          </div>
        </PostSlideLayout>
      );
    default:
      return renderCardsBatch3(slide, isActive);
  }
}

export function renderSurfacesExtended(slide: PostSurfacesSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  const featured = slide.items[0];
  const FeaturedIcon = featured?.icon;

  switch (layout) {
    case "surfaces-compact-grid":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostSlideGrid count={slide.items.length}>
            {slide.items.map((item, index) => (
              <PostReveal key={item.title} isActive={isActive} delayMs={160 + index * 60}>
                <div className="post-compact-tile text-center">
                  <item.icon className="mx-auto h-4 w-4 text-[#F3BA2F]/70" strokeWidth={1.5} />
                  <p className="post-slide-card-title mt-2">{item.title}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );
    case "surfaces-featured-one":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          {featured && FeaturedIcon ? (
            <PostReveal isActive={isActive} delayMs={180}>
              <div className="post-surface-featured post-slide-card">
                <FeaturedIcon className="h-5 w-5 text-[#F3BA2F]/75" strokeWidth={1.5} />
                <h3 className="post-slide-card-title-lg mt-3">{featured.title}</h3>
                <p className="post-slide-card-copy mt-2">{featured.description}</p>
              </div>
            </PostReveal>
          ) : null}
          <PostSlideGrid count={Math.max(0, slide.items.length - 1)}>
            {slide.items.slice(1).map((item, index) => (
              <PostReveal key={item.title} isActive={isActive} delayMs={280 + index * 70}>
                <div className="post-slide-card text-center">
                  <item.icon className="mx-auto h-4 w-4 text-white/50" strokeWidth={1.5} />
                  <p className="post-slide-card-title mt-2">{item.title}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );
    case "surfaces-orbit":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <div className="post-orbit-grid">
            {slide.items.map((item, index) => (
              <PostReveal key={item.title} isActive={isActive} delayMs={180 + index * 65}>
                <div className="post-orbit-node">
                  <item.icon className="h-4 w-4 text-white/55" strokeWidth={1.5} />
                  <p className="post-slide-card-title mt-1.5">{item.title}</p>
                </div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    default:
      return renderSurfacesBatch3(slide, isActive);
  }
}

export function renderImpactExtended(slide: PostImpactSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "impact-counter-row":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-counter-row">
            {slide.stats.map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={140 + index * 80}>
                <div className="post-counter-row-item">
                  {index > 0 ? <span className="post-counter-divider" aria-hidden /> : null}
                  <div className="post-counter-cell">
                    <p className="post-slide-stat">{stat.value}</p>
                    <p className="post-slide-meta mt-1">{stat.label}</p>
                  </div>
                </div>
              </PostReveal>
            ))}
          </div>
          <PostReveal isActive={isActive} delayMs={420}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    case "impact-narrative-first":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostReveal isActive={isActive} delayMs={160}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
          <PostSlideGrid count={slide.stats.length}>
            {slide.stats.map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={300 + index * 80}>
                <div className="post-slide-card text-center">
                  <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                  <p className="post-slide-meta mt-1">{stat.label}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );
    case "impact-duo":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack">
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-impact-duo">
            {slide.stats.slice(0, 2).map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={160 + index * 100}>
                <div className="post-slide-card text-center">
                  <p className="post-slide-stat post-slide-stat--xl">{stat.value}</p>
                  <p className="post-slide-card-copy mt-2">{stat.label}</p>
                </div>
              </PostReveal>
            ))}
          </div>
          <PostReveal isActive={isActive} delayMs={380}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    default:
      return renderImpactBatch3(slide, isActive);
  }
}

export function renderClosingExtended(slide: PostClosingSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateExtended;
  switch (layout) {
    case "closing-split-cta":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" className="post-closing-split">
          <div className="post-closing-split-copy">
            <PostReveal isActive={isActive} delayMs={0}>
              <h2 className="post-slide-headline text-left">{slide.headline}</h2>
            </PostReveal>
            <PostReveal isActive={isActive} delayMs={120}>
              <p className="post-slide-copy post-slide-prose text-left">{slide.subline}</p>
            </PostReveal>
          </div>
          <div className="post-closing-split-links">
            {slide.links.map((link, index) => (
              <PostReveal key={link.label} isActive={isActive} delayMs={220 + index * 70}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="post-slide-card group flex items-center justify-between gap-2">
                  <span className="post-slide-card-title">{link.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/40 group-hover:text-[#F3BA2F]/80" />
                </a>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "closing-stack-links":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" itemCount={slide.links.length}>
          <PostReveal isActive={isActive} delayMs={0}>
            <h2 className="post-slide-headline post-slide-balance">{slide.headline}</h2>
          </PostReveal>
          <div className="post-closing-stack">
            {slide.links.map((link, index) => (
              <PostReveal key={link.label} isActive={isActive} delayMs={140 + index * 70}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="post-closing-stack-link">
                  <span>{link.value}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "closing-banner":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-closing-banner">
              <h2 className="post-slide-headline post-slide-balance">{slide.headline}</h2>
              <p className="post-slide-copy mt-2">{slide.subline}</p>
            </div>
          </PostReveal>
          {slide.links[0] ? (
            <PostReveal isActive={isActive} delayMs={200}>
              <a href={slide.links[0].href} target="_blank" rel="noopener noreferrer" className="post-slide-cta-primary">
                {slide.links[0].label}: {slide.links[0].value}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </PostReveal>
          ) : null}
        </PostSlideLayout>
      );
    default:
      return renderClosingBatch3(slide, isActive);
  }
}
