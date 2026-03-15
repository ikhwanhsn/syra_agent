import { MessageCircle, Hash } from 'lucide-react'
import { sentimentData } from '../data/dummyData'

function GaugeChart({ value, label }) {
  const r = 32
  const sw = 5
  const c = Math.PI * r
  const p = (value / 100) * c
  const color = value >= 70 ? '#00ff88' : value >= 40 ? '#ffaa00' : '#ff3366'
  return (
    <div className="flex flex-col items-center">
      <svg width={72} height={42} viewBox="0 0 72 42">
        <path d="M 4 40 A 32 32 0 0 1 68 40" fill="none" stroke="#1e2a3a" strokeWidth={sw} strokeLinecap="round" />
        <path d="M 4 40 A 32 32 0 0 1 68 40" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${p} ${c}`} style={{ filter: `drop-shadow(0 0 3px ${color}40)` }} />
        <text x="36" y="30" textAnchor="middle" fill={color} fontSize="13" fontWeight="700" fontFamily="JetBrains Mono">{value}</text>
        <text x="36" y="40" textAnchor="middle" fill="#8892a4" fontSize="6" fontFamily="JetBrains Mono">{label}</text>
      </svg>
    </div>
  )
}

function SentimentSparkline({ data }) {
  const min = Math.min(...data.map(d => d.score))
  const max = Math.max(...data.map(d => d.score))
  const range = max - min || 1
  const w = 120
  const h = 20
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.score - min) / range) * (h - 3) - 1.5}`).join(' ')
  return (
    <svg width={w} height={h} className="w-full">
      <polyline fill="none" stroke="#00d4ff" strokeWidth="1.2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SentimentPanel() {
  const { marketMood, tokenSentiments, history } = sentimentData
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Market Sentiment</span>
        <span className="badge-green">{sentimentData.label}</span>
      </div>
      <div className="flex-1 overflow-auto p-1.5 space-y-1.5" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-around">
          <GaugeChart value={sentimentData.overall} label="Overall" />
          <GaugeChart value={sentimentData.fearGreed} label="Fear & Greed" />
        </div>

        <div className="space-y-0.5">
          {sentimentData.breakdown.map((item) => {
            const color = item.score >= 70 ? 'bg-terminal-green' : item.score >= 40 ? 'bg-terminal-yellow' : 'bg-terminal-red'
            return (
              <div key={item.category} className="flex items-center gap-1.5">
                <span className="text-[9px] text-terminal-dim w-14 flex-shrink-0 truncate">{item.category}</span>
                <div className="flex-1 h-1 bg-terminal-border overflow-hidden">
                  <div className={`h-full ${color}`} style={{ width: `${item.score}%` }} />
                </div>
                <span className="text-[9px] text-terminal-text w-4 text-right tabular-nums">{item.score}</span>
              </div>
            )
          })}
        </div>

        <div>
          <div className="text-[9px] text-terminal-dim uppercase tracking-wider font-semibold mb-0.5">7-Day Trend</div>
          <div className="bg-terminal-bg/50 p-1">
            <SentimentSparkline data={history} />
            <div className="flex justify-between mt-0.5">
              {history.map((d, i) => (
                <span key={i} className="text-[7px] text-terminal-muted">{d.date.split(' ')[1]}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="text-[9px] text-terminal-dim uppercase tracking-wider font-semibold mb-0.5">Market Mood</div>
          <div className="flex items-center gap-px mb-1">
            <div className="h-1.5 bg-terminal-green" style={{ width: `${marketMood.bullishPct}%` }} />
            <div className="h-1.5 bg-terminal-yellow" style={{ width: `${marketMood.neutralPct}%` }} />
            <div className="h-1.5 bg-terminal-red" style={{ width: `${marketMood.bearishPct}%` }} />
          </div>
          <div className="flex justify-between text-[8px] mb-1">
            <span className="text-terminal-green">Bull {marketMood.bullishPct}%</span>
            <span className="text-terminal-yellow">Neutral {marketMood.neutralPct}%</span>
            <span className="text-terminal-red">Bear {marketMood.bearishPct}%</span>
          </div>
          <div className="grid grid-cols-2 gap-px">
            <div className="flex items-center gap-1 bg-terminal-bg/50 px-1.5 py-0.5">
              <MessageCircle size={8} className="text-terminal-accent flex-shrink-0" />
              <div>
                <div className="text-[8px] text-terminal-dim">Social Vol</div>
                <div className="text-[9px] text-terminal-text font-medium">{(marketMood.socialVolume24h / 1e6).toFixed(1)}M
                  <span className="text-terminal-green ml-0.5">+{marketMood.socialVolumeChange}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-terminal-bg/50 px-1.5 py-0.5">
              <Hash size={8} className="text-terminal-accent flex-shrink-0" />
              <div>
                <div className="text-[8px] text-terminal-dim">Trending</div>
                <div className="text-[9px] text-terminal-text font-medium truncate">{marketMood.trending[0]}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[9px] text-terminal-dim uppercase tracking-wider font-semibold mb-0.5">Token Sentiment</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-px">
            {tokenSentiments.map((t) => {
              const barColor = t.score >= 70 ? 'bg-terminal-green' : t.score >= 40 ? 'bg-terminal-yellow' : 'bg-terminal-red'
              return (
                <div key={t.symbol} className="flex items-center gap-1 py-px">
                  <span className="text-[9px] text-terminal-accent font-semibold w-7">{t.symbol}</span>
                  <div className="flex-1 h-[3px] bg-terminal-border overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${t.score}%` }} />
                  </div>
                  <span className="text-[8px] tabular-nums w-4 text-right text-terminal-text">{t.score}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-terminal-dim uppercase tracking-wider font-semibold mb-0.5">Narratives</div>
          <div className="flex flex-wrap gap-0.5">
            {marketMood.trending.map((tag) => (
              <span key={tag} className="text-[8px] px-1 py-px bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
