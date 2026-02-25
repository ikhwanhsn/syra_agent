import { cn } from "../lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function LoadingState({ message = "Loading…", size = "md", className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-gray-700 bg-gray-900/30 p-8",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full border-2 border-gray-700/80 border-t-syra-primary border-r-syra-accent/60 animate-spin",
          spinnerSizes[size]
        )}
        aria-hidden
      />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

/** Inline loading for panels (spinner + message in one row) */
export function LoadingStateInline({ message = "Loading…", className }: { message?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/30 p-8",
        className
      )}
    >
      <div
        className="h-8 w-8 shrink-0 rounded-full border-2 border-gray-700 border-t-syra-primary border-r-syra-accent/50 animate-spin"
        aria-hidden
      />
      <span className="text-sm text-gray-400">{message}</span>
    </div>
  );
}
