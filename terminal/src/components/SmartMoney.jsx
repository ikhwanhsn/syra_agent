import { Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { smartMoneyData } from '../data/dummyData'

const COLORS = ['#00d4ff', '#00ff88', '#ffaa00', '#ff6b35', '#ff3366', '#8892a4']

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.allocation, 0)
  let cum = 0
  const size = 80
  const cx = size / 2
  const cy = size / 2
  const r = 28
  const strokeW = 11

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const startAngle = (cum / total) * 360 - 90
        cum += d.allocation
        const endAngle = (cum / total) * 360 - 90
        const largeArc = endAngle - startAngle > 180 ? 1 : 0
        const startRad = (startAngle * Math.PI) / 180
        const endRad = (endAngle * Math.PI) / 180
        const x1 = cx + r * Math.cos(startRad)
        const y1 = cy + r * Math.sin(startRad)
        const x2 = cx + r * Math.cos(endRad)
        const y2 = cy + r * Math.sin(endRad)
        return (
          <path
            key={d.token}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={strokeW}
          />
        )
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono">
        ${(smartMoneyData.netFlow24h / 1e6).toFixed(0)}M
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fill="#8892a4" fontSize="6" fontFamily="JetBrains Mono">
        NET FLOW
      </text>
    </svg>
  )
}

export default function SmartMoney() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Eye size={10} />
          <span>Smart Money</span>
        </div>
        <span className="badge-accent">Tracking</span>
      </div>
      <div className="flex-1 overflow-auto p-1.5" style={{ minHeight: 0 }}>
        <div className="flex items-start gap-3 mb-2">
          <DonutChart data={smartMoneyData.topHoldings} />
          <div className="flex-1 space-y-0.5">
            {smartMoneyData.topHoldings.map((h, i) => (
              <div key={h.token} className="flex items-center gap-1 text-[9px]">
                <div className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-terminal-text font-medium w-8">{h.token}</span>
                <span className="text-terminal-dim tabular-nums">{h.allocation}%</span>
                <span className={`tabular-nums ${h.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {h.change >= 0 ? '+' : ''}{h.change}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[9px] text-terminal-dim uppercase tracking-wider mb-0.5 font-semibold">Recent Trades</div>
        <div className="space-y-px">
          {smartMoneyData.recentTrades.map((trade, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[9px] py-0.5 px-1 hover:bg-terminal-accent/5 transition-colors">
              {trade.action === 'Buy'
                ? <ArrowUpRight size={8} className="text-terminal-green flex-shrink-0" />
                : <ArrowDownRight size={8} className="text-terminal-red flex-shrink-0" />
              }
              <span className="text-terminal-dim font-mono">{trade.wallet}</span>
              <span className={`font-medium ${trade.action === 'Buy' ? 'text-terminal-green' : 'text-terminal-red'}`}>{trade.action}</span>
              <span className="text-terminal-text font-medium">{trade.token}</span>
              <span className="text-terminal-text tabular-nums ml-auto">{trade.amount}</span>
              <span className="text-terminal-muted">{trade.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
