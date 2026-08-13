import type { ReactNode } from "react";
import type {
  XLayerCardDef,
  XLayerPillar,
  XLayerStat,
  XLayerStep,
  XLayerWinnerIcon,
} from "@/content/announce/xlayerCards";
import {
  PHOTO,
  PHOTO_SQUARE,
  PHOTO_TYPE,
  PHOTO_XLAYER_DISCLAIMER,
} from "@/components/post/photo/satori/tokens";

type Assets = Record<string, string>;

const LOGO_PATH = "/images/logo.jpg";
const S = PHOTO_SQUARE;

const SURFACE = "radial-gradient(circle at 34% 26%, #2a2a2a 0%, #070707 76%)";
const SURFACE_FLAT = "linear-gradient(155deg, #262626 0%, #0a0a0a 100%)";

/* ── Shared chrome ─────────────────────────────────────────── */

function StudioHeader({ logoSrc, label }: { logoSrc: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: S.padX,
        paddingRight: S.padX,
        paddingTop: 48,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={logoSrc} width={44} height={44} style={{ borderRadius: 10, objectFit: "cover" }} />
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: PHOTO.fg,
          }}
        >
          Syra
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: PHOTO.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function BoxedHeadline({
  lines,
  align = "center",
  size = "lg",
}: {
  lines: string[];
  align?: "center" | "left";
  size?: "md" | "lg" | "xl";
}) {
  const fontSize = size === "xl" ? 84 : size === "md" ? 52 : 66;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 10,
      }}
    >
      {lines.map((line) => (
        <div
          key={line}
          style={{
            display: "flex",
            background: PHOTO.black,
            color: PHOTO.white,
            padding: "10px 24px 15px",
            fontFamily: PHOTO_TYPE.display,
            fontSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function Subtitle({ text, align = "center" }: { text?: string; align?: "center" | "left" }) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 15,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: PHOTO.muted,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function Disclaimer({ align = "center" }: { align?: "center" | "left" }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: align === "center" ? "center" : "flex-start",
        paddingLeft: S.padX,
        paddingRight: S.padX,
        paddingBottom: 30,
      }}
    >
      <div
        style={{
          display: "flex",
          maxWidth: 820,
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: PHOTO.faint,
          textAlign: align,
          lineHeight: 1.5,
        }}
      >
        {PHOTO_XLAYER_DISCLAIMER}
      </div>
    </div>
  );
}

function SquareCanvas({ bgSrc, children }: { bgSrc?: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: S.width,
        height: S.height,
        display: "flex",
        flexDirection: "column",
        background: PHOTO.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {bgSrc ? (
        <img
          src={bgSrc}
          width={S.width}
          height={S.height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: S.width,
            height: S.height,
            objectFit: "cover",
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

/* ── Content modules ───────────────────────────────────────── */

function WinnerOrb({ icon }: { icon: XLayerWinnerIcon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 150 }}>
      <div
        style={{
          display: "flex",
          width: 128,
          height: 128,
          borderRadius: 999,
          background: SURFACE,
          border: "1px solid rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: icon.glyph.length >= 4 ? 24 : icon.glyph.length >= 2 ? 34 : 46,
            fontWeight: 600,
            color: PHOTO.white,
          }}
        >
          {icon.glyph}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: PHOTO.fg,
        }}
      >
        {icon.label}
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: XLayerStat }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8,
        width: 224,
        height: 150,
        padding: "0 26px",
        borderRadius: 20,
        background: SURFACE_FLAT,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 20px 44px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 52,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: PHOTO.white,
          lineHeight: 1,
        }}
      >
        {stat.value}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.62)",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

function PillarCard({ pillar }: { pillar: XLayerPillar }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 16,
        width: 268,
        height: 320,
        padding: 28,
        borderRadius: 22,
        background: SURFACE_FLAT,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 24px 50px rgba(0,0,0,0.24)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.16)",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 32,
          fontWeight: 700,
          color: PHOTO.white,
        }}
      >
        {pillar.glyph}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: PHOTO.white,
        }}
      >
        {pillar.title}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.body,
          fontSize: 18,
          lineHeight: 1.4,
          color: "rgba(255,255,255,0.66)",
        }}
      >
        {pillar.body}
      </div>
    </div>
  );
}

function StepChip({ step, last }: { step: XLayerStep; last: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 12,
          width: 246,
          height: 200,
          padding: 26,
          borderRadius: 22,
          background: SURFACE_FLAT,
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 22px 46px rgba(0,0,0,0.24)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {step.step}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.display,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: PHOTO.white,
          }}
        >
          {step.title}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.body,
            fontSize: 16,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.64)",
          }}
        >
          {step.body}
        </div>
      </div>
      {!last ? (
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.mono,
            fontSize: 30,
            color: PHOTO.fg,
          }}
        >
          {">"}
        </div>
      ) : null}
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        width: 560,
        padding: "16px 22px",
        borderRadius: 16,
        background: "rgba(0,0,0,0.86)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 34,
          height: 34,
          borderRadius: 999,
          background: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: PHOTO_TYPE.display,
          fontSize: 20,
          fontWeight: 700,
          color: "#000000",
          flexShrink: 0,
        }}
      >
        {"+"}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.body,
          fontSize: 20,
          fontWeight: 600,
          color: PHOTO.white,
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ComparePanel({
  title,
  body,
  dim,
}: {
  title: string;
  body: string;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 16,
        width: 392,
        height: 340,
        padding: 32,
        borderRadius: 24,
        background: dim
          ? "linear-gradient(155deg, #1c1c1c 0%, #050505 100%)"
          : SURFACE_FLAT,
        border: dim
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 26px 54px rgba(0,0,0,0.26)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.mono,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: dim ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.7)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: PHOTO_TYPE.body,
          fontSize: 24,
          lineHeight: 1.42,
          color: dim ? "rgba(255,255,255,0.6)" : PHOTO.white,
        }}
      >
        {body}
      </div>
    </div>
  );
}

