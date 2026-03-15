import { analyticsSummary, tokenStatistics } from '../data/dummyData'

export default function StatusBar() {
  return (
    <footer className="flex items-center justify-between px-2 py-0.5 bg-terminal-bg border-t border-terminal-border text-[9px] text-terminal-dim flex-shrink-0">
      <div className="flex items-center gap-3">
        <span>SYRA Terminal v2.0</span>
        <span className="text-terminal-muted">|</span>
        <span>MCap: <span className="text-terminal-text tabular-nums">${(analyticsSummary.totalMarketCap / 1e12).toFixed(2)}T</span></span>
        <span className="text-terminal-muted">|</span>
        <span>24h Vol: <span className="text-terminal-text tabular-nums">${(analyticsSummary.totalVolume24h / 1e9).toFixed(0)}B</span></span>
        <span className="text-terminal-muted">|</span>
        <span>BTC.D: <span className="text-terminal-accent tabular-nums">{analyticsSummary.btcDominance}%</span></span>
        <span className="text-terminal-muted">|</span>
        <span>New Tokens: <span className="text-terminal-yellow tabular-nums">{tokenStatistics.newTokens24h}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span>Data: <span className="text-terminal-green">Syra API</span></span>
        <span className="text-terminal-muted">|</span>
        <div className="flex items-center gap-0.5">
          <div className="w-1 h-1 rounded-full bg-terminal-green animate-pulse" />
          <span>All Systems Operational</span>
        </div>
      </div>
    </footer>
  )
}
