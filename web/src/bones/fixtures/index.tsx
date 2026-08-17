import type { ReactNode } from "react";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { playgroundApiCardClass } from "@/components/playground/playgroundStyles";
import { cn } from "@/lib/utils";

const SAMPLE_TITLES = [
  "Sample title one",
  "Sample title two",
  "Sample title three",
  "Sample title four",
  "Sample title five",
  "Sample title six",
];

function CardGridFixture({
  count = 6,
  heightClass = "h-[14rem]",
}: {
  count?: number;
  heightClass?: string;
}) {
  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "flex flex-col justify-between overflow-hidden rounded-[1.35rem] border border-border/40 bg-card/40 p-5",
            heightClass,
          )}
        >
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">General</p>
            <h3 className="font-display text-lg font-semibold">{SAMPLE_TITLES[i % SAMPLE_TITLES.length]}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Placeholder copy so capture matches a loaded card layout.
            </p>
          </div>
          <span className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
            Open
          </span>
        </li>
      ))}
    </ul>
  );
}

function YieldPanelFixture() {
  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-label="Available strategies">
        <div className="grid gap-3 sm:grid-cols-2">
          {["Meridian yield", "Delta desk", "LST loop", "Sniper desk"].map((label) => (
            <div key={label} className={cn(overviewCardShell, "flex flex-col gap-4 p-5")}>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <span className="block h-4 w-4 rounded-full bg-primary/40" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    Sample strategy pitch used only for skeleton capture.
                  </p>
                </div>
              </div>
              <p className="text-sm">Track record 12 runs, +2.4 SOL</p>
              <p className="text-xs text-muted-foreground">Limit 1-5 SOL · Fee 10% on profit only</p>
              <span className="inline-flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
                View strategy
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EarnPageFixture() {
  return (
    <div className="space-y-6">
      <div className="grid h-auto w-full grid-cols-5 gap-1 rounded-full border border-border/40 bg-muted/15 p-1">
        {["Yield", "Token", "Playbooks", "Skills", "LLM"].map((tab) => (
          <span key={tab} className="flex h-10 items-center justify-center rounded-full text-sm font-medium">
            {tab}
          </span>
        ))}
      </div>
      <YieldPanelFixture />
    </div>
  );
}

function TokenDetailFixture() {
  return (
    <div className="space-y-6">
      <header className="rounded-[1.35rem] border border-border/40 bg-card/40 p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-muted sm:h-20 sm:w-20" />
            <div className="min-w-0 space-y-2">
              <h1 className="font-display text-2xl font-semibold">Sample token</h1>
              <p className="text-sm text-muted-foreground">$SMPL</p>
              <p className="max-w-xl text-sm text-muted-foreground">
                Fixture headline for the token detail capture layout.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
              Trade
            </span>
            <span className="inline-flex h-11 items-center rounded-full border border-border/40 px-5 text-sm">
              Share
            </span>
          </div>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <section className="rounded-[1.35rem] border border-border/40 bg-card/40 p-4">
          <p className="mb-3 text-sm font-medium">Price</p>
          <div className="h-64 rounded-xl bg-muted/30" />
        </section>
        <aside className="space-y-3 rounded-[1.35rem] border border-border/40 bg-card/40 p-4">
          {["Market cap", "Liquidity", "Holders"].map((label) => (
            <div key={label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold tabular-nums">12.4k</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function YieldDetailFixture() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/15" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Meridian yield</h1>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px]">SOL</span>
              <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px]">Moderate</span>
            </div>
          </div>
        </div>
        <span className="inline-flex h-9 items-center rounded-md border border-border/40 px-3 text-sm">Back</span>
      </header>
      <div className={cn(overviewCardShell, "grid grid-cols-2 gap-4 p-4 sm:grid-cols-4")}>
        {["Deposit", "PnL", "Runs", "Fee"].map((label) => (
          <div key={label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold tabular-nums">4.20</p>
          </div>
        ))}
      </div>
      <section className={cn(overviewCardShell, "space-y-4 p-4")}>
        <span className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Start
        </span>
      </section>
    </div>
  );
}

function CatalogFixture({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(playgroundApiCardClass(false), "min-h-[15.5rem] p-5")}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="rounded-md bg-muted/50 px-2 py-0.5 text-xs">GET</span>
            <span className="text-xs tabular-nums text-muted-foreground">$0.01</span>
          </div>
          <h3 className="text-[15px] font-semibold">News feed {i + 1}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">Paid crypto news for agents.</p>
          <p className="mt-3 truncate rounded-lg border border-border/40 bg-muted/20 px-2 py-1.5 font-mono text-xs">
            /api/news
          </p>
          <span className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground">
            Open
          </span>
        </div>
      ))}
    </div>
  );
}

function MarketplaceDetailFixture() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Syra Core</p>
        <h1 className="font-display text-3xl font-semibold">News</h1>
        <p className="max-w-md text-sm text-muted-foreground">Pay-per-call news for agents.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Price", "Method", "Chain"].map((label) => (
          <div key={label} className={cn(overviewCardShell, "p-4")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-3 text-xl font-semibold">GET</p>
          </div>
        ))}
      </div>
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg border border-border/40 bg-muted/20 px-3 py-3 text-sm">
            Parameter {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetsTableFixture({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 text-left">
            <th className="h-11 pl-4">Asset</th>
            <th className="hidden h-11 sm:table-cell">Chain</th>
            <th className="h-11 text-right">Price</th>
            <th className="h-11 text-right">24h</th>
            <th className="hidden h-11 text-right md:table-cell">Market cap</th>
            <th className="hidden h-11 pr-4 text-right lg:table-cell">Volume</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-2.5 pl-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-muted" />
                  <div>
                    <p className="font-medium">Sample {i + 1}</p>
                    <p className="text-xs text-muted-foreground">SMPL</p>
                  </div>
                </div>
              </td>
              <td className="hidden sm:table-cell">
                <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs">Solana</span>
              </td>
              <td className="text-right tabular-nums">$1.24</td>
              <td className="text-right tabular-nums">+2.1%</td>
              <td className="hidden text-right tabular-nums md:table-cell">$12.4M</td>
              <td className="hidden pr-4 text-right tabular-nums lg:table-cell">$840k</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IntelligenceFixture() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn(overviewCardShell, "space-y-3 p-5")}>
          <h3 className="text-sm font-semibold">Sentiment</h3>
          <p className="text-3xl font-semibold tabular-nums">62</p>
          <p className="text-sm text-muted-foreground">Positive 48 · Negative 12 · Neutral 20</p>
        </div>
        <div className={cn(overviewCardShell, "space-y-3 p-5")}>
          <h3 className="text-sm font-semibold">Signal</h3>
          <p className="text-lg font-semibold">Hold</p>
          <p className="text-sm text-muted-foreground">Strength medium · source desk</p>
        </div>
      </div>
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h3 className="text-sm font-semibold">News</h3>
        {["Headline one about the asset", "Headline two about the market", "Headline three for capture"].map(
          (title) => (
            <p key={title} className="border-b border-border/30 py-2 text-sm last:border-0">
              {title}
            </p>
          ),
        )}
      </div>
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h3 className="text-sm font-semibold">Events</h3>
        {["Unlock", "Listing", "Governance"].map((title) => (
          <p key={title} className="border-b border-border/30 py-2 text-sm last:border-0">
            {title}
          </p>
        ))}
      </div>
    </div>
  );
}

function AssetDetailFixture() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold">Sample asset</h1>
        <p className="text-sm text-muted-foreground">$SMPL · Solana</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Price", "24h", "Volume"].map((label) => (
          <div key={label} className={cn(overviewCardShell, "p-4")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums">$1.24</p>
          </div>
        ))}
      </div>
      <IntelligenceFixture />
    </div>
  );
}

