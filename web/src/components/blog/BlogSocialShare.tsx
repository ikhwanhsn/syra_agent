import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

interface BlogSocialShareProps {
  title: string;
  url: string;
  className?: string;
}

const SHARE_LINKS = [
  {
    id: "x",
    label: "X",
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
] as const;

export function BlogSocialShare({ title, url, className }: BlogSocialShareProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className={cn(overviewCardShell, "p-4", className)}
      aria-label="Share article"
    >
      <div className="mb-3 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Share</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SHARE_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href(url, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 min-w-[3rem] items-center justify-center rounded-lg border border-border/55 bg-muted/15 px-3 text-sm font-medium transition-colors hover:bg-muted/30"
          >
            {link.label}
          </a>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={copyLink}
          className="h-9 gap-2 rounded-lg border-border/55"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/45 bg-muted/10 px-3 py-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono text-[11px] text-muted-foreground">{url}</span>
      </div>
    </motion.aside>
  );
}
