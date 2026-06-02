const LANDING_URL = "https://www.syraa.fun";

export function StakingFooter() {
  return (
    <footer className="mt-14 border-t border-border/40 pt-8 text-center sm:mt-16">
      <p className="text-sm text-muted-foreground">
        Part of{" "}
        <a
          href={LANDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-border/70 underline-offset-4 transition hover:decoration-foreground/50"
        >
          Syra
        </a>
        — agent intelligence on Solana.
      </p>
    </footer>
  );
}
