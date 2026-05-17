const LANDING_URL = "https://www.syraa.fun";

export function StakingFooter() {
  return (
    <footer className="mt-12 border-t border-border/50 pt-8 text-center sm:mt-16">
      <p className="text-sm text-muted-foreground">
        Part of the{" "}
        <a
          href={LANDING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground/60"
        >
          Syra
        </a>{" "}
        ecosystem — smart intelligence for traders on Solana.
      </p>
    </footer>
  );
}
