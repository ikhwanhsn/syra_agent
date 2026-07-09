import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { BlogCallout, parseCalloutType } from "./BlogCallout";
import { BlogCodeBlock } from "./BlogCodeBlock";
import { BlogImage } from "./BlogImage";

interface BlogContentProps {
  content: string;
  onHeadingsExtracted?: (headings: { id: string; text: string; level: number }[]) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const el = children as React.ReactElement<{ children?: React.ReactNode }>;
    return extractText(el.props.children);
  }
  return "";
}

export function BlogContent({ content }: BlogContentProps) {
  const components: Components = useMemo(
    () => ({
      h2: ({ children, ...props }) => {
        const text = extractText(children);
        const id = slugify(text);
        return (
          <h2
            id={id}
            className="blog-h2 group relative mt-10 scroll-mt-[calc(var(--syra-global-nav-height,3.5rem)+1rem)] font-display text-xl font-semibold tracking-[-0.03em] text-foreground first:mt-0 sm:mt-12 sm:text-2xl lg:text-[1.75rem]"
            {...props}
          >
            <span className="blog-heading-anchor absolute -left-6 hidden text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40 lg:inline">
              #
            </span>
            {children}
          </h2>
        );
      },
      h3: ({ children, ...props }) => {
        const text = extractText(children);
        const id = slugify(text);
        return (
          <h3
            id={id}
            className="blog-h3 mt-10 scroll-mt-[calc(var(--syra-global-nav-height,3.5rem)+1rem)] font-display text-xl font-semibold tracking-[-0.025em] text-foreground sm:mt-12"
            {...props}
          >
            {children}
          </h3>
        );
      },
      p: ({ children, ...props }) => (
        <p
          className="blog-p my-4 text-base leading-[1.75] tracking-[-0.011em] text-foreground/90 sm:my-5 sm:text-[17px]"
          {...props}
        >
          {children}
        </p>
      ),
      ul: ({ children, ...props }) => (
        <ul
          className="blog-ul my-6 ml-1 space-y-3 text-[17px] leading-relaxed text-foreground/88 sm:my-8"
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          className="blog-ol my-6 ml-1 space-y-3 text-[17px] leading-relaxed text-foreground/88 sm:my-8"
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li className="blog-li relative pl-6" {...props}>
          {children}
        </li>
      ),
      blockquote: ({ children }) => {
        const text = extractText(children).trim();
        const calloutType = parseCalloutType(text);
        if (calloutType) {
          const cleaned = text.replace(/^\[![\w]+\]\s*/i, "");
          return (
            <BlogCallout type={calloutType}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children: c }) => <p className="m-0">{c}</p>,
                }}
              >
                {cleaned}
              </ReactMarkdown>
            </BlogCallout>
          );
        }
        return (
          <blockquote className="blog-quote relative my-10 py-1 pl-6 sm:pl-8">
            <div className="blog-quote-mark pointer-events-none absolute -left-1 -top-3 font-display text-5xl leading-none text-foreground/10" aria-hidden>
              &ldquo;
            </div>
            <div className="text-lg font-medium italic leading-relaxed text-foreground/85 sm:text-xl">
              {children}
            </div>
          </blockquote>
        );
      },
      a: ({ href, children, ...props }) => {
        const isInternal = href?.startsWith("/");
        const className =
          "blog-link font-medium text-foreground underline decoration-foreground/25 underline-offset-[5px] transition-all hover:decoration-foreground/60";
        if (isInternal && href) {
          return (
            <Link to={href} className={className} {...props}>
              {children}
            </Link>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            {...props}
          >
            {children}
          </a>
        );
      },
      code: ({ className, children, ...props }) => {
        const code = String(children).replace(/\n$/, "");
        const hasLanguage = className?.startsWith("language-");
        const isBlock = hasLanguage || code.includes("\n");
        const lang = className?.replace("language-", "") ?? "plaintext";

        if (isBlock) {
          return <BlogCodeBlock code={code} language={lang} />;
        }

        return (
          <code
            className="blog-inline-code rounded-md border border-border/50 bg-muted/40 px-1.5 py-px font-mono text-[0.875em] text-foreground"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => <>{children}</>,
      img: ({ src, alt }) => {
        if (!src) return null;
        return <BlogImage src={src} alt={alt ?? ""} caption={alt} />;
      },
      table: ({ children, ...props }) => (
        <div className="blog-table-wrap -mx-1 my-8 overflow-x-auto rounded-xl sm:my-10 sm:rounded-2xl">
          <table className="blog-table w-full min-w-[min(100%,32rem)] border-collapse text-sm sm:min-w-[480px]" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }) => (
        <thead className="blog-thead" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }) => (
        <tbody className="blog-tbody divide-y divide-border/40" {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }) => (
        <tr className="blog-tr transition-colors" {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }) => (
        <th className="blog-th px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider" {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td className="blog-td px-5 py-4 text-[15px] leading-relaxed" {...props}>
          {children}
        </td>
      ),
      hr: () => <hr className="blog-hr my-12 border-0" />,
      strong: ({ children, ...props }) => (
        <strong className="font-semibold text-foreground" {...props}>
          {children}
        </strong>
      ),
    }),
    [],
  );

  return (
    <article className="blog-content relative min-w-0">
      <div className={cn(overviewCardShell, "min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10")}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
