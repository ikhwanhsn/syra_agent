import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";

const AUTO_FORMAT = [
  {
    group: "Structure",
    items: ["heading (h2)", "subheading (h3)", "body (paragraph)", "title as bold lead"],
  },
  {
    group: "Inline",
    items: ["bold", "italic", "strikethrough", "link (absolute URLs)"],
  },
  {
    group: "Blocks",
    items: ["quote / callout", "bullet list", "numbered list"],
  },
] as const;

const AUTO_REMAPPED = [
  {
    group: "Remapped for paste",
    items: [
      "table → bullet list",
      "code fence → quote labeled Code",
      "inline code → bold",
      "--- → · · ·",
      "relative links → https://www.syraa.fun/...",
    ],
  },
] as const;

const MANUAL_FORMAT = [
  { group: "Inline", items: ["underline (X toolbar only)"] },
  {
    group: "Blocks",
    items: [
      "native divider (Insert → Divider)",
      "native code block (Insert → Code)",
      "LaTeX (Insert → Equation)",
      "native table (Insert → Table)",
      "image / media (upload in X)",
    ],
  },
] as const;

export interface ArticleXFormatGuideProps {
  className?: string;
}

/** Collapsible hint for pasting into X Articles with correct formatting. */
export function ArticleXFormatGuide({ className }: ArticleXFormatGuideProps) {
  return (
    <details
      className={cn(
        overviewCardShell,
        "group p-4 text-sm text-muted-foreground open:border-accent/30",
        className,
      )}
    >
      <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          X formatting guide
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">
            (tap to expand)
          </span>
          <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">
            (tap to collapse)
          </span>
        </span>
      </summary>

      <div className="mt-3 space-y-4 border-t border-border/50 pt-3">
        <p className="text-xs leading-relaxed">
          <strong className="text-foreground">Copy for X</strong> writes rich HTML using only
          formats X auto-accepts on paste. Unsupported website formats are remapped so nothing
          gets mashed together (tables) or dropped (code).
        </p>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Auto-formats on paste
          </h3>
          <ul className="space-y-2">
            {[...AUTO_FORMAT, ...AUTO_REMAPPED].map((row) => (
              <li key={row.group}>
                <span className="font-medium text-foreground">{row.group}:</span>{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {row.items.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Not paste-supported (manual in X)
          </h3>
          <ul className="space-y-2">
            {MANUAL_FORMAT.map((row) => (
              <li key={row.group}>
                <span className="font-medium text-foreground">{row.group}:</span>{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {row.items.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
            Authoring legend (markdown source)
          </h3>
          <pre className="overflow-x-auto rounded-lg border border-border/45 bg-muted/15 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
{`[structure]  ## heading   ### subheading   body paragraphs
[inline]     **bold**     *italic*         ~~strike~~  [link](url)
[blocks]     > quote      - bullet         1. numbered
[remapped]   \`\`\`code\`\`\`  --- divider     | table |

Never use em dash (—). Prefer commas in prose; colon for label: value.`}
          </pre>
        </section>
      </div>
    </details>
  );
}
