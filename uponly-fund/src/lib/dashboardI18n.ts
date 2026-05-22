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
    createToken: string;
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
    createTokenEyebrow: string;
    createTokenTitle: string;
    createTokenDescription: string;
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
    menuTitle: string;
    solana: string;
    installPhantom: string;
    connecting: string;
    connectWallet: string;
    connectedWallet: string;
    walletConnected: string;
    walletAddressCopied: string;
    copyAddress: string;
    viewOnSolscan: string;
    disconnect: string;
    disconnecting: string;
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
    sectionTopHolders: string;
    topHoldersTitle: string;
    topHoldersDescription: string;
    topHoldersMintSupply: string;
    topHoldersTop10Conc: string;
    topHoldersRiseHoldersHint: string;
    topHoldersRank: string;
    topHoldersWallet: string;
    topHoldersBalance: string;
    topHoldersShare: string;
    topHoldersUnknownWallet: string;
    topHoldersFootnote: string;
    topHoldersError: string;
    topHoldersEmpty: string;
    topHoldersExplorer: string;
    topHoldersTokenAccountHint: string;
    topHoldersYou: string;
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
    /** Main heading above the OHLC chart (user-facing; not a data “source” label). */
    chartSectionTitle: string;
    /** One-line page primer under breadcrumbs on token detail. */
    pageLayoutIntro: string;
    /** Subcopy under Intelligence section title. */
    sectionScoreDescription: string;
    /** Subcopy under market snapshot KPIs. */
    sectionKpisDescription: string;
    /** Eyebrow above sparkline in hero (e.g. recent price path). */
    sparklineMicroLabel: string;
    kpiGroupMarket: string;
    kpiGroupLiquidity: string;
    kpiGroupSupply: string;
    kpiGroupLifecycle: string;
    /** Short helper under the trade / borrow stack in the sticky column. */
    tradeColumnIntro: string;
    /** Main H2 for the intelligence strip (distinct from eyebrow). */
    scoreSectionHeadline: string;
    tabActivity: string;
    tabHolders: string;
    tabDetails: string;
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
    tradePanelTitle: string;
    tradeWalletRequired: string;
    tradeHumanUnits: string;
    tradeOn: string;
    tradeOff: string;
    tradeAmountBuyHuman: string;
    tradeAmountBuyRaw: string;
    tradeAmountSellHuman: string;
    tradeAmountSellRaw: string;
    tradeSlippage: string;
    tradeExecuteBuy: string;
    tradeExecuteSell: string;
    tradeSuccessBuy: string;
    tradeSuccessSell: string;
    tradeViewSolscan: string;
    tradeErrorGeneric: string;
    tradeFooterRisk: string;
    tradeSellDisabled: string;
    tradeYourTokenBalance: string;
    tradeAvailableToSpend: string;
    tradePct25: string;
    tradePct50: string;
    tradePctMax: string;
    tradesLatestFootnote: string;
    borrowPanelEyebrow: string;
    borrowPanelTitle: string;
    borrowModeBorrow: string;
    borrowModeRepay: string;
    borrowMax: string;
    borrowDebt: string;
    borrowFee: string;
    borrowAmountLabel: string;
    repayWithdrawLabel: string;
    borrowExecute: string;
    repayExecute: string;
    borrowSuccess: string;
    repaySuccess: string;
    borrowInvalidAmount: string;
    borrowFooterRisk: string;
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
  createTokenPage: {
    imageLabel: string;
    nameLabel: string;
    symbolLabel: string;
    descriptionLabel: string;
    twitterLabel: string;
    telegramLabel: string;
    backingLabel: string;
    backingSol: string;
    backingUsdc: string;
    feeLabel: string;
    submit: string;
    successTitle: string;
    successBody: string;
    viewToken: string;
    signaturesTitle: string;
    reset: string;
    uploading: string;
    dropHint: string;
    sectionIdentity: string;
    sectionIdentityHint: string;
    sectionStory: string;
    sectionStoryHint: string;
    sectionEconomics: string;
    sectionEconomicsHint: string;
    previewEyebrow: string;
    previewNewMarket: string;
    previewPlaceholderName: string;
    previewPlaceholderSymbol: string;
    previewBacking: string;
    previewCreatorFee: string;
    launchRailTitle: string;
    stepMetadata: string;
    stepTransactions: string;
    stepConfirm: string;
    checklistImage: string;
    checklistName: string;
    checklistWallet: string;
    checklistSol: string;
    connectBannerTitle: string;
    connectBannerBody: string;
    backingSolDesc: string;
    backingUsdcDesc: string;
    feeHint: string;
    replaceImage: string;
    removeImage: string;
    copyMint: string;
    mintCopied: string;
    connectWalletPrompt: string;
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
    sidebar: "Smart Agent Fund · Solana",
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
      createToken: "Create token",
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
      createTokenEyebrow: "RISE LAUNCH",
      createTokenTitle: "Create a Rise token",
      createTokenDescription:
        "Upload artwork + metadata via Syra (Pinata), then sign two Rise transactions with Phantom. Requires SOL for fees.",
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
      menuTitle: "Wallet",
      solana: "Solana",
      installPhantom: "Install Phantom",
      connecting: "Connecting...",
      connectWallet: "Connect wallet",
      connectedWallet: "Connected wallet",
      walletConnected: "Wallet connected",
      walletAddressCopied: "Wallet address copied",
      copyAddress: "Copy address",
      viewOnSolscan: "View on Solscan",
      disconnect: "Disconnect",
      disconnecting: "Disconnecting…",
    },
    tokenDetail: {
      pageTitle: "Token",
      eyebrow: "RISE MARKET",
      pageDescription: "Price, trade, and on-chain data for this RISE market on Solana.",
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
      sectionTopHolders: "On-chain",
      topHoldersTitle: "Largest wallets",
      topHoldersDescription:
        "Top SPL token accounts by balance. Useful for spotting concentration; not the same as RISE’s unique-holder count.",
      topHoldersMintSupply: "Minted supply (on-chain)",
      topHoldersTop10Conc: "Top 10 share of minted supply",
      topHoldersRiseHoldersHint: "RISE-reported unique wallets (all accounts)",
      topHoldersRank: "#",
      topHoldersWallet: "Owner wallet",
      topHoldersBalance: "Tokens",
      topHoldersShare: "Of minted supply",
      topHoldersUnknownWallet: "Unknown / program",
      topHoldersFootnote:
        "Data from Solana RPC (largest token accounts). Share % uses total minted supply. Bonding-curve or vault PDAs may appear as owners. DYOR — not financial advice.",
      topHoldersError: "Could not load on-chain holder list.",
      topHoldersEmpty: "No token accounts returned for this mint.",
      topHoldersExplorer: "Solscan",
      topHoldersTokenAccountHint: "View SPL token account on Solscan",
      topHoldersYou: "You",
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
      chartSectionTitle: "Price chart",
      pageLayoutIntro:
        "Trade on the right. Chart and activity below. Verify large positions on Solscan.",
      sectionScoreDescription:
        "Heuristic scores and tags derived from this market’s live fields. They summarize momentum and structure—they are not buy or sell recommendations.",
      sectionKpisDescription:
        "Key ratios and reference prices in one grid. Floor metrics reflect the RISE bonding curve design for this listing.",
      sparklineMicroLabel: "Recent path (1h · 96 bars)",
      kpiGroupMarket: "Price & cap",
      kpiGroupLiquidity: "Volume & turnover",
      kpiGroupSupply: "Supply & holders",
      kpiGroupLifecycle: "Listing lifecycle",
      tradeColumnIntro: "Live RISE quote. Confirm amounts in your wallet before signing.",
      scoreSectionHeadline: "Signal board",
      tabActivity: "Activity",
      tabHolders: "Holders",
      tabDetails: "Details",
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
      tradePanelTitle: "Trade on-chain",
      tradeWalletRequired: "Connect Phantom to sign and send a Rise program transaction via Syra proxy.",
      tradeHumanUnits: "Human amounts",
      tradeOn: "On",
      tradeOff: "Raw",
      tradeAmountBuyHuman: "Spend",
      tradeAmountBuyRaw: "Cash in (raw lamports / base units)",
      tradeAmountSellHuman: "Sell",
      tradeAmountSellRaw: "Token in (raw base units)",
      tradeSlippage: "Slippage tolerance",
      tradeExecuteBuy: "Buy (sign in wallet)",
      tradeExecuteSell: "Sell (sign in wallet)",
      tradeSuccessBuy: "Buy submitted",
      tradeSuccessSell: "Sell submitted",
      tradeViewSolscan: "Solscan",
      tradeErrorGeneric: "Transaction failed",
      tradeFooterRisk:
        "You sign an unsigned transaction from Rise. Review amounts in your wallet. Syra proxies the API key; execution is on Solana mainnet.",
      tradeSellDisabled: "Selling is disabled for this market.",
      tradeYourTokenBalance: "You hold",
      tradeAvailableToSpend: "Available to spend",
      tradePct25: "25%",
      tradePct50: "50%",
      tradePctMax: "Max",
      tradesLatestFootnote: "Latest 50 trades · scroll for more",
      borrowPanelEyebrow: "BORROW / REPAY",
      borrowPanelTitle: "Floor-backed borrow",
      borrowModeBorrow: "Borrow",
      borrowModeRepay: "Repay & withdraw",
      borrowMax: "Max borrow (USD est.)",
      borrowDebt: "Debt (raw)",
      borrowFee: "Borrow fee",
      borrowAmountLabel: "Borrow (after fee)",
      repayWithdrawLabel: "Withdraw collateral",
      borrowExecute: "Deposit & borrow (sign)",
      repayExecute: "Repay & withdraw (sign)",
      borrowSuccess: "Borrow transaction submitted",
      repaySuccess: "Repay transaction submitted",
      borrowInvalidAmount: "Enter a positive amount.",
      borrowFooterRisk:
        "Borrowing uses Rise deposit-and-borrow / repay-and-withdraw. Not financial advice; verify health factor in wallet.",
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
    createTokenPage: {
      imageLabel: "Logo image (PNG / JPG / GIF)",
      nameLabel: "Token name",
      symbolLabel: "Ticker",
      descriptionLabel: "Description",
      twitterLabel: "X (Twitter) URL",
      telegramLabel: "Telegram URL",
      backingLabel: "Backing collateral",
      backingSol: "SOL",
      backingUsdc: "USDC",
      feeLabel: "Creator fee % (0–10)",
      submit: "Create token (2 signatures)",
      successTitle: "Token created",
      successBody: "Both transactions confirmed. Indexers may take a minute to show the new market.",
      viewToken: "Open token page",
      signaturesTitle: "Signatures",
      reset: "Create another",
      uploading: "Uploading & requesting transactions…",
      dropHint: "Drag & drop or click to pick an image (max 15 MB).",
      sectionIdentity: "Identity",
      sectionIdentityHint: "Name, ticker, and artwork that appear on RISE and in wallets.",
      sectionStory: "Story & links",
      sectionStoryHint: "Optional copy and socials surfaced on the token page.",
      sectionEconomics: "Launch economics",
      sectionEconomicsHint: "Collateral pair and creator fee — signed on-chain in two transactions.",
      previewEyebrow: "Live preview",
      previewNewMarket: "New RISE market",
      previewPlaceholderName: "Your token name",
      previewPlaceholderSymbol: "TICKER",
      previewBacking: "Backing",
      previewCreatorFee: "Creator fee",
      launchRailTitle: "Launch checklist",
      stepMetadata: "Upload metadata",
      stepTransactions: "Build transactions",
      stepConfirm: "Sign in Phantom",
      checklistImage: "Logo uploaded",
      checklistName: "Name & ticker set",
      checklistWallet: "Wallet connected",
      checklistSol: "SOL reserved for fees",
      connectBannerTitle: "Connect Phantom to launch",
      connectBannerBody: "You’ll sign two Rise program transactions. Keep a small SOL balance for network fees.",
      backingSolDesc: "Bond to native SOL liquidity on Rise.",
      backingUsdcDesc: "Bond to USDC liquidity on Rise.",
      feeHint: "Share of trade fees routed to your wallet (0–10%).",
      replaceImage: "Replace image",
      removeImage: "Remove",
      copyMint: "Copy mint",
      mintCopied: "Mint copied",
      connectWalletPrompt: "Connect Phantom to continue",
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
      createToken: "创建代币",
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
      createTokenEyebrow: "RISE 发行",
      createTokenTitle: "创建 Rise 代币",
      createTokenDescription: "通过 Syra（Pinata）上传图片与元数据，再用 Phantom 依次签署两笔 Rise 交易。需预留 SOL 作为手续费。",
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
      menuTitle: "钱包",
      solana: "Solana",
      installPhantom: "安装 Phantom",
      connecting: "连接中...",
      connectWallet: "连接钱包",
      connectedWallet: "已连接钱包",
      walletConnected: "钱包已连接",
      walletAddressCopied: "钱包地址已复制",
      copyAddress: "复制地址",
      viewOnSolscan: "在 Solscan 查看",
      disconnect: "断开连接",
      disconnecting: "断开中…",
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
      sectionTopHolders: "链上",
      topHoldersTitle: "大户钱包",
      topHoldersDescription:
        "按余额排序的主要 SPL 代币账户，便于观察集中度；与 RISE 统计的「唯一持有人」口径不同。",
      topHoldersMintSupply: "链上已铸造供应量",
      topHoldersTop10Conc: "前 10 名占已铸造比例",
      topHoldersRiseHoldersHint: "RISE 报告的唯一钱包数（含所有账户）",
      topHoldersRank: "#",
      topHoldersWallet: "所有者钱包",
      topHoldersBalance: "代币数量",
      topHoldersShare: "占已铸造比例",
      topHoldersUnknownWallet: "未知 / 程序账户",
      topHoldersFootnote:
        "数据来自 Solana RPC（最大代币账户列表）。占比按已铸造总供应量计算；曲线金库等 PDA 可能显示为持有人。DYOR，非投资建议。",
      topHoldersError: "无法加载链上持有人列表。",
      topHoldersEmpty: "该铸币未返回代币账户。",
      topHoldersExplorer: "Solscan",
      topHoldersTokenAccountHint: "在 Solscan 查看 SPL 代币账户",
      topHoldersYou: "你",
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
      chartSectionTitle: "历史价格",
      pageLayoutIntro:
        "建议自上而下阅读：标的价格与信号、深度指标、再到持有人与成交。数据来自 RISE 索引，重要仓位请在链上核对。",
      sectionScoreDescription:
        "基于该市场实时字段的启发式评分与标签，概括动能与结构，不构成买卖建议。",
      sectionKpisDescription:
        "关键比率与参考价一览。底线类指标对应该资产在 RISE 曲线机制下的设计。",
      sparklineMicroLabel: "近期走势（1h · 96 根）",
      kpiGroupMarket: "价格与市值",
      kpiGroupLiquidity: "成交量与换手",
      kpiGroupSupply: "供应与持有人",
      kpiGroupLifecycle: "上架生命周期",
      tradeColumnIntro: "来自 RISE 的实时曲线报价。在钱包中确认交易前，请将数量与冲击视为估算值。",
      scoreSectionHeadline: "信号面板",
      tabActivity: "成交",
      tabHolders: "持有人",
      tabDetails: "详情",
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
      tradePanelTitle: "链上交易",
      tradeWalletRequired: "连接 Phantom，通过 Syra 代理签名并发送 Rise 程序交易。",
      tradeHumanUnits: "人类可读数量",
      tradeOn: "开",
      tradeOff: "原始单位",
      tradeAmountBuyHuman: "支付",
      tradeAmountBuyRaw: "输入抵押（原始最小单位）",
      tradeAmountSellHuman: "卖出",
      tradeAmountSellRaw: "代币输入（原始最小单位）",
      tradeSlippage: "滑点",
      tradeExecuteBuy: "买入（钱包签名）",
      tradeExecuteSell: "卖出（钱包签名）",
      tradeSuccessBuy: "买入已提交",
      tradeSuccessSell: "卖出已提交",
      tradeViewSolscan: "Solscan",
      tradeErrorGeneric: "交易失败",
      tradeFooterRisk: "你将签署 Rise 返回的未签名交易，请在钱包中核对金额。Syra 代理 API Key；执行在主网。",
      tradeSellDisabled: "该市场已禁用卖出。",
      tradeYourTokenBalance: "持仓",
      tradeAvailableToSpend: "可用于买入",
      tradePct25: "25%",
      tradePct50: "50%",
      tradePctMax: "最大",
      tradesLatestFootnote: "最近 50 笔成交 · 可滚动查看",
      borrowPanelEyebrow: "借入 / 偿还",
      borrowPanelTitle: "底线抵押借贷",
      borrowModeBorrow: "借入",
      borrowModeRepay: "偿还并提取",
      borrowMax: "最大可借（USD 估算）",
      borrowDebt: "债务（原始）",
      borrowFee: "借贷手续费",
      borrowAmountLabel: "借入（费后）",
      repayWithdrawLabel: "提取抵押",
      borrowExecute: "存入并借入（签名）",
      repayExecute: "偿还并提取（签名）",
      borrowSuccess: "借贷交易已提交",
      repaySuccess: "偿还交易已提交",
      borrowInvalidAmount: "请输入正数金额。",
      borrowFooterRisk: "使用 Rise 的存入+借入 / 偿还+提取。非投资建议；请在钱包中核对风险。",
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
    createTokenPage: {
      imageLabel: "Logo 图片（PNG / JPG / GIF）",
      nameLabel: "代币名称",
      symbolLabel: "简称",
      descriptionLabel: "描述",
      twitterLabel: "X（Twitter）链接",
      telegramLabel: "Telegram 链接",
      backingLabel: "抵押资产",
      backingSol: "SOL",
      backingUsdc: "USDC",
      feeLabel: "创作者费率 %（0–10）",
      submit: "创建代币（两次签名）",
      successTitle: "代币已创建",
      successBody: "两笔交易已确认。索引可能需要几分钟显示新市场。",
      viewToken: "打开代币页",
      signaturesTitle: "签名",
      reset: "再创建一个",
      uploading: "上传并请求交易中…",
      dropHint: "拖拽或点击选择图片（最大 15 MB）。",
      sectionIdentity: "基础信息",
      sectionIdentityHint: "在 RISE 与钱包中展示的名称、简称与图片。",
      sectionStory: "叙事与链接",
      sectionStoryHint: "可选描述与社交链接，会显示在代币页。",
      sectionEconomics: "发行参数",
      sectionEconomicsHint: "抵押对与创作者费率 — 需链上两次签名确认。",
      previewEyebrow: "实时预览",
      previewNewMarket: "新 RISE 市场",
      previewPlaceholderName: "你的代币名称",
      previewPlaceholderSymbol: "简称",
      previewBacking: "抵押",
      previewCreatorFee: "创作者费率",
      launchRailTitle: "发行清单",
      stepMetadata: "上传元数据",
      stepTransactions: "构建交易",
      stepConfirm: "Phantom 签名",
      checklistImage: "已上传 Logo",
      checklistName: "已填写名称与简称",
      checklistWallet: "已连接钱包",
      checklistSol: "预留 SOL 手续费",
      connectBannerTitle: "连接 Phantom 以发行",
      connectBannerBody: "需签署两笔 Rise 程序交易。请保留少量 SOL 作为网络费。",
      backingSolDesc: "与 Rise 上原生 SOL 流动性绑定。",
      backingUsdcDesc: "与 Rise 上 USDC 流动性绑定。",
      feeHint: "交易费中分给创作者钱包的比例（0–10%）。",
      replaceImage: "更换图片",
      removeImage: "移除",
      copyMint: "复制 Mint",
      mintCopied: "已复制 Mint",
      connectWalletPrompt: "请连接 Phantom 后继续",
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
  if (pathname === "/overview" || pathname === "/dashboard/overview") return t.overviewPageTitle;
  if (pathname === "/terminal") return t.riseTerminal;
  if (pathname === "/create-token") return t.createTokenTitle;
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
