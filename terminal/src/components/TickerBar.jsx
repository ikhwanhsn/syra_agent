import { marketPrices } from '../data/dummyData'

function TickerItem({ item }) {
  const isPositive = item.change24h >= 0
  return (
    <div className="flex items-center gap-1.5 px-3 whitespace-nowrap">
      <span className="text-terminal-accent font-semibold text-[10px]">{item.symbol}</span>
      <span className="text-terminal-text text-[10px] tabular-nums">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span className={`text-[10px] font-medium tabular-nums ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
        {isPositive ? '+' : ''}{item.change24h.toFixed(2)}%
      </span>
      <MiniSparkline data={item.sparkline} positive={isPositive} />
    </div>
  )
}

function MiniSparkline({ data, positive }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const h = 10
  const w = 28
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke={positive ? '#00ff88' : '#ff3366'} strokeWidth="1" points={points} />
    </svg>
  )
}

export default function TickerBar() {
  const doubled = [...marketPrices, ...marketPrices]
  return (
    <div className="border-b border-terminal-border bg-terminal-panel/50 overflow-hidden h-5 flex items-center flex-shrink-0">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <TickerItem key={`${item.symbol}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}
