import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BrandMark } from "./BrandMark";
import { Mail, Send, Twitter } from "lucide-react";
import {
  EMAIL_SUPPORT,
  LINK_AGENT,
  LINK_DOCS,
  LINK_PLAYGROUND,
  LINK_TELEGRAM,
  LINK_X,
} from "../../config/global";
import { SITE_ORIGIN } from "@/config/site";

export const Footer = () => {
  return (
    <footer className="relative border-t border-border/60 bg-gradient-to-b from-background to-card/30">
      <div className={cn(siteShell, "py-12 sm:py-20")}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="landing-institutional-panel relative overflow-hidden p-8 sm:p-12 md:p-14"
        >
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <p className="landing-eyebrow">Institutional allocator</p>
            <h2 className="landing-section-title mt-5 text-foreground">
              Underwrite <span className="text-foreground">Up Only Fund</span> like a venture allocator—not a headline.
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              We publish how capital and strategy are aimed at Solana-native growth; execution, venue rules, and token risk
              still live on-chain. This site is transparency and tooling—never a promise of returns.
            </p>
            <div className="mt-8 flex min-w-0 flex-col items-stretch justify-center gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-center">
              <Link
                to="/"
                className="inline-flex min-h-12 w-full min-w-0 items-center justify-center rounded-md bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 min-[400px]:w-auto min-[400px]:px-6"
              >
                Landing overview
              </Link>
              <a
                href={`mailto:${EMAIL_SUPPORT}`}
                className="inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 break-all rounded-md border border-border/60 bg-transparent px-3 text-sm font-medium text-foreground transition hover:border-border min-[400px]:w-auto min-[400px]:px-6 sm:break-normal"
              >
                <Mail className="h-4 w-4 shrink-0" />
                Email support
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground/90">
              Agent, APIs, and playground:{" "}
              <a href={LINK_AGENT} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                open agent
              </a>
              ,{" "}
              <a href={LINK_DOCS} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                docs
              </a>
              ,{" "}
              <a href={LINK_PLAYGROUND} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                playground
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
              Onchain capital for high conviction bets — mandate-first, disclosure-heavy, and structurally separate from the liquid{" "}
              <span className="font-mono text-foreground/90">$UPONLY</span> tranche. Not an offer. Not financial advice.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={LINK_X}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background/50 text-foreground transition hover:border-border hover:bg-muted/40"
                aria-label="Up Only Fund on X"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={LINK_TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 bg-background/50 text-foreground transition hover:border-border hover:bg-muted/40"
                aria-label="Up Only Fund on Telegram"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 md:pl-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Program</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    Landing overview
                  </Link>
                </li>
                <li>
                  <Link to="/#thesis" className="text-muted-foreground transition hover:text-foreground">
                    Allocation thesis
                  </Link>
                </li>
                <li>
                  <Link to="/#mandate" className="text-muted-foreground transition hover:text-foreground">
                    Investment mandate
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Developers</h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href={LINK_DOCS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    API docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://solana.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    Solana
                  </a>{" "}
                  <span className="text-[0.65rem] text-muted-foreground/80">(network)</span>
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
                    href={`${SITE_ORIGIN}/privacy`}
                    className="text-muted-foreground transition hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href={`${SITE_ORIGIN}/terms`}
                    className="text-muted-foreground transition hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href={`${SITE_ORIGIN}/cookies`}
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
          <p className="text-center sm:text-right">Onchain Capital · Solana</p>
        </div>
      </div>
    </footer>
  );
};