function ListPanelFixture({ variant = "list", rows = 8 }: { variant?: "list" | "leaderboard"; rows?: number }) {
  return (
    <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{variant === "leaderboard" ? "Leaderboard" : "Live calls"}</h2>
          <p className="text-sm text-muted-foreground">Recent pump.fun activity for capture.</p>
        </div>
        <span className="rounded-md border border-border/40 px-3 py-1 text-sm">Refresh</span>
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="h-10 flex-1 rounded-md border border-border/40 bg-muted/20 px-3 text-sm" defaultValue="" readOnly placeholder="Search" />
        <span className="h-10 w-full rounded-md border border-border/40 px-3 py-2 text-sm sm:w-[160px]">All</span>
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 border-b border-border/30 py-4 last:border-0 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {variant === "leaderboard" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs">{i + 1}</span>
              ) : null}
              <div className="h-11 w-11 shrink-0 rounded-xl bg-muted" />
              <div className="min-w-0">
                <p className="font-medium">Token {i + 1}</p>
                <p className="text-sm text-muted-foreground">Caller sample wallet</p>
                <p className="text-xs text-muted-foreground">2m ago</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full bg-muted/50 px-3 py-1 text-sm">+42%</span>
              <span className="rounded-full border border-border/40 px-3 py-1 text-sm">Open</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisFixture() {
  return (
    <div className={cn(overviewCardShell, "space-y-5 p-5")}>
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-muted" />
        <div>
          <h2 className="text-lg font-semibold">Sample scan</h2>
          <p className="text-sm text-muted-foreground">Mint ABC123 · 2 minutes ago</p>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Score", "Holders", "Liquidity"].map((label) => (
          <div key={label} className="rounded-xl border border-border/40 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">72</p>
          </div>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Fixture analysis body so the capture matches a completed scan card.
      </p>
    </div>
  );
}

function TableCardFixture({
  headers,
  rows = 4,
}: {
  headers: string[];
  rows?: number;
}) {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 text-left">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0">
              {headers.map((h) => (
                <td key={h} className="px-3 py-2">
                  Sample {i + 1}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsCardFixture() {
  return (
    <div className={cn(overviewCardShell, "space-y-5 p-5")}>
      <h3 className="text-sm font-semibold">Auto-call settings</h3>
      {["Endpoint", "Interval", "Max spend"].map((label) => (
        <div key={label} className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="h-10 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-sm">Sample value</div>
        </div>
      ))}
    </div>
  );
}

function EndpointsGridFixture() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {["/api/news", "/api/sentiment", "/api/signals", "/api/smart-money", "/api/token", "/api/yield"].map((path) => (
        <div key={path} className="rounded-lg border border-border/60 bg-card/50 p-3 text-sm">
          <code className="text-xs font-medium">{path}</code>
          <p className="mt-1 text-xs text-muted-foreground">$0.01 · GET</p>
        </div>
      ))}
    </div>
  );
}

function DepositHubFixture() {
  return (
    <div className={cn(overviewCardShell, "space-y-4 p-5")}>
      <h3 className="text-sm font-semibold">Deposit hub</h3>
      <p className="text-3xl font-semibold tabular-nums">12.40 SOL</p>
      <p className="text-sm text-muted-foreground">Available for x402 calls</p>
      <span className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
        Deposit
      </span>
    </div>
  );
}

function ModelSelectorFixture() {
  return (
    <div className="space-y-2">
      {["GPT-4.1", "Claude Sonnet", "Gemini Flash"].map((name) => (
        <div key={name} className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">$0.01</span>
        </div>
      ))}
    </div>
  );
}

function InvestFixture() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(overviewCardShell, "flex items-center justify-between p-4")}>
            <div>
              <p className="font-medium">Opportunity {i + 1}</p>
              <p className="text-sm text-muted-foreground">SOL · 8.2% APY</p>
            </div>
            <span className="rounded-md border border-border/40 px-3 py-1 text-sm">View</span>
          </div>
        ))}
      </div>
      <aside className={cn(overviewCardShell, "space-y-3 p-4")}>
        <h3 className="text-sm font-semibold">Positions</h3>
        <p className="text-2xl font-semibold tabular-nums">4.20 SOL</p>
        <p className="text-sm text-muted-foreground">2 open positions</p>
      </aside>
    </div>
  );
}

