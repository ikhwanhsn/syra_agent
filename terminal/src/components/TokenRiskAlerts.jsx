import { ShieldAlert, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { tokenRiskAlerts } from '../data/dummyData'

const riskConfig = {
  Low: { color: 'text-terminal-green', bg: 'bg-terminal-green/10', icon: CheckCircle },
  Medium: { color: 'text-terminal-yellow', bg: 'bg-terminal-yellow/10', icon: AlertTriangle },
  High: { color: 'text-terminal-red', bg: 'bg-terminal-red/10', icon: XCircle },
  Critical: { color: 'text-terminal-red', bg: 'bg-terminal-red/20', icon: XCircle },
}

const statusColors = {
  Verified: 'badge-green',
  Trending: 'badge-accent',
  Recent: 'badge-yellow',
  New: 'text-terminal-muted bg-terminal-muted/10 px-1 py-0 text-[9px]',
}

export default function TokenRiskAlerts() {
  return (
    <div className="panel h-full">
      <div className="panel-header">
        <div className="flex items-center gap-1">
          <ShieldAlert size={10} className="text-terminal-yellow" />
          <span>Token Risk Scanner</span>
        </div>
        <span className="badge-yellow">Rugcheck</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-terminal-dim border-b border-terminal-border sticky top-0 bg-terminal-panel">
              <th className="text-left px-1.5 py-0.5 font-medium">Token</th>
              <th className="text-center px-1 py-0.5 font-medium">Risk</th>
              <th className="text-center px-1 py-0.5 font-medium">Score</th>
              <th className="text-left px-1 py-0.5 font-medium">Issues</th>
              <th className="text-center px-1.5 py-0.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tokenRiskAlerts.map((token) => {
              const config = riskConfig[token.riskLevel]
              const Icon = config.icon
              return (
                <tr key={token.token} className="border-b border-terminal-border/20 hover:bg-terminal-accent/5 transition-colors cursor-pointer">
                  <td className="px-1.5 py-[3px]">
                    <span className="font-semibold text-terminal-text">{token.token}</span>
                    <div className="text-[8px] text-terminal-muted font-mono">{token.address}</div>
                  </td>
                  <td className="text-center px-1 py-[3px]">
                    <span className={`inline-flex items-center gap-px ${config.color}`}>
                      <Icon size={8} />
                      <span className="text-[9px]">{token.riskLevel}</span>
                    </span>
                  </td>
                  <td className="text-center px-1 py-[3px]">
                    <div className="inline-flex items-center gap-0.5">
                      <div className="w-8 h-1 bg-terminal-border overflow-hidden">
                        <div
                          className={`h-full ${token.riskScore >= 80 ? 'bg-terminal-red' : token.riskScore >= 50 ? 'bg-terminal-yellow' : 'bg-terminal-green'}`}
                          style={{ width: `${token.riskScore}%` }}
                        />
                      </div>
                      <span className={`text-[9px] tabular-nums ${config.color}`}>{token.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-1 py-[3px]">
                    <div className="flex flex-wrap gap-0.5">
                      {token.issues.length > 0 ? token.issues.map((issue) => (
                        <span key={issue} className="text-[8px] text-terminal-red bg-terminal-red/10 px-0.5 py-px">{issue}</span>
                      )) : <span className="text-[8px] text-terminal-green">Clean</span>}
                    </div>
                  </td>
                  <td className="text-center px-1.5 py-[3px]">
                    <span className={`${statusColors[token.status]}`}>{token.status}</span>
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
