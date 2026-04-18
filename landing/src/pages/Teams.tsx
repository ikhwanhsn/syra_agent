import { useCallback, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Copy,
  Fingerprint,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LINK_TELEGRAM } from "../../config/global";
import { cn } from "@/lib/utils";
import {
  lookupSyraTeamContact,
  normalizeSocialHandle,
  type SyraTeamMember,
  type SyraTeamPlatform,
} from "@/data/teamMembers";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

type TeamSubmission = { platform: SyraTeamPlatform; query: string };

function roleBadgeClass(role: SyraTeamMember["role"]): string {
  switch (role) {
    case "founder":
      return "border-success/40 bg-success/[0.12] text-success";
    case "core":
      return "border-neon-blue/35 bg-neon-blue/[0.1] text-neon-blue";
    case "advisor":
      return "border-border bg-muted/45 text-muted-foreground";
    default:
      return "border-border bg-muted/35 text-muted-foreground";
  }
}

const platformMeta: Record<SyraTeamPlatform, { label: string; short: string }> = {
  x: { label: "X (Twitter)", short: "X" },
  telegram: { label: "Telegram", short: "Telegram" },
};

function PlatformSwitcher({
  value,
  onChange,
}: {
  value: SyraTeamPlatform;
  onChange: (p: SyraTeamPlatform) => void;
}) {
  return (
    <div
      className="relative flex w-full gap-1 rounded-2xl border border-border/70 bg-muted/25 p-1 shadow-inner sm:max-w-md"
      role="tablist"
      aria-label="Verification platform"
    >
      {(["x", "telegram"] as const).map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className={cn(
              "relative flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground/90",
            )}
          >
            {active ? (
              <motion.span
                layoutId="teams-platform-bg"
                className="absolute inset-0 rounded-xl border border-border/60 bg-background/95 shadow-[0_1px_0_hsl(var(--foreground)/0.04),0_8px_24px_-4px_hsl(0_0%_0%/0.25)] dark:shadow-[0_1px_0_hsl(var(--foreground)/0.06),0_12px_32px_-8px_hsl(0_0%_0%/0.55)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10 flex items-center justify-center gap-2">
              {p === "x" ? (
                <span className="text-sm font-bold tracking-tight">X</span>
              ) : (
                <Send className="h-4 w-4 opacity-90" aria-hidden />
              )}
              <span className="hidden sm:inline">{platformMeta[p].label}</span>
              <span className="sm:hidden">{platformMeta[p].short}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function Teams() {
  const formId = useId();
  const [platform, setPlatform] = useState<SyraTeamPlatform>("x");
  const [query, setQuery] = useState("");
  const [lastSubmission, setLastSubmission] = useState<TeamSubmission | null>(null);
  const [copied, setCopied] = useState(false);

  const hit = useMemo(() => {
    if (!lastSubmission) return undefined;
    return lookupSyraTeamContact(lastSubmission.platform, lastSubmission.query);
  }, [lastSubmission]);

  const onVerify = useCallback(() => {
    setLastSubmission({ platform, query });
    setCopied(false);
  }, [platform, query]);

  const onTryExample = useCallback((p: SyraTeamPlatform) => {
    setPlatform(p);
    setQuery("ikhwanhsn");
    setLastSubmission({ platform: p, query: "ikhwanhsn" });
    setCopied(false);
  }, []);

  const onCopyProfile = useCallback((url: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const onSelectPlatform = useCallback((p: SyraTeamPlatform) => {
    setPlatform(p);
    setLastSubmission(null);
    setCopied(false);
  }, []);

  const showEmptySubmit =
    lastSubmission !== null &&
    normalizeSocialHandle(lastSubmission.query, lastSubmission.platform) === "";

  const submittedDisplayHandle =
    lastSubmission === null
      ? ""
      : normalizeSocialHandle(lastSubmission.query, lastSubmission.platform);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <main className="relative z-10 pb-28 pt-28">
        {/* Depth — aligned with hero ambient treatment */}
        <div className="pointer-events-none absolute inset-0 opacity-50 grid-pattern" />
        <div className="pointer-events-none absolute inset-0 opacity-30 grid-pattern-accent" />
        <div className="pointer-events-none absolute inset-0 section-glow-left opacity-60" />
        <div className="pointer-events-none absolute inset-0 section-glow-right opacity-35" />
        <div className="pointer-events-none absolute top-24 left-[8%] h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-[120px] sm:left-[12%]" />
        <div className="pointer-events-none absolute bottom-20 right-[6%] h-[380px] w-[380px] rounded-full bg-accent/[0.07] blur-[110px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/"
              className="group mb-12 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.04] hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Home
            </Link>
          </motion.div>

          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-16">
            <div>
              <motion.header
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-12 max-w-3xl"
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/40 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success/90 shadow-[0_0_10px_hsl(var(--success)/0.45)]" />
                  </span>
                  <span className="font-medium text-foreground/90">Public roster</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="section-eyebrow-gradient font-semibold uppercase tracking-wider">
                    Trust
                  </span>
                </div>

                <h1 className="text-[2.35rem] font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl md:text-[3.25rem]">
                  <span className="text-foreground">Team</span>{" "}
                  <span className="neon-text">verification</span>
                  <span className="text-foreground">.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Confirm an X or Telegram identity against Syra’s published directory before you reply,
                  send funds, or trust “official” outreach.
                </p>
              </motion.header>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/[0.35] shadow-[0_24px_80px_-24px_hsl(0_0%_0%/0.45)] backdrop-blur-xl dark:bg-card/[0.25] dark:shadow-[0_28px_90px_-28px_hsl(0_0%_0%/0.65)]"
              >
                {/* Hairline spectrum accent */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent"
                  aria-hidden
                />

                <div className="relative border-b border-border/60 bg-gradient-to-b from-muted/[0.2] to-transparent px-5 py-8 sm:px-10 sm:py-9">
                  <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Platform
                      </p>
                      <p className="text-sm text-muted-foreground">Choose where the handle lives.</p>
                    </div>
                    <PlatformSwitcher value={platform} onChange={onSelectPlatform} />
                  </div>

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <label
                        htmlFor={`${formId}-handle-${platform}`}
                        className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        {platform === "x" ? "Handle or profile URL" : "Username or t.me link"}
                      </label>
                      <div className="flex rounded-2xl border border-input/90 bg-background/90 shadow-sm ring-offset-background transition-shadow duration-200 focus-within:border-ring/40 focus-within:shadow-[0_0_0_3px_hsl(var(--ring)/0.12)] focus-within:ring-0">
                        <span
                          className="flex select-none items-center rounded-l-2xl border-r border-border/70 bg-muted/30 px-4 font-mono text-sm font-medium text-muted-foreground"
                          aria-hidden
                        >
                          @
                        </span>
                        <Input
                          key={platform}
                          id={`${formId}-handle-${platform}`}
                          name={platform === "x" ? "x-handle" : "telegram-handle"}
                          type="text"
                          inputMode="text"
                          autoComplete="username"
                          spellCheck={false}
                          placeholder={
                            platform === "x"
                              ? "ikhwanhsn or https://x.com/…"
                              : "ikhwanhsn or https://t.me/…"
                          }
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              onVerify();
                            }
                          }}
                          className="h-14 rounded-none rounded-r-2xl border-0 bg-transparent py-3 pl-4 pr-4 text-base shadow-none placeholder:text-muted-foreground/55 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-[15px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end lg:w-[200px]">
                      <Button
                        type="button"
                        size="lg"
                        className="h-14 w-full rounded-2xl text-[15px] font-semibold shadow-md transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                        onClick={onVerify}
                      >
                        <Search className="h-4 w-4 opacity-90" />
                        Verify identity
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/40 pt-6">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick try
                    </span>
                    <button
                      type="button"
                      onClick={() => onTryExample("x")}
                      className="rounded-full border border-border/80 bg-background/50 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.06] hover:shadow-sm"
                    >
                      X · @ikhwanhsn
                    </button>
                    <button
                      type="button"
                      onClick={() => onTryExample("telegram")}
                      className="rounded-full border border-border/80 bg-background/50 px-3.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/[0.06] hover:shadow-sm"
                    >
                      Telegram @ikhwanhsn
                    </button>
                  </div>
                </div>

                <div className="relative px-5 py-8 sm:px-10 sm:py-10">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Result
                    </p>
                    {lastSubmission ? (
                      <span className="rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                        {lastSubmission.platform === "x" ? "X lookup" : "Telegram lookup"}
                      </span>
                    ) : null}
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {lastSubmission === null ? (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-muted/[0.12] px-6 py-14 text-center sm:px-10 sm:py-16"
                      >
                        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-foreground/[0.04] blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-ring/[0.06] blur-3xl" />

                        <motion.div
                          animate={{ scale: [1, 1.03, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border/80 bg-card/80 shadow-sm"
                        >
                          <Fingerprint className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
                        </motion.div>
                        <p className="relative mt-6 text-base font-semibold tracking-tight text-foreground">
                          Ready when you are
                        </p>
                        <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                          Run a check against Syra’s public roster. Handles support pasted profile URLs.
                        </p>
                      </motion.div>
                    ) : showEmptySubmit ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6 sm:p-8"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-base font-semibold tracking-tight text-foreground">
                              Add a username
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              Paste a handle (with or without <span className="font-mono">@</span>) or a
                              profile link, then run{" "}
                              <span className="font-medium text-foreground">Verify identity</span>.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : hit ? (
                      <motion.div
                        key={`verified-${hit.platform}-${hit.handle}`}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="relative overflow-hidden rounded-2xl border border-success/30 bg-gradient-to-b from-success/[0.09] via-card/30 to-card/[0.08] p-6 shadow-sm sm:p-8"
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-success/60 via-foreground/25 to-transparent" />
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
                            <div className="relative shrink-0">
                              <div className="absolute inset-0 rounded-full bg-success/15 blur-xl" />
                              <Avatar className="relative h-[4.5rem] w-[4.5rem] border-2 border-success/35 shadow-md ring-4 ring-success/10 ring-offset-2 ring-offset-background sm:h-20 sm:w-20">
                                <AvatarFallback className="bg-gradient-to-br from-muted via-background to-muted text-lg font-semibold tracking-tight sm:text-xl">
                                  {initials(hit.member.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-success/90 text-background shadow-md">
                                <BadgeCheck className="h-4 w-4" strokeWidth={2.5} />
                              </div>
                            </div>
                            <div className="min-w-0 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl sm:tracking-tight">
                                  {hit.member.displayName}
                                </p>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                    roleBadgeClass(hit.member.role),
                                  )}
                                >
                                  {hit.member.roleLabel}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-border/80 bg-background/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                  {hit.platform === "x" ? "X" : "TG"}
                                </span>
                              </div>
                              <p className="font-mono text-sm text-muted-foreground sm:text-base">
                                @{hit.handle}
                              </p>
                            </div>
                          </div>

                          <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-end lg:w-auto lg:flex-col">
                            <a
                              href={hit.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/90 px-5 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.04] hover:shadow-md sm:min-w-[200px]"
                            >
                              {hit.platform === "x" ? "Open on X" : "Open in Telegram"}
                              <ArrowUpRight className="h-4 w-4 opacity-80" />
                            </a>
                            <button
                              type="button"
                              onClick={() => onCopyProfile(hit.profileUrl)}
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-transparent px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground sm:min-w-[200px]"
                            >
                              <Copy className="h-4 w-4 shrink-0" />
                              {copied ? "Copied link" : "Copy profile link"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-8 rounded-xl border border-border/60 bg-background/35 p-5 backdrop-blur-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Verification statement
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                            This{" "}
                            {hit.platform === "x" ? (
                              <span className="font-semibold text-foreground">X</span>
                            ) : (
                              <span className="font-semibold text-foreground">Telegram</span>
                            )}{" "}
                            identity matches Syra’s public directory as{" "}
                            <span className="font-semibold text-foreground">{hit.member.roleLabel}</span>.
                            Still verify links out-of-band, and never share seeds or signing permissions.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`not-listed-${lastSubmission.platform}-${submittedDisplayHandle}`}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-2xl border border-border/80 bg-muted/[0.08] p-6 sm:p-8"
                      >
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
                              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <p className="text-base font-semibold tracking-tight text-foreground">
                                Not in this directory
                              </p>
                              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                                <span className="font-mono font-medium text-foreground/95">
                                  @{submittedDisplayHandle}
                                </span>{" "}
                                on{" "}
                                <span className="font-semibold text-foreground">
                                  {lastSubmission.platform === "x" ? "X" : "Telegram"}
                                </span>{" "}
                                is not listed here. Absence of a match is not proof of impersonation — only
                                that this roster does not currently include that handle.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                            <a
                              href="https://x.com/syra_agent"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/90 px-4 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
                            >
                              Syra on X
                              <ArrowUpRight className="h-4 w-4 opacity-80" />
                            </a>
                            <a
                              href={LINK_TELEGRAM}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/90 px-4 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
                            >
                              Syra on Telegram
                              <ArrowUpRight className="h-4 w-4 opacity-80" />
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-8 rounded-2xl border border-border/50 bg-muted/[0.08] px-5 py-4 text-xs leading-relaxed text-muted-foreground backdrop-blur-sm sm:px-6"
              >
                Coverage expands as the team grows. For announcements and support, prefer links from this
                site, Syra’s docs, and the official Syra accounts linked above.
              </motion.p>
            </div>

            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="lg:sticky lg:top-28"
            >
              <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/[0.35] p-8 shadow-[0_20px_60px_-28px_hsl(0_0%_0%/0.5)] backdrop-blur-xl dark:bg-card/[0.22]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/12 to-transparent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Why it matters
                </p>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-foreground">
                  Imposter-resistant checks
                </h2>
                <ul className="mt-8 space-y-0">
                  {[
                    {
                      step: "01",
                      title: "Directory-backed",
                      body: "Confirms whether a handle is intentionally published as Syra team.",
                      icon: Shield,
                    },
                    {
                      step: "02",
                      title: "Link you can audit",
                      body: "Listed results include a profile URL to compare with the account messaging you.",
                      icon: BadgeCheck,
                    },
                    {
                      step: "03",
                      title: "Official surfaces",
                      body: "Use this page alongside the site, docs, Syra on X, and Syra on Telegram.",
                      icon: Sparkles,
                    },
                  ].map((item, i) => (
                    <li key={item.step} className="relative flex gap-4 pb-8 last:pb-0">
                      {i < 2 ? (
                        <div
                          className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-border to-transparent"
                          aria-hidden
                        />
                      ) : null}
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 shadow-sm">
                        <item.icon className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {item.step}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
