import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ExternalLink } from "lucide-react";

import { KolProfileAvatar } from "@/components/kol/KolProfileAvatar";
import { SourceTweetMedia } from "@/components/kol/SourceTweetMedia";
import type { KolTweetMedia } from "@/lib/kolApi";
import { cn } from "@/lib/utils";

const TWEET_ENTITY_PATTERN = /(https?:\/\/[^\s]+|@[\w_]+|#[\w_]+)/g;

function normalizeTweetLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function trimUrlTrailingPunctuation(url: string): { href: string; display: string; extra: string } {
  const trailing = url.match(/[.,;:!?)]+$/);
  if (!trailing) return { href: url, display: url, extra: "" };
  const suffix = trailing[0];
  const trimmed = url.slice(0, -suffix.length);
  return { href: trimmed, display: trimmed, extra: suffix };
}

function renderTweetEntity(token: string, key: string): ReactNode {
  if (token.startsWith("http://") || token.startsWith("https://")) {
    const { href, display, extra } = trimUrlTrailingPunctuation(token);
    return (
      <Fragment key={key}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {display}
        </a>
        {extra}
      </Fragment>
    );
  }

  if (token.startsWith("@")) {
    const handle = token.slice(1);
    return (
      <Link
        key={key}
        to={`/kol/${encodeURIComponent(handle)}`}
        className="text-primary hover:underline"
      >
        {token}
      </Link>
    );
  }

  if (token.startsWith("#")) {
    const tag = token.slice(1);
    return (
      <a
        key={key}
        href={`https://x.com/hashtag/${encodeURIComponent(tag)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {token}
      </a>
    );
  }

  return <Fragment key={key}>{token}</Fragment>;
}

export function TweetText({ text, className }: { text: string; className?: string }) {
  const normalized = normalizeTweetLineEndings(text);
  const parts = normalized.split(TWEET_ENTITY_PATTERN);

  return (
    <p
      className={cn(
        "whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-foreground",
        className,
      )}
    >
      {parts.map((part, index) => {
        if (!part) return null;
        if (
          part.startsWith("http://") ||
          part.startsWith("https://") ||
          part.startsWith("@") ||
          part.startsWith("#")
        ) {
          return renderTweetEntity(part, `${index}-${part}`);
        }
        return <Fragment key={`${index}-text`}>{part}</Fragment>;
      })}
    </p>
  );
}

interface SourceTweetCardProps {
  text: string;
  tweetUrl: string;
  authorHandle?: string | null;
  authorName?: string | null;
  authorVerified?: boolean;
  authorProfilePicture?: string | null;
  media?: KolTweetMedia[];
  className?: string;
}

export function SourceTweetCard({
  text,
  tweetUrl,
  authorHandle,
  authorName,
  authorVerified,
  authorProfilePicture,
  media,
  className,
}: SourceTweetCardProps) {
  const handle = authorHandle?.replace(/^@/, "") ?? "";
  const displayName = authorName?.trim() || handle || "Unknown";
  const hasMedia = (media?.length ?? 0) > 0;
  const hasText = Boolean(text.trim());

  if (!hasText && !hasMedia) return null;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/60 bg-muted/15 overflow-hidden",
        className,
      )}
    >
      <div className="p-4 sm:p-5">
        {handle ? (
          <div className="flex gap-3 mb-3">
            <KolProfileAvatar
              handle={handle}
              name={displayName}
              profilePicture={authorProfilePicture}
              size="md"
              className="rounded-full"
            />
            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[15px] leading-tight truncate">{displayName}</span>
                {authorVerified ? (
                  <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" />
                ) : null}
              </div>
              <a
                href={`https://x.com/${encodeURIComponent(handle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                @{handle}
              </a>
            </div>
          </div>
        ) : null}

        {hasText ? <TweetText text={text} /> : null}
      </div>

      {hasMedia ? (
        <div className={cn("px-4 sm:px-5", hasText ? "pb-4 sm:pb-5" : "py-4 sm:py-5")}>
          <SourceTweetMedia
            media={media!}
            tweetUrl={tweetUrl}
            className="rounded-2xl overflow-hidden border border-border/40"
          />
        </div>
      ) : null}

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          View on X
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
