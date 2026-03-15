// Maps to: syra_v2_coingecko_simple_price / coinmarketcap
export const marketPrices = [
  { symbol: 'BTC', name: 'Bitcoin', price: 87234.56, change24h: 2.34, volume: 42_800_000_000, marketCap: 1_720_000_000_000, sparkline: [85100, 85800, 86200, 85900, 86800, 87100, 87234] },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change24h: -1.23, volume: 18_500_000_000, marketCap: 415_000_000_000, sparkline: [3520, 3490, 3460, 3480, 3445, 3460, 3456] },
  { symbol: 'SOL', name: 'Solana', price: 178.92, change24h: 5.67, volume: 4_200_000_000, marketCap: 82_000_000_000, sparkline: [168, 170, 173, 175, 176, 178, 178.92] },
  { symbol: 'BNB', name: 'BNB', price: 612.34, change24h: 0.89, volume: 1_800_000_000, marketCap: 91_000_000_000, sparkline: [605, 607, 610, 608, 611, 612, 612.34] },
  { symbol: 'XRP', name: 'XRP', price: 2.34, change24h: -0.56, volume: 3_100_000_000, marketCap: 134_000_000_000, sparkline: [2.38, 2.36, 2.35, 2.33, 2.34, 2.35, 2.34] },
  { symbol: 'ADA', name: 'Cardano', price: 0.782, change24h: 3.21, volume: 890_000_000, marketCap: 27_600_000_000, sparkline: [0.755, 0.76, 0.77, 0.775, 0.78, 0.781, 0.782] },
  { symbol: 'AVAX', name: 'Avalanche', price: 42.56, change24h: -2.45, volume: 620_000_000, marketCap: 17_200_000_000, sparkline: [43.8, 43.2, 42.9, 42.7, 42.5, 42.6, 42.56] },
  { symbol: 'DOT', name: 'Polkadot', price: 8.92, change24h: 1.78, volume: 410_000_000, marketCap: 12_800_000_000, sparkline: [8.72, 8.78, 8.82, 8.85, 8.88, 8.9, 8.92] },
  { symbol: 'LINK', name: 'Chainlink', price: 18.45, change24h: 4.12, volume: 780_000_000, marketCap: 11_200_000_000, sparkline: [17.6, 17.8, 18.0, 18.1, 18.3, 18.4, 18.45] },
  { symbol: 'MATIC', name: 'Polygon', price: 0.567, change24h: -1.89, volume: 340_000_000, marketCap: 5_300_000_000, sparkline: [0.58, 0.577, 0.573, 0.57, 0.568, 0.567, 0.567] },
  { symbol: 'UNI', name: 'Uniswap', price: 12.34, change24h: 2.56, volume: 290_000_000, marketCap: 7_400_000_000, sparkline: [11.9, 12.0, 12.1, 12.2, 12.25, 12.3, 12.34] },
  { symbol: 'ATOM', name: 'Cosmos', price: 9.87, change24h: 0.34, volume: 210_000_000, marketCap: 3_800_000_000, sparkline: [9.8, 9.82, 9.84, 9.85, 9.86, 9.87, 9.87] },
  { symbol: 'NEAR', name: 'NEAR Protocol', price: 7.23, change24h: 6.45, volume: 520_000_000, marketCap: 8_100_000_000, sparkline: [6.7, 6.85, 6.92, 7.0, 7.08, 7.15, 7.23] },
  { symbol: 'ICP', name: 'Internet Computer', price: 14.56, change24h: -3.12, volume: 180_000_000, marketCap: 6_900_000_000, sparkline: [15.1, 15.0, 14.85, 14.72, 14.65, 14.58, 14.56] },
  { symbol: 'FIL', name: 'Filecoin', price: 6.78, change24h: 1.92, volume: 310_000_000, marketCap: 3_900_000_000, sparkline: [6.6, 6.65, 6.68, 6.72, 6.74, 6.76, 6.78] },
  { symbol: 'ARB', name: 'Arbitrum', price: 1.45, change24h: 3.78, volume: 450_000_000, marketCap: 5_600_000_000, sparkline: [1.38, 1.39, 1.41, 1.42, 1.43, 1.44, 1.45] },
  { symbol: 'OP', name: 'Optimism', price: 2.89, change24h: -0.78, volume: 280_000_000, marketCap: 3_400_000_000, sparkline: [2.93, 2.92, 2.91, 2.90, 2.89, 2.89, 2.89] },
  { symbol: 'SUI', name: 'Sui', price: 3.56, change24h: 8.92, volume: 890_000_000, marketCap: 10_200_000_000, sparkline: [3.2, 3.28, 3.35, 3.4, 3.48, 3.52, 3.56] },
  { symbol: 'RENDER', name: 'Render', price: 8.92, change24h: 5.34, volume: 340_000_000, marketCap: 4_600_000_000, sparkline: [8.4, 8.5, 8.6, 8.7, 8.78, 8.85, 8.92] },
  { symbol: 'JUP', name: 'Jupiter', price: 1.23, change24h: -2.34, volume: 260_000_000, marketCap: 1_700_000_000, sparkline: [1.28, 1.27, 1.26, 1.25, 1.24, 1.23, 1.23] },
  { symbol: 'INJ', name: 'Injective', price: 28.45, change24h: 4.56, volume: 190_000_000, marketCap: 2_700_000_000, sparkline: [27.0, 27.3, 27.6, 27.9, 28.1, 28.3, 28.45] },
  { symbol: 'TIA', name: 'Celestia', price: 12.67, change24h: -1.45, volume: 220_000_000, marketCap: 2_900_000_000, sparkline: [12.9, 12.85, 12.8, 12.75, 12.72, 12.69, 12.67] },
  { symbol: 'SEI', name: 'Sei', price: 0.678, change24h: 7.23, volume: 310_000_000, marketCap: 2_100_000_000, sparkline: [0.62, 0.635, 0.648, 0.655, 0.665, 0.672, 0.678] },
  { symbol: 'BONK', name: 'Bonk', price: 0.0000234, change24h: 12.56, volume: 890_000_000, marketCap: 1_600_000_000, sparkline: [0.0000205, 0.0000210, 0.0000215, 0.0000220, 0.0000225, 0.0000230, 0.0000234] },
  { symbol: 'WIF', name: 'dogwifhat', price: 2.34, change24h: -4.67, volume: 560_000_000, marketCap: 2_300_000_000, sparkline: [2.48, 2.45, 2.42, 2.39, 2.37, 2.35, 2.34] },
  { symbol: 'PYTH', name: 'Pyth Network', price: 0.456, change24h: 2.89, volume: 190_000_000, marketCap: 1_200_000_000, sparkline: [0.44, 0.443, 0.446, 0.449, 0.452, 0.454, 0.456] },
  { symbol: 'STX', name: 'Stacks', price: 2.12, change24h: 1.34, volume: 150_000_000, marketCap: 3_100_000_000, sparkline: [2.08, 2.09, 2.10, 2.10, 2.11, 2.11, 2.12] },
  { symbol: 'AAVE', name: 'Aave', price: 312.45, change24h: 3.45, volume: 420_000_000, marketCap: 4_700_000_000, sparkline: [300, 303, 306, 308, 310, 311, 312.45] },
  { symbol: 'MKR', name: 'Maker', price: 1890.23, change24h: -0.92, volume: 110_000_000, marketCap: 1_700_000_000, sparkline: [1910, 1905, 1900, 1898, 1895, 1892, 1890.23] },
  { symbol: 'ONDO', name: 'Ondo Finance', price: 1.78, change24h: 9.34, volume: 340_000_000, marketCap: 2_500_000_000, sparkline: [1.6, 1.64, 1.68, 1.71, 1.74, 1.76, 1.78] },
  { symbol: 'PEPE', name: 'Pepe', price: 0.00001234, change24h: 15.67, volume: 1_200_000_000, marketCap: 5_200_000_000, sparkline: [0.00001050, 0.00001080, 0.00001120, 0.00001150, 0.00001180, 0.00001210, 0.00001234] },
]

