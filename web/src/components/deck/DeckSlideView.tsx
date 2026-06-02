import type { DeckSlide } from "@/content/syraPitchDeck";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface DeckSlideViewProps {
  slide: DeckSlide;
  isActive: boolean;
}

export function DeckSlideView({ slide, isActive }: DeckSlideViewProps) {
  return (
    <article
      aria-hidden={!isActive}
      className={cn(
        "deck-slide absolute inset-0 flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20",
        "transition-[opacity,transform] duration-500 ease-out",
        isActive ? "deck-slide-active z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{renderSlideBody(slide)}</div>
    </article>
  );
}

function renderSlideBody(slide: DeckSlide) {
  switch (slide.kind) {
    case "cover":
      return (
        <div className="flex flex-col items-start gap-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
            {slide.eyebrow}
          </p>
          <div className="flex items-center gap-6">
            <img
              src="/images/logo.jpg"
              alt=""
              className="h-16 w-16 rounded-2xl border border-white/10 object-cover shadow-2xl sm:h-20 sm:w-20"
            />
            <h1 className="font-display text-6xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
              {slide.title}
            </h1>
          </div>
          <p className="max-w-3xl font-display text-2xl font-light leading-snug text-white/85 sm:text-3xl lg:text-4xl">
            {slide.subtitle}
          </p>
          <p className="font-mono text-sm text-white/40">{slide.footnote}</p>
        </div>
      );

    case "statement":
      return (
        <div className="space-y-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">{slide.kicker}</p>
          <h2 className="max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {slide.headline}
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-white/65 sm:text-xl">{slide.body}</p>
          {slide.bullets && slide.bullets.length > 0 ? (
            <ul className="grid max-w-3xl gap-3 pt-2 sm:grid-cols-2">
              {slide.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/70"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/50" aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );

    case "pillars":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slide.pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent p-5 transition-colors hover:border-white/15"
              >
                <pillar.icon className="mb-4 h-5 w-5 text-white/55" strokeWidth={1.5} />
                <h3 className="font-display text-base font-medium text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "flow":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="grid gap-4 lg:grid-cols-3">
            {slide.steps.map((step, index) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 lg:p-8"
              >
                {index < slide.steps.length - 1 ? (
                  <span
                    className="absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-white/15 lg:block"
                    aria-hidden
                  />
                ) : null}
                <p className="font-mono text-xs text-white/35">{step.step}</p>
                <h3 className="mt-3 font-display text-xl font-medium text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "capabilities":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            {slide.rows.map((row) => (
              <div
                key={row.title}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:gap-8 sm:py-5"
              >
                <p className="font-display text-sm font-medium text-white">{row.title}</p>
                <p className="text-sm leading-relaxed text-white/55">{row.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "stack":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="space-y-3">
            {slide.layers.map((layer, index) => (
              <div
                key={layer.label}
                className="grid gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 sm:grid-cols-[8rem_1fr]"
                style={{ marginLeft: `${index * 12}px`, maxWidth: `calc(100% - ${index * 12}px)` }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{layer.label}</p>
                <ul className="space-y-1.5">
                  {layer.items.map((item) => (
                    <li key={item} className="text-sm text-white/65">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );

    case "market":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="grid gap-4 sm:grid-cols-3">
            {slide.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6"
              >
                <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-medium text-white/80">{stat.label}</p>
                {stat.detail ? (
                  <p className="mt-2 text-xs leading-relaxed text-white/45">{stat.detail}</p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="max-w-3xl text-lg leading-relaxed text-white/60">{slide.narrative}</p>
        </div>
      );

    case "business":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="grid gap-4 sm:grid-cols-2">
            {slide.streams.map((stream) => (
              <div
                key={stream.title}
                className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.05] to-transparent p-6"
              >
                <h3 className="font-display text-lg font-medium text-white">{stream.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{stream.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "traction":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slide.items.map((item) => {
              const inner = (
                <>
                  <item.icon className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                  <h3 className="mt-4 font-display text-base font-medium text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{item.description}</p>
                  {item.href ? (
                    <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-white/25 transition-colors group-hover:text-white/60" />
                  ) : null}
                </>
              );
              const className =
                "group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-colors hover:border-white/15";
              if (item.href) {
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {inner}
                  </a>
                );
              }
              return (
                <div key={item.title} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      );

    case "roadmap":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="grid gap-4 sm:grid-cols-2">
            {slide.quarters.map((quarter) => (
              <div
                key={quarter.period}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/45">{quarter.period}</p>
                <ul className="mt-4 space-y-2">
                  {quarter.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-white/60">
                      <span className="text-white/30" aria-hidden>
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );

    case "moat":
      return (
        <div className="space-y-10">
          <DeckHeader kicker={slide.kicker} headline={slide.headline} />
          <div className="overflow-hidden rounded-2xl border border-white/[0.07]">
            <div className="grid grid-cols-[minmax(8rem,12rem)_1fr] border-b border-white/[0.06] bg-white/[0.04] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
              <span>Dimension</span>
              <span>Syra</span>
            </div>
            {slide.rows.map((row) => (
              <div
                key={row.dimension}
                className="grid grid-cols-1 gap-1 border-b border-white/[0.05] px-5 py-4 last:border-0 sm:grid-cols-[minmax(8rem,12rem)_1fr] sm:gap-8"
              >
                <p className="text-sm font-medium text-white/75">{row.dimension}</p>
                <p className="text-sm leading-relaxed text-white/55">{row.syra}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "closing":
      return (
        <div className="flex flex-col items-start gap-10">
          <div className="space-y-4">
            <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {slide.headline}
            </h2>
            <p className="max-w-2xl text-lg text-white/60">{slide.subline}</p>
          </div>
          <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
            {slide.contacts.map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                    {contact.label}
                  </p>
                  <p className="mt-1 font-display text-sm text-white">{contact.value}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-white/70" />
              </a>
            ))}
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-white/35">{slide.disclaimer}</p>
        </div>
      );

    default:
      return null;
  }
}

function DeckHeader({ kicker, headline }: { kicker: string; headline: string }) {
  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">{kicker}</p>
      <h2 className="max-w-4xl font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
        {headline}
      </h2>
    </div>
  );
}
