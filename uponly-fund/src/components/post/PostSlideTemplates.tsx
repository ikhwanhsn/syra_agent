import type {
  PostCardsSlide,
  PostClosingSlide,
  PostCoverSlide,
  PostFlowSlide,
  PostHeroSlide,
  PostImpactSlide,
  PostSlide,
  PostStatementSlide,
  PostSurfacesSlide,
} from "@/content/posts/types";
import {
  PostHeader,
  PostSlideContent,
  PostSlideGrid,
  PostSlideLayout,
} from "@/components/post/PostSlideLayout";
import {
  renderCardsExtended,
  renderClosingExtended,
  renderCoverExtended,
  renderFlowExtended,
  renderHeroExtended,
  renderImpactExtended,
  renderStatementExtended,
  renderSurfacesExtended,
} from "@/components/post/PostSlideTemplatesExtended";
import { PostReveal } from "@/components/post/PostStagger";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

function CoverBadge({ text, isActive, delayMs = 80 }: { text: string; isActive: boolean; delayMs?: number }) {
  return (
    <PostReveal isActive={isActive} delayMs={delayMs}>
      <span className="post-badge-bnb inline-flex items-center gap-2 rounded-full border border-uof/25 bg-uof/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-uof/90">
        <span className="post-pulse-dot h-1.5 w-1.5 rounded-full bg-uof" aria-hidden />
        {text}
      </span>
    </PostReveal>
  );
}

function TokenCard({
  card,
  className,
}: {
  card: PostCardsSlide["cards"][number];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "post-token-card post-slide-card h-full",
        card.accent === "gold"
          ? "border-uof/20 bg-gradient-to-br from-uof/12 via-white/[0.04] to-transparent"
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

function renderCover(slide: PostCoverSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "cover-spotlight":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <p className="post-slide-kicker">{slide.eyebrow}</p>
          </PostReveal>
          <CoverBadge text={slide.badge} isActive={isActive} />
          <PostReveal isActive={isActive} delayMs={160}>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <img src="/images/experiment/rise_uponly.png" alt="" className="post-cover-logo h-12 w-12 rounded-xl border border-white/10 object-cover shadow-2xl sm:h-14 sm:w-14" />
              <h1 className="post-slide-title post-slide-balance">{slide.title}</h1>
            </div>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={280}>
            <p className="post-slide-lead post-slide-balance post-slide-prose">{slide.subtitle}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    case "cover-split":
      return (
        <PostSlideLayout
          isActive={isActive}
          template={slide.layout}
          variant="cover"
          className="post-tmpl-cover-split"
        >
          <div className="post-cover-split">
            <div className="post-cover-split-copy">
              <PostReveal isActive={isActive} delayMs={0}>
                <p className="post-slide-kicker">{slide.eyebrow}</p>
              </PostReveal>
              <PostReveal isActive={isActive} delayMs={100}>
                <h1 className="post-slide-title post-cover-split-title">{slide.title}</h1>
              </PostReveal>
              <PostReveal isActive={isActive} delayMs={220}>
                <p className="post-slide-lead post-cover-split-lead">{slide.subtitle}</p>
              </PostReveal>
            </div>
            <div className="post-cover-split-visual">
              <CoverBadge text={slide.badge} isActive={isActive} delayMs={160} />
              <PostReveal isActive={isActive} delayMs={280}>
                <div className="post-cover-hero-lockup">
                  <div className="post-cover-hero-glow" aria-hidden />
                  <div className="post-cover-hero-ring" aria-hidden />
                  <img
                    src="/images/experiment/rise_uponly.png"
                    alt=""
                    className="post-cover-hero-logo"
                  />
                </div>
              </PostReveal>
            </div>
          </div>
        </PostSlideLayout>
      );

    case "cover-minimal":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="cover">
          <CoverBadge text={slide.badge} isActive={isActive} delayMs={0} />
          <PostReveal isActive={isActive} delayMs={120}>
            <h1 className="post-slide-title post-slide-title--xl post-slide-balance">{slide.title}</h1>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={220}>
            <p className="post-slide-kicker">{slide.eyebrow}</p>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={320}>
            <p className="post-slide-copy post-slide-prose">{slide.subtitle}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    default:
      return renderCoverExtended(slide, isActive);
  }
}

function renderStatement(slide: PostStatementSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "statement-centered":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack">
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered />
          <PostReveal isActive={isActive} delayMs={200}>
            <p className="post-slide-copy post-slide-prose post-slide-balance text-center">{slide.body}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    case "statement-accent-bar":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-accent-panel">
              <p className="post-slide-kicker">{slide.kicker}</p>
              <h2 className="post-slide-headline mt-2 text-left">{slide.headline}</h2>
              <p className="post-slide-copy post-slide-prose mt-3 text-left">{slide.body}</p>
            </div>
          </PostReveal>
        </PostSlideLayout>
      );

    case "statement-large-type":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <p className="post-slide-kicker">{slide.kicker}</p>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={100}>
            <h2 className="post-slide-headline post-slide-headline--display post-slide-balance">{slide.headline}</h2>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={220}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.body}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    case "compare-columns":
      return (
        <PostSlideLayout
          isActive={isActive}
          template={slide.layout}
          variant="stack"
          className="post-slide-body--align-left"
        >
          <PostSlideContent align="left" className="post-slide-content--wide">
            <PostReveal isActive={isActive} delayMs={0}>
              <p className="post-slide-kicker">{slide.kicker}</p>
            </PostReveal>
            <div className="post-tmpl-split-main post-tmpl-split-main--balanced">
              <PostReveal isActive={isActive} delayMs={100}>
                <h2 className="post-slide-headline">{slide.headline}</h2>
              </PostReveal>
              <PostReveal isActive={isActive} delayMs={200}>
                <p className="post-slide-copy post-slide-prose">{slide.body}</p>
              </PostReveal>
            </div>
          </PostSlideContent>
        </PostSlideLayout>
      );

    default:
      return renderStatementExtended(slide, isActive);
  }
}

