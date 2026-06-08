import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ArticleAuthor } from "@/data/marketing/articleContent";

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
      <div className="blog-author-avatar-wrap relative shrink-0">
        <div className="blog-author-avatar-ring absolute -inset-1 rounded-2xl" aria-hidden />
        <Avatar className="relative h-14 w-14 rounded-xl border border-border/50 sm:h-16 sm:w-16">
          <AvatarImage src={author.avatar} alt="" className="object-cover" />
          <AvatarFallback className="rounded-xl bg-muted font-display text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Written by
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">
            {author.name}
          </p>
          {author.xHandle && author.xUrl ? (
            <a
              href={author.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              {author.xHandle}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{author.role}</p>
        {variant === "card" ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground/90">
            {author.bio}
          </p>
        ) : null}
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex items-center gap-4"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="blog-author-card group relative overflow-hidden rounded-2xl p-6 sm:p-7"
      aria-label="Author information"
    >
      <div className="blog-author-card-shine pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="relative flex gap-5">{content}</div>
    </motion.aside>
  );
}
