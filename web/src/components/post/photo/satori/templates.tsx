import type { ReactNode } from "react";
import type { PostPhotoCardDef, PostPhotoContent } from "@/content/posts/photo/types";
import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";
import {
  PHOTO,
  PHOTO_SIZE,
  PHOTO_TYPE,
  getRoleTint,
} from "@/components/post/photo/satori/tokens";

type Assets = Record<string, string>;

const LOGO_PATH = "/images/logo.jpg";

/* ── Primitives ─────────────────────────────────────────────── */

function Kicker({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: PHOTO_TYPE.mono,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: PHOTO.accent,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px",
        borderRadius: 999,
        border: `1px solid ${PHOTO.accentLine}`,
        background: PHOTO.accentSoft,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: PHOTO.accent,
        }}
      />
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: PHOTO.accent,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Headline({
  children,
  large,
  center,
}: {
  children: ReactNode;
  large?: boolean;
  center?: boolean;
}) {
  const style: Record<string, string | number> = {
    display: "flex",
    justifyContent: center ? "center" : "flex-start",
    fontFamily: PHOTO_TYPE.display,
    fontSize: large ? 56 : 42,
    fontWeight: 700,
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
    color: PHOTO.fg,
    marginBottom: 16,
    textAlign: center ? "center" : "left",
  };
  if (center) style.maxWidth = 960;
  return <div style={style}>{children}</div>;
}

function Title({ children, center }: { children: ReactNode; center?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: center ? "center" : "flex-start",
        fontFamily: PHOTO_TYPE.display,
        fontSize: 48,
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        color: PHOTO.fg,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </div>
  );
}

function Body({
  children,
  dim,
  center,
}: {
  children: ReactNode;
  dim?: boolean;
  center?: boolean;
}) {
  if (!children) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: center ? "center" : "flex-start",
        fontFamily: PHOTO_TYPE.body,
        fontSize: 20,
        fontWeight: 400,
        lineHeight: 1.45,
        color: dim ? PHOTO.faint : PHOTO.muted,
        maxWidth: 820,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </div>
  );
}

function AccentRule({ width = 64 }: { width?: number }) {
  return (
    <div
      style={{
        width,
        height: 3,
        borderRadius: 2,
        background: PHOTO.accent,
        marginBottom: 18,
      }}
    />
  );
}

