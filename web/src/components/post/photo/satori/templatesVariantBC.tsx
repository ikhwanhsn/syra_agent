/**
 * Layout variants B and C for each photo card role.
 * Same PHOTO palette as variant A — structurally different composition only.
 */
import type { ReactNode } from "react";
import type { PostPhotoContent } from "@/content/posts/photo/types";
import {
  PHOTO,
  PHOTO_TYPE,
} from "@/components/post/photo/satori/tokens";

type Assets = Record<string, string>;

const LOGO_PATH = "/images/logo.jpg";

/* ── Shared primitives (mirror templates.tsx) ───────────────── */

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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src={partnerSrc}
          width={52}
          height={52}
          style={{
            borderRadius: 14,
            objectFit: content.partnerLogoSolidBg ? "contain" : "cover",
            background: content.partnerLogoSolidBg
              ? "#ffffff"
              : "rgba(255,255,255,0.06)",
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

/* ── Cover B / C ────────────────────────────────────────────── */

export function CoverLayoutB({
  content,
  logoSrc,
  assets,
}: {
  content: PostPhotoContent;
  logoSrc: string;
  assets: Assets;
}) {
  const hasPartner = Boolean(
    content.partnerName && content.partnerLogo && assets[content.partnerLogo],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
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
            gap: 16,
            marginBottom: 16,
          }}
        >
          <img
            src={logoSrc}
            width={56}
            height={56}
            style={{ borderRadius: 14, objectFit: "cover" }}
          />
          <Title>{content.title}</Title>
        </div>
      )}
      {hasPartner ? <Title>{content.title}</Title> : null}
      <AccentRule width={48} />
      <Body>{content.subtitle}</Body>
    </div>
  );
}

export function CoverLayoutC({
  content,
  logoSrc,
  assets,
}: {
  content: PostPhotoContent;
  logoSrc: string;
  assets: Assets;
}) {
  const hasPartner = Boolean(
    content.partnerName && content.partnerLogo && assets[content.partnerLogo],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "28px 36px",
        borderRadius: 20,
        border: `1px solid ${PHOTO.accentLine}`,
        background: PHOTO.accentDim,
      }}
    >
      <Badge text={content.badge} />
      {hasPartner ? (
        <PartnershipExtras content={content} assets={assets} />
      ) : (
        <img
          src={logoSrc}
          width={64}
          height={64}
          style={{ borderRadius: 16, objectFit: "cover", marginBottom: 16 }}
        />
      )}
      <Title center>{content.title}</Title>
      <div style={{ display: "flex", marginTop: 12 }}>
        <Body center>{content.subtitle}</Body>
      </div>
    </div>
  );
}

/* ── Thesis B / C ───────────────────────────────────────────── */

export function ThesisLayoutB({ content }: { content: PostPhotoContent }) {
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
      <Kicker>{content.kicker || "Thesis"}</Kicker>
      <Headline large center>
        {content.headline}
      </Headline>
      <Body center>{content.body}</Body>
    </div>
  );
}

export function ThesisLayoutC({ content }: { content: PostPhotoContent }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "28px 32px",
        borderRadius: 18,
        border: `1px solid ${PHOTO.cardBorder}`,
        background: PHOTO.cardBg,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 999,
          border: `1px solid ${PHOTO.accentLine}`,
          background: PHOTO.accentSoft,
          alignSelf: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: PHOTO.accent,
          }}
        >
          {content.kicker || "Thesis"}
        </div>
      </div>
      <Headline>{content.headline}</Headline>
      <Body>{content.body}</Body>
    </div>
  );
}

/* ── Quote B / C ────────────────────────────────────────────── */

export function QuoteLayoutB({ content }: { content: PostPhotoContent }) {
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
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 96,
          fontWeight: 700,
          color: PHOTO.accentSoft,
          lineHeight: 0.8,
          marginBottom: 8,
        }}
      >
        “
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.3,
          color: PHOTO.fg,
          textAlign: "center",
          maxWidth: 900,
          marginBottom: 20,
        }}
      >
        {content.quote}
      </div>
      <Body center>{content.narrative}</Body>
    </div>
  );
}

