import { ArrowUpRight, Coins, SlidersHorizontal } from "lucide-react";

import { Link } from "@/lib/navigation";

import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";

import { playgroundApiCardClass } from "@/components/playground/playgroundStyles";

import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";

import { buildFlowCardDisplay } from "@/lib/x402FlowCardMeta";

import { cn } from "@/lib/utils";



interface SyraApiCardProps {

  flow: ExampleFlowPreset;

  path: string;

  detailHref: string;

  groupName?: string;

  staggerIndex?: number;

}



export function SyraApiCard({

  flow,

  path,

  detailHref,

  groupName,

  staggerIndex = 0,

}: SyraApiCardProps) {

  const card = buildFlowCardDisplay(flow, path, groupName);

  const isGet = flow.method === "GET";



  return (

    <Link

      to={detailHref}

      className={cn(playgroundApiCardClass(false), "block no-underline")}

      style={playgroundStaggerStyle(staggerIndex)}

    >

      <div

        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"

        aria-hidden

      />

      <div

        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"

        aria-hidden

      />



      <div className="relative flex flex-1 flex-col p-4 sm:p-5">

        <div className="mb-3 flex items-start justify-between gap-2">

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">

            {card.categoryLabel ? (

              <span className="inline-flex max-w-full truncate rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground ring-1 ring-border/40">

                {card.categoryLabel}

              </span>

            ) : null}

            {card.groupName && card.groupName !== card.categoryLabel ? (

              <span className="inline-flex max-w-full truncate rounded-md bg-primary/[0.06] px-2 py-0.5 text-[10px] font-medium text-primary/90 ring-1 ring-primary/15">

                {card.groupName}

              </span>

            ) : null}

          </div>

          <div className="flex shrink-0 items-center gap-1.5">

            {card.priceLabel ? (

              <span

                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold tabular-nums text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300"

                title="Catalog price per call"

              >

                <Coins className="h-3 w-3" aria-hidden />

                {card.priceLabel}

              </span>

            ) : null}

            <span

              className={cn(

                "inline-flex items-center rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",

                isGet

                  ? "bg-muted/60 text-muted-foreground ring-1 ring-border/40"

                  : "bg-primary/12 text-primary ring-1 ring-primary/20",

              )}

            >

              {flow.method}

            </span>

          </div>

        </div>



        <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug tracking-tight text-foreground">

          {card.name}

        </h3>

        {(card.summary || card.description) && (

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">

            {card.summary || card.description}

          </p>

        )}



        <div className="mt-3 flex items-center gap-2">

          <code

            className="min-w-0 flex-1 truncate rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 font-mono text-[10px] text-foreground/80"

            title={card.path}

          >

            {card.path}

          </code>

          <ArrowUpRight

            className="h-4 w-4 shrink-0 text-muted-foreground/35 transition-all duration-300 group-hover:text-primary/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"

            aria-hidden

          />

        </div>



        <div className="mt-3 min-h-[2.25rem]">

          {card.paramPreview.length > 0 ? (

            <div className="flex flex-wrap gap-1.5">

              {card.paramPreview.map((param) => (

                <span

                  key={param.key}

                  className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-border/40 bg-background/60 px-2 py-1 font-mono text-[10px] text-muted-foreground"

                  title={`${param.key}=${param.value}`}

                >

                  <span className="text-foreground/70">{param.key}</span>

                  <span className="text-border">=</span>

                  <span className="truncate text-primary/90">{param.value}</span>

                </span>

              ))}

              {card.extraParamCount > 0 ? (

                <span className="inline-flex items-center rounded-md border border-dashed border-border/50 px-2 py-1 text-[10px] font-medium text-muted-foreground">

                  +{card.extraParamCount} more

                </span>

              ) : null}

            </div>

          ) : card.hasParams ? (

            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">

              <SlidersHorizontal className="h-3 w-3" aria-hidden />

              Optional params on detail page

            </span>

          ) : (

            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">

              No query params

            </span>

          )}

        </div>



        <span

          className={cn(

            "playground-try-btn mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground",

            "transition-opacity group-hover:opacity-95",

          )}

        >

          View details

          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />

        </span>

      </div>

    </Link>

  );

}

