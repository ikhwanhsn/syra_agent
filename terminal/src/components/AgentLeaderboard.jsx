import { Trophy, Shield } from 'lucide-react'
import { agentLeaderboard, agentStats } from '../data/dummyData'

const tierColors = {
  Diamond: 'text-terminal-accent bg-terminal-accent/10',
  Gold: 'text-terminal-yellow bg-terminal-yellow/10',
  Silver: 'text-terminal-dim bg-terminal-dim/10',
  Bronze: 'text-terminal-orange bg-terminal-orange/10',
}

const rankBadge = {
  1: 'text-terminal-yellow',
  2: 'text-terminal-dim',
  3: 'text-terminal-orange',
}

export default function AgentLeaderboard() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <Trophy size={10} className="text-terminal-yellow" />
          <span>Agent Leaderboard</span>
        </div>
        <span className="badge-accent">8004 Registry</span>
      </div>
      <div className="px-1.5 py-1 border-b border-terminal-border/30 flex-shrink-0">
        <div className="grid grid-cols-5 gap-1 text-center">
          <div>
            <div className="text-[8px] text-terminal-dim">Total</div>
            <div className="text-[10px] text-terminal-text font-semibold tabular-nums">{agentStats.totalAgents.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[8px] text-terminal-dim">Feedbacks</div>
            <div className="text-[10px] text-terminal-text font-semibold tabular-nums">{agentStats.totalFeedbacks.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[8px] text-terminal-dim">Diamond</div>
            <div className="text-[10px] text-terminal-accent font-semibold">{agentStats.tiers.Diamond}</div>
          </div>
          <div>
            <div className="text-[8px] text-terminal-dim">Gold</div>
            <div className="text-[10px] text-terminal-yellow font-semibold">{agentStats.tiers.Gold}</div>
          </div>
          <div>
            <div className="text-[8px] text-terminal-dim">Silver</div>
            <div className="text-[10px] text-terminal-dim font-semibold">{agentStats.tiers.Silver}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-terminal-dim border-b border-terminal-border sticky top-0 bg-terminal-panel">
              <th className="text-center px-1 py-0.5 font-medium w-6">#</th>
              <th className="text-left px-1 py-0.5 font-medium">Agent</th>
              <th className="text-center px-1 py-0.5 font-medium">Tier</th>
              <th className="text-center px-1 py-0.5 font-medium">Trust</th>
              <th className="text-right px-1 py-0.5 font-medium">FB</th>
              <th className="text-right px-1.5 py-0.5 font-medium">Asset</th>
            </tr>
          </thead>
          <tbody>
            {agentLeaderboard.map((agent) => (
              <tr key={agent.rank} className="border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors cursor-pointer group">
                <td className={`text-center px-1 py-[3px] font-bold ${rankBadge[agent.rank] || 'text-terminal-dim'}`}>
                  {agent.rank}
                </td>
                <td className="px-1 py-[3px]">
                  <div className="flex items-center gap-1">
                    <Shield size={9} className="text-terminal-accent flex-shrink-0" />
                    <span className="font-semibold text-terminal-text group-hover:text-terminal-accent transition-colors">{agent.name}</span>
                  </div>
                </td>
                <td className="text-center px-1 py-[3px]">
                  <span className={`text-[9px] px-1 py-px font-medium ${tierColors[agent.tier]}`}>{agent.tier}</span>
                </td>
                <td className="text-center px-1 py-[3px]">
                  <div className="inline-flex items-center gap-0.5">
                    <div className="w-8 h-1 bg-terminal-border overflow-hidden">
                      <div className="h-full bg-terminal-green" style={{ width: `${agent.trustScore}%` }} />
                    </div>
                    <span className="text-terminal-text tabular-nums text-[9px]">{agent.trustScore}</span>
                  </div>
                </td>
                <td className="text-right px-1 py-[3px] text-terminal-dim tabular-nums">{agent.feedbacks.toLocaleString()}</td>
                <td className="text-right px-1.5 py-[3px] text-terminal-muted font-mono text-[9px]">{agent.asset}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
