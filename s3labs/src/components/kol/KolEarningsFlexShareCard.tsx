import { forwardRef, useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, Coins, Flame, Share2, Trophy, Zap } from "lucide-react";

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

export interface KolEarningsFlexShareCardData {
  handle: string;
  displayName: string;
  verified?: boolean;
  profilePicture?: string | null;
  followers?: number | null;
  totalEarnedSol: number;
  paidSol: number;
  projectedSol: number;
  campaignCount: number;
  submissionCount: number;
  reputationScore?: number;
  shareUrl: string;
}

interface KolEarningsFlexShareCardProps {
  data: KolEarningsFlexShareCardData;
  className?: string;
  previewScale?: number;
}

const ACCENT = "#00cc88";
const ACCENT_GLOW = "rgba(0, 204, 136, 0.5)";
const GOLD = "#f5c542";

export const KolEarningsFlexShareCard = forwardRef<
  HTMLDivElement,
  KolEarningsFlexShareCardProps
>(function KolEarningsFlexShareCard({ data, className, previewScale = 1 }, ref) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarSrc = useMemo(() => {
    const primary = normalizeXProfilePictureUrl(data.profilePicture);
    return primary ?? xProfileAvatarFallbackUrl(data.handle);
  }, [data.handle, data.profilePicture]);

  const showAvatar = Boolean(avatarSrc) && !avatarFailed;

  const headlineSol =
    data.totalEarnedSol > 0
      ? data.totalEarnedSol
      : Math.max(data.paidSol, data.projectedSol);

  const initial = (data.displayName.trim() || data.handle).slice(0, 1).toUpperCase();

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
        className="kol-earnings-flex-share-canvas relative overflow-hidden"
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
              radial-gradient(ellipse 80% 60% at 12% 18%, ${ACCENT_GLOW}, transparent 58%),
              radial-gradient(ellipse 55% 45% at 92% 88%, rgba(245,197,66,0.22), transparent 52%),
              linear-gradient(165deg, #0c1411 0%, #030303 50%, #050505 100%)
            `,
          }}
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col px-16 py-14">
          {/* Header */}
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-5 min-w-0">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(145deg, ${ACCENT}, #009966)`,
                  boxShadow: `0 0 36px ${ACCENT_GLOW}`,
                }}
              >
                <Flame className="h-8 w-8 text-black" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[18px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: ACCENT }}
                >
                  S3 Labs · KOL Arena
                </p>
                <p className="mt-1 text-[34px] font-extrabold tracking-tight leading-none">
                  Earnings flex
                </p>
              </div>
            </div>
            <div
              className="shrink-0 inline-flex items-center gap-2.5 rounded-full border px-5 py-3 text-[18px] font-bold"
              style={{
                borderColor: "rgba(0,204,136,0.4)",
                background: "rgba(0,204,136,0.14)",
                color: ACCENT,
              }}
            >
              <Zap className="h-5 w-5" />
              Real SOL · Real campaigns
            </div>
          </div>

          {/* Body */}
          <div className="mt-12 flex min-h-0 flex-1 items-stretch gap-12">
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center gap-7">
                <div
                  className="relative h-40 w-40 shrink-0 overflow-hidden rounded-[32px] border-[3px]"
                  style={{ borderColor: "rgba(0,204,136,0.5)" }}
                >
                  {/* Letter fallback if avatar fails to load or export can't inline it. */}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold"
                    style={{ background: "rgba(0,204,136,0.18)", color: ACCENT }}
                    aria-hidden
                  >
                    {initial}
                  </div>
                  {showAvatar ? (
                    <img
                      src={avatarSrc!}
                      alt=""
                      className="relative h-full w-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      decoding="sync"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="truncate text-[48px] font-extrabold tracking-tight leading-none">
                      {data.displayName}
                    </p>
                    {data.verified ? (
                      <BadgeCheck className="h-10 w-10 shrink-0" style={{ color: ACCENT }} />
                    ) : null}
                  </div>
                  <p className="mt-3 text-[32px] font-semibold text-white/60">@{data.handle}</p>
                  {data.followers != null ? (
                    <p className="mt-2 text-[20px] text-white/40">
                      {formatFollowers(data.followers)} followers
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-12">
                <p
                  className="text-[20px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Total on S3 Labs
                </p>
                <div className="mt-3 flex items-baseline gap-4">
                  <p
                    className="font-mono text-[120px] font-extrabold leading-none tracking-tight tabular-nums"
                    style={{ color: ACCENT }}
                  >
                    {formatSol(headlineSol)}
                  </p>
                  <p
                    className="pb-3 text-[36px] font-bold tracking-tight"
                    style={{ color: GOLD }}
                  >
                    SOL
                  </p>
                </div>
              </div>
            </div>

            <div className="grid w-[460px] shrink-0 grid-rows-3 gap-5 self-center">
              <StatTile
                icon={<Coins className="h-7 w-7" style={{ color: ACCENT }} />}
                label="Paid out"
                value={`${formatSol(data.paidSol)} SOL`}
              />
              <StatTile
                icon={<Flame className="h-7 w-7" style={{ color: GOLD }} />}
                label="Still projecting"
                value={`${formatSol(data.projectedSol)} SOL`}
              />
              <StatTile
                icon={<Trophy className="h-7 w-7" style={{ color: ACCENT }} />}
                label="Campaigns"
                value={String(data.campaignCount)}
                sub={`${data.submissionCount} post${data.submissionCount === 1 ? "" : "s"}${
                  data.reputationScore != null && data.reputationScore > 0
                    ? ` · rep ${formatCompact(data.reputationScore)}`
                    : ""
                }`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-8">
            <div className="flex items-center gap-4">
              <Share2 className="h-7 w-7" style={{ color: ACCENT }} />
              <p className="text-[24px] font-semibold tracking-tight text-white/70">
                Check your bag · flex the receipts
              </p>
            </div>
            <p className="text-[24px] font-bold tracking-tight" style={{ color: ACCENT }}>
              {KOL_SHARE_PUBLIC_LABEL}?tab=check
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="flex flex-col justify-center rounded-3xl border px-7 py-5"
      style={{
        borderColor: "rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-3 text-[16px] font-bold uppercase tracking-[0.14em] text-white/50">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-mono text-[40px] font-extrabold tabular-nums tracking-tight leading-none">
        {value}
      </p>
      {sub ? <p className="mt-2 text-[18px] text-white/45">{sub}</p> : null}
    </div>
  );
}
