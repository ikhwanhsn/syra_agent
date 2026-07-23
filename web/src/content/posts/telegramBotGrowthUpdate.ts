import { Bot, MessageCircle, Share2, Sun, Wallet, Zap } from "lucide-react";
import { defineVideoUpdate } from "./videoDeck";

/**
 * Ship log: Syra Telegram bot growth loop for end users.
 * User-facing only: free live-data credits, Syra Daily, referral sponsor.
 */
export const TELEGRAM_BOT_GROWTH_POST = defineVideoUpdate(
  {
    updateNumber: 33,
    id: "telegram-bot-growth",
    title: "Syra Telegram Bot",
    published: "July 2026",
    tagline:
      "Walleted crypto intel in Telegram: free daily live-data credits, morning briefing, and invite friends on your stack.",
    shareCopyVideo: `SHIP LOG · Syra Telegram just leveled up.

Ask for BTC news or a SOL signal in chat. Same live tools as the web agent.

→ 3 free live-data calls every day
→ Syra Daily: one morning briefing
→ Referral link: friends use your USDC (daily cap)

Open → t.me/syra_trading_bot

Full breakdown in the video ↓`,
    shareCopyPhoto: `SHIP LOG · Syra is live on Telegram.

Free live-data credits. Morning briefing. Invite friends on your stack.

→ t.me/syra_trading_bot
→ /start then ask "BTC news"`,
  },
  [
    {
      id: "cover",
      kind: "cover",
      layout: "cover-dual-badge",
      label: "Cover",
      eyebrow: "Ship log",
      title: "Syra on Telegram",
      subtitle:
        "Ask anything crypto. Get live news and signals. Free daily credits, then pay with USDC from your agent wallet.",
      badge: "Free credits · Daily · Referral",
    },
    {
      id: "context",
      kind: "statement",
      layout: "statement-gold-frame",
      label: "Context",
      kicker: "Why this matters",
      headline: "Crypto intel should live where you already chat.",
      body: "Tabs kill momentum. Syra on Telegram gives you a walleted agent in the same place you trade alpha with friends: short asks, live data, and a morning pulse without opening ten dashboards.",
    },
    {
      id: "shipped",
      kind: "hero",
      layout: "hero-pillar-trio",
      label: "Shipped",
      kicker: "What is new",
      headline: "Three reasons to open Syra every day",
      body: "Start the bot, try a free live-data ask, get a morning briefing, and share a referral when you want friends on your stack.",
      highlights: [
        "3 free live-data tool calls per day (UTC)",
        "Syra Daily morning briefing with one tap shortcuts",
        "Referral link: friends bill your wallet (daily sponsor cap)",
        "Same news, signal, and sentiment tools as the web agent",
      ],
    },
    {
      id: "flow",
      kind: "flow",
      layout: "flow-vertical-rail",
      label: "Flow",
      kicker: "How to use it",
      headline: "Start. Ask. Brief. Share.",
      steps: [
        {
          step: "01",
          title: "Open the bot",
          description: "t.me/syra_trading_bot → /start. Wallet ready in seconds.",
        },
        {
          step: "02",
          title: "Ask live",
          description: 'Try "BTC news", "SOL signal", or "ETH sentiment".',
        },
        {
          step: "03",
          title: "Get Syra Daily",
          description: "One morning briefing. /digest off or /mute anytime.",
        },
        {
          step: "04",
          title: "Invite friends",
          description: "/referral → share link. Their paid tools use your USDC.",
        },
      ],
    },
    {
      id: "tools",
      kind: "cards",
      layout: "cards-featured-trio",
      label: "Features",
      kicker: "For you",
      headline: "Simple surfaces. Real data.",
      cards: [
        {
          title: "Free credits",
          subtitle: "3 / day",
          detail: "Feel live news and signals before you deposit USDC.",
          accent: "gold",
        },
        {
          title: "Syra Daily",
          subtitle: "Morning pulse",
          detail: "One briefing with shortcuts like BTC news and SOL signal.",
          accent: "gold",
        },
        {
          title: "Referral",
          subtitle: "Sponsor friends",
          detail: "Custom link. Daily spend cap protects your balance.",
        },
      ],
    },
    {
      id: "surfaces",
      kind: "surfaces",
      layout: "surfaces-icon-row",
      label: "Product",
      kicker: "Where to find it",
      headline: "Telegram first. Web when you want more.",
      items: [
        {
          icon: MessageCircle,
          title: "Telegram bot",
          description: "@syra_trading_bot · /start",
          href: "https://t.me/syra_trading_bot",
        },
        {
          icon: Zap,
          title: "Live asks",
          description: "News, signals, sentiment in plain language.",
        },
        {
          icon: Sun,
          title: "Syra Daily",
          description: "/digest on · /mute to pause",
        },
        {
          icon: Share2,
          title: "Referral",
          description: "/referral create yourname",
        },
        {
          icon: Wallet,
          title: "Wallet",
          description: "Deposit USDC/SOL when free credits run out.",
        },
        {
          icon: Bot,
          title: "Web agent",
          description: "Same tools on syraa.fun when you graduate.",
          href: "https://www.syraa.fun/agent",
        },
      ],
    },
    {
      id: "impact",
      kind: "impact",
      layout: "impact-mega-stat",
      label: "Impact",
      kicker: "What you get",
      headline: "Less tab switching. More signal.",
      stats: [
        { value: "3", label: "Free calls / day" },
        { value: "1", label: "Daily briefing" },
        { value: "TG", label: "Native chat" },
      ],
      narrative:
        "General crypto Q&A is always free. Live tools use daily credits first, then your Syra wallet USDC.",
    },
    {
      id: "closing",
      kind: "closing",
      layout: "closing-gold-banner",
      label: "Try it",
      headline: "Open Syra on Telegram.",
      subline: '/start, then ask "BTC news". Turn on Syra Daily when you want the morning pulse.',
      links: [
        {
          label: "Bot",
          value: "t.me/syra_trading_bot",
          href: "https://t.me/syra_trading_bot",
        },
        {
          label: "Docs",
          value: "docs.syraa.fun/docs/telegram-bot",
          href: "https://docs.syraa.fun/docs/telegram-bot",
        },
        {
          label: "Community",
          value: "t.me/syra_ai",
          href: "https://t.me/syra_ai",
        },
      ],
    },
  ],
);
