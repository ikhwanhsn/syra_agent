import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, ArrowRight, LayoutGrid, FileCode, Terminal, Home, SearchX, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

function useGlitchText(text: string, intervalMs = 80) {
  const [display, setDisplay] = useState(text);
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    if (!isGlitching) return;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const resolved = text.slice(0, step);
      const remaining = text.length - step;
      const noise = Array.from({ length: remaining }, () =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      ).join('');
      setDisplay(resolved + noise);
      if (step >= text.length) {
        clearInterval(id);
        setIsGlitching(false);
        setDisplay(text);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [text, intervalMs, isGlitching]);

  return display;
}

const NotFound = () => {
  const location = useLocation();
  const glitchedCode = useGlitchText('404', 120);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-purple/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-12 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 to-black/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/80 to-black/60 flex items-center justify-center border border-border/30">
              <SearchX className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Error code */}
        <h1 className="text-7xl sm:text-8xl font-black tracking-tighter gradient-text mb-3 font-mono select-none">
          {glitchedCode}
        </h1>

        <p className="text-lg sm:text-xl font-medium text-foreground mb-2">
          Page not found
        </p>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed max-w-sm mx-auto">
          The route you're looking for doesn't exist or has been moved.
        </p>

        {location.pathname !== '/' && (
          <p className="text-xs font-mono text-muted-foreground/70 bg-muted/50 px-3 py-1.5 rounded-lg inline-block mb-8 border border-border/30">
            {location.pathname}
          </p>
        )}

        {!location.pathname || location.pathname === '/' ? <div className="mb-8" /> : null}

        {/* Quick actions */}
        <div className="grid gap-3 text-left mb-8">
          <Link
            to="/"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Playground</span>
              <span className="text-xs text-muted-foreground">Build & send API requests</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            to="/examples"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Examples</span>
              <span className="text-xs text-muted-foreground">Browse x402 example flows</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            to="/explorer"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <FileCode className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Explorer</span>
              <span className="text-xs text-muted-foreground">Browse all available endpoints</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            to="/batch-test"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Batch Test</span>
              <span className="text-xs text-muted-foreground">Run multiple requests at once</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            to="/format-test"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 hover:bg-secondary/50 transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <FlaskConical className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Format Test</span>
              <span className="text-xs text-muted-foreground">Check if x402 API format is correct</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>

        {/* CTA */}
        <Button asChild variant="neon" size="sm" className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