// Maps to: syra_v2_coingecko_trending_pools / trending_jupiter
export const trendingPools = [
  { name: 'BONK/SOL', dex: 'Raydium', price: 0.0000234, change: 45.6, volume24h: 89_000_000, liquidity: 12_400_000, chain: 'Solana' },
  { name: 'WIF/SOL', dex: 'Orca', price: 2.34, change: 12.3, volume24h: 56_000_000, liquidity: 8_900_000, chain: 'Solana' },
  { name: 'JUP/USDC', dex: 'Raydium', price: 1.23, change: -3.4, volume24h: 34_000_000, liquidity: 15_600_000, chain: 'Solana' },
  { name: 'RENDER/SOL', dex: 'Orca', price: 8.56, change: 8.9, volume24h: 28_000_000, liquidity: 6_700_000, chain: 'Solana' },
  { name: 'PYTH/SOL', dex: 'Raydium', price: 0.456, change: -1.2, volume24h: 19_000_000, liquidity: 5_200_000, chain: 'Solana' },
  { name: 'RAY/USDC', dex: 'Raydium', price: 3.78, change: 6.7, volume24h: 15_000_000, liquidity: 9_800_000, chain: 'Solana' },
  { name: 'RNDR/USDC', dex: 'Jupiter', price: 8.92, change: 15.2, volume24h: 42_000_000, liquidity: 11_300_000, chain: 'Solana' },
  { name: 'MEME/SOL', dex: 'Raydium', price: 0.0312, change: 78.4, volume24h: 67_000_000, liquidity: 3_400_000, chain: 'Solana' },
]

