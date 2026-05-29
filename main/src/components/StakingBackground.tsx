export function StakingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-50 grid-pattern" />
      <div className="absolute inset-0 opacity-30 grid-pattern-accent" />

      <div className="absolute top-0 left-1/4 h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-primary/[0.07] blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[min(360px,45vw)] w-[min(360px,45vw)] rounded-full bg-primary/[0.05] blur-[100px]" />
      <div className="absolute top-1/3 right-0 h-[min(280px,35vw)] w-[min(280px,35vw)] rounded-full bg-accent/[0.06] blur-[90px]" />

      <div className="absolute bottom-0 left-1/2 h-px w-[min(100%,72rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
    </div>
  );
}