function renderHero(slide: PostHeroSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "hero-checklist":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostReveal isActive={isActive} delayMs={180}>
            <p className="post-slide-copy post-slide-prose post-slide-balance text-center">{slide.body}</p>
          </PostReveal>
          <ul className="post-slide-list post-slide-prose w-full">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={280 + i * 90}>
                <li className="post-highlight-row flex gap-2.5 rounded-lg border border-white/[0.07] bg-gradient-to-r from-white/[0.06] to-transparent px-3 py-2.5">
                  <span className="post-check shrink-0 font-mono text-uof/80">✓</span>
                  <span className="post-slide-copy text-left">{item}</span>
                </li>
              </PostReveal>
            ))}
          </ul>
        </PostSlideLayout>
      );

    case "hero-split":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={slide.highlights.length} className="post-tmpl-hero-split">
          <div className="post-tmpl-hero-split-copy">
            <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact />
            <PostReveal isActive={isActive} delayMs={200}>
              <p className="post-slide-copy post-slide-prose text-left">{slide.body}</p>
            </PostReveal>
          </div>
          <ul className="post-slide-list">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={280 + i * 80}>
                <li className="post-slide-card post-highlight-row flex gap-2 px-3 py-2">
                  <span className="font-mono text-[10px] text-uof/75">{String(i + 1).padStart(2, "0")}</span>
                  <span className="post-slide-card-copy text-left">{item}</span>
                </li>
              </PostReveal>
            ))}
          </ul>
        </PostSlideLayout>
      );

    case "hero-compact":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <ul className="post-slide-list w-full max-w-[50ch]">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={160 + i * 70}>
                <li className="post-slide-card-copy border-b border-white/[0.06] py-2 text-center last:border-0">{item}</li>
              </PostReveal>
            ))}
          </ul>
          <PostReveal isActive={isActive} delayMs={400}>
            <p className="post-slide-meta text-center">{slide.body}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    case "pillars-three":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={3}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostSlideGrid count={Math.min(3, slide.highlights.length)}>
            {slide.highlights.slice(0, 3).map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={200 + i * 90}>
                <div className="post-slide-card post-pillar text-center">
                  <p className="font-mono text-xs text-uof/70">{String(i + 1).padStart(2, "0")}</p>
                  <p className="post-slide-card-copy mt-2">{item}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );

    default:
      return renderHeroExtended(slide, isActive);
  }
}