function StatCell({
  value,
  label,
  featured,
}: {
  value: string;
  label: string;
  featured?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: featured ? "28px 24px" : "20px 18px",
        borderRadius: 16,
        border: `1px solid ${featured ? PHOTO.accentLine : PHOTO.cardBorder}`,
        background: featured ? PHOTO.accentDim : PHOTO.cardBg,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.display,
          fontSize: featured ? 64 : 36,
          fontWeight: 700,
          color: PHOTO.accent,
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: PHOTO.faint,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function CardCell({
  title,
  subtitle,
  detail,
  gold,
  flex = 1,
}: {
  title: string;
  subtitle?: string;
  detail?: string;
  gold?: boolean;
  flex?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex,
        minWidth: 0,
        padding: "18px 16px",
        borderRadius: 14,
        border: `1px solid ${gold ? PHOTO.accentLine : PHOTO.cardBorder}`,
        background: gold ? PHOTO.accentDim : PHOTO.cardBg,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 18,
          fontWeight: 700,
          color: gold ? PHOTO.accent : PHOTO.fg,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.body,
            fontSize: 14,
            color: PHOTO.muted,
            lineHeight: 1.35,
            marginBottom: detail ? 6 : 0,
          }}
        >
          {subtitle}
        </div>
      ) : null}
      {detail ? (
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 12,
            color: PHOTO.faint,
          }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function CheckItem({ text, index }: { text: string; index: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `1px solid ${PHOTO.accentLine}`,
          background: PHOTO.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 11,
          fontWeight: 600,
          color: PHOTO.accent,
          flexShrink: 0,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.body,
          fontSize: 18,
          color: PHOTO.fg,
          lineHeight: 1.35,
          flex: 1,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function CornerBracket({
  top,
  left,
}: {
  top?: boolean;
  left?: boolean;
}) {
  const style: Record<string, string | number> = {
    position: "absolute",
    width: 22,
    height: 22,
  };
  if (top) {
    style.top = 20;
    style.borderTop = `2px solid ${PHOTO.accentLine}`;
  } else {
    style.bottom = 20;
    style.borderBottom = `2px solid ${PHOTO.accentLine}`;
  }
  if (left) {
    style.left = 20;
    style.borderLeft = `2px solid ${PHOTO.accentLine}`;
  } else {
    style.right = 20;
    style.borderRight = `2px solid ${PHOTO.accentLine}`;
  }
  return <div style={style} />;
}

/* ── Canvas shell ───────────────────────────────────────────── */

function PhotoCanvas({
  role,
  logoSrc,
  children,
  hideBrand,
  hideFooter,
}: {
  role: PostPhotoCardRole;
  logoSrc: string;
  children: ReactNode;
  hideBrand?: boolean;
  hideFooter?: boolean;
}) {
  const tint = getRoleTint(role);

  return (
    <div
      style={{
        width: PHOTO_SIZE.width,
        height: PHOTO_SIZE.height,
        display: "flex",
        flexDirection: "column",
        background: PHOTO.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 520,
          height: 520,
          borderRadius: 999,
          background: `radial-gradient(circle, ${tint} 0%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -100,
          width: 480,
          height: 480,
          borderRadius: 999,
          background: `radial-gradient(circle, ${PHOTO.accentDim} 0%, transparent 70%)`,
        }}
      />
      {/* Subtle top gold rule */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${PHOTO.accent} 40%, ${PHOTO.accent} 60%, transparent 100%)`,
        }}
      />

      <CornerBracket top left />
      <CornerBracket top />
      <CornerBracket left />
      <CornerBracket />

      {!hideBrand ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingTop: PHOTO_SIZE.padY,
            paddingLeft: PHOTO_SIZE.padX,
            paddingRight: PHOTO_SIZE.padX,
            height: PHOTO_SIZE.brandH + PHOTO_SIZE.padY,
          }}
        >
          <img
            src={logoSrc}
            width={36}
            height={36}
            style={{ borderRadius: 10, objectFit: "cover" }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: PHOTO_TYPE.display,
              fontSize: 18,
              fontWeight: 700,
              color: PHOTO.fg,
              letterSpacing: "-0.01em",
            }}
          >
            Syra
          </div>
        </div>
      ) : (
        <div style={{ height: PHOTO_SIZE.padY }} />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingLeft: PHOTO_SIZE.padX,
          paddingRight: PHOTO_SIZE.padX,
          paddingBottom: hideFooter ? PHOTO_SIZE.padY : 8,
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {!hideFooter ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: PHOTO_SIZE.padX,
            paddingRight: PHOTO_SIZE.padX,
            paddingBottom: PHOTO_SIZE.padY - 8,
            height: PHOTO_SIZE.footerH + PHOTO_SIZE.padY - 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: PHOTO.accent,
            }}
          >
            syraa.fun
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: PHOTO.faint,
            }}
          >
            Ship log
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Role layouts ───────────────────────────────────────────── */

function CoverLayout({
  content,
  logoSrc,
  assets,
}: {
  content: PostPhotoContent;
  logoSrc: string;
  assets: Assets;
}) {
  const hasPartner = Boolean(content.partnerName && content.partnerLogo && assets[content.partnerLogo]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <Kicker>{content.eyebrow || "Ship log"}</Kicker>
      <Badge text={content.badge} />
      {hasPartner ? (
        <PartnershipExtras content={content} assets={assets} />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            marginBottom: 18,
            marginTop: 8,
          }}
        >
          <img
            src={logoSrc}
            width={72}
            height={72}
            style={{ borderRadius: 18, objectFit: "cover" }}
          />
          <Title center>{content.title}</Title>
        </div>
      )}
      {hasPartner ? (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <Title center>{content.title}</Title>
        </div>
      ) : null}
      <Body center>{content.subtitle}</Body>
    </div>
  );
}

function ThesisLayout({ content }: { content: PostPhotoContent }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        alignItems: "center",
        gap: 36,
      }}
    >
      <div
        style={{
          width: 6,
          height: "70%",
          borderRadius: 4,
          background: `linear-gradient(180deg, ${PHOTO.accent} 0%, transparent 100%)`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Kicker>{content.kicker || "Thesis"}</Kicker>
        <Headline large>{content.headline}</Headline>
        <Body>{content.body}</Body>
      </div>
    </div>
  );
}

function QuoteLayout({ content }: { content: PostPhotoContent }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Kicker>{content.kicker || "Quote"}</Kicker>
      <div
        style={{
          fontFamily: PHOTO_TYPE.display,
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.25,
          color: PHOTO.fg,
          marginBottom: 20,
          borderLeft: `4px solid ${PHOTO.accent}`,
          paddingLeft: 28,
        }}
      >
        {`“${content.quote}”`}
      </div>
      <Body>{content.narrative}</Body>
    </div>
  );
}

