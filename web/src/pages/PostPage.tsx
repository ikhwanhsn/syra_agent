import { Link } from "react-router-dom";
import { ImageIcon, Video } from "lucide-react";
import { PostXStatusLabel } from "@/components/post/PostXStatusControl";
import { LATEST_POST_UPDATE_NUMBER, POST_REGISTRY } from "@/content/posts";

/** Hub for ship-log social formats — video deck or photo templates. */
export default function PostPage() {
  const updates = [...POST_REGISTRY].reverse();

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
            to={`/post/video/${LATEST_POST_UPDATE_NUMBER}`}
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
            to={`/post/photo/${LATEST_POST_UPDATE_NUMBER}`}
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

        {updates.length > 0 ? (
          <div className="mt-8 text-left">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Ship log updates
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                <span className="text-emerald-400/80">● Posted</span>
                <span className="mx-1.5 text-white/20">·</span>
                <span className="text-amber-300/70">● Not posted</span>
              </p>
            </div>
            <ul className="space-y-2">
              {updates.map((bundle) => {
                const { meta } = bundle.video;
                const isLatest = meta.updateNumber === LATEST_POST_UPDATE_NUMBER;

                return (
                  <li key={meta.updateNumber}>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/85">
                          #{meta.updateNumber} · {meta.title}
                          {isLatest ? (
                            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#F3BA2F]/80">
                              Latest
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate font-mono text-[10px] text-white/35">{meta.published}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PostXStatusLabel
                          updateNumber={meta.updateNumber}
                          defaultPosted={meta.postedOnX}
                        />
                        <Link
                          to={`/post/video/${meta.updateNumber}`}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-[#F3BA2F]/80"
                        >
                          Video
                        </Link>
                        <Link
                          to={`/post/photo/${meta.updateNumber}`}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45 transition-colors hover:text-[#F3BA2F]/80"
                        >
                          Photo
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
