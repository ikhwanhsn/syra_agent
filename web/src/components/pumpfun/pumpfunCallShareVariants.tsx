import { forwardRef } from "react";
import { formatCompactUsd, truncateWallet, type PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import {
  deriveShareCardData,
  EMERALD,
  EMERALD_BORDER,
  EMERALD_BRIGHT,
  EMERALD_DIM,
  EMERALD_MUTED,
  FONT_MONO,
  GLASS_BG,
  GLASS_BORDER,
  GlassBadge,
  IntelCardBackground,
  McapSparkline,
  ShareCardFrame,
  ShareStat,
  TokenAvatar,
} from "@/components/pumpfun/pumpfunCallShareShared";

export interface ShareCardVariantProps {
  record: PumpfunScanRecord;
  className?: string;
}

/** Institutional agent terminal — default premium layout */
export const PumpfunCallShareCardIntel = forwardRef<HTMLDivElement, ShareCardVariantProps>(
  function PumpfunCallShareCardIntel({ record, className }, ref) {
    const d = deriveShareCardData(record);

    return (
      <ShareCardFrame ref={ref} className={className}>
        <IntelCardBackground />
        <div className="relative z-10 flex h-full flex-col" style={{ padding: "40px 52px 36px" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ gap: 16 }}>
              <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.22em", color: EMERALD }}>SYRA</p>
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
              <p
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                Machine Money for Agents
              </p>
            </div>
            <GlassBadge>Agent Terminal</GlassBadge>
          </div>

          <div className="flex flex-1 items-stretch" style={{ gap: 40, marginTop: 28, marginBottom: 16 }}>
            <div
              style={{
                width: 340,
                flexShrink: 0,
                borderRadius: 24,
                border: `1px solid ${GLASS_BORDER}`,
                background: GLASS_BG,
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
              }}
            >
              <TokenAvatar record={record} size={200} radius={32} />
              <div style={{ textAlign: "center", width: "100%" }}>
                <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                  {record.symbol}
                </p>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 16,
                    color: "rgba(255,255,255,0.5)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {record.name}
                </p>
                <div className="flex flex-wrap items-center justify-center" style={{ marginTop: 16, gap: 8 }}>
                  <GlassBadge>Solana</GlassBadge>
                  <GlassBadge>Pump.fun</GlassBadge>
                </div>
                <p
                  style={{
                    marginTop: 16,
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  Agent discovery · {d.scannedDate}
                </p>
              </div>
            </div>

            <div className="relative flex min-w-0 flex-1 flex-col justify-center">
              <div
                className="pointer-events-none absolute"
                aria-hidden
                style={{
                  left: "50%",
                  top: "42%",
                  transform: "translate(-50%, -50%)",
                  width: 520,
                  height: 320,
                  borderRadius: "50%",
                  background: `radial-gradient(ellipse, ${EMERALD_MUTED}, transparent 70%)`,
                }}
              />
              <div className="relative flex flex-col items-center">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    border: `1px solid ${EMERALD_BORDER}`,
                    background: "rgba(52, 211, 153, 0.08)",
                    boxShadow: `0 0 24px rgba(52,211,153,0.15)`,
                    padding: "10px 22px",
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: EMERALD_BRIGHT,
                  }}
                >
                  <span style={{ color: EMERALD }}>✓</span>
                  {d.statusBadge}
                </div>
                <p
                  style={{
                    marginTop: 20,
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  Alpha Captured
                </p>
                <div className="flex items-end" style={{ marginTop: 4, lineHeight: 1 }}>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 300,
                      fontWeight: 800,
                      letterSpacing: "-0.06em",
                      color: "#FFFFFF",
                      textShadow: `0 0 80px rgba(52,211,153,0.35)`,
                    }}
                  >
                    {d.multiplierDisplay}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 120,
                      fontWeight: 800,
                      marginBottom: 44,
                      color: EMERALD,
                    }}
                  >
                    ×
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 40,
                    fontWeight: 800,
                    color: EMERALD_BRIGHT,
                  }}
                >
                  {d.percentGain}
                </p>
                {d.mcapSteps.length >= 2 ? (
                  <div
                    className="flex items-center"
                    style={{
                      marginTop: 28,
                      gap: 24,
                      borderRadius: 16,
                      border: `1px solid ${GLASS_BORDER}`,
                      background: "rgba(0,0,0,0.4)",
                      padding: "18px 28px",
                    }}
                  >
                    <div className="flex flex-col" style={{ gap: 10 }}>
                      {d.mcapSteps.map((step, i) => (
                        <div key={step.label} className="flex items-center" style={{ gap: 12 }}>
                          <span
                            style={{
                              fontFamily: FONT_MONO,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.3)",
                              width: 52,
                            }}
                          >
                            {step.label}
                          </span>
                          <span
                            style={{
                              fontFamily: FONT_MONO,
                              fontSize: i === d.mcapSteps.length - 1 ? 22 : 17,
                              fontWeight: i === d.mcapSteps.length - 1 ? 800 : 600,
                              color:
                                i === d.mcapSteps.length - 1 ? EMERALD_BRIGHT : "rgba(255,255,255,0.65)",
                            }}
                          >
                            {formatCompactUsd(step.value)}
                          </span>
                          {i < d.mcapSteps.length - 1 ? (
                            <span style={{ color: EMERALD_DIM, opacity: 0.6 }}>↓</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <McapSparkline steps={d.mcapSteps} width={140} height={80} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 20,
              border: `1px solid ${GLASS_BORDER}`,
              background: GLASS_BG,
              padding: "24px 20px",
            }}
          >
            <div className="flex items-center">
              <ShareStat label="Entry" value={formatCompactUsd(record.scanMarketCapUsd)} />
              <div style={{ width: 1, height: 52, background: "rgba(255,255,255,0.07)" }} />
              <ShareStat label="Peak" value={formatCompactUsd(record.peakMarketCapUsd)} accent={EMERALD_BRIGHT} />
              <div style={{ width: 1, height: 52, background: "rgba(255,255,255,0.07)" }} />
              <ShareStat label="Current" value={formatCompactUsd(record.currentMarketCapUsd)} accent="rgba(255,255,255,0.9)" />
              <div style={{ width: 1, height: 52, background: "rgba(255,255,255,0.07)" }} />
              <ShareStat label="Confidence" value={`${record.syraAlphaScore}/100`} accent={EMERALD} />
            </div>
            {record.syraAlphaVerdict ? (
              <p
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  textAlign: "center",
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Agent conviction · {record.syraAlphaVerdict}
              </p>
            ) : null}
          </div>

          <div style={{ marginTop: 22, textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
              Agent discovered {record.symbol} before the market.
            </p>
            <p style={{ marginTop: 8, fontSize: 15, color: "rgba(255,255,255,0.4)" }}>
              Machine-generated alpha. Human-verified conviction.
            </p>
            <p style={{ marginTop: 16, fontFamily: FONT_MONO, fontSize: 13, color: EMERALD_DIM }}>
              syra.ai/pumpfun
            </p>
          </div>
        </div>
      </ShareCardFrame>
    );
  },
);

/** Dense monospace terminal feed */
export const PumpfunCallShareCardTerminal = forwardRef<HTMLDivElement, ShareCardVariantProps>(
  function PumpfunCallShareCardTerminal({ record, className }, ref) {
    const d = deriveShareCardData(record);

    return (
      <ShareCardFrame ref={ref} className={className} innerRadius={8} borderColor="rgba(52,211,153,0.35)">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            opacity: 0.12,
            backgroundImage:
              "linear-gradient(rgba(52,211,153,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="relative z-10 flex h-full flex-col"
          style={{ padding: "36px 44px", fontFamily: FONT_MONO }}
        >
          <p style={{ fontSize: 12, letterSpacing: "0.2em", color: EMERALD }}>
            [ SYRA AGENT TERMINAL v2.1 ]
          </p>
          <p style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            MACHINE MONEY FOR AGENTS · PUMPFUN ALPHA FEED
          </p>

          <div
            style={{
              marginTop: 28,
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            <div style={{ border: `1px solid ${EMERALD_BORDER}`, padding: 24, background: "rgba(0,0,0,0.5)" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>ASSET</p>
              <div className="flex items-center" style={{ marginTop: 16, gap: 16 }}>
                <TokenAvatar record={record} size={88} radius={12} />
                <div>
                  <p style={{ fontSize: 28, fontWeight: 800 }}>${record.symbol}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{record.name}</p>
                </div>
              </div>
              <div style={{ marginTop: 20, fontSize: 12, lineHeight: 2, color: "rgba(255,255,255,0.55)" }}>
                <p>CHAIN ······ SOLANA</p>
                <p>PLATFORM · PUMP.FUN</p>
                <p>DISCOVERED {d.scannedDate.toUpperCase()}</p>
                <p>STATUS ··· {d.statusBadge}</p>
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${EMERALD_BORDER}`,
                padding: 24,
                background: "rgba(52,211,153,0.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)" }}>
                RETURN GENERATED
              </p>
              <div className="flex items-end" style={{ marginTop: 8, lineHeight: 1 }}>
                <span style={{ fontSize: 200, fontWeight: 800, color: EMERALD_BRIGHT }}>{d.multiplierDisplay}</span>
                <span style={{ fontSize: 72, fontWeight: 800, marginBottom: 28, color: EMERALD }}>×</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: EMERALD }}>{d.percentGain}</p>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              border: `1px solid ${EMERALD_BORDER}`,
              padding: "20px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              fontSize: 12,
            }}
          >
            {[
              ["ENTRY", formatCompactUsd(record.scanMarketCapUsd)],
              ["PEAK", formatCompactUsd(record.peakMarketCapUsd)],
              ["CURRENT", formatCompactUsd(record.currentMarketCapUsd)],
              ["CONFIDENCE", `${record.syraAlphaScore}/100`],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>{label}</p>
                <p style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: EMERALD_BRIGHT }}>{value}</p>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            {truncateWallet(record.callerWallet, 6)} · syra.ai/pumpfun · NFA
          </p>
        </div>
      </ShareCardFrame>
    );
  },
);

/** Centered mega gain — X screenshot optimized */
export const PumpfunCallShareCardHero = forwardRef<HTMLDivElement, ShareCardVariantProps>(
  function PumpfunCallShareCardHero({ record, className }, ref) {
    const d = deriveShareCardData(record);

    return (
      <ShareCardFrame ref={ref} className={className}>
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `radial-gradient(ellipse 70% 55% at 50% 42%, ${EMERALD_MUTED}, transparent 70%)`,
          }}
        />
        <div
          className="relative z-10 flex h-full flex-col items-center justify-between"
          style={{ padding: "48px 56px 40px", textAlign: "center" }}
        >
          <div className="flex w-full items-center justify-between">
            <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", color: EMERALD }}>SYRA</p>
            <GlassBadge>{d.statusBadge}</GlassBadge>
          </div>

          <div className="flex flex-col items-center" style={{ gap: 24 }}>
            <TokenAvatar record={record} size={140} radius={28} />
            <div>
              <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>${record.symbol}</p>
              <p style={{ marginTop: 6, fontSize: 17, color: "rgba(255,255,255,0.5)" }}>{record.name}</p>
            </div>

            <div>
              <p
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Alpha Captured
              </p>
              <div className="flex items-end justify-center" style={{ marginTop: 8, lineHeight: 1 }}>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 340,
                    fontWeight: 800,
                    letterSpacing: "-0.06em",
                    color: "#FFFFFF",
                    textShadow: `0 0 100px rgba(52,211,153,0.4)`,
                  }}
                >
                  {d.multiplierDisplay}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 130,
                    fontWeight: 800,
                    marginBottom: 48,
                    color: EMERALD,
                  }}
                >
                  ×
                </span>
              </div>
              <p style={{ fontFamily: FONT_MONO, fontSize: 44, fontWeight: 800, color: EMERALD_BRIGHT }}>
                {d.percentGain}
              </p>
              <p
                style={{
                  marginTop: 16,
                  fontFamily: FONT_MONO,
                  fontSize: 20,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {formatCompactUsd(record.scanMarketCapUsd)} → {formatCompactUsd(record.peakMarketCapUsd)}
              </p>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            <div className="flex items-center" style={{ gap: 0 }}>
              <ShareStat label="Entry" value={formatCompactUsd(record.scanMarketCapUsd)} valueSize={26} />
              <ShareStat label="Peak" value={formatCompactUsd(record.peakMarketCapUsd)} accent={EMERALD_BRIGHT} valueSize={26} />
              <ShareStat label="Score" value={`${record.syraAlphaScore}`} accent={EMERALD} valueSize={26} />
            </div>
            <p style={{ marginTop: 20, fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
              Agent discovered {record.symbol} before the market.
            </p>
            <p style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 13, color: EMERALD_DIM }}>
              syra.ai/pumpfun
            </p>
          </div>
        </div>
      </ShareCardFrame>
    );
  },
);

/** Clean minimal split layout */
export const PumpfunCallShareCardClassic = forwardRef<HTMLDivElement, ShareCardVariantProps>(
  function PumpfunCallShareCardClassic({ record, className }, ref) {
    const d = deriveShareCardData(record);

    return (
      <ShareCardFrame ref={ref} className={className} innerRadius={28}>
        <div className="relative z-10 flex h-full flex-col" style={{ padding: "44px 52px 36px" }}>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.2em", color: EMERALD }}>SYRA</p>
            <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>
              PUMPFUN ALPHA
            </p>
          </div>

          <div className="flex flex-1 items-center" style={{ gap: 48, marginTop: 32, marginBottom: 24 }}>
            <div className="flex flex-col items-center" style={{ width: 300, gap: 20 }}>
              <TokenAvatar record={record} size={180} radius={28} />
              <p style={{ fontSize: 44, fontWeight: 800 }}>${record.symbol}</p>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)" }}>{record.name}</p>
              <p style={{ fontFamily: FONT_MONO, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                Called {d.scannedDate}
              </p>
            </div>

            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.08)" }} />

            <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
              <p
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Return Generated
              </p>
              <div className="flex items-end" style={{ marginTop: 8, lineHeight: 1 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 260, fontWeight: 800, letterSpacing: "-0.05em" }}>
                  {d.multiplierDisplay}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 100,
                    fontWeight: 800,
                    marginBottom: 36,
                    color: EMERALD,
                  }}
                >
                  ×
                </span>
              </div>
              <p style={{ fontFamily: FONT_MONO, fontSize: 36, fontWeight: 700, color: EMERALD_BRIGHT }}>
                {d.percentGain}
              </p>
              <p
                style={{
                  marginTop: 16,
                  fontFamily: FONT_MONO,
                  fontSize: 18,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {formatCompactUsd(record.scanMarketCapUsd)} → {formatCompactUsd(record.peakMarketCapUsd)}
              </p>
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${GLASS_BORDER}`,
              background: GLASS_BG,
              padding: "22px 16px",
            }}
          >
            <div className="flex items-center">
              <ShareStat label="Entry" value={formatCompactUsd(record.scanMarketCapUsd)} valueSize={28} />
              <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.07)" }} />
              <ShareStat label="Peak" value={formatCompactUsd(record.peakMarketCapUsd)} accent={EMERALD_BRIGHT} valueSize={28} />
              <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.07)" }} />
              <ShareStat label="Current" value={formatCompactUsd(record.currentMarketCapUsd)} valueSize={28} />
              <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.07)" }} />
              <ShareStat label="Confidence" value={`${record.syraAlphaScore}/100`} accent={EMERALD} valueSize={28} />
            </div>
          </div>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 20, fontWeight: 600 }}>
            I called ${record.symbol} on Syra —{" "}
            <span style={{ color: EMERALD }}>syra.ai/pumpfun</span>
          </p>
        </div>
      </ShareCardFrame>
    );
  },
);

