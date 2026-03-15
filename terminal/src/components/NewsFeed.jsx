import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { newsItems } from '../data/dummyData'

const sentimentIcons = {
  bullish: <TrendingUp size={8} className="text-terminal-green" />,
  bearish: <TrendingDown size={8} className="text-terminal-red" />,
  neutral: <Minus size={8} className="text-terminal-yellow" />,
}

const sentimentBadge = {
  bullish: 'badge-green',
  bearish: 'badge-red',
  neutral: 'badge-yellow',
}

export default function NewsFeed() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>News & Headlines</span>
        <span className="badge-accent">Live</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        {newsItems.map((item) => (
          <div
            key={item.id}
            className="px-1.5 py-1 border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-1.5">
              <div className="mt-0.5 flex-shrink-0">{sentimentIcons[item.sentiment]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-terminal-text leading-tight group-hover:text-terminal-accent transition-colors line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-terminal-dim">{item.source}</span>
                  <span className="text-[9px] text-terminal-muted">{item.time}</span>
                  <span className={`${sentimentBadge[item.sentiment]}`}>{item.ticker}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