function SpendFixture() {
  return (
    <div className="space-y-4">
      <div className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h2 className="text-lg font-semibold">Spend</h2>
        <p className="text-sm text-muted-foreground">Pay-per-call preview for capture.</p>
        <div className="h-10 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-sm">/api/news</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {["Calls", "USDC", "Saved"].map((label) => (
          <div key={label} className={cn(overviewCardShell, "p-4")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">24</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewFixture() {
  return (
    <div className={cn(overviewCardShell, "space-y-3 p-5")}>
      <h3 className="text-sm font-semibold">Quote</h3>
      <p className="text-2xl font-semibold tabular-nums">$0.012</p>
      <p className="text-sm text-muted-foreground">x402 payment required · Solana USDC</p>
      <span className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
        Pay
      </span>
    </div>
  );
}

function GrowFixture() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {["Idle USDC", "Suggested", "Risk"].map((label) => (
          <div key={label} className={cn(overviewCardShell, "p-4")}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">$240</p>
          </div>
        ))}
      </div>
      <div className={cn(overviewCardShell, "space-y-2 p-5")}>
        {["Move idle USDC to yield", "Keep 20% liquid", "Skip memecoin loop"].map((row) => (
          <p key={row} className="border-b border-border/30 py-2 text-sm last:border-0">
            {row}
          </p>
        ))}
      </div>
    </div>
  );
}

function LpPoolsFixture() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn(overviewCardShell, "flex items-center justify-between p-4")}>
          <div>
            <p className="font-medium">SOL / USDC {i + 1}</p>
            <p className="text-sm text-muted-foreground">Raydium · 24.1% APR</p>
          </div>
          <p className="text-sm tabular-nums">$12.4k TVL</p>
        </div>
      ))}
    </div>
  );
}

