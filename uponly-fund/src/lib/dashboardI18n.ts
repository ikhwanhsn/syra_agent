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
  },
};

export function getPageTitle(pathname: string, t: DashboardDictionary["pages"]): string {
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
