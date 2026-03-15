import { Flame } from 'lucide-react'
import { trendingPools } from '../data/dummyData'

export default function TrendingPools() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Flame size={10} className="text-terminal-orange" />
          <span>Trending Pools</span>
        </div>
        <span className="badge-accent">Jupiter / CoinGecko</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-terminal-dim border-b border-terminal-border sticky top-0 bg-terminal-panel">
              <th className="text-left px-1.5 py-0.5 font-medium">Pair</th>
              <th className="text-left px-1 py-0.5 font-medium">DEX</th>
              <th className="text-right px-1 py-0.5 font-medium">Price</th>
              <th className="text-right px-1 py-0.5 font-medium">24h%</th>
              <th className="text-right px-1 py-0.5 font-medium">Volume</th>
              <th className="text-right px-1.5 py-0.5 font-medium">Liquidity</th>
            </tr>
          </thead>
          <tbody>
            {trendingPools.map((pool) => {
              const isPositive = pool.change >= 0
              return (
                <tr key={pool.name} className="border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors cursor-pointer group">
                  <td className="px-1.5 py-[3px]">
                    <span className="font-semibold text-terminal-text group-hover:text-terminal-accent transition-colors">{pool.name}</span>
                  </td>
                  <td className="px-1 py-[3px] text-terminal-dim">{pool.dex}</td>
                  <td className="text-right px-1 py-[3px] text-terminal-text tabular-nums">
                    ${pool.price < 0.01 ? pool.price.toFixed(7) : pool.price.toFixed(2)}
                  </td>
                  <td className={`text-right px-1 py-[3px] font-medium tabular-nums ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {isPositive ? '+' : ''}{pool.change.toFixed(1)}%
                  </td>
                  <td className="text-right px-1 py-[3px] text-terminal-dim tabular-nums">
                    ${(pool.volume24h / 1e6).toFixed(1)}M
                  </td>
                  <td className="text-right px-1.5 py-[3px] text-terminal-dim tabular-nums">
                    ${(pool.liquidity / 1e6).toFixed(1)}M
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