function renderFlow(slide: PostFlowSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "flow-pipeline":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostSlideGrid count={slide.steps.length}>
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={200 + index * 100} className="min-h-0">
                <div className="post-flow-card post-slide-card group relative h-full">
                  {index < slide.steps.length - 1 ? (
                    <span className="post-flow-connector absolute -right-1 top-1/2 hidden h-px w-2 -translate-y-1/2 sm:block" aria-hidden />
                  ) : null}
                  <p className="post-slide-meta text-uof/70">{step.step}</p>
                  <h3 className="post-slide-card-title mt-1.5">{step.title}</h3>
                  <p className="post-slide-card-copy mt-1">{step.description}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );

    case "flow-timeline":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <ol className="post-timeline">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={180 + index * 90}>
                <li className="post-timeline-item">
                  <span className="post-timeline-dot">{step.step}</span>
                  <div>
                    <h3 className="post-slide-card-title">{step.title}</h3>
                    <p className="post-slide-card-copy mt-0.5">{step.description}</p>
                  </div>
                </li>
              </PostReveal>
            ))}
          </ol>
        </PostSlideLayout>
      );

    case "flow-numbered":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <ol className="post-numbered-flow">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={160 + index * 70}>
                <li className="post-numbered-flow-item">
                  <span className="post-numbered-flow-index">{step.step}</span>
                  <div className="min-w-0">
                    <span className="post-slide-card-title">{step.title}</span>
                    <span className="post-slide-card-copy ml-2">{step.description}</span>
                  </div>
                </li>
              </PostReveal>
            ))}
          </ol>
        </PostSlideLayout>
      );

    default:
      return renderFlowExtended(slide, isActive);
  }
}

function renderCards(slide: PostCardsSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "cards-grid":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostSlideGrid count={slide.cards.length}>
            {slide.cards.map((card, index) => (
              <PostReveal key={card.title} isActive={isActive} delayMs={180 + index * 80} className="min-h-0">
                <TokenCard card={card} />
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );

    case "cards-bento":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-bento">
            {slide.cards.map((card, index) => (
              <PostReveal
                key={card.title}
                isActive={isActive}
                delayMs={180 + index * 80}
                className={cn("min-h-0", index === 0 && "post-bento-featured")}
              >
                <TokenCard card={card} />
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );

    case "cards-row":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-slide-grid post-slide-grid--row" data-cols={slide.cards.length} data-count={slide.cards.length}>
            {slide.cards.map((card, index) => (
              <PostReveal key={card.title} isActive={isActive} delayMs={140 + index * 60} className="min-h-0">
                <TokenCard card={card} className="text-center" />
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );

    default:
      return renderCardsExtended(slide, isActive);
  }
}

function renderSurfaces(slide: PostSurfacesSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "surfaces-tiles":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="grid" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostSlideGrid count={slide.items.length}>
            {slide.items.map((item, index) => {
              const cardClassName = "post-surface-card post-slide-card group relative flex h-full min-h-0 flex-col";
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <item.icon className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.5} />
                    {item.href ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/25 group-hover:text-uof/80" /> : null}
                  </div>
                  <h3 className="post-slide-card-title mt-2">{item.title}</h3>
                  <p className="post-slide-card-copy mt-1">{item.description}</p>
                </>
              );
              return (
                <PostReveal key={item.title} isActive={isActive} delayMs={200 + index * 70} className="min-h-0">
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className={cardClassName}>{inner}</a>
                  ) : (
                    <div className={cardClassName}>{inner}</div>
                  )}
                </PostReveal>
              );
            })}
          </PostSlideGrid>
        </PostSlideLayout>
      );

    case "surfaces-list":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <ul className="post-surface-list">
            {slide.items.map((item, index) => (
              <PostReveal key={item.title} isActive={isActive} delayMs={180 + index * 65}>
                <li className="post-surface-list-item">
                  <item.icon className="h-4 w-4 shrink-0 text-uof/65" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="post-slide-card-title">{item.title}</p>
                    <p className="post-slide-card-copy">{item.description}</p>
                  </div>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-white/30 hover:text-uof/80">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </li>
              </PostReveal>
            ))}
          </ul>
        </PostSlideLayout>
      );

    default:
      return renderSurfacesExtended(slide, isActive);
  }
}