function TreasuryFixture() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["SOL", "USDC", "SYRA"].map((label) => (
        <div key={label} className={cn(overviewCardShell, "p-4")}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">128.4</p>
        </div>
      ))}
    </div>
  );
}

function SpendRowsFixture() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2">
          <p className="text-sm">/api/news</p>
          <p className="text-sm tabular-nums">$0.01</p>
        </div>
      ))}
    </div>
  );
}

function OrganizeSummaryFixture() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["Wallets", "Tokens", "Dust"].map((label) => (
        <div key={label} className={cn(overviewCardShell, "p-4")}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-semibold">12</p>
        </div>
      ))}
    </div>
  );
}

function SwapDetailsFixture() {
  return (
    <div className="space-y-2 text-sm">
      {["Rate", "Price impact", "Fee", "Route"].map((label) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-muted-foreground">{label}</span>
          <span>1.024</span>
        </div>
      ))}
    </div>
  );
}

function TokenListFixture() {
  return (
    <div className="space-y-1">
      {["SOL", "USDC", "SYRA", "BONK"].map((sym) => (
        <div key={sym} className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{sym}</p>
            <p className="text-xs text-muted-foreground">Sample token</p>
          </div>
          <p className="text-sm tabular-nums">12.4</p>
        </div>
      ))}
    </div>
  );
}

function SwapMarketFixture() {
  return (
    <div className={cn(overviewCardShell, "space-y-3 p-4")}>
      <h3 className="text-sm font-semibold">SOL / USDC</h3>
      <div className="h-40 rounded-xl bg-muted/30" />
      <p className="text-2xl font-semibold tabular-nums">$142.10</p>
    </div>
  );
}

function XPostsFixture() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn(overviewCardShell, "space-y-2 p-4")}>
          <p className="text-sm font-medium">@sample</p>
          <p className="text-sm text-muted-foreground">Fixture post about the market move today.</p>
        </div>
      ))}
    </div>
  );
}

function BtcHeroFixture() {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Bitcoin</p>
      <p className="font-display text-4xl font-semibold tabular-nums">$64,210</p>
      <p className="text-sm">+1.4% today</p>
    </div>
  );
}

function BtcStatsFixture() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["Market cap", "Volume", "Dominance"].map((label) => (
        <div key={label} className={cn(overviewCardShell, "p-4")}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-semibold">$1.2T</p>
        </div>
      ))}
    </div>
  );
}

