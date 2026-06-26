import { cn } from "@/lib/utils";
import { overviewAccentBackground } from "@/components/dashboard/overview/overviewStyles";

export function Btc3Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(800px 400px at 20% -10%, hsl(220 60% 50% / 0.08), transparent 60%), radial-gradient(600px 300px at 80% 100%, hsl(45 80% 50% / 0.06), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: overviewAccentBackground("internal") }}
      />
    </div>
  );
}