function renderImpact(slide: PostImpactSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "impact-stats":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostSlideGrid count={slide.stats.length}>
            {slide.stats.map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={160 + index * 100}>
                <div className="post-stat-card post-slide-card text-center">
                  <p className="post-slide-stat">{stat.value}</p>
                  <p className="post-slide-card-copy mt-1 font-medium text-white/75">{stat.label}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
          <PostReveal isActive={isActive} delayMs={480}>
            <p className="post-slide-copy post-slide-prose post-slide-balance text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    case "impact-featured-stat":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack">
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostReveal isActive={isActive} delayMs={180}>
            <div className="post-featured-stat">
              <p className="post-slide-stat post-slide-stat--xl">{slide.stats[0]?.value}</p>
              <p className="post-slide-card-copy mt-2 font-medium text-white/80">{slide.stats[0]?.label}</p>
            </div>
          </PostReveal>
          <PostSlideGrid count={Math.max(0, slide.stats.length - 1)} className="max-w-[36ch]">
            {slide.stats.slice(1).map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={300 + index * 80}>
                <div className="post-slide-card text-center">
                  <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                  <p className="post-slide-meta mt-1">{stat.label}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
          <PostReveal isActive={isActive} delayMs={500}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    case "metric-strip":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-metric-strip">
            {slide.stats.map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={140 + index * 70}>
                <div className="post-metric-strip-item">
                  <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                  <p className="post-slide-meta mt-1">{stat.label}</p>
                </div>
              </PostReveal>
            ))}
          </div>
          <PostReveal isActive={isActive} delayMs={420}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );

    default:
      return renderImpactExtended(slide, isActive);
  }
}

function renderClosing(slide: PostClosingSlide, isActive: boolean): ReactNode {
  switch (slide.layout) {
    case "closing-links":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="cover" itemCount={slide.links.length}>
          <PostReveal isActive={isActive} delayMs={0}>
            <h2 className="post-slide-headline post-slide-balance">{slide.headline}</h2>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={120}>
            <p className="post-slide-copy post-slide-prose post-slide-balance">{slide.subline}</p>
          </PostReveal>
          <PostSlideGrid count={slide.links.length} className="post-slide-link-grid">
            {slide.links.map((link, index) => (
              <PostReveal key={link.label} isActive={isActive} delayMs={220 + index * 80}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="post-link-card post-slide-card group flex h-full items-center justify-between gap-2">
                  <div className="min-w-0 text-left">
                    <p className="post-slide-meta">{link.label}</p>
                    <p className="post-slide-card-title mt-0.5 break-words">{link.value}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-uof/80" />
                </a>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );

    case "closing-minimal":
      return (
        <PostSlideLayout isActive={isActive} template={slide.layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <h2 className="post-slide-headline post-slide-headline--display post-slide-balance">{slide.headline}</h2>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={140}>
            <p className="post-slide-copy post-slide-prose">{slide.subline}</p>
          </PostReveal>
          {slide.links[0] ? (
            <PostReveal isActive={isActive} delayMs={260}>
              <a href={slide.links[0].href} target="_blank" rel="noopener noreferrer" className="post-slide-cta-primary">
                {slide.links[0].value}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </PostReveal>
          ) : null}
        </PostSlideLayout>
      );

    default:
      return renderClosingExtended(slide, isActive);
  }
}

export function renderPostSlideTemplate(slide: PostSlide, isActive: boolean): ReactNode {
  switch (slide.kind) {
    case "cover":
      return renderCover(slide, isActive);
    case "statement":
      return renderStatement(slide, isActive);
    case "hero":
      return renderHero(slide, isActive);
    case "flow":
      return renderFlow(slide, isActive);
    case "cards":
      return renderCards(slide, isActive);
    case "surfaces":
      return renderSurfaces(slide, isActive);
    case "impact":
      return renderImpact(slide, isActive);
    case "closing":
      return renderClosing(slide, isActive);
    default:
      return null;
  }
}
