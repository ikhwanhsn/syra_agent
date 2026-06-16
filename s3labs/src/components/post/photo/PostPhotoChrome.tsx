import type { ReactNode } from "react";
import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";
import {
  getPostPhotoBgVariant,
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

function PostPhotoS3Underlay({ variant }: { variant: PostPhotoBgVariant }) {
  return (
    <div className={cn("post-s3-canvas-bg", `post-s3-bg--${variant}`)} aria-hidden>
      <div className="post-s3-bg-base" />
      <div className="post-s3-ribbon post-s3-ribbon--a" />
      <div className="post-s3-ribbon post-s3-ribbon--b" />
      <div className="post-s3-ribbon post-s3-ribbon--c" />
      <div className="post-s3-mesh" />
      <div className="post-s3-orbit" />
      <div className="post-s3-beam" />
      <div className="post-s3-spot" />
      <div className="post-s3-stripe" />
      <div className="post-s3-wave" />
      <div className="post-s3-geo" />
      <div className="post-s3-top-glow" />
    </div>
  );
}

/** 1200×675 — S3 ribbon editorial canvas (not UOF vault terminal). */
export function PostPhotoChrome({
  children,
  className,
  bgVariant = "ribbon",
  role,
  hideFooter,
  hideBrand,
}: PostPhotoChromeProps) {
  const variant = bgVariant ?? (role ? getPostPhotoBgVariant(role) : "ribbon");

  return (
    <div
      className={cn(
        "post-photo-canvas post-photo-canvas--s3",
        `post-s3-bg--${variant}`,
        role && `post-s3-role--${role}`,
        className,
      )}
    >
      <PostPhotoS3Underlay variant={variant} />

      {!hideBrand ? (
        <div className="post-s3-brand-pill">
          <img src="/images/logo.png" alt="" className="post-s3-brand-logo" />
          <span className="post-s3-brand-text">S3 Labs</span>
          <span className="post-s3-brand-tag">Results over hype</span>
        </div>
      ) : null}

      <div className="post-photo-body post-s3-photo-body">{children}</div>

      {!hideFooter ? (
        <div className="post-s3-footer-dock">
          <span className="post-s3-footer-url">s3labs.io</span>
        </div>
      ) : null}
    </div>
  );
}

export function PostPhotoBadge({ text }: { text: string }) {
  return (
    <span className="post-s3-badge">
      <span className="post-s3-badge-dot" aria-hidden />
      {text}
    </span>
  );
}

export function PostPhotoKicker({ children }: { children: ReactNode }) {
  return <p className="post-s3-kicker">{children}</p>;
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
    <h2 className={cn("post-s3-headline", large && "post-s3-headline--lg", className)}>
      {children}
    </h2>
  );
}

export function PostPhotoTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("post-s3-title", className)}>{children}</h1>;
}

export function PostPhotoBody({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("post-s3-copy", className)}>{children}</p>;
}

export function PostPhotoHighlightList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("post-s3-list", className)}>
      {items.map((item, i) => (
        <li key={item} className="post-s3-list-item">
          {className?.includes("numbered") ? (
            <span className="post-s3-list-index">{String(i + 1).padStart(2, "0")}</span>
          ) : (
            <span className="post-s3-list-dot" aria-hidden />
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
        "post-s3-stat-grid",
        featured && "post-s3-stat-grid--featured",
        variant === "counter" && "post-s3-stat-grid--counter",
        variant === "orbit" && "post-s3-stat-grid--orbit",
        variant === "facet" && "post-s3-stat-grid--facet",
        variant === "halo" && "post-s3-stat-grid--halo",
        variant === "podium" && "post-s3-stat-grid--podium",
      )}
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className="post-s3-stat">
          {variant === "counter" && i > 0 ? <span className="post-s3-stat-divider" aria-hidden /> : null}
          <span className="post-s3-stat-value">{stat.value}</span>
          <span className="post-s3-stat-label">{stat.label}</span>
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
        "post-s3-card-grid",
        variant === "stack" && "post-s3-card-grid--stack",
        variant === "bento" && "post-s3-card-grid--bento",
        variant === "spotlight" && "post-s3-card-grid--spotlight",
        variant === "glass" && "post-s3-card-grid--glass",
        variant === "marquee" && "post-s3-card-grid--marquee",
      )}
      data-cols={cols}
    >
      {cards.map((card, i) => (
        <div
          key={card.title}
          className={cn(
            "post-s3-card",
            card.accent === "gold" && "post-s3-card--accent",
            variant === "spotlight" && i === 0 && "post-s3-card--lead",
            variant === "bento" && i === 0 && "post-s3-card--bento-lead",
          )}
        >
          <h3 className="post-s3-card-title">{card.title}</h3>
          {card.subtitle ? <p className="post-s3-card-sub">{card.subtitle}</p> : null}
          {card.detail ? <p className="post-s3-card-detail">{card.detail}</p> : null}
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
      <div className="post-s3-arrow-chain">
        {steps.map((step, i) => (
          <div key={step.step} className="post-s3-arrow-seg">
            <div className="post-s3-flow-node">{step.step}</div>
            <p className="post-s3-flow-title">{step.title}</p>
            {i < steps.length - 1 ? <span className="post-s3-arrow-icon" aria-hidden /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "zigzag") {
    return (
      <ul className="post-s3-zigzag">
        {steps.map((step, i) => (
          <li key={step.step} className={cn("post-s3-zigzag-item", i % 2 === 1 && "post-s3-zigzag-item--right")}>
            <span className="post-s3-timeline-dot">{step.step}</span>
            <div>
              <p className="post-s3-timeline-title">{step.title}</p>
              <p className="post-s3-timeline-desc">{step.description}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "pipeline") {
    return (
      <div className="post-s3-pipeline">
        {steps.map((step, i) => (
          <div key={step.step} className="post-s3-pipeline-seg">
            <div className="post-s3-flow-node">{step.step}</div>
            <p className="post-s3-flow-title">{step.title}</p>
            {i < steps.length - 1 ? <span className="post-s3-pipeline-arrow" aria-hidden /> : null}
          </div>
        ))}
      </div>
    );
  }

  if (variant === "numbered") {
    return (
      <ol className="post-s3-numbered">
        {steps.map((step) => (
          <li key={step.step} className="post-s3-numbered-item">
            <span className="post-s3-numbered-index">{step.step}</span>
            <div>
              <p className="post-s3-numbered-title">{step.title}</p>
              <p className="post-s3-numbered-desc">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="post-s3-timeline">
      {steps.map((step) => (
        <li key={step.step} className="post-s3-timeline-item">
          <span className="post-s3-timeline-dot">{step.step}</span>
          <div>
            <p className="post-s3-timeline-title">{step.title}</p>
            <p className="post-s3-timeline-desc">{step.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PostPhotoLinks({ links }: { links: { label: string; value: string }[] }) {
  return (
    <div className="post-s3-links">
      {links.map((link) => (
        <div key={link.label} className="post-s3-link-row">
          <span className="post-s3-link-label">{link.label}</span>
          <span className="post-s3-link-value">{link.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Centered logo with teal ribbon glow — cover aside. */
export function PostPhotoHeroLogo({ className }: { className?: string }) {
  return (
    <div className={cn("post-s3-hero-lockup", className)}>
      <div className="post-s3-hero-ribbon" aria-hidden />
      <div className="post-s3-hero-ring" aria-hidden />
      <img src="/images/logo.png" alt="" className="post-s3-hero-logo" />
    </div>
  );
}