// Maps to: syra_v2_news / trending_headline
export const newsItems = [
  { id: 1, title: 'Bitcoin Breaks $87K as Institutional Inflows Surge', source: 'CoinDesk', time: '2m ago', sentiment: 'bullish', ticker: 'BTC' },
  { id: 2, title: 'Solana DeFi TVL Reaches New All-Time High of $18B', source: 'The Block', time: '15m ago', sentiment: 'bullish', ticker: 'SOL' },
  { id: 3, title: 'SEC Delays Decision on Ethereum ETF Options Trading', source: 'Reuters', time: '32m ago', sentiment: 'bearish', ticker: 'ETH' },
  { id: 4, title: 'Jupiter DEX Launches V2 with Cross-Chain Routing', source: 'DL News', time: '1h ago', sentiment: 'bullish', ticker: 'JUP' },
  { id: 5, title: 'Whale Alert: 5,000 BTC Moved from Coinbase to Unknown Wallet', source: 'Whale Alert', time: '1h ago', sentiment: 'neutral', ticker: 'BTC' },
  { id: 6, title: 'Base Network Records 10M Daily Transactions', source: 'CoinTelegraph', time: '2h ago', sentiment: 'bullish', ticker: 'BASE' },
  { id: 7, title: 'BONK Rallies 45% After Major CEX Listing Announcement', source: 'Decrypt', time: '2h ago', sentiment: 'bullish', ticker: 'BONK' },
  { id: 8, title: 'Fed Minutes Signal Potential Rate Cut in Q2 2026', source: 'Bloomberg', time: '3h ago', sentiment: 'bullish', ticker: 'MACRO' },
  { id: 9, title: 'Cardano Launches Smart Contract Upgrade Proposal', source: 'CoinDesk', time: '4h ago', sentiment: 'neutral', ticker: 'ADA' },
  { id: 10, title: 'MicroStrategy Acquires Additional 2,500 BTC Worth $217M', source: 'CNBC', time: '5h ago', sentiment: 'bullish', ticker: 'BTC' },
]

// Maps to: syra_v2_sentiment
export const sentimentData = {
  overall: 72,
  label: 'Bullish',
  breakdown: [
    { category: 'Social Media', score: 78, label: 'Very Bullish' },
    { category: 'News Sentiment', score: 65, label: 'Bullish' },
    { category: 'Technical', score: 71, label: 'Bullish' },
    { category: 'On-Chain', score: 68, label: 'Bullish' },
    { category: 'Derivatives', score: 58, label: 'Neutral' },
  ],
  fearGreed: 72,
  fearGreedLabel: 'Greed',
  history: [
    { date: 'Mar 8', score: 58 },
    { date: 'Mar 9', score: 62 },
    { date: 'Mar 10', score: 55 },
    { date: 'Mar 11', score: 68 },
    { date: 'Mar 12', score: 71 },
    { date: 'Mar 13', score: 69 },
    { date: 'Mar 14', score: 72 },
  ],
  tokenSentiments: [
    { symbol: 'BTC', score: 85, change: 4 },
    { symbol: 'ETH', score: 58, change: -3 },
    { symbol: 'SOL', score: 91, change: 8 },
    { symbol: 'BONK', score: 78, change: 12 },
    { symbol: 'SUI', score: 82, change: 6 },
    { symbol: 'PEPE', score: 74, change: 15 },
    { symbol: 'LINK', score: 69, change: 2 },
    { symbol: 'AVAX', score: 42, change: -5 },
  ],
  marketMood: {
    bullishPct: 62,
    bearishPct: 21,
    neutralPct: 17,
    trending: ['AI Tokens', 'Solana Memes', 'DeFi Revival', 'RWA'],
    topMention: 'BTC',
    socialVolume24h: 2_340_000,
    socialVolumeChange: 18.5,
  },
}

