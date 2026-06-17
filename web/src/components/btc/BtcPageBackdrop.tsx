export function BtcPageBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="absolute -left-[15%] top-0 h-[50vh] w-[50vw] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(247,147,26,0.07), transparent 70%)" }}
      />
      <div
        className="absolute -right-[12%] top-[18%] h-[42vh] w-[42vw] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.06), transparent 68%)" }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-[30vh] w-[70vw] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.04), transparent 72%)" }}
      />
    </div>
  );
}
