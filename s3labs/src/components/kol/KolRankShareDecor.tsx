import { Crown } from "lucide-react";

interface RankLaurelProps {
  rank: number;
  rankLabel: string;
  accent: string;
  gradient: string;
  glow: string;
  size?: number;
}

/** Decorative laurel frame around rank — inline SVG for export capture. */
export function RankLaurelFrame({
  rank,
  rankLabel,
  accent,
  gradient,
  glow,
  size = 280,
}: RankLaurelProps) {
  const showCrown = rank === 1;
  const h = size;
  const w = size * 1.15;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: w, height: h }}>
      {showCrown ? (
        <Crown
          size={36}
          color={accent}
          strokeWidth={2}
          className="mb-1"
          style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
          aria-hidden
        />
      ) : null}

      <svg
        viewBox="0 0 200 200"
        width={w}
        height={h * 0.85}
        className="absolute inset-0 m-auto"
        aria-hidden
      >
        <defs>
          <linearGradient id="laurelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {/* Left wreath */}
        <path
          d="M38 100 C30 70, 45 45, 68 38 C62 58, 58 78, 62 100 C58 122, 62 142, 68 162 C45 155, 30 130, 38 100 Z"
          fill="none"
          stroke="url(#laurelGrad)"
          strokeWidth="2.5"
          opacity="0.85"
        />
        <path
          d="M48 88 C42 68, 52 55, 65 50 M48 112 C42 132, 52 145, 65 150"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          opacity="0.5"
        />
        {/* Right wreath (mirrored) */}
        <path
          d="M162 100 C170 70, 155 45, 132 38 C138 58, 142 78, 138 100 C142 122, 138 142, 132 162 C155 155, 170 130, 162 100 Z"
          fill="none"
          stroke="url(#laurelGrad)"
          strokeWidth="2.5"
          opacity="0.85"
        />
        <path
          d="M152 88 C158 68, 148 55, 135 50 M152 112 C158 132, 148 145, 135 150"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>

      <div className="relative z-[1] flex flex-col items-center">
        <span
          className="font-black tabular-nums leading-none tracking-[-0.04em]"
          style={{
            fontSize: rank <= 3 ? 88 : 72,
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 20px ${glow})`,
          }}
        >
          {rankLabel}
        </span>
        <span
          className="mt-1 text-[15px] font-bold uppercase tracking-[0.35em]"
          style={{ color: accent, opacity: 0.85 }}
        >
          Place
        </span>
      </div>
    </div>
  );
}

/** Subtle sparkle dots for top-3 cards. */
export function TierSparkles({ color, count = 12 }: { color: string; count?: number }) {
  const dots = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${8 + ((i * 37) % 84)}%`,
    top: `${5 + ((i * 23) % 70)}%`,
    size: 2 + (i % 3),
    opacity: 0.15 + (i % 4) * 0.12,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            backgroundColor: color,
            opacity: d.opacity,
            boxShadow: `0 0 ${d.size * 3}px ${color}`,
          }}
        />
      ))}
    </div>
  );
}
