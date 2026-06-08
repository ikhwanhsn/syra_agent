import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn("blog-share", className)}
      aria-label="Share article"
    >
      <div className="blog-share-panel rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
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
              className="blog-share-btn inline-flex h-10 min-w-[3rem] items-center justify-center rounded-xl px-4 text-sm font-medium transition-all"
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            className="blog-share-copy h-10 gap-2 rounded-xl border-border/60 bg-background/50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy link
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-xs text-muted-foreground">{url}</span>
        </div>
      </div>
    </motion.aside>
  );
}