/* ── Layouts ───────────────────────────────────────────────── */

function CenteredBody({
  children,
  gap = 44,
  align = "center",
}: {
  children: ReactNode;
  gap?: number;
  align?: "center" | "flex-start";
}) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        width: "100%",
        flexDirection: "column",
        alignItems: align,
        justifyContent: "center",
        gap,
        paddingLeft: S.padX,
        paddingRight: S.padX,
      }}
    >
      {children}
    </div>
  );
}

/** Horizontal row of modules, always centered within the body. */
function Row({ children, gap = 24 }: { children: ReactNode; gap?: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap,
      }}
    >
      {children}
    </div>
  );
}

function ShowcaseLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  const icons = card.winnerIcons ?? [];
  const row1 = icons.slice(0, 3);
  const row2 = icons.slice(3, 6);
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <CenteredBody>
        <BoxedHeadline lines={card.headlineLines} />
        <div style={{ display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
          <Row gap={30}>
            {row1.map((icon) => (
              <WinnerOrb key={icon.id} icon={icon} />
            ))}
          </Row>
          <Row gap={30}>
            {row2.map((icon) => (
              <WinnerOrb key={icon.id} icon={icon} />
            ))}
          </Row>
        </div>
      </CenteredBody>
      <Disclaimer />
    </SquareCanvas>
  );
}

function MetricsLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  const stats = card.stats ?? [];
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <CenteredBody gap={36}>
        <BoxedHeadline lines={card.headlineLines} />
        <Subtitle text={card.subtitle} />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 22,
            width: 470,
            justifyContent: "space-between",
          }}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </CenteredBody>
      <Disclaimer />
    </SquareCanvas>
  );
}

function PillarsLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  const pillars = card.pillars ?? [];
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <CenteredBody gap={40}>
        <BoxedHeadline lines={card.headlineLines} />
        <Row gap={24}>
          {pillars.map((pillar) => (
            <PillarCard key={pillar.title} pillar={pillar} />
          ))}
        </Row>
      </CenteredBody>
      <Disclaimer />
    </SquareCanvas>
  );
}

function FlowLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  const steps = card.steps ?? [];
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <CenteredBody gap={40}>
        <BoxedHeadline lines={card.headlineLines} />
        <Row gap={0}>
          {steps.map((step, i) => (
            <StepChip key={step.step} step={step} last={i === steps.length - 1} />
          ))}
        </Row>
      </CenteredBody>
      <Disclaimer />
    </SquareCanvas>
  );
}

function QuoteLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 30,
          paddingLeft: S.padX,
          paddingRight: S.padX + 40,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.display,
            fontSize: 120,
            fontWeight: 700,
            color: PHOTO.fg,
            lineHeight: 0.7,
          }}
        >
          {"\u201C"}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: PHOTO_TYPE.display,
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: PHOTO.fg,
            maxWidth: 840,
          }}
        >
          {card.quote}
        </div>
        {card.quoteBy ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
            }}
          >
            <div style={{ display: "flex", width: 40, height: 2, background: PHOTO.fg }} />
            <div
              style={{
                display: "flex",
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: PHOTO.muted,
              }}
            >
              {card.quoteBy}
            </div>
          </div>
        ) : null}
      </div>
      <Disclaimer align="left" />
    </SquareCanvas>
  );
}

function ComparisonLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  const compare = card.compare;
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <CenteredBody gap={40}>
        <BoxedHeadline lines={card.headlineLines} />
        {compare ? (
          <Row gap={24}>
            <ComparePanel title={compare.left.title} body={compare.left.body} dim />
            <div
              style={{
                display: "flex",
                fontFamily: PHOTO_TYPE.mono,
                fontSize: 28,
                color: PHOTO.fg,
              }}
            >
              {">"}
            </div>
            <ComparePanel title={compare.right.title} body={compare.right.body} />
          </Row>
        ) : null}
      </CenteredBody>
      <Disclaimer />
    </SquareCanvas>
  );
}

function ChecklistLayout({ card, assets }: { card: XLayerCardDef; assets: Assets }) {
  const logoSrc = assets[LOGO_PATH];
  const items = card.checklist ?? [];
  return (
    <SquareCanvas bgSrc={assets[card.bgImage]}>
      <StudioHeader logoSrc={logoSrc} label={card.topLabel} />
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 30,
          paddingLeft: S.padX,
          paddingRight: S.padX,
        }}
      >
        <BoxedHeadline lines={card.headlineLines} align="left" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item) => (
            <ChecklistItem key={item} text={item} />
          ))}
        </div>
      </div>
      <Disclaimer align="left" />
    </SquareCanvas>
  );
}

export function buildXLayerTemplate(card: XLayerCardDef, assets: Assets): ReactNode {
  switch (card.archetype) {
    case "showcase":
      return <ShowcaseLayout card={card} assets={assets} />;
    case "metrics":
      return <MetricsLayout card={card} assets={assets} />;
    case "pillars":
      return <PillarsLayout card={card} assets={assets} />;
    case "flow":
      return <FlowLayout card={card} assets={assets} />;
    case "quote":
      return <QuoteLayout card={card} assets={assets} />;
    case "comparison":
      return <ComparisonLayout card={card} assets={assets} />;
    case "checklist":
      return <ChecklistLayout card={card} assets={assets} />;
    default:
      return <ShowcaseLayout card={card} assets={assets} />;
  }
}
