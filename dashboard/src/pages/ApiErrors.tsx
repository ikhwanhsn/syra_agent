import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchApiErrors, type ApiErrorEntry } from "../api/errors";
import { LoadingState } from "../components/LoadingState";
import { cn } from "../lib/utils";

function Card({
  className,
  title,
  children,
}: {
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-800 bg-syra-card p-4 shadow-sm sm:p-6",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-400">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function StatusBadge({ statusCode }: { statusCode: number }) {
  const is5xx = statusCode >= 500;
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        is5xx ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
      )}
    >
      {statusCode}
    </span>
  );
}

export function ApiErrorsPage() {
  const [searchParams] = useSearchParams();
  const daysParam = searchParams.get("days");
  const initialDays: 7 | 30 = daysParam === "7" ? 7 : 30;
  const [days, setDays] = useState<7 | 30>(initialDays);

  useEffect(() => {
    if (daysParam === "7" || daysParam === "30") setDays(daysParam === "7" ? 7 : 30);
  }, [daysParam]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["api-errors", days],
    queryFn: () => fetchApiErrors(days),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
        <LoadingState message="Loading API errors…" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-200 sm:p-6">
          <p className="font-semibold">Failed to load API errors</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : String(error)}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-syra-primary hover:underline">
            ← Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  const errors: ApiErrorEntry[] = data?.errors ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:space-y-8 sm:p-6">
      <header className="flex flex-col gap-4 border-b border-gray-800 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-gray-400 transition-colors hover:text-white"
            aria-label="Back to Overview"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white sm:text-2xl">API errors</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Period:</span>
          <button
            type="button"
            onClick={() => setDays(7)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              days === 7
                ? "bg-syra-primary/20 text-syra-primary"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            )}
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => setDays(30)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              days === 30
                ? "bg-syra-primary/20 text-syra-primary"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            )}
          >
            Last 30 days
          </button>
        </div>
      </header>

      <section>
        <p className="mb-3 text-sm text-gray-400">
          Requests that returned HTTP 4xx or 5xx. Showing up to 500 most recent.{" "}
          <span className="text-gray-500">x402 = paid API endpoint;</span> — = non-x402.
        </p>
        <Card>
          {errors.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No API errors in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="pb-2 pr-4 font-medium">Time (UTC)</th>
                    <th className="pb-2 pr-4 font-medium">Path</th>
                    <th className="pb-2 pr-4 font-medium">Method</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Duration (ms)</th>
                    <th className="pb-2 pr-4 font-medium">x402</th>
                    <th className="pb-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((row, i) => (
                    <tr key={`${row.createdAt}-${row.path}-${i}`} className="border-b border-gray-800/80">
                      <td className="py-2 pr-4 text-gray-400">
                        {new Date(row.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-gray-300">{row.path}</td>
                      <td className="py-2 pr-4 text-gray-400">{row.method}</td>
                      <td className="py-2 pr-4">
                        <StatusBadge statusCode={row.statusCode} />
                      </td>
                      <td className="py-2 pr-4 text-gray-400">{row.durationMs}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            row.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-600/30 text-gray-400"
                          )}
                        >
                          {row.paid ? "x402" : "—"}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{row.source ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
