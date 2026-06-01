/** Ambient backdrop for the LP experiment workstation page. */
export function LpExperimentBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 85% 70% at 50% 0%, black 20%, transparent 75%)",
        }}
      />
      <div
        className="absolute -left-[16%] top-[-10%] h-[58vh] w-[55vw] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, hsl(262 83% 58% / 0.13), transparent 68%)",
        }}
      />
      <div
        className="absolute -right-[10%] top-[18%] h-[42vh] w-[40vw] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, hsl(173 58% 39% / 0.09), transparent 65%)",
        }}
      />
      <div
        className="absolute bottom-[-5%] left-[25%] h-[32vh] w-[45vw] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(262 83% 58% / 0.25), transparent)",
        }}
      />
    </div>
  );
}
