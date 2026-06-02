import { PlaygroundSessionProvider } from "@/contexts/PlaygroundSessionContext";
import PlaygroundIndex from "@/pages/playground/Index";

/** Shared request links: `/playground/s/:slug` */
export default function PlaygroundShareRoute() {
  return (
    <PlaygroundSessionProvider>
      <PlaygroundIndex />
    </PlaygroundSessionProvider>
  );
}