function FlowLayout({ content }: { content: PostPhotoContent }) {
  const steps = content.steps.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "How it works"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 12,
          marginTop: 8,
          width: "100%",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={step.step}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: PHOTO.accentSoft,
                  border: `1px solid ${PHOTO.accentLine}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: PHOTO_TYPE.mono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: PHOTO.accent,
                }}
              >
                {step.step || String(i + 1)}
              </div>
              {i < steps.length - 1 ? (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: PHOTO.accentLine,
                    marginRight: -12,
                  }}
                />
              ) : null}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.display,
                fontSize: 16,
                fontWeight: 700,
                color: PHOTO.fg,
                marginBottom: 4,
              }}
            >
              {step.title}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.body,
                fontSize: 13,
                color: PHOTO.muted,
                lineHeight: 1.35,
              }}
            >
              {step.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineLayout({ content }: { content: PostPhotoContent }) {
  const steps = content.steps.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Timeline"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {steps.map((step) => (
          <div
            key={step.step}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 28,
                borderRadius: 8,
                background: PHOTO.accentSoft,
                border: `1px solid ${PHOTO.accentLine}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 11,
                fontWeight: 600,
                color: PHOTO.accent,
                flexShrink: 0,
              }}
            >
              {step.step}
            </div>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  fontFamily: PHOTO_TYPE.display,
                  fontSize: 18,
                  fontWeight: 700,
                  color: PHOTO.fg,
                  marginBottom: 2,
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontFamily: PHOTO_TYPE.body,
                  fontSize: 14,
                  color: PHOTO.muted,
                  lineHeight: 1.35,
                }}
              >
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PillarsLayout({ content }: { content: PostPhotoContent }) {
  const cards = content.cards.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Pillars"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "row", gap: 12, marginTop: 4 }}>
        {cards.map((card) => (
          <CardCell
            key={card.title}
            title={card.title}
            subtitle={card.subtitle}
            detail={card.detail}
            gold={card.accent === "gold"}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistLayout({ content }: { content: PostPhotoContent }) {
  const items = content.highlights.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Live now"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
        {items.map((item, i) => (
          <CheckItem key={item} text={item} index={i} />
        ))}
      </div>
    </div>
  );
}

function MetricsLayout({ content }: { content: PostPhotoContent }) {
  const stats = content.stats.slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Metrics"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "row", gap: 14, marginTop: 4 }}>
        {stats.map((stat) => (
          <StatCell key={stat.label} value={stat.value} label={stat.label} />
        ))}
      </div>
      {content.narrative ? (
        <div style={{ display: "flex", marginTop: 16 }}>
          <Body>{content.narrative}</Body>
        </div>
      ) : null}
    </div>
  );
}

function FeaturedLayout({ content }: { content: PostPhotoContent }) {
  const stat = content.stats[0];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        alignItems: "center",
        gap: 40,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1.1 }}>
        <Kicker>{content.kicker || "Featured"}</Kicker>
        <Headline>{content.headline}</Headline>
        <Body>{content.narrative || content.body}</Body>
      </div>
      {stat ? (
        <div style={{ display: "flex", width: 320, flexShrink: 0 }}>
          <StatCell value={stat.value} label={stat.label} featured />
        </div>
      ) : null}
    </div>
  );
}

function ComparisonLayout({ content }: { content: PostPhotoContent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Before / now"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "row", gap: 16, marginTop: 4 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "22px 20px",
            borderRadius: 16,
            border: `1px solid ${PHOTO.cardBorder}`,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: PHOTO.faint,
              marginBottom: 10,
            }}
          >
            {content.compareLeft.title}
          </div>
          <Body>{content.compareLeft.body}</Body>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "22px 20px",
            borderRadius: 16,
            border: `1px solid ${PHOTO.accentLine}`,
            background: PHOTO.accentDim,
          }}
        >
          <div
            style={{
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: PHOTO.accent,
              marginBottom: 10,
            }}
          >
            {content.compareRight.title}
          </div>
          <Body>{content.compareRight.body}</Body>
        </div>
      </div>
    </div>
  );
}

