import { forwardRef, type ReactNode } from "react";
import { Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

export const BTC_SECTION_SHARE_WIDTH = 1000;

const FRAME = {
  bg: "#0a0a0a",
  border: "rgba(255,255,255,0.08)",
  text: "#fafafa",
  muted: "#a1a1aa",
  faint: "#71717a",
  accent: "#F7931A",
};

export interface BtcSectionShareFrameProps {
  kicker: string;
  title: string;
  description?: string;
  capturedAt?: string;
  children: ReactNode;
  className?: string;
}

export const BtcSectionShareFrame = forwardRef<HTMLDivElement, BtcSectionShareFrameProps>(
  function BtcSectionShareFrame({ kicker, title, description, capturedAt, children, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn("overflow-hidden", className)}
        style={{
          width: BTC_SECTION_SHARE_WIDTH,
          background: FRAME.bg,
          color: FRAME.text,
        }}
        data-export-bg={FRAME.bg}
      >
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${FRAME.accent}, #2563eb 55%, transparent)`,
          }}
        />
        <div className="border-b px-8 py-6" style={{ borderColor: FRAME.border }}>
          <div className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
              style={{ borderColor: "rgba(247,147,26,0.35)", backgroundColor: "rgba(247,147,26,0.12)", color: FRAME.accent }}
            >
              <Bitcoin className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: FRAME.faint }}>
                Syra · {kicker}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight" style={{ color: FRAME.text }}>
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: FRAME.muted }}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-8 py-7">{children}</div>
        <div
          className="flex items-center justify-between border-t px-8 py-4 font-mono text-[10px] uppercase tracking-[0.16em]"
          style={{ borderColor: FRAME.border, color: FRAME.faint }}
        >
          <span>syra.ai/btc</span>
          <span>{capturedAt ?? new Date().toLocaleString()}</span>
        </div>
      </div>
    );
  },
);
