import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
  /** Optional label for the failing surface (shown in the recovery UI). */
  label?: string;
};

type State = {
  error: Error | null;
};

/**
 * Catches lazy-chunk and render failures so React does not unmount `#root`
 * into a blank page (common when @remotion/player fails to load).
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[RouteErrorBoundary] ${this.props.label ?? "route"}`, error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const label = this.props.label ?? "This page";

    return (
      <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#030303] px-6 text-center text-white">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Something went wrong</p>
        <h1 className="font-display text-xl font-medium tracking-tight text-white/90 sm:text-2xl">
          {label} failed to load
        </h1>
        <p className="max-w-md text-sm text-white/50">
          {error.message || "An unexpected error stopped this view from rendering."}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={this.retry}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/30 bg-white/15 px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/25"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-white/25 hover:text-white/90"
          >
            Reload
          </button>
          <Link
            to="/post"
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-white/25 hover:text-white/90"
          >
            Back to ship log
          </Link>
        </div>
      </div>
    );
  }
}
