import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BrandMark } from "./BrandMark";
import { Mail } from "lucide-react";
import {
  EMAIL_SUPPORT,
  LINK_AGENT,
  LINK_DOCS,
  LINK_PLAYGROUND,
  LINK_TELEGRAM,
  LINK_X,
} from "../../config/global";

const SYRA_HOME = "https://www.syraa.fun/" as const;

export const Footer = () => {
  return (
    <footer className="relative border-t border-border/60 bg-gradient-to-b from-background to-card/30">
      <div className={cn(siteShell, "py-12 sm:py-20")}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/25 p-6 min-[400px]:rounded-3xl sm:p-10 md:p-12"
        >
          <div
            className="pointer-events-none absolute inset-0 uof-hero-mesh opacity-80"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Build conviction from{" "}
              <span className="uof-wordmark">the mandate</span>, not the narrative.
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Up Only Fund publishes how capital is meant to be deployed across the RISE ecosystem. Execution and venue
              rules still live with RISE and on-chain reality — this site is for transparency and tools, not promises.
            </p>
            <div className="mt-8 flex min-w-0 flex-col items-stretch justify-center gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-center">
              <Link
                to="/uponly/fund"
                className="inline-flex min-h-12 w-full min-w-0 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 min-[400px]:w-auto min-[400px]:px-6"
              >
                Treasury &amp; mandate
              </Link>
              <a
                href={`mailto:${EMAIL_SUPPORT}`}
                className="inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 break-all rounded-xl border border-border/60 bg-background/50 px-3 text-sm font-medium text-foreground backdrop-blur-sm transition hover:border-border min-[400px]:w-auto min-[400px]:px-6 sm:break-normal"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {EMAIL_SUPPORT}
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground/90">
              Need agent or API access?{" "}
              <a
                href={SYRA_HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/90 underline-offset-2 hover:underline"
              >
                Syra
              </a>{" "}
              operates the infrastructure layer —{" "}
              <a href={LINK_AGENT} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                open agent
              </a>
              ,{" "}
              <a href={LINK_DOCS} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                read docs
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>

      <div className={cn(siteShell, "pb-10")}>
        <div className="grid min-w-0 gap-10 border-t border-border/40 pt-10 md:grid-cols-12">
          <div className="min-w-0 md:col-span-4">
            <BrandMark className="text-foreground" compact />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A tech-utility program fund focused on the RISE launch stack — mandate-first, disclosure-heavy, and
              structurally separate from the liquid <span className="font-mono text-foreground/90">$UPONLY</span>{" "}
              tranche. Not an offer. Not financial advice.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <a
                href={LINK_X}
                className="inline-flex text-sm font-medium text-foreground/90 underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Updates on X
              </a>
              <a
                href={LINK_TELEGRAM}
                className="inline-flex text-sm font-medium text-foreground/90 underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 md:pl-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Program</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    to="/uponly/overview"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    $UPONLY tranche
                  </Link>
                </li>
                <li>
                  <Link to="/uponly/fund" className="text-muted-foreground transition hover:text-foreground">
                    Treasury &amp; mandate
                  </Link>
                </li>
                <li>
                  <Link to="/uponly/rise" className="text-muted-foreground transition hover:text-foreground">
                    RISE markets
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Partner stack</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href={SYRA_HOME}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    Syra
                  </a>{" "}
                  <span className="text-[0.65rem] text-muted-foreground/80">(infra)</span>
                </li>
                <li>
                  <a
                    href="https://rise.rich"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    RISE
                  </a>{" "}
                  <span className="text-[0.65rem] text-muted-foreground/80">(venue)</span>
                </li>
                <li>
                  <a
                    href={LINK_PLAYGROUND}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    Playground
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Legal</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href={`${SYRA_HOME}privacy`}
                    className="text-muted-foreground transition hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href={`${SYRA_HOME}terms`}
                    className="text-muted-foreground transition hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href={`${SYRA_HOME}cookies`}
                    className="text-muted-foreground transition hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Up Only Fund program. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Infrastructure from{" "}
            <a
              href={SYRA_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground/85 underline-offset-2 hover:underline"
            >
              Syra
            </a>
            . Program narrative is UOF.
          </p>
        </div>
      </div>
    </footer>
  );
};