function LaunchBrandTile({
  src,
  label,
  solidBg,
}: {
  src: string;
  label: string;
  solidBg?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        width: 140,
      }}
    >
      {/* Outer gold frame */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 80,
          height: 80,
          borderRadius: 20,
          border: `1px solid ${PHOTO.accentLine}`,
          background: "rgba(243,186,47,0.06)",
        }}
      >
        {/* Inner plate with clear inset from the border */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            borderRadius: 14,
            border: `1px solid ${PHOTO.cardBorder}`,
            background: solidBg ? "#ffffff" : "rgba(0,0,0,0.55)",
          }}
        >
          <img
            src={src}
            width={solidBg ? 42 : 52}
            height={solidBg ? 42 : 52}
            style={{
              borderRadius: solidBg ? 8 : 12,
              objectFit: solidBg ? "contain" : "cover",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: PHOTO.faint,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function LaunchLayout({
  content,
  assets,
}: {
  content: PostPhotoContent;
  assets: Assets;
}) {
  const logoSrc = assets[LOGO_PATH] ?? "";
  const partnerSrc =
    content.partnerLogo && assets[content.partnerLogo]
      ? assets[content.partnerLogo]
      : "";
  const hasPartner = Boolean(content.partnerName && partnerSrc);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {hasPartner ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            marginBottom: 22,
          }}
        >
          <LaunchBrandTile src={logoSrc} label="Syra" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 999,
              border: `1px solid ${PHOTO.accentLine}`,
              background: "rgba(0,0,0,0.4)",
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 13,
              fontWeight: 600,
              color: PHOTO.accent,
              marginBottom: 22,
            }}
          >
            ×
          </div>
          <LaunchBrandTile
            src={partnerSrc}
            label={content.partnerName}
            solidBg={content.partnerLogoSolidBg}
          />
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: 20,
              border: `1px solid ${PHOTO.accentLine}`,
              background: "rgba(243,186,47,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 60,
                height: 60,
                borderRadius: 14,
                border: `1px solid ${PHOTO.cardBorder}`,
                background: "rgba(0,0,0,0.55)",
              }}
            >
              <img
                src={logoSrc}
                width={52}
                height={52}
                style={{
                  borderRadius: 12,
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          marginBottom: 16,
        }}
      >
        <AccentRule width={48} />
      </div>

      <Badge text={content.badge} />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 42,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: "-0.025em",
          color: PHOTO.fg,
          textAlign: "center",
          marginBottom: 14,
          maxWidth: 880,
        }}
      >
        {content.headline}
      </div>

      {content.body || content.subtitle ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontFamily: PHOTO_TYPE.body,
            fontSize: 17,
            fontWeight: 400,
            lineHeight: 1.45,
            color: PHOTO.muted,
            textAlign: "center",
            maxWidth: 680,
          }}
        >
          {content.body || content.subtitle}
        </div>
      ) : null}
    </div>
  );
}

function DeepDiveLayout({ content }: { content: PostPhotoContent }) {
  const items = (content.items.length ? content.items : content.highlights).slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Deep dive"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {items.map((item, i) => (
          <div
            key={item}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: "10px 14px",
              borderRadius: 12,
              border: `1px solid ${PHOTO.cardBorder}`,
              background: PHOTO.cardBg,
            }}
          >
            <div
              style={{
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 13,
                fontWeight: 600,
                color: PHOTO.accent,
                width: 28,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.body,
                fontSize: 17,
                color: PHOTO.fg,
                flex: 1,
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitLayout({ content }: { content: PostPhotoContent }) {
  const highlights = content.highlights.slice(0, 3);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        gap: 36,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1.15 }}>
        <Badge text={content.badge} />
        <Headline>{content.headline}</Headline>
        <Body>{content.body}</Body>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 0.85,
          gap: 10,
          padding: "20px 18px",
          borderRadius: 16,
          border: `1px solid ${PHOTO.cardBorder}`,
          background: PHOTO.cardBg,
        }}
      >
        {highlights.map((item, i) => (
          <CheckItem key={item} text={item} index={i} />
        ))}
      </div>
    </div>
  );
}

