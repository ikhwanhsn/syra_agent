import { useState } from 'react'
import { ArrowUpDown, Search } from 'lucide-react'
import { marketPrices } from '../data/dummyData'

function MiniSparkline({ data, positive }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const h = 12
  const w = 36
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h}>
      <polyline fill="none" stroke={positive ? '#00ff88' : '#ff3366'} strokeWidth="1" points={points} />
    </svg>
  )
}

export default function MarketOverview({ compact }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('marketCap')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = marketPrices
    .filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey])

  const items = compact ? filtered.slice(0, 15) : filtered

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Market Overview</span>
        <span className="badge-accent">CoinGecko / CMC</span>
      </div>
      <div className="px-1.5 py-1 border-b border-terminal-border/40 flex-shrink-0">
        <div className="relative">
          <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-terminal-dim" />
          <input
            type="text"
            placeholder="Search token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-terminal-bg border border-terminal-border px-1.5 pl-5 py-0.5 text-[10px] text-terminal-text placeholder:text-terminal-muted focus:outline-none focus:border-terminal-accent/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-terminal-dim border-b border-terminal-border sticky top-0 bg-terminal-panel">
              <th className="text-left px-1.5 py-0.5 font-medium w-5">#</th>
              <th className="text-left px-1 py-0.5 font-medium">Token</th>
              <th className="text-right px-1 py-0.5 font-medium cursor-pointer select-none hover:text-terminal-text" onClick={() => handleSort('price')}>
                <span className="inline-flex items-center gap-px">Price<ArrowUpDown size={7} /></span>
              </th>
              <th className="text-right px-1 py-0.5 font-medium cursor-pointer select-none hover:text-terminal-text" onClick={() => handleSort('change24h')}>
                <span className="inline-flex items-center gap-px">24h%<ArrowUpDown size={7} /></span>
              </th>
              <th className="text-right px-1 py-0.5 font-medium cursor-pointer select-none hover:text-terminal-text" onClick={() => handleSort('volume')}>
                <span className="inline-flex items-center gap-px">Vol<ArrowUpDown size={7} /></span>
              </th>
              <th className="text-right px-1 py-0.5 font-medium cursor-pointer select-none hover:text-terminal-text" onClick={() => handleSort('marketCap')}>
                <span className="inline-flex items-center gap-px">MCap<ArrowUpDown size={7} /></span>
              </th>
              <th className="text-center px-1 py-0.5 font-medium">7d</th>
            </tr>
          </thead>
          <tbody>
            {items.map((token, i) => {
              const isPositive = token.change24h >= 0
              return (
                <tr key={token.symbol} className="border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors cursor-pointer group">
                  <td className="px-1.5 py-[3px] text-terminal-dim">{i + 1}</td>
                  <td className="px-1 py-[3px]">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-terminal-text group-hover:text-terminal-accent transition-colors">{token.symbol}</span>
                      <span className="text-terminal-dim text-[9px]">{token.name}</span>
                    </div>
                  </td>
                  <td className="text-right px-1 py-[3px] text-terminal-text font-medium tabular-nums">
                    ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: token.price < 1 ? 4 : 2 })}
                  </td>
                  <td className={`text-right px-1 py-[3px] font-medium tabular-nums ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
                  </td>
                  <td className="text-right px-1 py-[3px] text-terminal-dim tabular-nums">
                    ${(token.volume / 1e9).toFixed(1)}B
                  </td>
                  <td className="text-right px-1 py-[3px] text-terminal-dim tabular-nums">
                    ${(token.marketCap / 1e9).toFixed(0)}B
                  </td>
                  <td className="px-1 py-[3px] flex justify-center">
                    <MiniSparkline data={token.sparkline} positive={isPositive} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
