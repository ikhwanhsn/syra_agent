import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { btcChartData, ethChartData } from '../data/dummyData'

const timeframes = ['1H', '4H', '1D', '1W', '1M']

const COINS = {
  BTC: { data: btcChartData, label: 'BTC/USD', color: '#00ff88', yFormat: (v) => `$${(v / 1000).toFixed(1)}k` },
  ETH: { data: ethChartData, label: 'ETH/USD', color: '#00d4ff', yFormat: (v) => `$${v.toLocaleString()}` },
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-terminal-bg border border-terminal-border px-1.5 py-1 text-[9px] shadow-lg">
      <div className="text-terminal-dim">{label}</div>
      <div className="font-semibold" style={{ color: payload[0].stroke }}>${payload[0].value.toLocaleString()}</div>
    </div>
  )
}

export default function PriceChart({ coin = 'BTC' }) {
  const [tf, setTf] = useState('1D')
  const cfg = COINS[coin] || COINS.BTC

  const lastPrice = cfg.data[cfg.data.length - 1].price
  const firstPrice = cfg.data[0].price
  const change = ((lastPrice - firstPrice) / firstPrice) * 100
  const isPositive = change >= 0
  const lineColor = isPositive ? cfg.color : '#ff3366'
  const gradientId = `grad-${coin}`

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1.5">
          <span>{cfg.label}</span>
          <span className={`text-[10px] font-bold ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
            ${lastPrice.toLocaleString()}
          </span>
          <span className={`text-[9px] ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-px">
          {timeframes.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-1 py-0 text-[9px] transition-colors ${
                tf === t ? 'bg-terminal-accent/20 text-terminal-accent' : 'text-terminal-dim hover:text-terminal-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-1" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cfg.data} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 8, fill: '#4a5568' }}
              axisLine={{ stroke: '#1e2a3a' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 8, fill: '#4a5568' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={cfg.yFormat}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={1.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
