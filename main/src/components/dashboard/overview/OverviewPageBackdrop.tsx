export function OverviewPageBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />
      <div
        className="absolute -left-[20%] top-0 h-[55vh] w-[55vw] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)" }}
      />
      <div
        className="absolute -right-[10%] top-[30%] h-[40vh] w-[40vw] rounded-full blur-[90px]"
        style={{ background: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.05), transparent 68%)" }}
      />
    </div>
  );
}


