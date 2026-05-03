import { ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, SectionHeader, shortenMint, SubtleNote } from "@/components/rise/RiseShared";
import { buildSolscanAccountUrl, buildSolscanTokenUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

export function TokenAboutPanel({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;

  if (!market) return null;

  const creatorUrl = buildSolscanAccountUrl(market.creator);
  const tokenUrl = buildSolscanTokenUrl(market.mint);

  return (
    <GlassCard className={className}>
      <SectionHeader eyebrow={t.sectionAbout} title={market.name || shortenMint(market.mint)} />
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
          <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.aboutMint}
          </dt>
          <dd className="break-all font-mono text-[0.7rem] text-foreground/90">{market.mint}</dd>
        </div>
        {market.marketAddress ? (
          <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
            <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.aboutMarketAddr}
            </dt>
            <dd className="break-all font-mono text-[0.7rem] text-foreground/90">{market.marketAddress}</dd>
          </div>
        ) : null}
        <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-background/30 px-3 py-2">
          <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.aboutCreator}
          </dt>
          <dd className="font-mono text-[0.7rem]">
            {creatorUrl && market.creator ? (
              <a
                href={creatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground/90 underline-offset-2 hover:underline"
              >
                {shortenMint(market.creator, 8, 8)}
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
              </a>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </dd>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border/40 bg-background/30 px-3 py-2">
            <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.aboutCreated}
            </dt>
            <dd className="mt-1 font-mono text-[0.75rem]" title={market.createdAt ?? undefined}>
              {market.createdAt ? new Date(market.createdAt).toLocaleString() : "—"}
            </dd>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/30 px-3 py-2">
            <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.aboutUpdated}
            </dt>
            <dd className="mt-1 font-mono text-[0.75rem]" title={market.updatedAt ?? undefined}>
              {market.updatedAt ? new Date(market.updatedAt).toLocaleString() : "—"}
            </dd>
          </div>
        </div>
        {market.tokenUri ? (
          <div>
            <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.aboutTokenUri}
            </dt>
            <dd className="mt-1">
              <Button asChild variant="link" className="h-auto px-0 py-0 text-xs font-normal">
                <a href={market.tokenUri} target="_blank" rel="noopener noreferrer">
                  {market.tokenUri.length > 52 ? `${market.tokenUri.slice(0, 52)}…` : market.tokenUri}
                  <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>
              </Button>
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t.aboutSocials}
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {tokenUrl ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <a href={tokenUrl} target="_blank" rel="noopener noreferrer">
                  Solscan <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            ) : null}
            {market.twitterUrl ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <a href={market.twitterUrl} target="_blank" rel="noopener noreferrer">
                  X
                </a>
              </Button>
            ) : null}
            {market.telegramUrl ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <a href={market.telegramUrl} target="_blank" rel="noopener noreferrer">
                  Telegram
                </a>
              </Button>
            ) : null}
            {market.discordUrl ? (
              <Button asChild size="sm" variant="outline" className="h-8">
                <a href={market.discordUrl} target="_blank" rel="noopener noreferrer">
                  {t.discord}
                </a>
              </Button>
            ) : null}
          </dd>
        </div>
      </dl>

      {market.disableSell ? (
        <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-3 text-sm text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mb-1 inline h-4 w-4 align-text-bottom" aria-hidden />
          <span className="ml-1">{t.aboutDisableSell}</span>
        </div>
      ) : null}

      <div className="mt-4">
        <SubtleNote icon={ShieldAlert}>{t.metaDisclaimer}</SubtleNote>
      </div>
    </GlassCard>
  );
}
