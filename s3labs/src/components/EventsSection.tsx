import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeader from "@/components/landing/SectionHeader";
import { Button } from "@/components/ui/button";
import { EVENTS, EVENTS_LANDING_LIMIT } from "@/lib/events";
import { Calendar, MapPin, ArrowRight, Sparkles, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const EventsSection = () => {
  const { t } = useLanguage();
  const displayEvents = EVENTS.slice(0, EVENTS_LANDING_LIMIT);

  return (
    <section id="events" className="scroll-mt-24 section-shell bg-gradient-subtle">
      <div className="section-divider" />
      <div className="container relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 lg:mb-16">
          <SectionHeader
            className="mb-0 lg:text-left lg:mx-0"
            align="left"
            eyebrow={t("Komunitas", "Community")}
            title={
              <>
                {t("Event", "Events")}{" "}
                <span className="text-gradient">{t("S3Labs", "at S3Labs")}</span>
              </>
            }
            description={t(
              "Workshop, meetup, dan acara untuk developer Solana. Bergabung dan tingkatkan skill Anda.",
              "Workshops, meetups, and events for Solana developers. Join and level up your skills.",
            )}
          />
          <Button variant="heroOutline" size="default" className="shrink-0 rounded-full group" asChild>
            <Link to="/events">
              {t("Lihat Semua Event", "Show All Events")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="flex items-stretch gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth scrollbar-hide-md">
          {displayEvents.map((event) => (
            <article
              key={event.id}
              className="flex flex-col flex-shrink-0 w-[min(300px,calc(100vw-2.5rem))] md:min-w-0 md:flex-1 md:basis-0 snap-center group"
            >
              <div className="card-premium-hover overflow-hidden flex flex-col flex-1">
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {event.comingSoon ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/60 text-muted-foreground p-6">
                      <Sparkles className="w-10 h-10 mb-3 opacity-50" />
                      <span className="text-sm font-medium">
                        {t("Segera Hadir", "Coming Soon")}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={event.image}
                      alt={t(event.titleId, event.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  {!event.comingSoon && event.date && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent p-3">
                      <div className="flex items-center gap-1.5 text-white/95 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {event.date}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-2 tracking-tight group-hover:text-primary transition-colors">
                    {t(event.titleId, event.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                    {t(event.descriptionId, event.description)}
                  </p>
                  {!event.comingSoon && event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {!event.comingSoon && event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {t("Join Space di X", "Join Space on X")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
