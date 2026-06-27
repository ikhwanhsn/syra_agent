import { forwardRef } from "react";
import { BadgeCheck, Coins, Share2, Sparkles, Users, Zap } from "lucide-react";

import { formatCompact, formatSol } from "@/lib/kolFormat";
import type { KolCampaign } from "@/lib/kolApi";
import {
  KOL_RANK_SHARE_HEIGHT,
  KOL_RANK_SHARE_WIDTH,
  KOL_SHARE_PUBLIC_LABEL,
} from "@/components/kol/kolRankShareExport";
import { cn } from "@/lib/utils";

export interface KolCampaignEarnShareCardData {
  campaignTitle: string;
  rewardSol: number;
  timeLeft: string;
  participantCount: number;
  status: KolCampaign["status"];
  sourceAuthorHandle?: string | null;
  sourceAuthorVerified?: boolean;
  sourceTweetText?: string;
  topProjectedSol?: number | null;
  shareUrl: string;
}

const ACCENT = "#00cc88";
const ACCENT_GLOW = "rgba(0, 204, 136, 0.42)";
const GOLD = "#f5c542";
const GOLD_GLOW = "rgba(245, 197, 66, 0.35)";

function truncateTweet(text: string, max = 140): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function statusLabel(status: KolCampaign["status"]): string {
  if (status === "active") return "Live now";
  if (status === "completed") return "Completed";
  if (status === "pending_deposit") return "Funding";
  return "Closed";
}

function statusAccent(status: KolCampaign["status"]): string {
  if (status === "active") return ACCENT;
  if (status === "completed") return GOLD;
  return "rgba(255,255,255,0.5)";
}

interface KolCampaignEarnShareCardProps {
  data: KolCampaignEarnShareCardData;
  className?: string;
  previewScale?: number;
}