export function QuoteLayoutC({ content }: { content: PostPhotoContent }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "28px 32px",
        borderRadius: 18,
        border: `1px solid ${PHOTO.accentLine}`,
        background: PHOTO.accentDim,
      }}
    >
      <Kicker>{content.kicker || "Quote"}</Kicker>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.3,
          color: PHOTO.fg,
          marginBottom: 18,
        }}
      >
        {`“${content.quote}”`}
      </div>
      <div
        style={{
          display: "flex",
          borderTop: `1px solid ${PHOTO.cardBorder}`,
          paddingTop: 14,
        }}
      >
        <Body>{content.narrative}</Body>
      </div>
    </div>
  );
}

/* ── Flow B / C ─────────────────────────────────────────────── */

export function FlowLayoutB({ content }: { content: PostPhotoContent }) {
  const steps = content.steps.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "How it works"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
        {steps.map((step, i) => (
          <div
            key={step.step}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              padding: "14px 16px",
              borderRadius: 12,
              border: `1px solid ${PHOTO.cardBorder}`,
              background: PHOTO.cardBg,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                background: PHOTO.accentSoft,
                border: `1px solid ${PHOTO.accentLine}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 13,
                fontWeight: 600,
                color: PHOTO.accent,
                flexShrink: 0,
              }}
            >
              {step.step || String(i + 1)}
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

export function FlowLayoutC({ content }: { content: PostPhotoContent }) {
  const steps = content.steps.slice(0, 4);
  const row1 = steps.slice(0, 2);
  const row2 = steps.slice(2, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "How it works"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
        {[row1, row2].map((row, ri) =>
          row.length ? (
            <div
              key={`row-${ri}`}
              style={{ display: "flex", flexDirection: "row", gap: 12, width: "100%" }}
            >
              {row.map((step, i) => (
                <div
                  key={step.step}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                    padding: "16px 14px",
                    borderRadius: 14,
                    border: `1px solid ${PHOTO.cardBorder}`,
                    background: PHOTO.cardBg,
                  }}
                >
                  <div
                    style={{
                      fontFamily: PHOTO_TYPE.mono,
                      fontSize: 12,
                      fontWeight: 600,
                      color: PHOTO.accent,
                      marginBottom: 8,
                    }}
                  >
                    {step.step || String(ri * 2 + i + 1).padStart(2, "0")}
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
          ) : null,
        )}
      </div>
    </div>
  );
}

/* ── Timeline B / C ─────────────────────────────────────────── */

export function TimelineLayoutB({ content }: { content: PostPhotoContent }) {
  const steps = content.steps.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Timeline"}</Kicker>
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
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: PHOTO.accentSoft,
                border: `2px solid ${PHOTO.accentLine}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 12,
                fontWeight: 600,
                color: PHOTO.accent,
                marginBottom: 10,
              }}
            >
              {step.step || String(i + 1)}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.display,
                fontSize: 15,
                fontWeight: 700,
                color: PHOTO.fg,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              {step.title}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.body,
                fontSize: 12,
                color: PHOTO.muted,
                textAlign: "center",
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

export function TimelineLayoutC({ content }: { content: PostPhotoContent }) {
  const steps = content.steps.slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Timeline"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
        {steps.map((step, i) => (
          <div
            key={step.step}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                maxWidth: "78%",
                padding: "12px 16px",
                borderRadius: 12,
                border: `1px solid ${i % 2 === 0 ? PHOTO.accentLine : PHOTO.cardBorder}`,
                background: i % 2 === 0 ? PHOTO.accentDim : PHOTO.cardBg,
              }}
            >
              <div
                style={{
                  fontFamily: PHOTO_TYPE.mono,
                  fontSize: 12,
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
                    fontSize: 16,
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
                    fontSize: 13,
                    color: PHOTO.muted,
                    lineHeight: 1.35,
                  }}
                >
                  {step.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Pillars B / C ──────────────────────────────────────────── */

export function PillarsLayoutB({ content }: { content: PostPhotoContent }) {
  const cards = content.cards.slice(0, 4);
  const row1 = cards.slice(0, 2);
  const row2 = cards.slice(2, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Pillars"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
        {[row1, row2].map((row, ri) =>
          row.length ? (
            <div
              key={`p-row-${ri}`}
              style={{ display: "flex", flexDirection: "row", gap: 12 }}
            >
              {row.map((card) => (
                <CardCell
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  detail={card.detail}
                  gold={card.accent === "gold"}
                />
              ))}
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

export function PillarsLayoutC({ content }: { content: PostPhotoContent }) {
  const cards = content.cards.slice(0, 4);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        gap: 28,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 0.9 }}>
        <Kicker>{content.kicker || "Pillars"}</Kicker>
        <Headline>{content.headline}</Headline>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1.1,
          gap: 10,
        }}
      >
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

/* ── Checklist B / C ────────────────────────────────────────── */

export function ChecklistLayoutB({ content }: { content: PostPhotoContent }) {
  const items = content.highlights.slice(0, 4);
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Live now"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "row", gap: 28, marginTop: 4 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {left.map((item, i) => (
            <CheckItem key={item} text={item} index={i} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          {right.map((item, i) => (
            <CheckItem key={item} text={item} index={mid + i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChecklistLayoutC({ content }: { content: PostPhotoContent }) {
  const items = content.highlights.slice(0, 4);
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
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Kicker>{content.kicker || "Live now"}</Kicker>
        <Headline>{content.headline}</Headline>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "18px 16px",
          borderRadius: 16,
          border: `1px solid ${PHOTO.cardBorder}`,
          background: PHOTO.cardBg,
        }}
      >
        {items.map((item, i) => (
          <CheckItem key={item} text={item} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ── Metrics B / C ──────────────────────────────────────────── */

export function MetricsLayoutB({ content }: { content: PostPhotoContent }) {
  const stats = content.stats.slice(0, 3);
  const featured = stats[0];
  const rest = stats.slice(1);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Metrics"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "row", gap: 14, marginTop: 4 }}>
        {featured ? (
          <div style={{ display: "flex", flex: 1.4 }}>
            <StatCell value={featured.value} label={featured.label} featured />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
          {rest.map((stat) => (
            <StatCell key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
      {content.narrative ? (
        <div style={{ display: "flex", marginTop: 16 }}>
          <Body>{content.narrative}</Body>
        </div>
      ) : null}
    </div>
  );
}

export function MetricsLayoutC({ content }: { content: PostPhotoContent }) {
  const stats = content.stats.slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Metrics"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 0,
          marginTop: 8,
          padding: "20px 8px",
          borderRadius: 16,
          border: `1px solid ${PHOTO.cardBorder}`,
          background: PHOTO.cardBg,
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              alignItems: "center",
              borderRight:
                i < stats.length - 1 ? `1px solid ${PHOTO.cardBorder}` : "none",
              paddingLeft: 12,
              paddingRight: 12,
            }}
          >
            <div
              style={{
                fontFamily: PHOTO_TYPE.display,
                fontSize: 40,
                fontWeight: 700,
                color: PHOTO.accent,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: PHOTO.faint,
              }}
            >
              {stat.label}
            </div>
          </div>
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

/* ── Featured B / C ─────────────────────────────────────────── */

export function FeaturedLayoutB({ content }: { content: PostPhotoContent }) {
  const stat = content.stats[0];
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
      <Kicker>{content.kicker || "Featured"}</Kicker>
      {stat ? (
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.display,
            fontSize: 88,
            fontWeight: 700,
            color: PHOTO.accent,
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          {stat.value}
        </div>
      ) : null}
      {stat ? (
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: PHOTO.faint,
            marginBottom: 20,
          }}
        >
          {stat.label}
        </div>
      ) : null}
      <Headline center>{content.headline}</Headline>
      <Body center>{content.narrative || content.body}</Body>
    </div>
  );
}

export function FeaturedLayoutC({ content }: { content: PostPhotoContent }) {
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
      {stat ? (
        <div style={{ display: "flex", width: 320, flexShrink: 0 }}>
          <StatCell value={stat.value} label={stat.label} featured />
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", flex: 1.1 }}>
        <Kicker>{content.kicker || "Featured"}</Kicker>
        <Headline>{content.headline}</Headline>
        <Body>{content.narrative || content.body}</Body>
      </div>
    </div>
  );
}

/* ── Comparison B / C ───────────────────────────────────────── */

export function ComparisonLayoutB({ content }: { content: PostPhotoContent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Before / now"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "18px 20px",
            borderRadius: 14,
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
              marginBottom: 8,
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
            padding: "18px 20px",
            borderRadius: 14,
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
              marginBottom: 8,
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

export function ComparisonLayoutC({ content }: { content: PostPhotoContent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Before / now"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          marginTop: 4,
        }}
      >
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
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 999,
            border: `1px solid ${PHOTO.accentLine}`,
            background: PHOTO.accentSoft,
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 12,
            fontWeight: 700,
            color: PHOTO.accent,
            flexShrink: 0,
            letterSpacing: "0.06em",
          }}
        >
          VS
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

/* ── Launch B / C ───────────────────────────────────────────── */

export function LaunchLayoutB({
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
            gap: 24,
            marginBottom: 28,
          }}
        >
          <LaunchBrandTile src={logoSrc} label="Syra" />
          <div
            style={{
              display: "flex",
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 20,
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
        <div style={{ display: "flex", marginBottom: 24 }}>
          <LaunchBrandTile src={logoSrc} label="Syra" />
        </div>
      )}
      <Badge text={content.badge} />
      <Headline large center>
        {content.headline}
      </Headline>
      {content.body || content.subtitle ? (
        <Body center>{content.body || content.subtitle}</Body>
      ) : null}
    </div>
  );
}

export function LaunchLayoutC({
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
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <AccentRule width={64} />
      <Badge text={content.badge} />
      {hasPartner ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          <img
            src={logoSrc}
            width={40}
            height={40}
            style={{ borderRadius: 10, objectFit: "cover" }}
          />
          <div
            style={{
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 14,
              color: PHOTO.accent,
            }}
          >
            ×
          </div>
          <img
            src={partnerSrc}
            width={40}
            height={40}
            style={{
              borderRadius: 10,
              objectFit: content.partnerLogoSolidBg ? "contain" : "cover",
              background: content.partnerLogoSolidBg ? "#fff" : "transparent",
            }}
          />
        </div>
      ) : null}
      <Headline>{content.headline}</Headline>
      {content.body || content.subtitle ? (
        <Body>{content.body || content.subtitle}</Body>
      ) : null}
    </div>
  );
}

/* ── Deep dive B / C ────────────────────────────────────────── */

export function DeepDiveLayoutB({ content }: { content: PostPhotoContent }) {
  const items = (content.items.length ? content.items : content.highlights).slice(
    0,
    5,
  );
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Kicker>{content.kicker || "Deep dive"}</Kicker>
      <Headline>{content.headline}</Headline>
      <div style={{ display: "flex", flexDirection: "row", gap: 16, marginTop: 4 }}>
        {[left, right].map((col, ci) => (
          <div
            key={`dd-col-${ci}`}
            style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}
          >
            {col.map((item, i) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
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
                  {String(ci === 0 ? i + 1 : mid + i + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    fontFamily: PHOTO_TYPE.body,
                    fontSize: 16,
                    color: PHOTO.fg,
                    flex: 1,
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeepDiveLayoutC({ content }: { content: PostPhotoContent }) {
  const items = (content.items.length ? content.items : content.highlights).slice(
    0,
    5,
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        gap: 32,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 0.95 }}>
        <Kicker>{content.kicker || "Deep dive"}</Kicker>
        <Headline>{content.headline}</Headline>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1.05,
          gap: 8,
        }}
      >
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
                fontSize: 16,
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

/* ── Split B / C ────────────────────────────────────────────── */

export function SplitLayoutB({ content }: { content: PostPhotoContent }) {
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
      <div style={{ display: "flex", flexDirection: "column", flex: 1.15 }}>
        <Badge text={content.badge} />
        <Headline>{content.headline}</Headline>
        <Body>{content.body}</Body>
      </div>
    </div>
  );
}

export function SplitLayoutC({ content }: { content: PostPhotoContent }) {
  const highlights = content.highlights.slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Badge text={content.badge} />
      <Headline>{content.headline}</Headline>
      <Body>{content.body}</Body>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 12,
          marginTop: 20,
          width: "100%",
        }}
      >
        {highlights.map((item, i) => (
          <div
            key={item}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              padding: "14px 12px",
              borderRadius: 12,
              border: `1px solid ${PHOTO.cardBorder}`,
              background: PHOTO.cardBg,
            }}
          >
            <div
              style={{
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 11,
                fontWeight: 600,
                color: PHOTO.accent,
                marginBottom: 6,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.body,
                fontSize: 15,
                color: PHOTO.fg,
                lineHeight: 1.35,
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

/* ── Terminal B / C ─────────────────────────────────────────── */

function TerminalWindow({
  lines,
  flex,
}: {
  lines: string[];
  flex?: number;
}) {
  const style: Record<string, string | number> = {
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
    border: `1px solid ${PHOTO.cardBorder}`,
    background: "rgba(0,0,0,0.55)",
    overflow: "hidden",
  };
  if (typeof flex === "number") {
    style.flex = flex;
  } else {
    style.width = "100%";
  }

  return (
    <div style={style}>
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
              color:
                line.startsWith("$") || line.startsWith(">")
                  ? PHOTO.accent
                  : PHOTO.fg,
              lineHeight: 1.45,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TerminalLayoutB({ content }: { content: PostPhotoContent }) {
  const lines = content.terminalLines.slice(0, 8);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        alignItems: "center",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", flex: 1.4 }}>
        <TerminalWindow lines={lines} flex={1} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 0.7 }}>
        <Kicker>Terminal</Kicker>
        <Body>
          {content.body ||
            content.narrative ||
            "Run the flow — pay, call, verify."}
        </Body>
      </div>
    </div>
  );
}

export function TerminalLayoutC({ content }: { content: PostPhotoContent }) {
  const lines = content.terminalLines.slice(0, 8);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        padding: "8px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "24px 28px",
          borderRadius: 12,
          border: `1px solid ${PHOTO.cardBorder}`,
          background: "rgba(0,0,0,0.65)",
        }}
      >
        {lines.map((line) => (
          <div
            key={line}
            style={{
              fontFamily: PHOTO_TYPE.mono,
              fontSize: 18,
              color:
                line.startsWith("$") || line.startsWith(">")
                  ? PHOTO.accent
                  : PHOTO.fg,
              lineHeight: 1.5,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CTA B / C ──────────────────────────────────────────────── */

export function CtaLayoutB({ content }: { content: PostPhotoContent }) {
  const links = content.links.slice(0, 4);
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
        <AccentRule width={64} />
        <Headline large>{content.headline}</Headline>
        <Body>{content.subtitle || content.body}</Body>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 0.9,
          gap: 10,
        }}
      >
        {links.map((link) => (
          <div
            key={link.label}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "14px 18px",
              borderRadius: 12,
              border: `1px solid ${PHOTO.accentLine}`,
              background: PHOTO.accentDim,
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

export function CtaLayoutC({ content }: { content: PostPhotoContent }) {
  const links = content.links.slice(0, 4);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "28px 32px",
        borderRadius: 18,
        border: `1px solid ${PHOTO.accentLine}`,
        background: PHOTO.accentDim,
      }}
    >
      <Headline center>{content.headline}</Headline>
      <Body center>{content.subtitle || content.body}</Body>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 20,
          justifyContent: "center",
        }}
      >
        {links.map((link) => (
          <div
            key={link.label}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 999,
              border: `1px solid ${PHOTO.accentLine}`,
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: PHOTO.accent,
              }}
            >
              {link.label}
            </div>
            <div
              style={{
                fontFamily: PHOTO_TYPE.body,
                fontSize: 14,
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
