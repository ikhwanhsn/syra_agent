import { forwardRef, useMemo } from "react";
import { BadgeCheck, Share2 } from "lucide-react";

import { formatCompact, formatSol } from "@/lib/kolFormat";
import {
  normalizeXProfilePictureUrl,
  xProfileAvatarFallbackUrl,
} from "@/components/kol/KolProfileAvatar";
import { RankLaurelFrame, TierSparkles } from "@/components/kol/KolRankShareDecor";
import {
  KOL_RANK_SHARE_HEIGHT,
  KOL_RANK_SHARE_WIDTH,
  KOL_SHARE_PUBLIC_LABEL,
} from "@/components/kol/kolRankShareExport";
import { cn } from "@/lib/utils";

export interface KolRankShareCardData {
  rank: number;
  totalParticipants: number;
  handle: string;
  verified?: boolean;
  profilePicture?: string | null;
  score: number;
  payoutSol: number;
  payoutLabel: string;
  likes: number;
  views: number;
  mode: "reply" | "quote";
  campaignTitle: string;
  rewardSol: number;
  shareUrl: string;
}

interface TierTheme {
  name: string;
  roleBadge: string;
  accent: string;
  border: string;
  cardBg: string;
  badgeBg: string;
  rankGradient: string;
  rankGlow: string;
  bannerAccent: string;
}

function resolveTierTheme(rank: number): TierTheme {
  if (rank === 1) {
    return {
      name: "champion",
      roleBadge: "S3 Champion",
      accent: "#f5c542",
      border: "rgba(245, 197, 66, 0.55)",
      cardBg:
        "linear-gradient(165deg, rgba(245,197,66,0.14) 0%, rgba(20,16,8,0.95) 45%, rgba(8,8,8,0.98) 100%)",
      badgeBg: "rgba(245, 197, 66, 0.2)",
      rankGradient: "linear-gradient(160deg, #fff7cc 0%, #f5c542 40%, #b8860b 100%)",
      rankGlow: "rgba(245, 197, 66, 0.45)",
      bannerAccent: "#f5c542",
    };
  }
  if (rank === 2) {
    return {
      name: "silver",
      roleBadge: "S3 Silver",
      accent: "#e2e8f0",
      border: "rgba(226, 232, 240, 0.45)",
      cardBg:
        "linear-gradient(165deg, rgba(226,232,240,0.1) 0%, rgba(16,18,22,0.95) 45%, rgba(8,8,8,0.98) 100%)",
      badgeBg: "rgba(226, 232, 240, 0.12)",
      rankGradient: "linear-gradient(160deg, #f8fafc 0%, #cbd5e1 45%, #64748b 100%)",
      rankGlow: "rgba(203, 213, 225, 0.4)",
      bannerAccent: "#cbd5e1",
    };
  }
  if (rank === 3) {
    return {
      name: "bronze",
      roleBadge: "S3 Bronze",
      accent: "#f97316",
      border: "rgba(249, 115, 22, 0.5)",
      cardBg:
        "linear-gradient(165deg, rgba(249,115,22,0.12) 0%, rgba(22,14,8,0.95) 45%, rgba(8,8,8,0.98) 100%)",
      badgeBg: "rgba(249, 115, 22, 0.16)",
      rankGradient: "linear-gradient(160deg, #fed7aa 0%, #f97316 45%, #c2410c 100%)",
      rankGlow: "rgba(249, 115, 22, 0.4)",
      bannerAccent: "#f97316",
    };
  }
  if (rank === 4) {
    return {
      name: "teal",
      roleBadge: "S3 Power",
      accent: "#2dd4bf",
      border: "rgba(45, 212, 191, 0.45)",
      cardBg:
        "linear-gradient(165deg, rgba(45,212,191,0.1) 0%, rgba(8,20,18,0.95) 45%, rgba(8,8,8,0.98) 100%)",
      badgeBg: "rgba(45, 212, 191, 0.12)",
      rankGradient: "linear-gradient(160deg, #99f6e4 0%, #2dd4bf 45%, #0d9488 100%)",
      rankGlow: "rgba(45, 212, 191, 0.35)",
      bannerAccent: "#2dd4bf",
    };
  }
  if (rank === 5) {
    return {
      name: "violet",
      roleBadge: "S3 Legend",
      accent: "#c084fc",
      border: "rgba(192, 132, 252, 0.45)",
      cardBg:
        "linear-gradient(165deg, rgba(192,132,252,0.1) 0%, rgba(18,10,24,0.95) 45%, rgba(8,8,8,0.98) 100%)",
      badgeBg: "rgba(192, 132, 252, 0.12)",
      rankGradient: "linear-gradient(160deg, #e9d5ff 0%, #c084fc 45%, #7e22ce 100%)",
      rankGlow: "rgba(192, 132, 252, 0.35)",
      bannerAccent: "#c084fc",
    };
  }
  return {
    name: "contender",
    roleBadge: "S3 KOL",
    accent: "#00cc88",
    border: "rgba(0, 204, 136, 0.4)",
    cardBg:
      "linear-gradient(165deg, rgba(0,204,136,0.08) 0%, rgba(8,16,14,0.95) 45%, rgba(8,8,8,0.98) 100%)",
    badgeBg: "rgba(0, 204, 136, 0.12)",
    rankGradient: "linear-gradient(160deg, #a7f3d0 0%, #00cc88 45%, #0891b2 100%)",
    rankGlow: "rgba(0, 204, 136, 0.3)",
    bannerAccent: "#00cc88",
  };
}

