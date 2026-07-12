import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Grow height with content so Enter adds a line without scroll or manual resize. */
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, onChange, value, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const adjustHeight = React.useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    React.useLayoutEffect(() => {
      adjustHeight();
    }, [adjustHeight, value]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          autoResize && "resize-none overflow-hidden",
          className,
        )}
        ref={setRefs}
        value={value}
        onChange={(event) => {
          onChange?.(event);
          if (autoResize) {
            // Keep height in sync for the same render cycle (Enter / paste).
            const el = event.currentTarget;
            el.style.height = "0px";
            el.style.height = `${el.scrollHeight}px`;
          }
        }}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
