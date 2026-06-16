import type { ReactNode } from "react";
import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";
import {
  getPostPhotoBgSignalTag,
  getPostPhotoBgWatermark,
  type PostPhotoBgVariant,
} from "@/components/post/photo/postPhotoBgVariants";
import { cn } from "@/lib/utils";

interface PostPhotoChromeProps {
  children: ReactNode;
  className?: string;
  bgVariant?: PostPhotoBgVariant;
  role?: PostPhotoCardRole;
  hideFooter?: boolean;
  hideBrand?: boolean;
}

function PostPhotoUofUnderlay({ variant }: { variant: PostPhotoBgVariant }) {
  const watermark = getPostPhotoBgWatermark(variant);
  const signalTag = getPostPhotoBgSignalTag(variant);

  return (
    <div className={cn("post-uof-alpha", `post-photo-bg--${variant}`)} aria-hidden>
      <div className="post-uof-alpha-base" />
      <div className="post-uof-alpha-conic" />
      <div className="post-uof-alpha-radial-tr" />
      <div className="post-uof-alpha-radial-bl" />
      <div className="post-uof-alpha-radial-tl" />
      <div className="post-uof-alpha-radial-center" />
      <div className="post-uof-alpha-beam" />
      <div className="post-uof-alpha-beam-left" />
      <div className="post-uof-alpha-grid" />
      <div className="post-uof-alpha-grid-dense" />
      <div className="post-uof-alpha-scanlines" />
      <div className="post-uof-alpha-stripes" />
      <div className="post-uof-alpha-ring" />
      <div className="post-uof-alpha-halo" />
      <div className="post-uof-alpha-spotlight" />
      <div className="post-uof-alpha-slash" />
      <div className="post-uof-alpha-aurora" />
      <div className="post-uof-alpha-layer post-uof-alpha-layer--vault" />
      <div className="post-uof-alpha-layer post-uof-alpha-layer--prism" />
      <div className="post-uof-alpha-layer post-uof-alpha-layer--flow" />
      <div className="post-uof-alpha-layer post-uof-alpha-layer--matrix" />
      <div className="post-uof-alpha-layer post-uof-alpha-layer--ledger" />
      <div className="post-uof-alpha-layer post-uof-alpha-layer--banner" />
      <span className="post-uof-bracket post-uof-bracket--tl" />
      <span className="post-uof-bracket post-uof-bracket--tr" />
      <span className="post-uof-bracket post-uof-bracket--bl" />
      <span className="post-uof-bracket post-uof-bracket--br" />
      <span className="post-uof-watermark">{watermark}</span>
      <span className="post-uof-signal">{signalTag}</span>
      <span className="post-uof-alpha-tag">UOF</span>
    </div>
  );
}

/** Fixed 1200×675 branded canvas — Up Only Fund vault aesthetic. */
export function PostPhotoChrome({
  children,
  className,
  bgVariant = "mandate",
  role,
  hideFooter,
  hideBrand,
}: PostPhotoChromeProps) {
  return (
    <div
      className={cn(
        "post-photo-canvas",
        `post-photo-bg--${bgVariant}`,
        role && `post-uof-role--${role}`,
        className,
      )}
    >
      <PostPhotoUofUnderlay variant={bgVariant} />

      {!hideBrand ? (
        <div className="post-photo-brand">
          <img src="/images/experiment/rise_uponly.png" alt="" className="post-photo-brand-logo" />
          <span className="post-photo-brand-name">Up Only Fund</span>
        </div>
      ) : null}

      <div className="post-photo-body">{children}</div>

      {!hideFooter ? (
        <div className="post-photo-url">uponlyfund.com</div>
      ) : null}
    </div>
  );
}

export function PostPhotoBadge({ text }: { text: string }) {
  return (
    <span className="post-photo-badge">
      <span className="post-photo-pulse-dot" aria-hidden />
      {text}
    </span>
  );
}

export function PostPhotoKicker({ children }: { children: ReactNode }) {
  return <p className="post-photo-kicker">{children}</p>;
}

export function PostPhotoHeadline({
  children,
  className,
  large,
}: {
  children: ReactNode;
  className?: string;
  large?: boolean;
}) {
  return (
    <h2 className={cn("post-photo-headline", large && "post-photo-headline--lg", className)}>
      {children}
    </h2>
  );
}

export function PostPhotoTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("post-photo-title", className)}>{children}</h1>;
}

export function PostPhotoBody({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("post-photo-copy", className)}>{children}</p>;
}