function ChatSidebarFixture() {
  return (
    <div className="space-y-1 px-1 py-1">
      {["News briefing", "Yield check", "Token scan", "LP status", "Swap quote", "Research"].map((title) => (
        <div key={title} className="rounded-lg px-2.5 py-2.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">2h ago</p>
        </div>
      ))}
    </div>
  );
}

function GrowthMetricsFixture() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["Paid calls", "Wallets", "USDC"].map((label) => (
        <div key={label} className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums">1,240</p>
        </div>
      ))}
    </div>
  );
}

function ArticlesFixture() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <article key={i} className={cn(overviewCardShell, "space-y-2 p-5")}>
          <p className="text-xs uppercase text-muted-foreground">Ship log</p>
          <h2 className="font-display text-xl font-semibold">Article title {i + 1}</h2>
          <p className="text-sm text-muted-foreground">Fixture excerpt for the articles grid capture.</p>
        </article>
      ))}
    </div>
  );
}

function AgentSetupFixture() {
  return (
    <div className="space-y-4">
      {["Wallet", "Agent", "Billing"].map((title) => (
        <section key={title} className={cn(overviewCardShell, "space-y-3 p-5")}>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">Fixture section copy for capture.</p>
          <div className="h-10 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-sm">Sample</div>
        </section>
      ))}
    </div>
  );
}

function OverviewChartFixture() {
  return (
    <div className={cn(overviewCardShell, "space-y-3 p-5")}>
      <h3 className="text-sm font-semibold">Balance</h3>
      <div className="h-48 rounded-xl bg-muted/30" />
      <p className="text-2xl font-semibold tabular-nums">12.4 SOL</p>
    </div>
  );
}

function OverviewStatFixture() {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <p className="text-xs text-muted-foreground">Wallet</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">4.20 SOL</p>
      <p className="mt-1 text-xs text-muted-foreground">Ready to spend</p>
    </div>
  );
}

function LeaderboardFixture() {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden")}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 text-left">
            <th className="px-3 py-2">Agent</th>
            <th className="px-3 py-2">PnL</th>
            <th className="px-3 py-2">Runs</th>
          </tr>
        </thead>
        <tbody>
          {["Alpha", "Beta", "Gamma", "Delta"].map((name) => (
            <tr key={name} className="border-b border-border/30 last:border-0">
              <td className="px-3 py-2">{name}</td>
              <td className="px-3 py-2">+$124</td>
              <td className="px-3 py-2">18</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostStudioFixture() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="aspect-video rounded-2xl border border-border/40 bg-muted/30" />
      <aside className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Ship log</h2>
        <p className="text-sm text-muted-foreground">Fixture copy for the studio capture.</p>
        <span className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Export
        </span>
      </aside>
    </div>
  );
}

function StakingStatsFixture() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {["Staked", "Rewards", "APY"].map((label) => (
        <div key={label} className={cn(overviewCardShell, "p-4")}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-semibold">12.4</p>
        </div>
      ))}
    </div>
  );
}

function StakingLocksFixture() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-3">
          <p className="text-sm font-medium">Lock {i + 1}</p>
          <p className="text-sm tabular-nums">100 SYRA</p>
        </div>
      ))}
    </div>
  );
}

function PillarCardFixture() {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <p className="text-xs text-muted-foreground">Earn</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">$42.10</p>
      <p className="mt-1 text-xs text-muted-foreground">This week</p>
    </div>
  );
}

function PriceChartFixture() {
  return (
    <div className="h-48 w-full rounded-xl border border-border/40 bg-muted/20 p-3">
      <p className="text-sm font-medium">$0.0042</p>
      <div className="mt-3 h-32 rounded-lg bg-muted/40" />
    </div>
  );
}

