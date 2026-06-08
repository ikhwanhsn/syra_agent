import { Link } from "react-router-dom";
import { ImageIcon, Video } from "lucide-react";

/** Hub for ship-log social formats — video deck or photo templates. */
export default function PostPage() {
  return (
    <div className="post-root relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden bg-[#030303] px-4 py-8 text-white">
      <div className="post-ambient pointer-events-none absolute inset-0" aria-hidden />
      <div className="post-orb post-orb-a pointer-events-none absolute rounded-full" aria-hidden />
      <div className="post-orb post-orb-b pointer-events-none absolute rounded-full" aria-hidden />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src="/images/logo.jpg"
            alt=""
            className="h-10 w-10 rounded-xl border border-white/10 object-cover"
          />
          <div className="text-left">
            <h1 className="font-display text-lg font-medium tracking-tight">Syra Ship Log</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Social post studio</p>
          </div>
        </div>

        <p className="mb-8 text-sm text-white/55">
          Choose a format for your X update. Record the video deck or export a branded photo.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/post/video"
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[#F3BA2F]/30 hover:bg-[#F3BA2F]/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 text-[#F3BA2F]">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-medium text-white/90">Video</p>
              <p className="mt-1 text-xs text-white/45">16:9 slide deck · 74 templates in library</p>
            </div>
          </Link>

          <Link
            to="/post/photo"
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[#F3BA2F]/30 hover:bg-[#F3BA2F]/[0.06]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F3BA2F]/25 bg-[#F3BA2F]/10 text-[#F3BA2F]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-medium text-white/90">Photo</p>
              <p className="mt-1 text-xs text-white/45">50 templates in library · curated picks per update</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