export function PostPhotoHighlightList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("post-photo-list", className)}>
      {items.map((item, i) => (
        <li key={item} className="post-photo-list-item">
          {className?.includes("numbered") ? (
            <span className="post-photo-numbered-index">{String(i + 1).padStart(2, "0")}</span>
          ) : (
            <span className="post-photo-list-dot" aria-hidden />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PostPhotoStatGrid({
  stats,
  featured,
  variant = "default",
}: {
  stats: PostPhotoStat[];
  featured?: boolean;
  variant?: "default" | "counter" | "orbit" | "facet" | "halo" | "podium";
}) {
  return (
    <div
      className={cn(
        "post-photo-stat-grid",
        featured && "post-photo-stat-grid--featured",
        variant === "counter" && "post-photo-stat-grid--counter",
        variant === "orbit" && "post-photo-stat-grid--orbit",
        variant === "facet" && "post-photo-stat-grid--facet",
        variant === "halo" && "post-photo-stat-grid--halo",
        variant === "podium" && "post-photo-stat-grid--podium",
      )}
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className="post-photo-stat">
          {variant === "counter" && i > 0 ? <span className="post-photo-counter-divider" aria-hidden /> : null}
          <span className="post-photo-stat-value">{stat.value}</span>
          <span className="post-photo-stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

interface PostPhotoStat {
  value: string;
  label: string;
}

export function PostPhotoCardGrid({
  cards,
  cols = 2,
  variant = "default",
}: {
  cards: { title: string; subtitle?: string; detail?: string; accent?: "gold" | "default" }[];
  cols?: 2 | 4;
  variant?: "default" | "stack" | "bento" | "spotlight" | "glass" | "marquee";
}) {
  return (
    <div
      className={cn(
        "post-photo-card-grid",
        variant === "stack" && "post-photo-card-grid--stack",
        variant === "bento" && "post-photo-card-grid--bento",
        variant === "spotlight" && "post-photo-card-grid--spotlight",
        variant === "glass" && "post-photo-card-grid--glass",
        variant === "marquee" && "post-photo-card-grid--marquee",
      )}
      data-cols={cols}
    >
      {cards.map((card, i) => (
        <div
          key={card.title}
          className={cn(
            "post-photo-card",
            card.accent === "gold" && "post-photo-card--gold",
            variant === "spotlight" && i === 0 && "post-photo-card--featured",
            variant === "bento" && i === 0 && "post-photo-card--bento-lead",
          )}
        >
          <h3 className="post-photo-card-title">{card.title}</h3>
          {card.subtitle ? <p className="post-photo-card-sub">{card.subtitle}</p> : null}
          {card.detail ? <p className="post-photo-card-detail">{card.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function PostPhotoSteps({
  steps,
  variant = "timeline",
}: {
  steps: { step: string; title: string; description: string }[];
  variant?: "timeline" | "pipeline" | "numbered" | "zigzag" | "arrows";
}) {
  if (variant === "arrows") {
    return (
      <div className="post-photo-arrow-chain">
        {steps.map((step, i) => (
          <div key={step.step} className="post-photo-arrow-chain-seg">
            <div className="post-photo-pipeline-node">{step.step}</div>
            <p className="post-photo-pipeline-title">{step.title}</p>
            {i < steps.length - 1 ? <span className="post-photo-arrow-chain-icon" aria-hidden /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "zigzag") {
    return (
      <ul className="post-photo-zigzag">
        {steps.map((step, i) => (
          <li key={step.step} className={cn("post-photo-zigzag-item", i % 2 === 1 && "post-photo-zigzag-item--right")}>
            <span className="post-photo-timeline-dot">{step.step}</span>
            <div>
              <p className="post-photo-timeline-title">{step.title}</p>
              <p className="post-photo-timeline-desc">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "pipeline") {
    return (
      <div className="post-photo-pipeline">
        {steps.map((step, i) => (
          <div key={step.step} className="post-photo-pipeline-seg">
            <div className="post-photo-pipeline-node">{step.step}</div>
            <p className="post-photo-pipeline-title">{step.title}</p>
            {i < steps.length - 1 ? <span className="post-photo-pipeline-arrow" aria-hidden /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "numbered") {
    return (
      <ol className="post-photo-numbered">
        {steps.map((step) => (
          <li key={step.step} className="post-photo-numbered-item">
            <span className="post-photo-numbered-index">{step.step}</span>
            <div>
              <p className="post-photo-numbered-title">{step.title}</p>
              <p className="post-photo-numbered-desc">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="post-photo-timeline">
      {steps.map((step) => (
        <li key={step.step} className="post-photo-timeline-item">
          <span className="post-photo-timeline-dot">{step.step}</span>
          <div>
            <p className="post-photo-timeline-title">{step.title}</p>
            <p className="post-photo-timeline-desc">{step.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PostPhotoLinks({ links }: { links: { label: string; value: string }[] }) {
  return (
    <div className="post-photo-links">
      {links.map((link) => (
        <div key={link.label} className="post-photo-link-row">
          <span className="post-photo-link-label">{link.label}</span>
          <span className="post-photo-link-value">{link.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Hero logo with emerald vault glow — cover split aside. */
export function PostPhotoHeroLogo({ className }: { className?: string }) {
  return (
    <div className={cn("post-photo-hero-lockup", className)}>
      <div className="post-photo-hero-glow" aria-hidden />
      <div className="post-photo-hero-ring" aria-hidden />
      <img
        src="/images/experiment/rise_uponly.png"
        alt=""
        className="post-photo-hero-logo"
      />
    </div>
  );
}
