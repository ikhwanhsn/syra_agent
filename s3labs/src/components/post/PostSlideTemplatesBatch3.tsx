import type { PostSlideLayoutTemplateBatch3 } from "@/content/posts/layoutsBatch3";
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
import { PostHeader, PostSlideContent, PostSlideGrid, PostSlideLayout } from "@/components/post/PostSlideLayout";
import { PostReveal } from "@/components/post/PostStagger";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

function CoverBadge({ text, isActive, delayMs = 80 }: { text: string; isActive: boolean; delayMs?: number }) {
  return (
    <PostReveal isActive={isActive} delayMs={delayMs}>
      <span className="post-badge-bnb inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/90">
        <span className="post-pulse-dot h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
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
          ? "border-primary/20 bg-gradient-to-br from-primary/12 via-white/[0.04] to-transparent"
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

export function renderCoverBatch3(slide: PostCoverSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "cover-gradient-ring":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" className="post-batch3-gradient-ring">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-batch3-ring-frame">
              <div className="post-batch3-ring-glow" aria-hidden />
              <div className="post-batch3-ring-inner">
                <img src="/images/logo.png" alt="" className="post-cover-logo mx-auto h-12 w-12 rounded-xl border border-white/10 object-cover sm:h-14 sm:w-14" />
                <CoverBadge text={slide.badge} isActive={isActive} delayMs={60} />
                <h1 className="post-slide-title post-slide-balance mt-2">{slide.title}</h1>
                <p className="post-slide-kicker mt-1">{slide.eyebrow}</p>
              </div>
            </div>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={220}>
            <p className="post-slide-lead post-slide-prose">{slide.subtitle}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    case "cover-ship-stamp":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" className="post-batch3-ship-stamp">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-batch3-stamp-border">
              <p className="post-batch3-stamp-meta">{slide.eyebrow}</p>
              <div className="post-batch3-stamp-divider" aria-hidden />
              <h1 className="post-slide-title post-slide-balance">{slide.title}</h1>
              <p className="post-slide-copy post-slide-prose mt-2">{slide.subtitle}</p>
              <div className="post-batch3-stamp-footer">
                <CoverBadge text={slide.badge} isActive={isActive} delayMs={80} />
                <span className="post-batch3-stamp-coords font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">S3 Labs · Investor brief</span>
              </div>
            </div>
          </PostReveal>
        </PostSlideLayout>
      );
    case "cover-corner-logo":
      return (
        <PostSlideLayout
          isActive={isActive}
          template={layout}
          variant="cover"
          className="post-batch3-corner-logo post-slide-body--align-left"
        >
          <PostSlideContent align="left">
            <PostReveal isActive={isActive} delayMs={0}>
              <div className="post-batch3-corner-anchor">
                <img src="/images/logo.png" alt="" className="post-batch3-corner-logo-img h-10 w-10 rounded-lg border border-primary/20 object-cover sm:h-12 sm:w-12" />
                <span className="post-batch3-corner-line" aria-hidden />
              </div>
            </PostReveal>
            <PostReveal isActive={isActive} delayMs={100}>
              <p className="post-slide-kicker">{slide.eyebrow}</p>
            </PostReveal>
            <PostReveal isActive={isActive} delayMs={180}>
              <h1 className="post-slide-title post-slide-title--xl post-slide-balance">{slide.title}</h1>
            </PostReveal>
            <CoverBadge text={slide.badge} isActive={isActive} delayMs={260} />
            <PostReveal isActive={isActive} delayMs={340}>
              <p className="post-slide-lead post-slide-prose">{slide.subtitle}</p>
            </PostReveal>
          </PostSlideContent>
        </PostSlideLayout>
      );
    case "cover-dual-badge":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" className="post-batch3-dual-badge">
          <PostReveal isActive={isActive} delayMs={0}>
            <span className="post-batch3-dual-badge-top post-badge-bnb font-mono text-[10px] uppercase tracking-[0.2em] text-primary/80">{slide.eyebrow}</span>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={100}>
            <h1 className="post-slide-title post-slide-balance">{slide.title}</h1>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={200}>
            <p className="post-slide-copy post-slide-prose">{slide.subtitle}</p>
          </PostReveal>
          <div className="post-batch3-dual-badge-row">
            <CoverBadge text={slide.badge} isActive={isActive} delayMs={280} />
            <PostReveal isActive={isActive} delayMs={360}>
              <span className="post-batch3-dual-badge-chip font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">v3 · batch</span>
            </PostReveal>
          </div>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderStatementBatch3(slide: PostStatementSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "statement-inverted-panel":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-batch3-inverted-panel">
              <p className="post-batch3-inverted-kicker">{slide.kicker}</p>
              <h2 className="post-batch3-inverted-headline">{slide.headline}</h2>
              <p className="post-batch3-inverted-body">{slide.body}</p>
            </div>
          </PostReveal>
        </PostSlideLayout>
      );
    case "statement-gold-frame":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-batch3-gold-frame">
              <div className="post-batch3-gold-frame-inner">
                <p className="post-slide-kicker">{slide.kicker}</p>
                <h2 className="post-slide-headline mt-2">{slide.headline}</h2>
                <p className="post-slide-copy post-slide-prose mt-3">{slide.body}</p>
              </div>
            </div>
          </PostReveal>
        </PostSlideLayout>
      );
    case "statement-split-highlight":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" className="post-batch3-split-highlight">
          <PostReveal isActive={isActive} delayMs={0}>
            <p className="post-slide-kicker text-left">{slide.kicker}</p>
          </PostReveal>
          <div className="post-batch3-split-highlight-grid">
            <PostReveal isActive={isActive} delayMs={100}>
              <h2 className="post-slide-headline text-left">{slide.headline}</h2>
            </PostReveal>
            <PostReveal isActive={isActive} delayMs={200}>
              <div className="post-batch3-split-highlight-pane">
                <p className="post-slide-copy post-slide-prose text-left">{slide.body}</p>
              </div>
            </PostReveal>
          </div>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderHeroBatch3(slide: PostHeroSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "hero-pillar-trio":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={3}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostReveal isActive={isActive} delayMs={160}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.body}</p>
          </PostReveal>
          <div className="post-batch3-pillar-trio">
            {slide.highlights.slice(0, 3).map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={240 + i * 80}>
                <div className="post-batch3-pillar">
                  <div className="post-batch3-pillar-cap" aria-hidden />
                  <p className="post-slide-card-copy mt-2 text-center">{item}</p>
                </div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "hero-highlight-cards":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostReveal isActive={isActive} delayMs={160}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.body}</p>
          </PostReveal>
          <ul className="post-batch3-highlight-cards">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={260 + i * 70}>
                <li className="post-batch3-highlight-card">
                  <span className="post-batch3-highlight-bar" aria-hidden />
                  <span className="post-slide-card-copy">{item}</span>
                </li>
              </PostReveal>
            ))}
          </ul>
        </PostSlideLayout>
      );
    case "hero-stacked-quote":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <PostReveal isActive={isActive} delayMs={160}>
            <blockquote className="post-batch3-stacked-quote">{slide.body}</blockquote>
          </PostReveal>
          <div className="post-batch3-stacked-chips">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={300 + i * 60}>
                <span className="post-batch3-stacked-chip">{item}</span>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "pillars-compact":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.highlights.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} centered compact />
          <div className="post-batch3-pillars-compact">
            {slide.highlights.map((item, i) => (
              <PostReveal key={item} isActive={isActive} delayMs={180 + i * 70} className="post-batch3-pillar-compact-item">
                <span className="post-batch3-pillar-compact-index font-mono text-[10px] text-primary/75">{String(i + 1).padStart(2, "0")}</span>
                <span className="post-slide-card-copy">{item}</span>
                {i < slide.highlights.length - 1 ? <span className="post-batch3-pillar-compact-divider" aria-hidden /> : null}
              </PostReveal>
            ))}
          </div>
          <PostReveal isActive={isActive} delayMs={400}>
            <p className="post-slide-meta text-center">{slide.body}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderFlowBatch3(slide: PostFlowSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "flow-vertical-rail":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <ol className="post-batch3-vertical-rail">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={160 + index * 80}>
                <li className="post-batch3-rail-item">
                  <div className="post-batch3-rail-track">
                    <span className="post-batch3-rail-node">{step.step}</span>
                    {index < slide.steps.length - 1 ? <span className="post-batch3-rail-line" aria-hidden /> : null}
                  </div>
                  <div className="post-batch3-rail-content">
                    <h3 className="post-slide-card-title">{step.title}</h3>
                    <p className="post-slide-card-copy mt-0.5">{step.description}</p>
                  </div>
                </li>
              </PostReveal>
            ))}
          </ol>
        </PostSlideLayout>
      );
    case "flow-step-cards":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-step-cards">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={140 + index * 90}>
                <div className="post-batch3-step-card">
                  <p className="post-batch3-step-card-num">{step.step}</p>
                  <div className="post-batch3-step-card-body">
                    <h3 className="post-slide-card-title">{step.title}</h3>
                    <p className="post-slide-card-copy mt-1">{step.description}</p>
                  </div>
                </div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "flow-ladder":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.steps.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <ol className="post-batch3-ladder">
            {slide.steps.map((step, index) => (
              <PostReveal key={step.step} isActive={isActive} delayMs={150 + index * 75}>
                <li className="post-batch3-ladder-rung" style={{ marginLeft: `${index * 8}%` }}>
                  <div className="post-slide-card post-batch3-ladder-card">
                    <div className="flex items-center gap-2">
                      <span className="post-slide-meta text-primary/70">{step.step}</span>
                      <ArrowRight className="h-3 w-3 text-primary/50" aria-hidden />
                      <h3 className="post-slide-card-title">{step.title}</h3>
                    </div>
                    <p className="post-slide-card-copy mt-1">{step.description}</p>
                  </div>
                </li>
              </PostReveal>
            ))}
          </ol>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderCardsBatch3(slide: PostCardsSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "cards-glass-row":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-glass-row">
            {slide.cards.map((card, index) => (
              <PostReveal key={card.title} isActive={isActive} delayMs={160 + index * 70}>
                <div className={cn("post-batch3-glass-card", card.accent === "gold" && "post-batch3-glass-card--gold")}>
                  <h3 className="post-slide-card-title-lg">{card.title}</h3>
                  <p className="post-slide-meta mt-0.5">{card.subtitle}</p>
                  <p className="post-slide-card-copy mt-2">{card.detail}</p>
                </div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "cards-featured-trio":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-featured-trio">
            {slide.cards[0] ? (
              <PostReveal isActive={isActive} delayMs={160} className="post-batch3-featured-trio-lead">
                <TokenCard card={slide.cards[0]} />
              </PostReveal>
            ) : null}
            <div className="post-batch3-featured-trio-side">
              {slide.cards.slice(1, 3).map((card, index) => (
                <PostReveal key={card.title} isActive={isActive} delayMs={280 + index * 70}>
                  <TokenCard card={card} className="text-center" />
                </PostReveal>
              ))}
            </div>
          </div>
        </PostSlideLayout>
      );
    case "cards-accent-strip":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.cards.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostSlideGrid count={slide.cards.length}>
            {slide.cards.map((card, index) => (
              <PostReveal key={card.title} isActive={isActive} delayMs={160 + index * 75}>
                <div className={cn("post-batch3-accent-strip-card post-slide-card h-full", card.accent === "gold" && "post-batch3-accent-strip-card--gold")}>
                  <div className="post-batch3-accent-strip" aria-hidden />
                  <h3 className="post-slide-card-title-lg">{card.title}</h3>
                  <p className="post-slide-meta mt-0.5">{card.subtitle}</p>
                  <p className="post-slide-card-copy mt-2">{card.detail}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderSurfacesBatch3(slide: PostSurfacesSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "surfaces-icon-row":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="grid" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-icon-row">
            {slide.items.map((item, index) => (
              <PostReveal key={item.title} isActive={isActive} delayMs={180 + index * 65}>
                <div className="post-batch3-icon-row-item">
                  <div className="post-batch3-icon-row-circle">
                    <item.icon className="h-4 w-4 text-primary/75" strokeWidth={1.5} />
                  </div>
                  <p className="post-slide-card-title mt-2">{item.title}</p>
                  <p className="post-slide-meta mt-0.5">{item.description}</p>
                </div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "surfaces-diamond-grid":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.items.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-diamond-grid">
            {slide.items.map((item, index) => (
              <PostReveal key={item.title} isActive={isActive} delayMs={200 + index * 70}>
                <div className="post-batch3-diamond-cell">
                  <div className="post-batch3-diamond-inner">
                    <item.icon className="h-4 w-4 text-white/55" strokeWidth={1.5} />
                    <p className="post-slide-card-title mt-1.5">{item.title}</p>
                    <p className="post-slide-card-copy mt-0.5">{item.description}</p>
                  </div>
                </div>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderImpactBatch3(slide: PostImpactSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "impact-orbit-stats":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-orbit">
            <PostReveal isActive={isActive} delayMs={180}>
              <div className="post-batch3-orbit-core">
                <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
              </div>
            </PostReveal>
            {slide.stats.map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={280 + index * 80} className={cn("post-batch3-orbit-node", `post-batch3-orbit-node--${index + 1}`)}>
                <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                <p className="post-slide-meta mt-0.5">{stat.label}</p>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "impact-spotlight-narrative":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <div className="post-batch3-spotlight-layout">
            <PostReveal isActive={isActive} delayMs={160}>
              <div className="post-batch3-spotlight-narrative">
                <p className="post-slide-copy post-slide-prose">{slide.narrative}</p>
              </div>
            </PostReveal>
            <div className="post-batch3-spotlight-stats">
              {slide.stats.map((stat, index) => (
                <PostReveal key={stat.label} isActive={isActive} delayMs={300 + index * 70}>
                  <div className="post-batch3-spotlight-stat">
                    <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                    <p className="post-slide-meta mt-0.5">{stat.label}</p>
                  </div>
                </PostReveal>
              ))}
            </div>
          </div>
        </PostSlideLayout>
      );
    case "impact-mega-stat":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          {slide.stats[0] ? (
            <PostReveal isActive={isActive} delayMs={160}>
              <div className="post-batch3-mega-stat">
                <p className="post-batch3-mega-value">{slide.stats[0].value}</p>
                <p className="post-slide-card-copy mt-2 font-medium text-white/80">{slide.stats[0].label}</p>
              </div>
            </PostReveal>
          ) : null}
          <PostSlideGrid count={Math.max(0, slide.stats.length - 1)}>
            {slide.stats.slice(1).map((stat, index) => (
              <PostReveal key={stat.label} isActive={isActive} delayMs={320 + index * 70}>
                <div className="post-slide-card text-center">
                  <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                  <p className="post-slide-meta mt-1">{stat.label}</p>
                </div>
              </PostReveal>
            ))}
          </PostSlideGrid>
          <PostReveal isActive={isActive} delayMs={480}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    case "metric-ribbon":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="stack" itemCount={slide.stats.length}>
          <PostHeader isActive={isActive} kicker={slide.kicker} headline={slide.headline} compact centered />
          <PostReveal isActive={isActive} delayMs={140}>
            <div className="post-batch3-metric-ribbon">
              {slide.stats.map((stat, index) => (
                <div key={stat.label} className="post-batch3-metric-ribbon-segment">
                  {index > 0 ? <span className="post-batch3-metric-ribbon-sep" aria-hidden /> : null}
                  <div className="post-batch3-metric-ribbon-cell">
                    <p className="post-slide-stat post-slide-stat--sm">{stat.value}</p>
                    <p className="post-slide-meta mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={380}>
            <p className="post-slide-copy post-slide-prose text-center">{slide.narrative}</p>
          </PostReveal>
        </PostSlideLayout>
      );
    default:
      return null;
  }
}

export function renderClosingBatch3(slide: PostClosingSlide, isActive: boolean): ReactNode {
  const layout = slide.layout as PostSlideLayoutTemplateBatch3;
  switch (layout) {
    case "closing-gold-banner":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover">
          <PostReveal isActive={isActive} delayMs={0}>
            <div className="post-batch3-gold-banner">
              <h2 className="post-slide-headline post-slide-balance">{slide.headline}</h2>
              <p className="post-slide-copy mt-2">{slide.subline}</p>
            </div>
          </PostReveal>
          <div className="post-batch3-gold-banner-links">
            {slide.links.map((link, index) => (
              <PostReveal key={link.label} isActive={isActive} delayMs={200 + index * 70}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="post-batch3-gold-banner-link group">
                  <span className="post-slide-card-title">{link.label}</span>
                  <span className="post-slide-meta">{link.value}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary" />
                </a>
              </PostReveal>
            ))}
          </div>
        </PostSlideLayout>
      );
    case "closing-minimal-type":
      return (
        <PostSlideLayout isActive={isActive} template={layout} variant="cover" className="post-batch3-closing-minimal">
          <PostReveal isActive={isActive} delayMs={0}>
            <h2 className="post-batch3-closing-display">{slide.headline}</h2>
          </PostReveal>
          <PostReveal isActive={isActive} delayMs={140}>
            <p className="post-batch3-closing-sub">{slide.subline}</p>
          </PostReveal>
          {slide.links[0] ? (
            <PostReveal isActive={isActive} delayMs={260}>
              <a href={slide.links[0].href} target="_blank" rel="noopener noreferrer" className="post-batch3-closing-link">
                {slide.links[0].value}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </PostReveal>
          ) : null}
        </PostSlideLayout>
      );
    default:
      return null;
  }
}
