import type { Language } from "@/lib/LanguageContext";
import type { NarrativeTag, RiskFlag } from "@/components/terminal/types";

export type DashboardDictionary = {
  sidebar: string;
  showSidebar: string;
  hideSidebar: string;
  openMenu: string;
  darkMode: string;
  lightMode: string;
  switchToDarkMode: string;
  switchToLightMode: string;
  nav: {
    terminal: string;
    market: string;
    simulator: string;
    insights: string;
    wallet: string;
  };
  /** Links pinned to the bottom of the dashboard sidebar */
  sidebarFooter: {
    /** Small eyebrow above outbound links */
    sectionLabel: string;
    /** Second line under the eyebrow (expanded sidebar only) */
    sectionSubtitle: string;
    xAria: string;
    telegramAria: string;
    riseTradeAria: string;
    /** Visible row titles when the sidebar is expanded */
    xLabel: string;
    telegramLabel: string;
    riseTradeLabel: string;
    /** Muted line under each row title */
    xHint: string;
    telegramHint: string;
    riseTradeHint: string;
  };
  pages: {
    riseTerminal: string;
    market: string;
    wallet: string;
    simulator: string;
    simulatorDashboard: string;
    insights: string;
    activityFeed: string;
    whales: string;
    signals: string;
    news: string;
    dashboard: string;
    terminalEyebrow: string;
    terminalTitle: string;
    terminalDescription: string;
    marketEyebrow: string;
    marketTitle: string;
    marketDescription: string;
    simulatorEyebrow: string;
    simulatorTitle: string;
    simulatorDescription: string;
    insightsEyebrow: string;
    insightsTitle: string;
    insightsDescription: string;
    walletEyebrow: string;
    walletTitle: string;
    walletDescription: string;
    /** Home `/` overview screener */
    overviewEyebrow: string;
    overviewTitle: string;
    overviewDescription: string;
    overviewPageTitle: string;
  };
  tabs: {
    screener: string;
    floorScanner: string;
    compare: string;
    watchlist: string;
    quoteCalculator: string;
    borrowSimulator: string;
    dcaSimulator: string;
    activityFeed: string;
    whales: string;
    signals: string;
    news: string;
  };
  terminal: {
    markets: string;
    vol24h: string;
    mcap: string;
    alphaPicks: string;
    agentsOnline: string;
    feed: string;
    feedHealthy: string;
    feedPartial: string;
    liveRiseTerminal: string;
    asOf: string;
    /** Shown next to day-over-day % on KPI strip */
    vsYesterday: string;
    /** When API has no prior UTC-day snapshot yet (first day or cold DB) */
    deltaNoBaseline: string;
    /** Aggregate omitted terminalKpiTrend (e.g. MongoDB unavailable) */
    terminalTrendUnavailable: string;
    alphaLeaderboard: string;
    topTen: string;
    riskWatchlist: string;
    highestFlags: string;
    /** Risk watchlist row — no flags surfaced */
    riskWatchlistClear: string;
    /** Alpha / risk side panels when the markets feed is empty */
    sidebarListsEmpty: string;
    volSuffix: string;
    filters: string;
    verified: string;
    floorBacked: string;
    clear: string;
    searchPlaceholder: string;
    riskFlags: string;
    narratives: string;
    token: string;
    alpha: string;
    price: string;
    h24: string;
    vol24hLabel: string;
    mcapLabel: string;
    floorMc: string;
    holders: string;
    age: string;
    risk: string;
    narrative: string;
    trade: string;
    actions: string;
    share: string;
    shareDialogTitle: string;
    shareDialogDescription: string;
    shareDownloadImage: string;
    shareCopyImage: string;
    shareCopiedImage: string;
    shareCopyImageFailed: string;
    /** Shown when Clipboard API cannot write image/png (browser / permissions). */
    shareCopyImageUnsupported: string;
    shareOnX: string;
    shareOnTelegram: string;
    shareCopyLink: string;
    shareCopyMint: string;
    shareCopiedLink: string;
    shareCopiedMint: string;
    shareNative: string;
    shareCardEyebrow: string;
    /** `{symbol}` placeholder */
    shareCardCta: string;
    shareCardBragline: string;
    /** `{rank}` placeholder */
    shareCardBraglineRanked: string;
    /** `{rank}` placeholder */
    topNAlpha: string;
    shareCardScoreLabel: string;
    /** Short hint under score label (e.g. scale) */
    shareCardScoreRange: string;
    shareCardMintLabel: string;
    shareCardVia: string;
    shareCardLive: string;
    /** `{symbol}`, `{rank}`, `{score}`, `{change24h}`, `{url}` */
    shareSocialTextRanked: string;
    /** `{symbol}`, `{score}`, `{change24h}`, `{url}` */
    shareSocialTextUnranked: string;
    shareDownloadFailed: string;
    showing: string;
    of: string;
    prev: string;
    next: string;
    riskLabel: Record<RiskFlag, string>;
    narrativeLabel: Record<NarrativeTag, string>;
  };
  walletButton: {
    installPhantom: string;
    connecting: string;
    connectWallet: string;
    connectedWallet: string;
    walletConnected: string;
    walletAddressCopied: string;
    copyAddress: string;
    viewOnSolscan: string;
    disconnect: string;
  };
  tokenDetail: {
    pageTitle: string;
    eyebrow: string;
    pageDescription: string;
    notFoundTitle: string;
    notFoundDescription: string;
    browseMarkets: string;
    back: string;
    copyMint: string;
    mintCopied: string;
    watchlistAdd: string;
    watchlistRemove: string;
    share: string;
    linkCopied: string;
    openSimulator: string;
    loadingToken: string;
    sectionScore: string;
    sectionKpis: string;
    sectionPrice: string;
    sectionTrades: string;
    sectionQuote: string;
    sectionLiquidity: string;
    sectionEcosystem: string;
    sectionAbout: string;
    sectionSimilar: string;
    sectionHolder: string;
    holderTitle: string;
    holderDescription: string;
    holderCirculatingSupply: string;
    holderYourBalance: string;
    holderShareOfSupply: string;
    holderUsdValue: string;
    holderConnectToSee: string;
    holderConnectPrompt: string;
    holderFootnote: string;
    holderErrorPortfolio: string;
    holderErrorSupply: string;
    kpiPrice: string;
    kpiFloor: string;
    kpiFloorDelta: string;
    kpiMcap: string;
    kpiFloorMcap: string;
    kpiVol24h: string;
    kpiVolAll: string;
    kpiStartPrice: string;
    kpiRoi: string;
    kpiTurnover: string;
    kpiHolders: string;
    kpiLocked: string;
    kpiCreatorFee: string;
    kpiAge: string;
    kpiCreatedAt: string;
    kpiUpdatedAt: string;
    chartHigh: string;
    chartLow: string;
    chartRange: string;
    chartAvgClose: string;
    chartVolSum: string;
    chartWindowChg: string;
    chartRsi: string;
    chartMom: string;
    chartVolSample: string;
    chartNoData: string;
    chartSource: string;
    chartUpdated: string;
    chartAllTimeframe: string;
    tradesTitle: string;
    tradesPartial: string;
    tradesBuySell: string;
    tradesUniqueWallets: string;
    tradesAvg: string;
    tradesLargest: string;
    tradesSide: string;
    tradesWallet: string;
    tradesPrice: string;
    tradesAmount: string;
    tradesUsd: string;
    tradesWhen: string;
    tradesSideBuy: string;
    tradesSideSell: string;
    tradesSideBorrow: string;
    tradesSideRepay: string;
    tradesSideCreate: string;
    tradesAggregated: string;
    tradesJustNow: string;
    tradesAgoUnit: string;
    tradesViewSolscan: string;
    quoteAmount: string;
    quoteBuy: string;
    quoteSell: string;
    quoteImpact: string;
    quoteAvgFill: string;
    quoteFee: string;
    quoteFooter: string;
    liquidityLocked: string;
    liquidityFloorCover: string;
    liquidityFeeMedian: string;
    rankMcap: string;
    rankVol: string;
    rankHolders: string;
    rankAge: string;
    rankTop: string;
    /** `{pct}` — percentile bucket label, e.g. Top 12% */
    topPercentLabel: string;
    aboutCreator: string;
    aboutMarketAddr: string;
    aboutMint: string;
    aboutCreated: string;
    aboutUpdated: string;
    aboutTokenUri: string;
    aboutSocials: string;
    aboutDisableSell: string;
    similarTitle: string;
    similarSubtitle: string;
    scoreMomentum: string;
    scoreFlow: string;
    scoreDepth: string;
    scoreFreshness: string;
    metaDisclaimer: string;
    tradeOnRise: string;
    solscan: string;
    discord: string;
  };
  bubbleMap: {
    eyebrow: string;
    title: string;
    description: string;
    sizeBy: string;
    marketCap: string;
    volume24h: string;
    holders: string;
    refreshing: string;
    /** aria-label for the top map status strip when not refetching */
    liveStripLabel: string;
    zoomInAria: string;
    zoomOutAria: string;
    dragHint: string;
    /** Scroll / pinch to zoom; drag empty map to pan */
    zoomHint: string;
    a11yListLabel: string;
    dialogViewToken: string;
    dialogSubtitle: string;
    dialogKpiPrice: string;
    dialogKpi24h: string;
    dialogKpiMcap: string;
    dialogKpiFloorMcap: string;
    dialogKpiVol24h: string;
    dialogKpiHolders: string;
    dialogKpiAge: string;
    share: string;
    shareNative: string;
    shareDownloadImage: string;
    shareOnX: string;
    shareOnTelegram: string;
    shareCopiedImage: string;
    shareDownloadFailed: string;
    shareNativeFailed: string;
    loadError: string;
    retry: string;
  };
};

