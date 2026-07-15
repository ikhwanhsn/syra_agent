import { useEffect, useRef } from "react";
import { InfoPageView } from "@/components/info/InfoPageView";
import { SYRA_TAGLINE } from "@/content/syraInfo";

/** Internal team brief — reachable only via /info (not linked in nav or search). */
export default function InfoPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `Syra · Internal info · ${SYRA_TAGLINE}`;
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) {
      meta.setAttribute("content", "noindex, nofollow");
    } else {
      const el = document.createElement("meta");
      el.name = "robots";
      el.content = "noindex, nofollow";
      document.head.appendChild(el);
    }
    return () => {
      document.title = "Syra";
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="info-scroll-root flex h-[100dvh] min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain scroll-smooth"
    >
      <InfoPageView scrollContainerRef={scrollRef} />
    </div>
  );
}
