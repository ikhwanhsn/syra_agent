import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { FadeIn } from "@/components/discovery/motion/FadeIn";
import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

interface DiscoveryDetailShellProps {
  backHref: string;
  backLabel: string;
  eyebrow?: ReactNode;
  title?: string;
  subtitle?: string;
  hero?: ReactNode;
  sidebar?: ReactNode;
  children?: ReactNode;
  stickyCta?: ReactNode;
  isLoading?: boolean;
  notFound?: {
    title: string;
    description: string;
  };
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-32 rounded-full" />
      <Skeleton className="h-12 w-3/4 max-w-xl rounded-xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function DiscoveryDetailShell({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  hero,
  sidebar,
  children,
  stickyCta,
  isLoading,
  notFound,
}: DiscoveryDetailShellProps) {
  return (
    <SitePageShell>
      <div className={cn(pageContent, "pb-28 lg:pb-20")}>
        <FadeIn>
          <Button
            variant="ghost"
            size="sm"
            className="mb-8 -ml-2 gap-2 rounded-full text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to={backHref}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {backLabel}
            </Link>
          </Button>
        </FadeIn>

        {isLoading ? (
          <DetailSkeleton />
        ) : notFound ? (
          <FadeIn className="panel-glass mx-auto max-w-lg p-10 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{notFound.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {notFound.description}
            </p>
            <Button variant="hero" className="mt-8 rounded-full" asChild>
              <Link to={backHref}>{backLabel}</Link>
            </Button>
          </FadeIn>
        ) : (
          <>
            {hero ? <FadeIn className="mb-10">{hero}</FadeIn> : null}

            {(eyebrow || title || subtitle) && !hero ? (
              <FadeIn className="mb-10 max-w-3xl">
                {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
                {title ? (
                  <h1 className="heading-section text-foreground">{title}</h1>
                ) : null}
                {subtitle ? (
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {subtitle}
                  </p>
                ) : null}
              </FadeIn>
            ) : null}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <FadeIn className="min-w-0 space-y-8" delay={0.08}>
                {children}
              </FadeIn>
              {sidebar ? (
                <FadeIn className="lg:sticky lg:top-28" delay={0.12}>
                  {sidebar}
                </FadeIn>
              ) : null}
            </div>
          </>
        )}
      </div>

      {stickyCta && !isLoading && !notFound ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 p-4 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-lg">{stickyCta}</div>
        </div>
      ) : null}
    </SitePageShell>
  );
}