export const KolCampaignEarnShareCard = forwardRef<HTMLDivElement, KolCampaignEarnShareCardProps>(
  function KolCampaignEarnShareCard({ data, className, previewScale = 1 }, ref) {
    const statusColor = statusAccent(data.status);
    const tweetSnippet = data.sourceTweetText ? truncateTweet(data.sourceTweetText) : null;
    const showTopPayout =
      data.topProjectedSol != null && data.topProjectedSol > 0 && data.participantCount > 0;

    return (
      <div
        className={cn("origin-top-left", className)}
        style={{
          width: KOL_RANK_SHARE_WIDTH * previewScale,
          height: KOL_RANK_SHARE_HEIGHT * previewScale,
        }}
      >
        <div
          ref={ref}
          className="kol-campaign-earn-share-canvas relative overflow-hidden"
          style={{
            width: KOL_RANK_SHARE_WIDTH,
            height: KOL_RANK_SHARE_HEIGHT,
            transform: previewScale !== 1 ? `scale(${previewScale})` : undefined,
            transformOrigin: "top left",
            fontFamily: "'Sora', system-ui, sans-serif",
            background: "#030303",
            color: "#f8fafc",
          }}
        >
          {/* Ambient mesh */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 30%, ${ACCENT_GLOW}, transparent 55%),
                radial-gradient(ellipse 50% 45% at 85% 20%, ${GOLD_GLOW}, transparent 50%),
                radial-gradient(ellipse 60% 50% at 70% 90%, rgba(8,145,178,0.18), transparent 55%)
              `,
            }}
            aria-hidden
          />

          {/* Grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />

          <div className="relative flex h-full flex-col px-16 py-12">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="" width={40} height={40} className="rounded-xl" />
                <div>
                  <p className="text-[15px] font-bold tracking-tight text-white/90">S3 Labs</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
                    KOL Arena
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    borderColor: `${statusColor}55`,
                    backgroundColor: `${statusColor}18`,
                    color: statusColor,
                  }}
                >
                  {statusLabel(data.status)}
                </span>
                {data.timeLeft !== "Ended" && data.timeLeft !== "—" ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold text-white/55">
                    {data.timeLeft}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Hero */}
            <div className="flex flex-1 min-h-0 items-center gap-10 py-8">
              {/* Left — SOL hero */}
              <div className="flex w-[46%] flex-col justify-center">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} color={ACCENT} strokeWidth={2.5} aria-hidden />
                  <p className="text-[13px] font-bold uppercase tracking-[0.42em] text-white/45">
                    KOL reward pool
                  </p>
                </div>

                <div className="mt-6 relative">
                  <p
                    className="font-mono text-[118px] font-black tabular-nums leading-[0.92] tracking-tighter"
                    style={{
                      background: `linear-gradient(165deg, #ffffff 0%, ${ACCENT} 55%, #0891b2 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 48px ${ACCENT_GLOW})`,
                    }}
                  >
                    {formatSol(data.rewardSol, 2)}
                  </p>
                  <p
                    className="mt-2 text-[42px] font-extrabold uppercase tracking-[0.22em]"
                    style={{ color: ACCENT }}
                  >
                    SOL
                  </p>
                </div>

                <p className="mt-8 max-w-[520px] text-[17px] leading-relaxed text-white/48">
                  Reply or quote on X. Engagement score decides your cut of the pool — paid in SOL when
                  the campaign ends.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {["Reply", "Quote", "Earn"].map((step, i) => (
                    <span
                      key={step}
                      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: i === 2 ? `${ACCENT}66` : "rgba(255,255,255,0.1)",
                        backgroundColor: i === 2 ? `${ACCENT}14` : "rgba(255,255,255,0.03)",
                        color: i === 2 ? ACCENT : "rgba(255,255,255,0.55)",
                      }}
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                        style={{
                          backgroundColor: i === 2 ? ACCENT : "rgba(255,255,255,0.08)",
                          color: i === 2 ? "#030303" : "rgba(255,255,255,0.7)",
                        }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — campaign card */}
              <div
                className="flex w-[54%] flex-col overflow-hidden rounded-[24px] border"
                style={{
                  borderColor: "rgba(0, 204, 136, 0.28)",
                  background:
                    "linear-gradient(165deg, rgba(0,204,136,0.1) 0%, rgba(8,12,11,0.92) 38%, rgba(6,6,6,0.98) 100%)",
                  boxShadow: `0 0 0 1px rgba(0,204,136,0.12), 0 32px 100px ${ACCENT_GLOW}, inset 0 1px 0 rgba(255,255,255,0.07)`,
                }}
              >
                <div
                  className="flex items-center justify-between border-b px-8 py-5"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} color={ACCENT} strokeWidth={2.5} aria-hidden />
                    <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/42">
                      Campaign
                    </span>
                  </div>
                  {data.sourceAuthorHandle ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-white/75">
                        @{data.sourceAuthorHandle}
                      </span>
                      {data.sourceAuthorVerified ? (
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <BadgeCheck size={12} color="#030303" strokeWidth={2.5} aria-hidden />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col px-8 py-7">
                  <h1 className="text-[36px] font-extrabold leading-[1.12] tracking-tight text-white">
                    {data.campaignTitle}
                  </h1>

                  {tweetSnippet ? (
                    <div
                      className="mt-6 rounded-2xl border px-6 py-5"
                      style={{
                        borderColor: "rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(0,0,0,0.35)",
                      }}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/32 mb-3">
                        Post to amplify
                      </p>
                      <p className="text-[16px] leading-relaxed text-white/62 line-clamp-4">
                        {tweetSnippet}
                      </p>
                    </div>
                  ) : null}

                  <div
                    className="mt-auto grid grid-cols-3 gap-0 overflow-hidden rounded-2xl border"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {[
                      {
                        icon: Coins,
                        label: "Pool",
                        value: `${formatSol(data.rewardSol)} SOL`,
                        highlight: true,
                      },
                      {
                        icon: Users,
                        label: "KOLs",
                        value: formatCompact(data.participantCount),
                        highlight: false,
                      },
                      {
                        icon: Sparkles,
                        label: showTopPayout ? "Top payout" : "Payout",
                        value: showTopPayout
                          ? `${formatSol(data.topProjectedSol!)} SOL`
                          : "Score-based",
                        highlight: showTopPayout,
                      },
                    ].map((stat, i) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center justify-center px-4 py-5 text-center"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.38)",
                          borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                        }}
                      >
                        <stat.icon
                          size={16}
                          color={stat.highlight ? ACCENT : "rgba(255,255,255,0.35)"}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/32">
                          {stat.label}
                        </p>
                        <p
                          className="mt-1.5 text-[18px] font-bold tabular-nums leading-none"
                          style={{ color: stat.highlight ? ACCENT : "#f8fafc" }}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div
              className="shrink-0 flex items-center gap-6 rounded-2xl border px-8 py-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: ACCENT }}
              >
                <Share2 size={22} color="#030303" strokeWidth={2.5} aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold leading-snug text-white/92">
                  <span style={{ color: ACCENT }}>{formatSol(data.rewardSol)} SOL</span> on the line —
                  join the S3 Labs KOL Arena
                </p>
                <p className="mt-1 text-[13px] text-white/40">
                  Share this card · Bring KOLs · Grow together · {KOL_SHARE_PUBLIC_LABEL}
                </p>
              </div>

              <p className="hidden shrink-0 text-right text-[12px] font-semibold leading-relaxed text-white/35 sm:block">
                #S3Labs
                <br />
                #KOLArena
                <br />
                #Solana
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
