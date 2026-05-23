/** Ambient backdrop for the LP experiment workstation page. */
export function LpExperimentBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute -left-[18%] top-[-8%] h-[52vh] w-[52vw] rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, hsl(262 83% 58% / 0.11), transparent 68%)",
        }}
      />
      <div
        className="absolute -right-[12%] top-[22%] h-[38vh] w-[38vw] rounded-full blur-[96px]"
        style={{
          background: "radial-gradient(circle, hsl(173 58% 39% / 0.08), transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-0 left-[30%] h-[28vh] w-[40vw] rounded-full blur-[80px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.05), transparent 70%)",
        }}
      />
    </div>
  );
}
