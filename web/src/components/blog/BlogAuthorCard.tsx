import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { ArticleAuthor } from "@/data/marketing/articleContent";
import { cn } from "@/lib/utils";

interface BlogAuthorCardProps {
  author: ArticleAuthor;
  variant?: "inline" | "card";
}

export function BlogAuthorCard({ author, variant = "card" }: BlogAuthorCardProps) {
  const initials = author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <>
      <Avatar className="h-12 w-12 shrink-0 rounded-xl border border-border/50 sm:h-14 sm:w-14">
        <AvatarImage src={author.avatar} alt="" className="object-cover" />
        <AvatarFallback className="rounded-xl bg-muted font-display text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          Written by
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="font-display text-base font-semibold tracking-tight text-foreground">
            {author.name}
          </p>
          {author.xHandle && author.xUrl ? (
            <a
              href={author.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/55 bg-muted/15 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {author.xHandle}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{author.role}</p>
        {variant === "card" ? (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{author.bio}</p>
        ) : null}
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="flex items-center gap-4"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className={cn(overviewCardShell, "p-5")}
      aria-label="Author information"
    >
      <div className="flex gap-4">{content}</div>
    </motion.aside>
  );
}