// Maps to: syra_v2_signal
export const tradingSignals = [
  { token: 'Bitcoin', symbol: 'BTC', action: 'BUY', confidence: 87, entry: 86800, target: 92000, stopLoss: 84500, timeframe: '1D', reasoning: 'Breakout above resistance with high volume' },
  { token: 'Solana', symbol: 'SOL', action: 'BUY', confidence: 82, entry: 176, target: 195, stopLoss: 168, timeframe: '4H', reasoning: 'Strong momentum, TVL growth catalyst' },
  { token: 'Ethereum', symbol: 'ETH', action: 'HOLD', confidence: 64, entry: 3400, target: 3600, stopLoss: 3250, timeframe: '1D', reasoning: 'Consolidating near support, awaiting catalyst' },
  { token: 'Chainlink', symbol: 'LINK', action: 'BUY', confidence: 78, entry: 18.2, target: 22.5, stopLoss: 16.8, timeframe: '1W', reasoning: 'CCIP adoption driving demand' },
  { token: 'Avalanche', symbol: 'AVAX', action: 'SELL', confidence: 71, entry: 43.0, target: 38.0, stopLoss: 45.5, timeframe: '4H', reasoning: 'Rejection at resistance, declining volume' },
]

// Maps to: syra_v2_smart_money
export const smartMoneyData = {
  netFlow24h: 234_000_000,
  topHoldings: [
    { token: 'BTC', allocation: 42.5, change: 1.2 },
    { token: 'ETH', allocation: 28.3, change: -0.8 },
    { token: 'SOL', allocation: 12.8, change: 3.4 },
    { token: 'LINK', allocation: 5.6, change: 0.9 },
    { token: 'AVAX', allocation: 3.2, change: -1.1 },
    { token: 'Other', allocation: 7.6, change: 0.4 },
  ],
  recentTrades: [
    { wallet: '7xKp...3mRt', action: 'Buy', token: 'SOL', amount: '$2.4M', time: '5m ago' },
    { wallet: '9bFn...8kLw', action: 'Sell', token: 'ETH', amount: '$1.8M', time: '12m ago' },
    { wallet: '3cHd...5nQx', action: 'Buy', token: 'BTC', amount: '$5.1M', time: '23m ago' },
    { wallet: '6eMr...2jYs', action: 'Buy', token: 'LINK', amount: '$890K', time: '45m ago' },
    { wallet: '1dGk...7pVt', action: 'Sell', token: 'AVAX', amount: '$1.2M', time: '1h ago' },
    { wallet: '4fBw...9mRn', action: 'Buy', token: 'JUP', amount: '$670K', time: '1h ago' },
  ],
  dcaPatterns: [
    { wallet: '7xKp...3mRt', token: 'BTC', frequency: 'Daily', avgAmount: '$50K' },
    { wallet: '3cHd...5nQx', token: 'SOL', frequency: 'Weekly', avgAmount: '$120K' },
  ],
}

// Maps to: syra_v2_token_risk_alerts / token_report
export const tokenRiskAlerts = [
  { token: 'BONK', address: '0x...abc1', riskScore: 35, riskLevel: 'Low', issues: ['Concentrated supply'], status: 'Verified' },
  { token: 'WIF', address: '0x...abc2', riskScore: 28, riskLevel: 'Low', issues: [], status: 'Verified' },
  { token: 'MEME', address: '0x...abc3', riskScore: 72, riskLevel: 'Medium', issues: ['Low liquidity', 'New token'], status: 'Recent' },
  { token: 'PEPE2', address: '0x...abc4', riskScore: 91, riskLevel: 'High', issues: ['Honeypot risk', 'Unrenounced'], status: 'New' },
  { token: 'FLOKI', address: '0x...abc5', riskScore: 45, riskLevel: 'Medium', issues: ['High tax'], status: 'Trending' },
  { token: 'DOGE2', address: '0x...abc6', riskScore: 88, riskLevel: 'High', issues: ['Copycat', 'Low holders'], status: 'New' },
  { token: 'SHIB2', address: '0x...abc7', riskScore: 95, riskLevel: 'Critical', issues: ['Rug pull pattern', 'Mint function'], status: 'New' },
]