export const BONE_CAPTURES: { name: string; fixture: ReactNode }[] = [
  { name: "earn-prompt-grid", fixture: <CardGridFixture heightClass="h-[14rem]" /> },
  { name: "earn-skills-grid", fixture: <CardGridFixture heightClass="h-[16rem]" /> },
  { name: "earn-llm-grid", fixture: <CardGridFixture heightClass="h-[17rem]" /> },
  { name: "earn-token-grid", fixture: <CardGridFixture heightClass="h-[17rem]" /> },
  { name: "earn-yield-panel", fixture: <YieldPanelFixture /> },
  { name: "earn-page", fixture: <EarnPageFixture /> },
  { name: "earn-token-detail", fixture: <TokenDetailFixture /> },
  { name: "earn-yield-detail", fixture: <YieldDetailFixture /> },
  { name: "playground-catalog", fixture: <CatalogFixture count={8} /> },
  { name: "playground-catalog-share", fixture: <CatalogFixture count={4} /> },
  { name: "marketplace-api-detail", fixture: <MarketplaceDetailFixture /> },
  { name: "assets-table", fixture: <AssetsTableFixture /> },
  { name: "asset-intelligence", fixture: <IntelligenceFixture /> },
  { name: "asset-detail", fixture: <AssetDetailFixture /> },
  { name: "pumpfun-list", fixture: <ListPanelFixture /> },
  { name: "pumpfun-leaderboard", fixture: <ListPanelFixture variant="leaderboard" /> },
  { name: "pumpfun-analysis", fixture: <AnalysisFixture /> },
  { name: "labs-wallet-list", fixture: <TableCardFixture headers={["Label", "Role", "Address", "SOL"]} rows={3} /> },
  { name: "labs-call-log", fixture: <TableCardFixture headers={["Time", "Endpoint", "Status", "USDC"]} /> },
  { name: "labs-auto-call", fixture: <SettingsCardFixture /> },
  { name: "labs-deposit-hub", fixture: <DepositHubFixture /> },
  { name: "labs-endpoints", fixture: <EndpointsGridFixture /> },
  { name: "llm-model-selector", fixture: <ModelSelectorFixture /> },
  { name: "invest-page", fixture: <InvestFixture /> },
  { name: "spend-page", fixture: <SpendFixture /> },
  { name: "spend-preview", fixture: <PreviewFixture /> },
  { name: "grow-analysis", fixture: <GrowFixture /> },
  { name: "lp-pools", fixture: <LpPoolsFixture /> },
  { name: "treasury-panel", fixture: <TreasuryFixture /> },
  { name: "treasury-spend", fixture: <SpendRowsFixture /> },
  { name: "organize-summary", fixture: <OrganizeSummaryFixture /> },
  { name: "organize-table", fixture: <TableCardFixture headers={["Token", "Amount", "Value"]} rows={5} /> },
  { name: "swap-details", fixture: <SwapDetailsFixture /> },
  { name: "swap-token-list", fixture: <TokenListFixture /> },
  { name: "swap-market", fixture: <SwapMarketFixture /> },
  { name: "swap-x-posts", fixture: <XPostsFixture /> },
  { name: "btc-hero", fixture: <BtcHeroFixture /> },
  { name: "btc-stats", fixture: <BtcStatsFixture /> },
  { name: "btc-exchange", fixture: <BtcStatsFixture /> },
  { name: "btc-chart", fixture: <PriceChartFixture /> },
  { name: "staking-stats", fixture: <StakingStatsFixture /> },
  { name: "staking-locks", fixture: <StakingLocksFixture /> },
  { name: "chat-sidebar", fixture: <ChatSidebarFixture /> },
  { name: "growth-metrics", fixture: <GrowthMetricsFixture /> },
  { name: "articles-list", fixture: <ArticlesFixture /> },
  { name: "agent-setup-sections", fixture: <AgentSetupFixture /> },
  { name: "overview-chart", fixture: <OverviewChartFixture /> },
  { name: "overview-stat", fixture: <OverviewStatFixture /> },
  { name: "experiment-leaderboard", fixture: <LeaderboardFixture /> },
  { name: "post-studio", fixture: <PostStudioFixture /> },
  { name: "pillar-card", fixture: <PillarCardFixture /> },
  { name: "pumpfun-price-chart", fixture: <PriceChartFixture /> },
];

export function fixtureFor(name: string): ReactNode {
  return BONE_CAPTURES.find((item) => item.name === name)?.fixture ?? null;
}