export const DASHBOARD_COPY: Record<Language, DashboardDictionary> = {
  en: {
    sidebar: "Smart Agent Fund · RISE",
    showSidebar: "Show sidebar",
    hideSidebar: "Hide sidebar",
    openMenu: "Open menu",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    switchToDarkMode: "Switch to dark mode",
    switchToLightMode: "Switch to light mode",
    nav: {
      terminal: "Terminal",
      market: "Market",
      simulator: "Simulator",
      insights: "Insights",
      wallet: "Wallet",
    },
    sidebarFooter: {
      sectionLabel: "Connect",
      sectionSubtitle: "Official channels",
      xAria: "Up Only Fund on X",
      telegramAria: "Up Only Fund on Telegram",
      riseTradeAria: "Trade $UPONLY on RISE",
      xLabel: "X",
      telegramLabel: "Telegram",
      riseTradeLabel: "Trade on RISE",
      xHint: "@uponly_fund",
      telegramHint: "Community & updates",
      riseTradeHint: "$UPONLY · rise.rich",
    },
    pages: {
      riseTerminal: "Rise Terminal",
      market: "Market",
      wallet: "Wallet",
      simulator: "Simulator",
      simulatorDashboard: "Simulator dashboard",
      insights: "Insights",
      activityFeed: "Activity feed",
      whales: "Whales",
      signals: "Signals",
      news: "News",
      dashboard: "Dashboard",
      terminalEyebrow: "RISE TERMINAL",
      terminalTitle: "Find alpha in one place",
      terminalDescription: "Institutional-grade screener for Rise, fused with fund-grade intelligence.",
      marketEyebrow: "ALPHA SCREENING",
      marketTitle: "Markets dashboard",
      marketDescription: "Scan, compare, and floor-check every RISE market - same data the agents use.",
      simulatorEyebrow: "RISK & SIZING",
      simulatorTitle: "Simulator dashboard",
      simulatorDescription: "Quote, borrow, and DCA simulators for sizing fund-grade entries.",
      insightsEyebrow: "EDGE INTELLIGENCE",
      insightsTitle: "Insights dashboard",
      insightsDescription: "Whales, signals, news, and on-chain activity - gated by $UPONLY.",
      walletEyebrow: "On-chain intel",
      walletTitle: "Wallet lookup",
      walletDescription:
        "Paste any Solana address to pull RISE portfolio totals and positions from read-only market APIs—shareable via URL, nothing signed.",
      overviewEyebrow: "GENERAL OVERVIEW",
      overviewTitle: "General overview",
      overviewDescription:
        "All RISE markets in one place — default composite trending rank (volume, holders, and move), 100 rows per page, with filters and column sort.",
      overviewPageTitle: "General overview",
    },
    tabs: {
      screener: "Screener",
      floorScanner: "Floor Scanner",
      compare: "Compare",
      watchlist: "Watchlist",
      quoteCalculator: "Quote Calculator",
      borrowSimulator: "Borrow Simulator",
      dcaSimulator: "DCA Simulator",
      activityFeed: "Activity Feed",
      whales: "Whales",
      signals: "Signals",
      news: "News",
    },
    terminal: {
      markets: "Markets",
      vol24h: "24h Vol",
      mcap: "Mcap",
      alphaPicks: "Alpha picks",
      agentsOnline: "Agents online",
      feed: "Feed",
      feedHealthy: "Healthy",
      feedPartial: "Partial",
      liveRiseTerminal: "Live · Rise terminal",
      asOf: "As of",
      vsYesterday: "vs prior day",
      deltaNoBaseline:
        "Day-over-day % appears after this device records yesterday's snapshot (terminal visits on consecutive days).",
      alphaLeaderboard: "Alpha leaderboard",
      topTen: "Top 10",
      riskWatchlist: "Risk watchlist",
      highestFlags: "Highest flags",
      riskWatchlistClear: "No active flags",
      sidebarListsEmpty: "No market data yet.",
      volSuffix: "vol",
      filters: "Filters",
      verified: "Verified",
      floorBacked: "Floor-backed",
      clear: "Clear",
      searchPlaceholder: "Search symbol, token name, mint...",
      riskFlags: "Risk flags",
      narratives: "Narratives",
      token: "Token",
      alpha: "Alpha",
      price: "Price",
      h24: "24h",
      vol24hLabel: "Vol 24h",
      mcapLabel: "Mcap",
      floorMc: "Floor MC",
      holders: "Holders",
      age: "Age",
      risk: "Risk",
      narrative: "Narrative",
      trade: "Trade",
      actions: "Actions",
      share: "Share",
      shareDialogTitle: "Share this market",
      shareDialogDescription: "Make your alpha pick impossible to ignore.",
      shareDownloadImage: "Download card",
      shareCopyImage: "Copy image",
      shareCopiedImage: "Image copied",
      shareCopyImageFailed: "Could not copy image. Try Download, or use Chrome / Edge / Safari 15.4+.",
      shareCopyImageUnsupported: "Copy image isn’t supported in this browser. Use Download.",
      shareOnX: "Share on X",
      shareOnTelegram: "Share on Telegram",
      shareCopyLink: "Copy link",
      shareCopyMint: "Copy mint",
      shareCopiedLink: "Link copied",
      shareCopiedMint: "Mint copied",
      shareNative: "Share…",
      shareCardEyebrow: "RISE Terminal · Up Only Fund",
      shareCardCta: "Trade {symbol} on RISE",
      shareCardBragline: "Fund-grade intelligence. Retail-proof conviction.",
      shareCardBraglineRanked: "Top {rank} on the Alpha leaderboard — publicly.",
      topNAlpha: "#{rank} ALPHA",
      shareCardScoreLabel: "Alpha score",
      shareCardScoreRange: "0–100 scale",
      shareCardMintLabel: "Mint",
      shareCardVia: "via uplonlyfund.com",
      shareCardLive: "Live",
      shareSocialTextRanked:
        "{symbol} is #{rank} on the Rise Alpha leaderboard — score {score}. {change24h} 24h. {url}",
      shareSocialTextUnranked:
        "{symbol} on Rise Terminal — Alpha score {score}. {change24h} 24h. {url}",
      shareDownloadFailed: "Could not export image. Try again.",
      showing: "Showing",
      of: "of",
      prev: "Prev",
      next: "Next",
      riskLabel: {
        LowLiquidity: "Low liquidity",
        HighFee: "High fee",
        NewAge: "New",
        LowLocked: "Low locked",
        Unverified: "Unverified",
        DisableSell: "Sell disabled",
      },
      narrativeLabel: {
        Verified: "Verified",
        FloorBacked: "Floor-backed",
        Momentum: "Momentum",
        Cooldown: "Cooldown",
        BlueChip: "Blue chip",
        Microcap: "Microcap",
        Fresh: "Fresh",
      },
    },
    walletButton: {
      installPhantom: "Install Phantom",
      connecting: "Connecting...",
      connectWallet: "Connect wallet",
      connectedWallet: "Connected wallet",
      walletConnected: "Wallet connected",
      walletAddressCopied: "Wallet address copied",
      copyAddress: "Copy address",
      viewOnSolscan: "View on Solscan",
      disconnect: "Disconnect",
    },
    tokenDetail: {
      pageTitle: "Token",
      eyebrow: "RISE MARKET",
      pageDescription: "Full-fidelity snapshot: live Rise endpoints plus fund-grade derived signals.",
      notFoundTitle: "Token not found",
      notFoundDescription: "This mint is not in the current Rise universe snapshot. Try browsing markets or Terminal.",
      browseMarkets: "Browse markets",
      back: "Back",
      copyMint: "Copy mint",
      mintCopied: "Mint copied",
      watchlistAdd: "Watchlist",
      watchlistRemove: "Remove",
      share: "Share",
      linkCopied: "Link copied",
      openSimulator: "Open full simulator",
      loadingToken: "Resolving token…",
      sectionScore: "Intelligence",
      sectionKpis: "Market snapshot",
      sectionPrice: "Price action",
      sectionTrades: "Recent trades",
      sectionQuote: "Curve quote",
      sectionLiquidity: "Liquidity & structure",
      sectionEcosystem: "Ecosystem rank",
      sectionAbout: "On-chain metadata",
      sectionSimilar: "Similar markets",
      sectionHolder: "Your holdings",
      holderTitle: "Holder snapshot",
      holderDescription: "Circulating supply from the live curve quote; your wallet balance from read-only RISE portfolio APIs.",
      holderCirculatingSupply: "Circulating supply",
      holderYourBalance: "Your balance",
      holderShareOfSupply: "Your share of supply",
      holderUsdValue: "Wallet value (USD)",
      holderConnectToSee: "Connect wallet",
      holderConnectPrompt: "Connect your Phantom wallet to see how many tokens you hold and what share of circulating supply that represents.",
      holderFootnote:
        "Balances and supply figures come from RISE indexers and quote simulations—they can lag on-chain state. Verify large positions on Solscan.",
      holderErrorPortfolio: "Could not load portfolio balance.",
      holderErrorSupply: "Could not load supply from quote.",
      kpiPrice: "Spot price",
      kpiFloor: "Floor price",
      kpiFloorDelta: "Floor delta",
      kpiMcap: "Market cap",
      kpiFloorMcap: "Floor mcap",
      kpiVol24h: "24h volume",
      kpiVolAll: "All-time volume",
      kpiStartPrice: "Starting price",
      kpiRoi: "ROI vs start",
      kpiTurnover: "24h vol / mcap",
      kpiHolders: "Holders",
      kpiLocked: "Locked supply",
      kpiCreatorFee: "Creator fee",
      kpiAge: "Age",
      kpiCreatedAt: "Created (API)",
      kpiUpdatedAt: "Updated (API)",
      chartHigh: "High",
      chartLow: "Low",
      chartRange: "Range",
      chartAvgClose: "Avg close",
      chartVolSum: "Σ volume",
      chartWindowChg: "Window Δ",
      chartRsi: "RSI(14)",
      chartMom: "Mom(14)",
      chartVolSample: "Vol index",
      chartNoData: "No chart data for this timeframe.",
      chartSource: "Source",
      chartUpdated: "Updated",
      chartAllTimeframe: "ALL (1d)",
      tradesTitle: "Tape",
      tradesPartial: "Some rows have partial metadata from upstream.",
      tradesBuySell: "Buy flow",
      tradesUniqueWallets: "Unique wallets",
      tradesAvg: "Avg trade",
      tradesLargest: "Largest",
      tradesSide: "Side",
      tradesWallet: "Wallet",
      tradesPrice: "Price",
      tradesAmount: "Amount",
      tradesUsd: "USD",
      tradesWhen: "When",
      tradesSideBuy: "Buy",
      tradesSideSell: "Sell",
      tradesSideBorrow: "Borrow",
      tradesSideRepay: "Repay",
      tradesSideCreate: "Create",
      tradesAggregated: "aggregated",
      tradesJustNow: "just now",
      tradesAgoUnit: "ago",
      tradesViewSolscan: "View on Solscan",
      quoteAmount: "Amount (tokens)",
      quoteBuy: "Buy",
      quoteSell: "Sell",
      quoteImpact: "Price impact",
      quoteAvgFill: "Avg fill",
      quoteFee: "Fee (USD)",
      quoteFooter: "Opens the quote simulator with this mint prefilled.",
      liquidityLocked: "Locked supply",
      liquidityFloorCover: "Floor / mcap coverage",
      liquidityFeeMedian: "Creator fee vs median",
      rankMcap: "Market cap",
      rankVol: "24h volume",
      rankHolders: "Holders",
      rankAge: "Age",
      rankTop: "Positioning",
      topPercentLabel: "Top {pct}%",
      aboutCreator: "Creator",
      aboutMarketAddr: "Market account",
      aboutMint: "Mint",
      aboutCreated: "Created",
      aboutUpdated: "Last updated",
      aboutTokenUri: "Token URI",
      aboutSocials: "Community",
      aboutDisableSell: "Selling is disabled for this market.",
      similarTitle: "Similar by profile",
      similarSubtitle: "Mcap proximity + overlapping narratives.",
      scoreMomentum: "Momentum",
      scoreFlow: "Flow",
      scoreDepth: "Depth",
      scoreFreshness: "Freshness",
      metaDisclaimer:
        "Read-only Rise proxy data. Trade links open rise.rich; nothing is signed in this dashboard. Not financial advice.",
      tradeOnRise: "Trade on RISE",
      solscan: "Solscan",
      discord: "Discord",
    },
    bubbleMap: {
      eyebrow: "LIVE MARKET MAP",
      title: "RISE bubble map",
      description:
        "Top 100 RISE markets. Size by cap, volume, or holders — color by 24h move. Tab changes size only; positions stay put. Drag to explore, tap for details.",
      sizeBy: "Size by",
      marketCap: "Market cap",
      volume24h: "24h volume",
      holders: "Holders",
      refreshing: "Refreshing…",
      liveStripLabel: "Live bubble map; data refreshes periodically",
      zoomInAria: "Zoom in map",
      zoomOutAria: "Zoom out map",
      dragHint: "Drag bubbles · click for details",
      zoomHint: "Scroll or pinch to zoom · drag empty space to pan",
      a11yListLabel: "Markets in bubble map (keyboard access)",
      dialogViewToken: "View token page",
      dialogSubtitle: "RISE market",
      dialogKpiPrice: "Price",
      dialogKpi24h: "24h %",
      dialogKpiMcap: "Market cap",
      dialogKpiFloorMcap: "Floor mcap",
      dialogKpiVol24h: "24h volume",
      dialogKpiHolders: "Holders",
      dialogKpiAge: "Age",
      share: "Share map",
      shareNative: "Share…",
      shareDownloadImage: "Download image",
      shareOnX: "Share on X",
      shareOnTelegram: "Share on Telegram",
      shareCopiedImage: "Map image ready to share",
      shareDownloadFailed: "Could not export map image. Try again.",
      shareNativeFailed: "Native share failed. Try Download image.",
      loadError: "Could not load markets for the bubble map.",
      retry: "Retry",
    },
  },
  zh: {
    sidebar: "智能代理基金 · RISE",
    showSidebar: "显示侧边栏",
    hideSidebar: "隐藏侧边栏",
    openMenu: "打开菜单",
    darkMode: "深色模式",
    lightMode: "浅色模式",
    switchToDarkMode: "切换到深色模式",
    switchToLightMode: "切换到浅色模式",
    nav: {
      terminal: "终端",
      market: "市场",
      simulator: "模拟器",
      insights: "洞察",
      wallet: "钱包",
    },
    sidebarFooter: {
      sectionLabel: "链接",
      sectionSubtitle: "官方渠道",
      xAria: "Up Only Fund 在 X",
      telegramAria: "Up Only Fund 在 Telegram",
      riseTradeAria: "在 RISE 交易 $UPONLY",
      xLabel: "X",
      telegramLabel: "Telegram",
      riseTradeLabel: "RISE 交易",
      xHint: "@uponly_fund",
      telegramHint: "社群与动态",
      riseTradeHint: "$UPONLY · rise.rich",
    },
    pages: {
      riseTerminal: "Rise 终端",
      market: "市场",
      wallet: "钱包",
      simulator: "模拟器",
      simulatorDashboard: "模拟器看板",
      insights: "洞察",
      activityFeed: "活动流",
      whales: "巨鲸",
      signals: "信号",
      news: "新闻",
      dashboard: "仪表板",
      terminalEyebrow: "RISE 终端",
      terminalTitle: "一站发现 Alpha",
      terminalDescription: "Institutional-grade screener for Rise, fused with fund-grade intelligence.",
      marketEyebrow: "ALPHA 筛选",
      marketTitle: "市场看板",
      marketDescription: "扫描、对比并检查所有 RISE 市场的底线数据，与代理同源。",
      simulatorEyebrow: "风险与仓位",
      simulatorTitle: "模拟器看板",
      simulatorDescription: "报价、借贷与 DCA 模拟器，辅助基金级入场规模决策。",
      insightsEyebrow: "边际情报",
      insightsTitle: "洞察看板",
      insightsDescription: "巨鲸、信号、新闻与链上活动，由 $UPONLY 门控。",
      walletEyebrow: "链上情报",
      walletTitle: "钱包查询",
      walletDescription: "输入任意 Solana 地址，查看 RISE 资产与持仓数据，可通过 URL 分享，无需签名。",
      overviewEyebrow: "总览",
      overviewTitle: "总览",
      overviewDescription:
        "汇集全部 RISE 市场 — 默认按综合热门分排序（成交量、持有人与波动），每页 100 条，支持筛选与列排序。",
      overviewPageTitle: "总览",
    },
    tabs: {
      screener: "筛选器",
      floorScanner: "底线扫描",
      compare: "对比",
      watchlist: "观察列表",
      quoteCalculator: "报价计算器",
      borrowSimulator: "借贷模拟器",
      dcaSimulator: "DCA 模拟器",
      activityFeed: "活动流",
      whales: "巨鲸",
      signals: "信号",
      news: "新闻",
    },
    terminal: {
      markets: "市场数",
      vol24h: "24h 成交量",
      mcap: "市值",
      alphaPicks: "Alpha 候选",
      agentsOnline: "在线代理",
      feed: "数据源",
      feedHealthy: "健康",
      feedPartial: "部分",
      liveRiseTerminal: "实时 · Rise 终端",
      asOf: "更新时间",
      vsYesterday: "较前 UTC 日",
      deltaNoBaseline:
        "跨日涨跌幅将当前数据与 API 存储的上一 UTC 日历日快照对比（需至少两个 UTC 日有成功的聚合请求）。",
      terminalTrendUnavailable:
        "趋势块暂不可用（数据库不可达）。上方 KPI 仍为 RISE 实时数据。",
      alphaLeaderboard: "Alpha 排行",
      topTen: "前 10",
      riskWatchlist: "风险观察",
      highestFlags: "最高风险标记",
      riskWatchlistClear: "无活跃标记",
      sidebarListsEmpty: "暂无市场数据。",
      volSuffix: "量",
      filters: "筛选",
      verified: "已验证",
      floorBacked: "底线支撑",
      clear: "清除",
      searchPlaceholder: "搜索代币、名称或 Mint...",
      riskFlags: "风险标记",
      narratives: "叙事",
      token: "代币",
      alpha: "Alpha",
      price: "价格",
      h24: "24h",
      vol24hLabel: "24h 量",
      mcapLabel: "市值",
      floorMc: "底线市值",
      holders: "持有人",
      age: "时长",
      risk: "风险",
      narrative: "叙事",
      trade: "交易",
      actions: "操作",
      share: "分享",
      shareDialogTitle: "分享该市场",
      shareDialogDescription: "让你的 Alpha 观点一眼难忘。",
      shareDownloadImage: "下载卡片",
      shareCopyImage: "复制图片",
      shareCopiedImage: "图片已复制",
      shareCopyImageFailed: "无法复制图片。请使用下载，或换用 Chrome / Edge / Safari 15.4+。",
      shareCopyImageUnsupported: "此浏览器无法复制图片，请使用下载。",
      shareOnX: "分享到 X",
      shareOnTelegram: "分享到 Telegram",
      shareCopyLink: "复制链接",
      shareCopyMint: "复制 Mint",
      shareCopiedLink: "链接已复制",
      shareCopiedMint: "Mint 已复制",
      shareNative: "分享…",
      shareCardEyebrow: "RISE 终端 · Up Only Fund",
      shareCardCta: "在 RISE 交易 {symbol}",
      shareCardBragline: "基金级情报，经得起公开检阅。",
      shareCardBraglineRanked: "Alpha 排行第 {rank} 名 — 公开可查。",
      topNAlpha: "ALPHA 第{rank}名",
      shareCardScoreLabel: "Alpha 评分",
      shareCardScoreRange: "0–100 分制",
      shareCardMintLabel: "Mint",
      shareCardVia: "via uplonlyfund.com",
      shareCardLive: "实时",
      shareSocialTextRanked:
        "{symbol} 位列 Rise Alpha 排行第 {rank} 名 — 评分 {score}，24h {change24h}。{url}",
      shareSocialTextUnranked: "{symbol} · Rise 终端 — Alpha {score}，24h {change24h}。{url}",
      shareDownloadFailed: "导出图片失败，请重试。",
      showing: "显示",
      of: "共",
      prev: "上一页",
      next: "下一页",
      riskLabel: {
        LowLiquidity: "流动性低",
        HighFee: "手续费高",
        NewAge: "较新",
        LowLocked: "锁仓低",
        Unverified: "未验证",
        DisableSell: "不可卖出",
      },
      narrativeLabel: {
        Verified: "已验证",
        FloorBacked: "底线支撑",
        Momentum: "动量",
        Cooldown: "冷却",
        BlueChip: "蓝筹",
        Microcap: "微盘",
        Fresh: "新币",
      },
    },
    walletButton: {
      installPhantom: "安装 Phantom",
      connecting: "连接中...",
      connectWallet: "连接钱包",
      connectedWallet: "已连接钱包",
      walletConnected: "钱包已连接",
      walletAddressCopied: "钱包地址已复制",
      copyAddress: "复制地址",
      viewOnSolscan: "在 Solscan 查看",
      disconnect: "断开连接",
    },
    tokenDetail: {
      pageTitle: "代币",
      eyebrow: "RISE 市场",
      pageDescription: "全量快照：实时 Rise 接口 + 基金级衍生信号。",
      notFoundTitle: "未找到代币",
      notFoundDescription: "当前市场快照中无此 Mint。请从市场或终端浏览。",
      browseMarkets: "浏览市场",
      back: "返回",
      copyMint: "复制 Mint",
      mintCopied: "Mint 已复制",
      watchlistAdd: "观察列表",
      watchlistRemove: "移除",
      share: "分享",
      linkCopied: "链接已复制",
      openSimulator: "打开完整模拟器",
      loadingToken: "正在解析代币…",
      sectionScore: "情报",
      sectionKpis: "市场快照",
      sectionPrice: "价格走势",
      sectionTrades: "近期成交",
      sectionQuote: "曲线报价",
      sectionLiquidity: "流动性与结构",
      sectionEcosystem: "生态排位",
      sectionAbout: "链上元数据",
      sectionSimilar: "相似市场",
      sectionHolder: "持仓",
      holderTitle: "持有人快照",
      holderDescription: "流通量来自实时曲线报价；钱包余额来自只读 RISE 资产接口。",
      holderCirculatingSupply: "流通供应量",
      holderYourBalance: "你的持仓",
      holderShareOfSupply: "占流通供应比例",
      holderUsdValue: "持仓估值（USD）",
      holderConnectToSee: "连接钱包",
      holderConnectPrompt: "连接 Phantom 钱包后可查看持仓数量及占流通供应的比例。",
      holderFootnote:
        "余额与供应量来自 RISE 索引与报价模拟，可能与链上略有延迟；大额请以 Solscan 核对。",
      holderErrorPortfolio: "无法加载资产余额。",
      holderErrorSupply: "无法从报价读取供应量。",
      kpiPrice: "现价",
      kpiFloor: "底线价",
      kpiFloorDelta: "底线变化",
      kpiMcap: "市值",
      kpiFloorMcap: "底线市值",
      kpiVol24h: "24h 成交量",
      kpiVolAll: "累计成交量",
      kpiStartPrice: "起始价",
      kpiRoi: "相对起始回报",
      kpiTurnover: "24h 量 / 市值",
      kpiHolders: "持有人",
      kpiLocked: "锁仓占比",
      kpiCreatorFee: "创作者费率",
      kpiAge: "时长",
      kpiCreatedAt: "创建时间（API）",
      kpiUpdatedAt: "更新时间（API）",
      chartHigh: "高",
      chartLow: "低",
      chartRange: "区间",
      chartAvgClose: "均价收盘",
      chartVolSum: "成交量合计",
      chartWindowChg: "窗口涨跌",
      chartRsi: "RSI(14)",
      chartMom: "动量(14)",
      chartVolSample: "波动指数",
      chartNoData: "该周期暂无图表数据。",
      chartSource: "来源",
      chartUpdated: "更新",
      chartAllTimeframe: "全部（1d）",
      tradesTitle: "成交明细",
      tradesPartial: "部分成交字段上游不完整。",
      tradesBuySell: "买入占比",
      tradesUniqueWallets: "独立钱包",
      tradesAvg: "平均单笔",
      tradesLargest: "最大单笔",
      tradesSide: "方向",
      tradesWallet: "钱包",
      tradesPrice: "价格",
      tradesAmount: "数量",
      tradesUsd: "USD",
      tradesWhen: "时间",
      tradesSideBuy: "买入",
      tradesSideSell: "卖出",
      tradesSideBorrow: "借入",
      tradesSideRepay: "偿还",
      tradesSideCreate: "创建",
      tradesAggregated: "聚合",
      tradesJustNow: "刚刚",
      tradesAgoUnit: "前",
      tradesViewSolscan: "在 Solscan 查看",
      quoteAmount: "数量（代币）",
      quoteBuy: "买入",
      quoteSell: "卖出",
      quoteImpact: "价格冲击",
      quoteAvgFill: "均价成交",
      quoteFee: "手续费（USD）",
      quoteFooter: "在报价模拟器中预填该 Mint。",
      liquidityLocked: "锁仓",
      liquidityFloorCover: "底线 / 市值覆盖",
      liquidityFeeMedian: "创作者费率 vs 中位数",
      rankMcap: "市值",
      rankVol: "24h 量",
      rankHolders: "持有人",
      rankAge: "时长",
      rankTop: "排位",
      topPercentLabel: "前 {pct}%",
      aboutCreator: "创建者",
      aboutMarketAddr: "市场账户",
      aboutMint: "Mint",
      aboutCreated: "创建",
      aboutUpdated: "最近更新",
      aboutTokenUri: "Token URI",
      aboutSocials: "社区",
      aboutDisableSell: "该市场已禁用卖出。",
      similarTitle: "相似市场",
      similarSubtitle: "市值接近 + 叙事重叠。",
      scoreMomentum: "动量",
      scoreFlow: "资金流",
      scoreDepth: "深度",
      scoreFreshness: "新鲜度",
      metaDisclaimer:
        "只读 Rise 代理数据。交易会跳转 rise.rich；本看板不签名。非投资建议。",
      tradeOnRise: "在 RISE 交易",
      solscan: "Solscan",
      discord: "Discord",
    },
    bubbleMap: {
      eyebrow: "实时市场图",
      title: "RISE 气泡图",
      description:
        "展示排名前 100 的 RISE 市场。按市值、24h 量或持有人调整大小；颜色表示 24h 涨跌。切换标签仅改变大小，位置不变。拖动探索，点击查看详情。",
      sizeBy: "大小依据",
      marketCap: "市值",
      volume24h: "24h 成交量",
      holders: "持有人",
      refreshing: "刷新中…",
      liveStripLabel: "实时气泡图；数据会定期在后台刷新",
      zoomInAria: "放大地图",
      zoomOutAria: "缩小地图",
      dragHint: "拖动气泡 · 点击查看详情",
      zoomHint: "滚轮或双指缩放 · 拖空白处平移",
      a11yListLabel: "气泡图中的市场（键盘访问）",
      dialogViewToken: "查看代币页",
      dialogSubtitle: "RISE 市场",
      dialogKpiPrice: "价格",
      dialogKpi24h: "24h %",
      dialogKpiMcap: "市值",
      dialogKpiFloorMcap: "底线市值",
      dialogKpiVol24h: "24h 成交量",
      dialogKpiHolders: "持有人",
      dialogKpiAge: "时长",
      share: "分享地图",
      shareNative: "分享…",
      shareDownloadImage: "下载图片",
      shareOnX: "分享到 X",
      shareOnTelegram: "分享到 Telegram",
      shareCopiedImage: "地图图片已可分享",
      shareDownloadFailed: "导出地图图片失败，请重试。",
      shareNativeFailed: "系统分享失败，请改用下载图片。",
      loadError: "无法加载气泡图所需的市场数据。",
      retry: "重试",
    },
  },
};

export function getPageTitle(pathname: string, dictionary: DashboardDictionary): string {
  const t = dictionary.pages;
  if (pathname.startsWith("/token/")) return dictionary.tokenDetail.pageTitle;
  if (pathname === "/" || pathname === "") return t.overviewPageTitle;
  if (pathname === "/terminal") return t.riseTerminal;
  if (pathname.endsWith("/market")) return t.market;
  if (pathname.endsWith("/wallet")) return t.wallet;
  if (pathname.endsWith("/simulator")) return t.simulator;
  if (pathname.endsWith("/quote")) return t.simulatorDashboard;
  if (pathname.endsWith("/borrow")) return t.simulatorDashboard;
  if (pathname.endsWith("/insights")) return t.insights;
  if (pathname.endsWith("/activity")) return t.activityFeed;
  if (pathname.endsWith("/whales")) return t.whales;
  if (pathname.endsWith("/signals")) return t.signals;
  if (pathname.endsWith("/dca")) return t.simulatorDashboard;
  if (pathname.endsWith("/news")) return t.news;
  return t.dashboard;
}