// Maps to: syra_v2_binance_correlation
export const correlationMatrix = {
  symbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'],
  data: [
    [1.00, 0.87, 0.72, 0.81, 0.65, 0.58],
    [0.87, 1.00, 0.78, 0.76, 0.62, 0.55],
    [0.72, 0.78, 1.00, 0.64, 0.51, 0.48],
    [0.81, 0.76, 0.64, 1.00, 0.69, 0.61],
    [0.65, 0.62, 0.51, 0.69, 1.00, 0.72],
    [0.58, 0.55, 0.48, 0.61, 0.72, 1.00],
  ],
}

// Maps to: syra_v2_8004_leaderboard / 8004_stats
export const agentLeaderboard = [
  { rank: 1, name: 'AlphaBot', tier: 'Diamond', trustScore: 98, feedbacks: 1247, asset: '8xKp...3mRt' },
  { rank: 2, name: 'TradeWiz', tier: 'Diamond', trustScore: 96, feedbacks: 983, asset: '9bFn...8kLw' },
  { rank: 3, name: 'SolScout', tier: 'Gold', trustScore: 91, feedbacks: 756, asset: '3cHd...5nQx' },
  { rank: 4, name: 'DeFiOracle', tier: 'Gold', trustScore: 88, feedbacks: 612, asset: '6eMr...2jYs' },
  { rank: 5, name: 'ChainPulse', tier: 'Silver', trustScore: 82, feedbacks: 445, asset: '1dGk...7pVt' },
  { rank: 6, name: 'MevHunter', tier: 'Silver', trustScore: 79, feedbacks: 334, asset: '4fBw...9mRn' },
  { rank: 7, name: 'YieldFarm3r', tier: 'Bronze', trustScore: 71, feedbacks: 201, asset: '2gNh...6kWq' },
  { rank: 8, name: 'NFTSniper', tier: 'Bronze', trustScore: 65, feedbacks: 156, asset: '5jLm...1pXr' },
  { rank: 9, name: 'LiquidBot', tier: 'Gold', trustScore: 89, feedbacks: 523, asset: '7kPn...4rTs' },
  { rank: 10, name: 'ArbKing', tier: 'Silver', trustScore: 84, feedbacks: 398, asset: '2mFq...6wXv' },
  { rank: 11, name: 'WhaleWatch', tier: 'Silver', trustScore: 81, feedbacks: 367, asset: '9nGr...3xYw' },
  { rank: 12, name: 'DexSniper', tier: 'Gold', trustScore: 87, feedbacks: 589, asset: '4pHs...7yZa' },
  { rank: 13, name: 'GasOpt', tier: 'Silver', trustScore: 80, feedbacks: 312, asset: '6qIt...8zBb' },
  { rank: 14, name: 'SentiBull', tier: 'Bronze', trustScore: 73, feedbacks: 245, asset: '1rJu...9aCc' },
  { rank: 15, name: 'FlashLoan3r', tier: 'Gold', trustScore: 86, feedbacks: 478, asset: '3sKv...0bDd' },
  { rank: 16, name: 'TokenScope', tier: 'Bronze', trustScore: 69, feedbacks: 134, asset: '5tLw...1cEe' },
  { rank: 17, name: 'PerpTrader', tier: 'Silver', trustScore: 83, feedbacks: 401, asset: '8uMx...2dFf' },
  { rank: 18, name: 'CopyBot', tier: 'Bronze', trustScore: 67, feedbacks: 119, asset: '0vNy...3eGg' },
  { rank: 19, name: 'RiskGuard', tier: 'Gold', trustScore: 90, feedbacks: 634, asset: '2wOz...4fHh' },
  { rank: 20, name: 'YieldMax', tier: 'Bronze', trustScore: 72, feedbacks: 189, asset: '4xPa...5gIi' },
]

export const agentStats = {
  totalAgents: 2847,
  totalFeedbacks: 18934,
  tiers: { Diamond: 23, Gold: 156, Silver: 489, Bronze: 1203, Unranked: 976 },
}

