import { analyticsSummary, tokenStatistics } from '../data/dummyData'

const stats = [
  { label: 'Total Market Cap', value: `$${(analyticsSummary.totalMarketCap / 1e12).toFixed(2)}T`, color: 'text-terminal-accent' },
  { label: '24h Volume', value: `$${(analyticsSummary.totalVolume24h / 1e9).toFixed(0)}B`, color: 'text-terminal-green' },
  { label: 'BTC Dominance', value: `${analyticsSummary.btcDominance}%`, color: 'text-terminal-yellow' },
  { label: 'DeFi TVL', value: `$${(analyticsSummary.defiTVL / 1e9).toFixed(0)}B`, color: 'text-terminal-accent' },
  { label: 'Stablecoin Supply', value: `$${(analyticsSummary.stablecoinSupply / 1e9).toFixed(0)}B`, color: 'text-terminal-green' },
  { label: 'Active Addresses', value: `${(analyticsSummary.activeAddresses24h / 1e6).toFixed(1)}M`, color: 'text-terminal-accent' },
  { label: 'Verified Tokens', value: tokenStatistics.verifiedTokens.toLocaleString(), color: 'text-terminal-green' },
  { label: 'Rugs Detected', value: tokenStatistics.rugPullsDetected, color: 'text-terminal-red' },
]

export default function AnalyticsSummary() {
  return (
    <div className="flex items-center bg-terminal-panel border-b border-terminal-border flex-shrink-0" style={{ gap: 1 }}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex-1 flex items-center gap-1.5 px-2 py-1 border-r border-terminal-border/40 last:border-r-0 hover:bg-terminal-accent/5 transition-colors"
        >
          <div className="min-w-0">
            <div className="text-[9px] text-terminal-dim truncate leading-none">{s.label}</div>
            <div className={`text-[11px] font-bold ${s.color} tabular-nums leading-tight`}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
