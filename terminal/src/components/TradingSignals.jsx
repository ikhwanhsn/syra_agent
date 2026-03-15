import { Target, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { tradingSignals } from '../data/dummyData'

const actionConfig = {
  BUY: { color: 'text-terminal-green', bg: 'bg-terminal-green/15', icon: ArrowUp },
  SELL: { color: 'text-terminal-red', bg: 'bg-terminal-red/15', icon: ArrowDown },
  HOLD: { color: 'text-terminal-yellow', bg: 'bg-terminal-yellow/15', icon: Minus },
}

export default function TradingSignals() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Target size={10} />
          <span>Trading Signals</span>
        </div>
        <span className="badge-accent">AI Generated</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        {tradingSignals.map((signal) => {
          const config = actionConfig[signal.action]
          const Icon = config.icon
          return (
            <div key={signal.symbol} className="px-1.5 py-1 border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-terminal-text">{signal.symbol}</span>
                  <span className={`inline-flex items-center gap-px px-1 py-px text-[9px] font-semibold ${config.color} ${config.bg}`}>
                    <Icon size={7} />
                    {signal.action}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-terminal-dim">{signal.timeframe}</span>
                  <div className="flex items-center gap-0.5">
                    <div className="w-10 h-1 bg-terminal-border overflow-hidden">
                      <div
                        className={`h-full ${signal.confidence >= 80 ? 'bg-terminal-green' : signal.confidence >= 60 ? 'bg-terminal-yellow' : 'bg-terminal-red'}`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-terminal-text tabular-nums">{signal.confidence}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[9px]">
                <div>
                  <span className="text-terminal-dim">Entry </span>
                  <span className="text-terminal-text tabular-nums">${signal.entry.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-terminal-dim">Target </span>
                  <span className="text-terminal-green tabular-nums">${signal.target.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-terminal-dim">SL </span>
                  <span className="text-terminal-red tabular-nums">${signal.stopLoss.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[9px] text-terminal-dim italic mt-0.5">{signal.reasoning}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
