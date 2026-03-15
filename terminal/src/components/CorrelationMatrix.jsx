import { Fragment } from 'react'
import { Grid3x3 } from 'lucide-react'
import { correlationMatrix } from '../data/dummyData'

function getColor(value) {
  if (value >= 0.8) return 'bg-terminal-green/40 text-terminal-green'
  if (value >= 0.6) return 'bg-terminal-green/20 text-terminal-green'
  if (value >= 0.4) return 'bg-terminal-yellow/20 text-terminal-yellow'
  return 'bg-terminal-red/20 text-terminal-red'
}

export default function CorrelationMatrix() {
  const { symbols, data } = correlationMatrix

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Grid3x3 size={10} />
          <span>Correlation Matrix</span>
        </div>
        <span className="badge-accent">Binance</span>
      </div>
      <div className="flex-1 overflow-auto p-1.5" style={{ minHeight: 0 }}>
        <div className="inline-grid gap-px" style={{ gridTemplateColumns: `auto repeat(${symbols.length}, 1fr)` }}>
          <div />
          {symbols.map((s) => (
            <div key={s} className="text-[9px] text-terminal-accent font-semibold text-center px-1.5 py-0.5">{s}</div>
          ))}
          {data.map((row, i) => (
            <Fragment key={`row-${i}`}>
              <div className="text-[9px] text-terminal-accent font-semibold flex items-center px-1.5 py-0.5">{symbols[i]}</div>
              {row.map((val, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`text-[9px] text-center px-1.5 py-1 tabular-nums font-medium ${
                    i === j ? 'bg-terminal-accent/20 text-terminal-accent' : getColor(val)
                  } hover:ring-1 hover:ring-terminal-accent/30 transition-all cursor-default`}
                >
                  {val.toFixed(2)}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[8px] text-terminal-dim">
          <div className="flex items-center gap-0.5"><div className="w-2.5 h-1.5 bg-terminal-green/40" /> Strong</div>
          <div className="flex items-center gap-0.5"><div className="w-2.5 h-1.5 bg-terminal-green/20" /> Moderate</div>
          <div className="flex items-center gap-0.5"><div className="w-2.5 h-1.5 bg-terminal-yellow/20" /> Weak</div>
          <div className="flex items-center gap-0.5"><div className="w-2.5 h-1.5 bg-terminal-red/20" /> Low</div>
        </div>
      </div>
    </div>
  )
}
