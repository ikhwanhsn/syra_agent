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
    xAria: string;
    telegramAria: string;
    riseTradeAria: string;
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
    narrativeBuckets: string;
    clearFilter: string;
    alphaLeaderboard: string;
    topTen: string;
    riskWatchlist: string;
    highestFlags: string;
    volSuffix: string;
    filters: string;
    verified: string;
    floorBacked: string;
    clear: string;
    refresh: string;
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
      xAria: "Up Only Fund on X",
      telegramAria: "Up Only Fund on Telegram",
      riseTradeAria: "Trade $UPONLY on RISE",
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
      walletDescription: "Paste any Solana address to pull RISE portfolio totals and positions from Syra’s read APIs—shareable via URL, nothing signed.",
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
      narrativeBuckets: "Narrative buckets",
      clearFilter: "Clear filter",
      alphaLeaderboard: "Alpha leaderboard",
      topTen: "Top 10",
      riskWatchlist: "Risk watchlist",
      highestFlags: "Highest flags",
      volSuffix: "vol",
      filters: "Filters",
      verified: "Verified",
      floorBacked: "Floor-backed",
      clear: "Clear",
      refresh: "Refresh",
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
      xAria: "Up Only Fund 在 X",
      telegramAria: "Up Only Fund 在 Telegram",
      riseTradeAria: "在 RISE 交易 $UPONLY",
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
      narrativeBuckets: "叙事分桶",
      clearFilter: "清除筛选",
      alphaLeaderboard: "Alpha 排行",
      topTen: "前 10",
      riskWatchlist: "风险观察",
      highestFlags: "最高风险标记",
      volSuffix: "量",
      filters: "筛选",
      verified: "已验证",
      floorBacked: "底线支撑",
      clear: "清除",
      refresh: "刷新",
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
  },
};

export function getPageTitle(pathname: string, t: DashboardDictionary["pages"]): string {
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
