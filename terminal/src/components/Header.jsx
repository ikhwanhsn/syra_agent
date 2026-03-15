import { Activity, Wifi } from 'lucide-react'

export default function Header({ activeTab, setActiveTab, tabs }) {
  return (
    <header className="flex items-center justify-between px-2 py-1 bg-terminal-bg border-b border-terminal-border flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <img src="/images/logo.jpg" alt="SYRA" className="w-5 h-5 rounded-sm" />
          <span className="text-xs font-bold tracking-wider text-terminal-accent">SYRA</span>
          <span className="text-[9px] text-terminal-dim font-medium tracking-widest">TERMINAL</span>
        </div>
        <nav className="flex items-center gap-px ml-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-0.5 text-[10px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30'
                  : 'text-terminal-dim hover:text-terminal-text hover:bg-terminal-panel border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-terminal-dim">
        <div className="flex items-center gap-1">
          <Wifi size={8} className="text-terminal-green" />
          <span>CONNECTED</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={8} className="text-terminal-green" />
          <span>LIVE</span>
        </div>
        <div className="w-px h-2.5 bg-terminal-border" />
        <span className="text-terminal-text font-medium tabular-nums">{new Date().toLocaleTimeString()}</span>
      </div>
    </header>
  )
}
