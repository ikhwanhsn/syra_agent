import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function PostPhotoStepConnector({ variant }: { variant: "pipeline" | "timeline" }) {
  return (
    <div
      className={cn("post-photo-step-connector", `post-photo-step-connector--${variant}`)}
      aria-hidden
    >
      <span className="post-photo-step-connector-line" />
      <span className="post-photo-step-connector-chevron" />
    </div>
  );
}

interface PostPhotoChromeProps {
  children: ReactNode;
  className?: string;
  /** Hide footer URL bar (some templates include their own). */
  hideFooter?: boolean;
  /** Hide top brand strip. */
  hideBrand?: boolean;
}

/** Fixed 1200×675 branded canvas shared by all photo templates. */
export function PostPhotoChrome({ children, className, hideFooter, hideBrand }: PostPhotoChromeProps) {
  return (
    <div className={cn("post-photo-canvas", className)}>
      <div className="post-photo-ambient" aria-hidden />
      <div className="post-photo-orb post-photo-orb-a" aria-hidden />
      <div className="post-photo-orb post-photo-orb-b" aria-hidden />
      <div className="post-photo-grid" aria-hidden />

      {!hideBrand ? (
        <div className="post-photo-brand">
          <img src="/images/logo.jpg" alt="" className="post-photo-brand-logo" />
          <span className="post-photo-brand-name">Syra</span>
        </div>
      ) : null}

      <div className="post-photo-body">{children}</div>

      {!hideFooter ? (
        <div className="post-photo-url">syraa.fun</div>
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

export function PostPhotoHeadline({ children, className, large }: { children: ReactNode; className?: string; large?: boolean }) {
  return <h2 className={cn("post-photo-headline", large && "post-photo-headline--lg", className)}>{children}</h2>;
}

export function PostPhotoTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("post-photo-title", className)}>{children}</h1>;
}

export function PostPhotoBody({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("post-photo-copy", className)}>{children}</p>;
}

export function PostPhotoHighlightList({
  items,
  className,
  variant = "default",
}: {
  items: string[];
  className?: string;
  variant?: "default" | "checklist" | "numbered" | "tiered";
}) {
  return (
    <ul
      className={cn(
        "post-photo-list",
        variant === "checklist" && "post-photo-list--checklist",
        variant === "numbered" && "post-photo-list--numbered",
        variant === "tiered" && "post-photo-list--tiered",
        className,
      )}
    >
      {items.map((item, i) => (
        <li key={item} className="post-photo-list-item">
          {variant === "numbered" ? (
            <span className="post-photo-numbered-index">{String(i + 1).padStart(2, "0")}</span>
          ) : variant === "checklist" ? (
            <span className="post-photo-list-check" aria-hidden />
          ) : (
            <span className="post-photo-list-dot" aria-hidden />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PostPhotoItemList({ items }: { items: string[] }) {
  return (
    <ol className="post-photo-item-list">
      {items.map((item, i) => (
        <li key={item} className="post-photo-item-list-row">
          <span className="post-photo-item-list-index">{String(i + 1).padStart(2, "0")}</span>
          <span className="post-photo-item-list-text">{item}</span>
        </li>
      ))}
    </ol>
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
      <div className="post-photo-pipeline post-photo-pipeline--tracked">
        <div className="post-photo-pipeline-row">
          {steps.map((step, i) => (
            <Fragment key={step.step}>
              <div className="post-photo-pipeline-col">
                <div className="post-photo-pipeline-node">{step.step}</div>
                <div className="post-photo-pipeline-card">
                  <p className="post-photo-pipeline-title">{step.title}</p>
                  {step.description ? <p className="post-photo-pipeline-desc">{step.description}</p> : null}
                </div>
              </div>
              {i < steps.length - 1 ? <PostPhotoStepConnector variant="pipeline" /> : null}
            </Fragment>
          ))}
        </div>
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
    <div className="post-photo-timeline post-photo-timeline--horizontal">
      <div className="post-photo-timeline-h-row">
        {steps.map((step, i) => (
          <Fragment key={step.step}>
            <div className="post-photo-timeline-h-col">
              <span className="post-photo-timeline-dot">{step.step}</span>
              <div className="post-photo-timeline-h-card">
                <p className="post-photo-timeline-title">{step.title}</p>
                <p className="post-photo-timeline-desc">{step.description}</p>
              </div>
            </div>
            {i < steps.length - 1 ? <PostPhotoStepConnector variant="timeline" /> : null}
          </Fragment>
        ))}
      </div>
    </div>
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
