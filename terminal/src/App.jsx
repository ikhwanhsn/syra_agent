import { useState } from 'react'
import Header from './components/Header'
import TickerBar from './components/TickerBar'
import MarketOverview from './components/MarketOverview'
import PriceChart from './components/PriceChart'
import TrendingPools from './components/TrendingPools'
import NewsFeed from './components/NewsFeed'
import SentimentPanel from './components/SentimentPanel'
import TradingSignals from './components/TradingSignals'
import SmartMoney from './components/SmartMoney'
import TokenRiskAlerts from './components/TokenRiskAlerts'
import CorrelationMatrix from './components/CorrelationMatrix'
import AgentLeaderboard from './components/AgentLeaderboard'
import SyraBrain from './components/SyraBrain'
import EventsCalendar from './components/EventsCalendar'
import AnalyticsSummary from './components/AnalyticsSummary'
import StatusBar from './components/StatusBar'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trading', label: 'Trading' },
  { id: 'defi', label: 'DeFi' },
  { id: 'agents', label: 'Agents' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      <TickerBar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'trading' && <TradingTab />}
        {activeTab === 'defi' && <DeFiTab />}
        {activeTab === 'agents' && <AgentsTab />}
      </main>
      <StatusBar />
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" style={{ gap: 1 }}>
      <AnalyticsSummary />
      <div className="flex-1 grid grid-cols-12 overflow-hidden" style={{ gap: 1, minHeight: 0 }}>
        <div className="col-span-4 overflow-hidden">
          <MarketOverview />
        </div>
        <div className="col-span-5 grid grid-rows-2 overflow-hidden" style={{ gap: 1 }}>
          <PriceChart coin="BTC" />
          <PriceChart coin="ETH" />
        </div>
        <div className="col-span-3 overflow-hidden">
          <NewsFeed />
        </div>
      </div>
      <div className="grid grid-cols-12 overflow-hidden" style={{ gap: 1, flex: '0 0 35%' }}>
        <div className="col-span-4 overflow-hidden">
          <SentimentPanel />
        </div>
        <div className="col-span-4 overflow-hidden">
          <EventsCalendar />
        </div>
        <div className="col-span-4 overflow-hidden">
          <SyraBrain />
        </div>
      </div>
    </div>
  )
}

function TradingTab() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" style={{ gap: 1 }}>
      <div className="flex-1 grid grid-cols-12 overflow-hidden" style={{ gap: 1, minHeight: 0 }}>
        <div className="col-span-4 overflow-hidden">
          <PriceChart coin="BTC" />
        </div>
        <div className="col-span-4 overflow-hidden">
          <PriceChart coin="ETH" />
        </div>
        <div className="col-span-4 overflow-hidden">
          <TradingSignals />
        </div>
      </div>
      <div className="grid grid-cols-12 overflow-hidden" style={{ gap: 1, flex: '0 0 45%' }}>
        <div className="col-span-5 overflow-hidden">
          <CorrelationMatrix />
        </div>
        <div className="col-span-7 overflow-hidden">
          <MarketOverview compact />
        </div>
      </div>
    </div>
  )
}

function DeFiTab() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" style={{ gap: 1 }}>
      <div className="flex-1 grid grid-cols-12 overflow-hidden" style={{ gap: 1, minHeight: 0 }}>
        <div className="col-span-6 overflow-hidden">
          <TrendingPools />
        </div>
        <div className="col-span-6 overflow-hidden">
          <SmartMoney />
        </div>
      </div>
      <div className="grid grid-cols-12 overflow-hidden" style={{ gap: 1, flex: '0 0 48%' }}>
        <div className="col-span-6 overflow-hidden">
          <TokenRiskAlerts />
        </div>
        <div className="col-span-6 overflow-hidden">
          <NewsFeed />
        </div>
      </div>
    </div>
  )
}

function AgentsTab() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" style={{ gap: 1 }}>
      <div className="flex-1 grid grid-cols-12 overflow-hidden" style={{ gap: 1, minHeight: 0 }}>
        <div className="col-span-7 overflow-hidden">
          <AgentLeaderboard />
        </div>
        <div className="col-span-5 grid grid-rows-2 overflow-hidden" style={{ gap: 1 }}>
          <SyraBrain />
          <div className="grid grid-cols-2 overflow-hidden" style={{ gap: 1 }}>
            <SentimentPanel />
            <EventsCalendar />
          </div>
        </div>
      </div>
    </div>
  )
}