function TerminalLayout({ content }: { content: PostPhotoContent }) {
  const lines = content.terminalLines.slice(0, 8);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 16,
          border: `1px solid ${PHOTO.cardBorder}`,
          background: "rgba(0,0,0,0.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: `1px solid ${PHOTO.cardBorder}`,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ff5f56" }} />
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#27c93f" }} />
          <div
            style={{
              marginLeft: 12,
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 12,
              color: PHOTO.faint,
              letterSpacing: "0.08em",
            }}
          >
            syra · terminal
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "20px 22px",
            gap: 6,
          }}
        >
          {lines.map((line) => (
            <div
              key={line}
              style={{
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 16,
                color: line.startsWith("$") || line.startsWith(">") ? PHOTO.accent : PHOTO.fg,
                lineHeight: 1.45,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaLayout({ content }: { content: PostPhotoContent }) {
  const links = content.links.slice(0, 4);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <AccentRule width={96} />
      <Headline large center>
        {content.headline}
      </Headline>
      <Body center>{content.subtitle || content.body}</Body>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 22,
          justifyContent: "center",
        }}
      >
        {links.map((link) => (
          <div
            key={link.label}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "12px 18px",
              borderRadius: 12,
              border: `1px solid ${PHOTO.accentLine}`,
              background: PHOTO.accentDim,
              minWidth: 160,
            }}
          >
            <div
              style={{
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: PHOTO.accent,
                marginBottom: 4,
              }}
            >
              {link.label}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.body,
                fontSize: 15,
                color: PHOTO.fg,
              }}
            >
              {link.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnershipExtras({
  content,
  assets,
}: {
  content: PostPhotoContent;
  assets: Assets;
}) {
  if (!content.partnerName || !content.partnerLogo) return null;
  const partnerSrc = assets[content.partnerLogo];
  const logoSrc = assets[LOGO_PATH];
  if (!partnerSrc || !logoSrc) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        marginBottom: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <img
          src={logoSrc}
          width={52}
          height={52}
          style={{ borderRadius: 14, objectFit: "cover" }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.display,
            fontSize: 18,
            fontWeight: 700,
            color: PHOTO.fg,
          }}
        >
          Syra
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 999,
          border: `1px solid ${PHOTO.accentLine}`,
          background: PHOTO.accentSoft,
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 14,
          color: PHOTO.accent,
          fontWeight: 600,
        }}
      >
        ×
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <img
          src={partnerSrc}
          width={52}
          height={52}
          style={{
            borderRadius: 14,
            objectFit: content.partnerLogoSolidBg ? "contain" : "cover",
            background: content.partnerLogoSolidBg ? "#ffffff" : "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.display,
            fontSize: 18,
            fontWeight: 700,
            color: PHOTO.fg,
          }}
        >
          {content.partnerName}
        </div>
      </div>
    </div>
  );
}

/* ── Public builder ─────────────────────────────────────────── */

function renderRoleBody(
  role: PostPhotoCardRole,
  content: PostPhotoContent,
  assets: Assets,
): ReactNode {
  const logoSrc = assets[LOGO_PATH] ?? "";

  switch (role) {
    case "cover":
      return <CoverLayout content={content} logoSrc={logoSrc} assets={assets} />;
    case "thesis":
      return <ThesisLayout content={content} />;
    case "quote":
      return <QuoteLayout content={content} />;
    case "flow":
      return <FlowLayout content={content} />;
    case "timeline":
      return <TimelineLayout content={content} />;
    case "pillars":
      return <PillarsLayout content={content} />;
    case "checklist":
      return <ChecklistLayout content={content} />;
    case "metrics":
      return <MetricsLayout content={content} />;
    case "featured":
      return <FeaturedLayout content={content} />;
    case "comparison":
      return <ComparisonLayout content={content} />;
    case "launch":
      return <LaunchLayout content={content} assets={assets} />;
    case "deepDive":
      return <DeepDiveLayout content={content} />;
    case "split":
      return <SplitLayout content={content} />;
    case "terminal":
      return <TerminalLayout content={content} />;
    case "cta":
      return <CtaLayout content={content} />;
    default:
      return (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline>{content.headline || content.title}</Headline>
          <Body>{content.body || content.subtitle}</Body>
        </div>
      );
  }
}

export function buildPhotoTemplate(
  card: PostPhotoCardDef,
  assets: Assets,
): ReactNode {
  const hasPartner = Boolean(card.content.partnerName && card.content.partnerLogo);
  const hideBrand =
    card.role === "cover" ||
    card.role === "cta" ||
    card.role === "launch" ||
    hasPartner;
  const hideFooter = card.role === "cover";
  const logoSrc = assets[LOGO_PATH] ?? "";

  return (
    <PhotoCanvas
      role={card.role}
      logoSrc={logoSrc}
      hideBrand={hideBrand}
      hideFooter={hideFooter}
    >
      {renderRoleBody(card.role, card.content, assets)}
    </PhotoCanvas>
  );
}