// Maps to: syra_v2_event
export const events = [
  { name: 'Solana Breakpoint 2026', date: 'Mar 20-22', location: 'Dubai', type: 'Conference', ticker: 'SOL' },
  { name: 'ETH Denver', date: 'Mar 28-30', location: 'Denver', type: 'Conference', ticker: 'ETH' },
  { name: 'Jupiter LFG Launchpad #12', date: 'Mar 18', location: 'Online', type: 'Launch', ticker: 'JUP' },
  { name: 'Chainlink CCIP v2 Launch', date: 'Mar 25', location: 'Online', type: 'Upgrade', ticker: 'LINK' },
  { name: 'Base Builder Summit', date: 'Apr 2-3', location: 'San Francisco', type: 'Conference', ticker: 'BASE' },
  { name: 'Polygon zkEVM Upgrade', date: 'Apr 8', location: 'Online', type: 'Upgrade', ticker: 'MATIC' },
]

// Maps to: syra_v2_dexscreener
export const dexScreenerData = {
  boostedTokens: [
    { name: 'BONK', chain: 'Solana', boostAmount: '$12.4K', totalBoosts: 156 },
    { name: 'WIF', chain: 'Solana', boostAmount: '$8.9K', totalBoosts: 98 },
    { name: 'POPCAT', chain: 'Solana', boostAmount: '$6.2K', totalBoosts: 67 },
  ],
  communityTakeovers: [
    { token: 'DEGEN', chain: 'Base', status: 'Active', holders: 45200 },
    { token: 'BRETT', chain: 'Base', status: 'Active', holders: 38100 },
  ],
}

// Maps to: syra_v2_analytics_summary
export const analyticsSummary = {
  totalMarketCap: 3_420_000_000_000,
  totalVolume24h: 128_000_000_000,
  btcDominance: 54.2,
  ethDominance: 16.8,
  defiTVL: 98_000_000_000,
  stablecoinSupply: 178_000_000_000,
  activeAddresses24h: 4_500_000,
  gasAvg: { eth: 23, sol: 0.00025, base: 0.001 },
}

// Maps to: syra_v2_brain (chat)
export const brainSampleMessages = [
  { role: 'user', content: 'What are the top trending tokens on Solana right now?' },
  { role: 'assistant', content: 'Based on current data, the top trending tokens on Solana are:\n\n1. **BONK** - Up 45.6% with $89M volume\n2. **MEME** - Up 78.4% (new listing hype)\n3. **RNDR** - Up 15.2% on AI narrative\n4. **WIF** - Up 12.3% steady momentum\n\nBONK and MEME are leading on momentum, while RNDR shows strong fundamental backing.' },
]

// Maps to: syra_v2_token_statistic
export const tokenStatistics = {
  newTokens24h: 1247,
  rugPullsDetected: 23,
  verifiedTokens: 8934,
  trendingTokens: 156,
}

// Maps to: syra_v2_sundown_digest
export const sundownDigest = {
  date: 'March 14, 2026',
  summary: 'Markets rallied led by BTC breaking $87K. Solana ecosystem saw massive activity with DeFi TVL hitting ATH. Institutional flows remain strong with MicroStrategy adding to BTC position.',
  topMovers: [
    { token: 'MEME', change: 78.4 },
    { token: 'BONK', change: 45.6 },
    { token: 'RNDR', change: 15.2 },
  ],
  keyEvents: ['MicroStrategy buys 2,500 BTC', 'Solana DeFi TVL ATH', 'Fed rate cut signals'],
}

// Chart data for BTC price chart
export const btcChartData = Array.from({ length: 48 }, (_, i) => {
  const base = 85000
  const time = new Date(Date.now() - (47 - i) * 3600000)
  const noise = Math.sin(i * 0.3) * 800 + Math.sin(i * 0.1) * 1200 + Math.random() * 400
  return {
    time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    price: Math.round((base + noise + i * 30) * 100) / 100,
    volume: Math.round(800_000_000 + Math.random() * 400_000_000),
  }
})

// Chart data for ETH price chart
export const ethChartData = Array.from({ length: 48 }, (_, i) => {
  const base = 3380
  const time = new Date(Date.now() - (47 - i) * 3600000)
  const noise = Math.sin(i * 0.25) * 40 + Math.sin(i * 0.12) * 60 + Math.random() * 20
  return {
    time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    price: Math.round((base + noise - i * 1.2) * 100) / 100,
    volume: Math.round(300_000_000 + Math.random() * 200_000_000),
  }
})

// Legacy alias
export const priceChartData = btcChartData
