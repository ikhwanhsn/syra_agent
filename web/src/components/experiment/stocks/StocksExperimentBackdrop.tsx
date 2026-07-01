export function StocksExperimentBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute -left-[20%] top-[-10%] h-[50vh] w-[60vw] rounded-full opacity-[0.35] blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(199 89% 48% / 0.18), transparent 70%)" }}
      />
      <div
        className="absolute -right-[15%] top-[5%] h-[45vh] w-[50vw] rounded-full opacity-[0.25] blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(142 76% 36% / 0.12), transparent 70%)" }}
      />
    </div>
  );
}
