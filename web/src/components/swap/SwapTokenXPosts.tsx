import { BadgeCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { IntelligenceEmptyMessage } from "@/components/assets/intelligence/IntelligenceEmptyMessage";
import type { TokenXPostItem } from "@/lib/tokensDossierApi";

function formatFollowers(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatRelativeTime(raw: string): string {
  if (!raw) return "";
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return raw;
  const deltaSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (deltaSec < 60) return `${deltaSec}s`;
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m`;
  if (deltaSec < 86_400) return `${Math.floor(deltaSec / 3600)}h`;
  return `${Math.floor(deltaSec / 86_400)}d`;
}

export function SwapTokenXPosts({
  posts,
  isLoading,
  idle = false,
  onLoad,
  errorMessage,
  className,
}: {
  posts: TokenXPostItem[];
  isLoading: boolean;
  /** When true, no API call has been made yet — show a load affordance. */
  idle?: boolean;
  onLoad?: () => void;
  errorMessage?: string;
  className?: string;
}) {
  return (
    <Card className={cn(overviewCardShell, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">X posts</CardTitle>
        <CardDescription className="text-xs">
          Recent mentions related to this token
        </CardDescription>
      </CardHeader>
      <CardContent>
        {idle ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-xs text-muted-foreground">
              Load recent mentions on demand to avoid unnecessary API usage.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onLoad}>
              Load X posts
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-3 w-full rounded-md" />
                  <Skeleton className="h-3 w-[80%] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => {
              const followers = formatFollowers(post.followers);
              const age = formatRelativeTime(post.createdAt);
              return (
                <article
                  key={post.id}
                  className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  {post.profileImageUrl ? (
                    <img
                      src={post.profileImageUrl}
                      alt=""
                      className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-border/50 object-cover"
                    />
                  ) : (
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted/40 text-xs font-semibold text-muted-foreground">
                      {(post.displayName || post.username || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-sm font-medium">
                          <span className="truncate">{post.displayName || post.username}</span>
                          {post.verified ? (
                            <BadgeCheck
                              className="h-3.5 w-3.5 shrink-0 text-sky-500"
                              aria-label="Verified"
                            />
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{post.username}
                          {followers ? ` · ${followers}` : ""}
                          {age ? ` · ${age}` : ""}
                        </p>
                      </div>
                      {post.url ? (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          aria-label="Open post on X"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/90 line-clamp-3">
                      {post.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <IntelligenceEmptyMessage>
            {errorMessage?.trim() || "No recent X posts found for this token."}
          </IntelligenceEmptyMessage>
        )}
      </CardContent>
    </Card>
  );
}