function rankLabel(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

function lockedInLabel(rank: number): string {
  if (rank <= 3) return "Top 3";
  if (rank <= 5) return "Top 5";
  if (rank <= 10) return "Top 10";
  return "Board";
}

function poolSharePct(payoutSol: number, rewardSol: number): string {
  if (rewardSol <= 0) return "—";
  const pct = Math.round((payoutSol / rewardSol) * 100);
  return `${Math.max(1, Math.min(100, pct))}%`;
}

function campaignBadge(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return title.toUpperCase().slice(0, 16);
  return words
    .slice(0, 2)
    .map((w) => w.toUpperCase())
    .join(" ");
}

interface KolRankShareCardProps {
  data: KolRankShareCardData;
  className?: string;
  previewScale?: number;
}

export const KolRankShareCard = forwardRef<HTMLDivElement, KolRankShareCardProps>(
  function KolRankShareCard({ data, className, previewScale = 1 }, ref) {
    const theme = resolveTierTheme(data.rank);

    const avatarSrc = useMemo(() => {
      const primary = normalizeXProfilePictureUrl(data.profilePicture);
      return primary ?? xProfileAvatarFallbackUrl(data.handle);
    }, [data.handle, data.profilePicture]);

    const rankText = rankLabel(data.rank);
    const poolShare = poolSharePct(data.payoutSol, data.rewardSol);
    const modeLabel = data.mode === "quote" ? "Quote" : "Reply";

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
          className="kol-rank-share-canvas relative overflow-hidden"
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
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 55% 70% at 50% 42%, ${theme.rankGlow}, transparent 65%)`,
            }}
            aria-hidden
          />

          <div className="relative flex h-full flex-col px-16 py-12">
            {/* Page header */}
            <div className="shrink-0 flex flex-col items-center text-center">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="" width={36} height={36} className="rounded-lg" />
                <span className="text-[15px] font-bold tracking-tight text-white/90">S3 Labs</span>
              </div>

              <h1 className="mt-5 max-w-[90%] truncate text-[34px] font-extrabold uppercase leading-tight tracking-tight text-white">
                {data.campaignTitle}
              </h1>

              <div className="mt-5 flex w-full max-w-[680px] items-center gap-5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[13px] font-semibold uppercase tracking-[0.45em] text-white/50">
                  Leaderboard
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
              </div>
            </div>

            {/* Main card */}
            <div className="flex flex-1 min-h-0 items-center justify-center py-8">
              <div
                className="relative w-full max-w-[1520px] overflow-hidden rounded-[20px] border"
                style={{
                  borderColor: theme.border,
                  background: theme.cardBg,
                  boxShadow: `0 0 0 1px ${theme.border}, 0 24px 80px ${theme.rankGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
              >
                {data.rank <= 3 ? <TierSparkles color={theme.accent} /> : null}

                <div
                  className="flex items-center justify-between border-b px-8 py-4"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <img src="/images/logo.png" alt="" width={28} height={28} className="rounded-md" />
                    <span className="text-[13px] font-bold text-white/80">S3 Labs</span>
                  </div>
                  <span
                    className="rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: theme.badgeBg, color: theme.accent }}
                  >
                    {campaignBadge(data.campaignTitle)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_1.1fr_1.2fr] items-center gap-4 px-10 py-8">
                  <div className="flex justify-center">
                    <RankLaurelFrame
                      rank={data.rank}
                      rankLabel={rankText}
                      accent={theme.accent}
                      gradient={theme.rankGradient}
                      glow={theme.rankGlow}
                      size={260}
                    />
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt=""
                          width={100}
                          height={100}
                          crossOrigin="anonymous"
                          className="rounded-full object-cover"
                          style={{
                            width: 100,
                            height: 100,
                            border: `3px solid ${theme.border}`,
                            boxShadow: `0 0 32px ${theme.rankGlow}`,
                          }}
                        />
                      ) : (
                        <div
                          className="flex h-[100px] w-[100px] items-center justify-center rounded-full text-3xl font-bold uppercase"
                          style={{
                            border: `3px solid ${theme.border}`,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            color: theme.accent,
                          }}
                        >
                          {data.handle.slice(0, 1)}
                        </div>
                      )}
                      {data.verified ? (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2"
                          style={{ borderColor: "#030303", backgroundColor: "#00cc88" }}
                        >
                          <BadgeCheck size={16} color="#030303" strokeWidth={2.5} aria-hidden />
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-5 text-[22px] font-bold tracking-tight">@{data.handle}</p>

                    <span
                      className="mt-3 inline-flex rounded-md border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.badgeBg,
                        color: theme.accent,
                      }}
                    >
                      {theme.roleBadge}
                    </span>
                  </div>

                  <div className="flex flex-col gap-6 px-4">
                    <div className="text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/38">
                        {data.payoutLabel} earned
                      </p>
                      <p
                        className="mt-2 font-mono text-[48px] font-black tabular-nums leading-none tracking-tight"
                        style={{ color: theme.accent }}
                      >
                        {formatSol(data.payoutSol)}{" "}
                        <span className="text-[26px] font-bold">SOL</span>
                      </p>
                    </div>

                    <div
                      className="grid grid-cols-3 gap-0 overflow-hidden rounded-xl border"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      {[
                        { label: "Rank", value: String(data.rank) },
                        { label: "Locked in", value: lockedInLabel(data.rank) },
                        { label: "Pool share", value: poolShare },
                      ].map((stat, i) => (
                        <div
                          key={stat.label}
                          className="flex flex-col items-center justify-center px-3 py-4 text-center"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.35)",
                            borderRight:
                              i < 2 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                          }}
                        >
                          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/32">
                            {stat.label}
                          </p>
                          <p
                            className="mt-1.5 text-[20px] font-bold tabular-nums leading-none"
                            style={{ color: i === 2 ? theme.accent : "#f8fafc" }}
                          >
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between border-t px-8 py-4"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[13px] text-white/40">
                    {data.score.toFixed(1)} score · {formatCompact(data.likes)} likes ·{" "}
                    {formatCompact(data.views)} views · {modeLabel}
                  </p>
                  <p className="text-[15px] font-bold" style={{ color: theme.bannerAccent }}>
                    {KOL_SHARE_PUBLIC_LABEL}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom CTA banner */}
            <div
              className="shrink-0 flex items-center gap-6 rounded-2xl border px-8 py-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#00cc88" }}
              >
                <Share2 size={22} color="#030303" strokeWidth={2.5} aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold leading-snug text-white/90">
                  Proud to be on the{" "}
                  <span style={{ color: theme.bannerAccent }}>S3 Labs KOL Leaderboard</span>
                </p>
                <p className="mt-1 text-[13px] text-white/40">
                  Share your rank · Earn more · Build together · {KOL_SHARE_PUBLIC_LABEL}
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