/** Vertical mcap bars + signal badge */
export const PumpfunCallShareCardSignal = forwardRef<HTMLDivElement, ShareCardVariantProps>(
  function PumpfunCallShareCardSignal({ record, className }, ref) {
    const d = deriveShareCardData(record);
    const maxMcap = Math.max(
      record.scanMarketCapUsd ?? 0,
      record.peakMarketCapUsd ?? 0,
      record.currentMarketCapUsd ?? 0,
      1,
    );

    return (
      <ShareCardFrame ref={ref} className={className}>
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background: `radial-gradient(ellipse 50% 60% at 80% 50%, ${EMERALD_MUTED}, transparent 65%)`,
          }}
        />
        <div className="relative z-10 flex h-full" style={{ padding: "40px 48px", gap: 40 }}>
          <div className="flex flex-col" style={{ width: 380, justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.2em", color: EMERALD }}>SYRA</p>
              <p
                style={{
                  marginTop: 6,
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                AGENT SIGNAL · PUMPFUN
              </p>
            </div>

            <div className="flex items-center" style={{ gap: 24 }}>
              <TokenAvatar record={record} size={120} radius={24} />
              <div>
                <p style={{ fontSize: 36, fontWeight: 800 }}>${record.symbol}</p>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{record.name}</p>
                <div className="flex" style={{ marginTop: 12, gap: 8 }}>
                  <GlassBadge>Solana</GlassBadge>
                  <GlassBadge>Pump.fun</GlassBadge>
                </div>
              </div>
            </div>

            <div>
              <p style={{ fontFamily: FONT_MONO, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                {d.scannedDate} · {truncateWallet(record.callerWallet, 4)}
              </p>
              <p style={{ marginTop: 20, fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                Machine-generated alpha.
              </p>
              <p style={{ marginTop: 6, fontFamily: FONT_MONO, fontSize: 13, color: EMERALD_DIM }}>
                syra.ai/pumpfun
              </p>
            </div>
          </div>

          <div
            className="flex min-w-0 flex-1 flex-col"
            style={{
              borderRadius: 24,
              border: `1px solid ${GLASS_BORDER}`,
              background: GLASS_BG,
              padding: "32px 36px",
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                borderRadius: 8,
                border: `1px solid ${EMERALD_BORDER}`,
                background: "rgba(52,211,153,0.1)",
                padding: "8px 14px",
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: EMERALD_BRIGHT,
              }}
            >
              ✓ {d.statusBadge}
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
              <p
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Alpha Captured
              </p>
              <div className="flex items-end" style={{ marginTop: 4, lineHeight: 1 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 220, fontWeight: 800, letterSpacing: "-0.05em" }}>
                  {d.multiplierDisplay}
                </span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 90,
                    fontWeight: 800,
                    marginBottom: 32,
                    color: EMERALD,
                  }}
                >
                  ×
                </span>
              </div>
              <p style={{ fontFamily: FONT_MONO, fontSize: 34, fontWeight: 800, color: EMERALD_BRIGHT }}>
                {d.percentGain}
              </p>

              <div className="flex items-end justify-center" style={{ marginTop: 36, gap: 28, height: 120 }}>
                {[
                  { label: "Entry", value: record.scanMarketCapUsd },
                  { label: "Current", value: record.currentMarketCapUsd },
                  { label: "Peak", value: record.peakMarketCapUsd },
                ].map((bar) => {
                  const h = bar.value != null ? Math.max(12, (bar.value / maxMcap) * 100) : 12;
                  return (
                    <div key={bar.label} className="flex flex-col items-center" style={{ gap: 10 }}>
                      <div
                        style={{
                          width: 48,
                          height: h,
                          borderRadius: 6,
                          background: `linear-gradient(to top, ${EMERALD_DIM}, ${EMERALD_BRIGHT})`,
                          boxShadow: `0 0 20px ${EMERALD_MUTED}`,
                        }}
                      />
                      <p
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        {bar.label}
                      </p>
                      <p style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: EMERALD_BRIGHT }}>
                        {formatCompactUsd(bar.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                borderTop: `1px solid ${GLASS_BORDER}`,
                paddingTop: 20,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: FONT_MONO,
                fontSize: 14,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Agent conviction</span>
              <span style={{ fontWeight: 800, color: EMERALD }}>
                {record.syraAlphaScore}/100
              </span>
            </div>
          </div>
        </div>
      </ShareCardFrame>
    );
  },
);
