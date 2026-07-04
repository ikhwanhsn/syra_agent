import { type ReactNode } from "react";
import { Link } from "react-router-dom";

import { FOOTER_BLURB, footerColumns } from "@/lib/landingContent";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.45 4.476-1.458z" />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

const socialIcons: {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
}[] = [
  { href: "https://x.com/s3labs_", label: "X", icon: IconX },
  {
    href: "https://www.linkedin.com/company/s3labs/",
    label: "LinkedIn",
    icon: IconLinkedIn,
  },
  { href: "https://t.me/s3labs", label: "Telegram", icon: IconTelegram },
  {
    href: "mailto:s3labs.company@gmail.com",
    label: "Email",
    icon: IconMail,
  },
];

function FooterLinkItem({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "text-[13px] leading-none text-muted-foreground/80 hover:text-foreground transition-colors duration-200";

  if (external) {
    return (
      <a
        href={href}
        target={href.startsWith("mailto") ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

const Footer = () => (
  <footer
    id="contact"
    className="relative border-t border-border/50 pt-16 sm:pt-20 lg:pt-24 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]"
  >
    <div className={cn(siteShell, "relative z-10")}>
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:gap-x-12">
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-5">
          <Link to="/" className="inline-flex items-center gap-2.5 w-fit group">
            <img
              src="/images/logo.png"
              alt=""
              className="h-7 w-7 rounded-lg ring-1 ring-border/40 group-hover:ring-primary/25 transition-all"
            />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              S3Labs
            </span>
          </Link>
          <p className="text-[13px] leading-relaxed text-muted-foreground/70 max-w-[14rem]">
            {FOOTER_BLURB}
          </p>
          <div className="flex items-center gap-2.5" role="list" aria-label="Social links">
            {socialIcons.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                role="listitem"
                className={cn(
                  "group relative inline-flex h-10 w-10 items-center justify-center rounded-xl",
                  "border border-border/60 bg-muted/20 text-muted-foreground",
                  "shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.04)]",
                  "transition-all duration-200 ease-out",
                  "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                  "hover:shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.35)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "active:translate-y-0 active:scale-[0.97]",
                )}
              >
                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
              </a>
            ))}
          </div>
        </div>

        {footerColumns.map((column) => (
          <nav
            key={column.title}
            aria-label={column.title}
            className="flex flex-col"
          >
            <p className="mb-5 text-[13px] font-medium tracking-tight text-foreground">
              {column.title}
            </p>
            <ul className="flex flex-col gap-3.5">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <FooterLinkItem
                    href={link.href}
                    label={link.label}
                    external={link.external}
                  />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-16 sm:mt-20 lg:mt-24 flex flex-col-reverse gap-4 border-t border-border/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted-foreground/55">
          © {new Date().getFullYear()} S3Labs, Inc.
        </p>
        <p className="text-[12px] text-muted-foreground/45 tracking-wide">
          Discover. Build. Earn.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
