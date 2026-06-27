

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EVENTS } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ApplicationModal from "@/components/ApplicationModal";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const EventsPageContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onApplyClick={() => setIsModalOpen(true)} />
      <main className="pt-20 lg:pt-24">
        {/* Page header */}
        <div className="border-b border-border bg-muted/20">
          <div className={cn(siteShell, "py-12 lg:py-16")}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {"Back to Home"}
            </Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {"All Events"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              {"Workshops, meetups, and events hosted by S3Labs for the Solana ecosystem."}
            </p>
          </div>
        </div>

        {/* Events grid */}
        <div className={cn(siteShell, "py-16 lg:py-24")}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {EVENTS.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {event.comingSoon ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground p-8">
                      <Sparkles className="w-16 h-16 mb-4 opacity-60" />
                      <span className="text-base font-medium">
                        {"Coming Soon"}
                      </span>
                      <p className="text-sm text-center mt-2 max-w-[200px]">
                        {event.description}
                      </p>
                    </div>
                  ) : (
                    <>
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      {event.date && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <div className="flex items-center gap-2 text-white text-sm font-medium">
                            <Calendar className="w-4 h-4 shrink-0" />
                            {event.date}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-white/90 text-xs mt-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {event.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {event.description}
                  </p>
                  {!event.comingSoon && event.link && (
                    <Button variant="outline" size="sm" className="mt-4 w-fit group/btn" asChild>
                      <a href={event.link} target="_blank" rel="noopener noreferrer">
                        {"Join Space on X"}
                        <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                    </Button>
                  )}
                  {!event.comingSoon && !event.link && (
                    <Button variant="outline" size="sm" className="mt-4 w-fit" asChild>
                      <a href="/#contact">
                        {"Register / Info"}
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <ApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const Events = () => <EventsPageContent />;

export default Events;
