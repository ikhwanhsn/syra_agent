import { forwardRef, useMemo } from "react";
import { Award, BadgeCheck, Coins, Share2, Star, Trophy, Users, Zap } from "lucide-react";

import {
  normalizeXProfilePictureUrl,
  xProfileAvatarFallbackUrl,
} from "@/components/kol/KolProfileAvatar";
import {
  KOL_RANK_SHARE_HEIGHT,
  KOL_RANK_SHARE_WIDTH,
  KOL_SHARE_PUBLIC_LABEL,
} from "@/components/kol/kolRankShareExport";
import { formatCompact, formatFollowers, formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

export interface KolProfileShareCardData {
  handle: string;
  displayName: string;
  verified?: boolean;
  profilePicture?: string | null;
  followers?: number | null;
  reputationScore?: number | null;
  totalPoints: number;
  earnedSol: number;
  projectedSol: number;
  campaignsParticipated: number;
  campaignsCompleted?: number;
  engagementTotal?: number;
  projectFundedSol?: number;
  shareUrl: string;
}

interface ProfileTierTheme {
  roleBadge: string;
  accent: string;
  accentGlow: string;
  heroGradient: string;
  cardBorder: string;
  cardBg: string;
}

function resolveProfileTier(reputationScore: number | null | undefined, totalPoints: number): ProfileTierTheme {
  const score = reputationScore ?? 0;

  if (score >= 100) {
    return {
      roleBadge: "S3 Elite",
      accent: "#f5c542",
      accentGlow: "rgba(245, 197, 66, 0.42)",
      heroGradient: "linear-gradient(165deg, #fff7cc 0%, #f5c542 45%, #b8860b 100%)",
      cardBorder: "rgba(245, 197, 66, 0.45)",
      cardBg:
        "linear-gradient(165deg, rgba(245,197,66,0.12) 0%, rgba(16,14,8,0.94) 42%, rgba(6,6,6,0.98) 100%)",
    };
  }
  if (score >= 50) {
    return {
      roleBadge: "S3 Power",
      accent: "#2dd4bf",
      accentGlow: "rgba(45, 212, 191, 0.38)",
      heroGradient: "linear-gradient(165deg, #99f6e4 0%, #2dd4bf 45%, #0d9488 100%)",
      cardBorder: "rgba(45, 212, 191, 0.42)",
      cardBg:
        "linear-gradient(165deg, rgba(45,212,191,0.1) 0%, rgba(8,18,16,0.94) 42%, rgba(6,6,6,0.98) 100%)",
    };
  }
  if (totalPoints >= 25 || score >= 20) {
    return {
      roleBadge: "S3 Rising",
      accent: "#c084fc",
      accentGlow: "rgba(192, 132, 252, 0.38)",
      heroGradient: "linear-gradient(165deg, #e9d5ff 0%, #c084fc 45%, #7e22ce 100%)",
      cardBorder: "rgba(192, 132, 252, 0.42)",
      cardBg:
        "linear-gradient(165deg, rgba(192,132,252,0.1) 0%, rgba(14,10,20,0.94) 42%, rgba(6,6,6,0.98) 100%)",
    };
  }
  return {
    roleBadge: "S3 KOL",
    accent: "#00cc88",
    accentGlow: "rgba(0, 204, 136, 0.38)",
    heroGradient: "linear-gradient(165deg, #a7f3d0 0%, #00cc88 45%, #0891b2 100%)",
    cardBorder: "rgba(0, 204, 136, 0.38)",
    cardBg:
      "linear-gradient(165deg, rgba(0,204,136,0.08) 0%, rgba(8,14,12,0.94) 42%, rgba(6,6,6,0.98) 100%)",
  };
}

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface KolProfileShareCardProps {
  data: KolProfileShareCardData;
  className?: string;
  previewScale?: number;
}

export const KolProfileShareCard = forwardRef<HTMLDivElement, KolProfileShareCardProps>(
  function KolProfileShareCard({ data, className, previewScale = 1 }, ref) {
    const theme = resolveProfileTier(data.reputationScore, data.totalPoints);
    const cleanHandle = data.handle.trim().replace(/^@/, "");
    const hasReputation = data.reputationScore != null && data.reputationScore > 0;
    const hasProjectFunded = data.projectFundedSol != null && data.projectFundedSol > 0;

    let heroLabel: string;
    let heroValue: string;
    if (hasReputation) {
      heroLabel = "Reputation score";
      heroValue = data.reputationScore!.toFixed(1);
    } else if (data.totalPoints > 0) {
      heroLabel = "S3Labs points";
      heroValue = formatPoints(data.totalPoints);
    } else if (hasProjectFunded) {
      heroLabel = "Total funded";
      heroValue = formatSol(data.projectFundedSol!);
    } else if (data.campaignsParticipated > 0) {
      heroLabel = "Campaigns joined";
      heroValue = String(data.campaignsParticipated);
    } else {
      heroLabel = "Reputation score";
      heroValue = (data.reputationScore ?? 0).toFixed(1);
    }

    const showSolSuffix = !hasReputation && hasProjectFunded && data.totalPoints <= 0;

    const avatarSrc = useMemo(() => {
      const primary = normalizeXProfilePictureUrl(data.profilePicture);
      return primary ?? xProfileAvatarFallbackUrl(cleanHandle);
    }, [cleanHandle, data.profilePicture]);

    const initial = (data.displayName.trim() || cleanHandle).slice(0, 1).toUpperCase();

    const stats = [
      {
        icon: Award,
        label: data.totalPoints > 0 ? "S3Labs pts" : "Pool funded",
        value:
          data.totalPoints > 0
            ? formatPoints(data.totalPoints)
            : data.projectFundedSol != null
              ? `${formatSol(data.projectFundedSol)} SOL`
              : "—",
        highlight: !hasReputation && (data.totalPoints > 0 || hasProjectFunded),
      },
      {
        icon: Coins,
        label: "SOL earned",
        value: `${formatSol(data.earnedSol)} SOL`,
        highlight: data.earnedSol > 0,
      },
      {
        icon: Trophy,
        label: "Campaigns",
        value: String(data.campaignsParticipated),
        highlight: false,
      },
      {
        icon: Zap,
        label: "Engagement",
        value: data.engagementTotal != null ? formatCompact(data.engagementTotal) : "—",
        highlight: false,
      },
    ];

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
          className="kol-profile-share-canvas relative overflow-hidden"
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
              background: `
                radial-gradient(ellipse 70% 55% at 18% 40%, ${theme.accentGlow}, transparent 58%),
                radial-gradient(ellipse 50% 45% at 88% 18%, rgba(8,145,178,0.16), transparent 52%),
                radial-gradient(ellipse 55% 40% at 72% 92%, ${theme.accentGlow}, transparent 55%)
              `,
            }}
            aria-hidden
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />

          <div className="relative flex h-full flex-col px-16 py-12">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="" width={40} height={40} className="rounded-xl" />
                <div>
                  <p className="text-[15px] font-bold tracking-tight text-white/90">S3 Labs</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
                    KOL Arena
                  </p>
                </div>
              </div>
              <span
                className="rounded-full border px-5 py-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{
                  borderColor: `${theme.accent}55`,
                  backgroundColor: `${theme.accent}16`,
                  color: theme.accent,
                }}
              >
                {theme.roleBadge}
              </span>
            </div>

            {/* Main */}
            <div className="flex min-h-0 flex-1 items-center gap-12 py-10">
              {/* Identity */}
              <div className="flex w-[38%] flex-col items-center text-center">
                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-[28px] blur-2xl"
                    style={{ backgroundColor: theme.accentGlow }}
                    aria-hidden
                  />
                  <div
                    className="relative overflow-hidden rounded-[24px] border-2"
                    style={{
                      borderColor: theme.cardBorder,
                      boxShadow: `0 0 0 1px ${theme.cardBorder}, 0 24px 64px ${theme.accentGlow}`,
                    }}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        width={220}
                        height={220}
                        className="block h-[220px] w-[220px] object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div
                        className="flex h-[220px] w-[220px] items-center justify-center text-6xl font-bold uppercase"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: theme.accent }}
                      >
                        {initial}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex max-w-full items-center justify-center gap-2.5">
                  <h2 className="truncate text-[34px] font-extrabold tracking-tight text-white">
                    {data.displayName}
                  </h2>
                  {data.verified ? (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    >
                      <BadgeCheck size={16} color="#030303" strokeWidth={2.5} aria-hidden />
                    </div>
                  ) : null}
                </div>

                <p className="mt-2 text-[20px] font-semibold text-white/55">@{cleanHandle}</p>

                {data.followers != null ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                    <Users size={14} color={theme.accent} strokeWidth={2.5} aria-hidden />
                    <span className="text-[13px] font-semibold text-white/55">
                      {formatFollowers(data.followers)} followers
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Hero score card */}
              <div
                className="flex w-[62%] flex-col overflow-hidden rounded-[28px] border"
                style={{
                  borderColor: theme.cardBorder,
                  background: theme.cardBg,
                  boxShadow: `0 0 0 1px ${theme.cardBorder}, 0 32px 100px ${theme.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
              >
                <div
                  className="flex items-center justify-between border-b px-10 py-5"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <Star size={18} color={theme.accent} strokeWidth={2.5} aria-hidden />
                    <span className="text-[12px] font-bold uppercase tracking-[0.22em] text-white/42">
                      Marketplace reputation
                    </span>
                  </div>
                  {data.campaignsCompleted != null && data.campaignsCompleted > 0 ? (
                    <span className="text-[12px] font-semibold text-white/45">
                      {data.campaignsCompleted} completed
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col px-10 py-10">
                  <p className="text-[13px] font-bold uppercase tracking-[0.38em] text-white/38">
                    {heroLabel}
                  </p>
                  <p
                    className="mt-4 font-mono text-[128px] font-black tabular-nums leading-[0.9] tracking-tighter"
                    style={{
                      background: theme.heroGradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 40px ${theme.accentGlow})`,
                    }}
                  >
                    {heroValue}
                  </p>
                  {showSolSuffix ? (
                    <p
                      className="mt-2 text-[42px] font-extrabold uppercase tracking-[0.22em]"
                      style={{ color: theme.accent }}
                    >
                      SOL
                    </p>
                  ) : null}

                  {data.projectedSol > 0 ? (
                    <p className="mt-6 text-[17px] text-white/48">
                      <span style={{ color: theme.accent }} className="font-semibold tabular-nums">
                        {formatSol(data.projectedSol)} SOL
                      </span>{" "}
                      projected from active campaigns
                    </p>
                  ) : (
                    <p className="mt-6 max-w-[560px] text-[17px] leading-relaxed text-white/42">
                      Building reputation on S3 Labs KOL Arena — verify X, submit reply/quote links, climb
                      leaderboards, get paid in SOL.
                    </p>
                  )}

                  <div
                    className="mt-auto grid grid-cols-4 gap-0 overflow-hidden rounded-2xl border"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {stats.map((stat, i) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center justify-center px-4 py-6 text-center"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.32)",
                          borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                        }}
                      >
                        <stat.icon
                          size={16}
                          color={stat.highlight ? theme.accent : "rgba(255,255,255,0.35)"}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/32">
                          {stat.label}
                        </p>
                        <p
                          className="mt-1.5 text-[17px] font-bold tabular-nums leading-none"
                          style={{ color: stat.highlight ? theme.accent : "#f8fafc" }}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex shrink-0 items-center gap-6 rounded-2xl border px-8 py-5"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: theme.accent }}
              >
                <Share2 size={22} color="#030303" strokeWidth={2.5} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold leading-snug text-white/92">
                  Flex your reputation — join the{" "}
                  <span style={{ color: theme.accent }}>S3 Labs KOL Arena</span>
                </p>
                <p className="mt-1 truncate text-[13px] text-white/40">
                  {data.shareUrl.replace(/^https?:\/\//, "")} · {KOL_SHARE_PUBLIC_LABEL}
                </p>
              </div>
              <p className="hidden shrink-0 text-right text-[12px] font-semibold leading-relaxed text-white/35 sm:block">
                #S3Labs
                <br />
                #KOLArena
                <br />#{cleanHandle.slice(0, 12)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
