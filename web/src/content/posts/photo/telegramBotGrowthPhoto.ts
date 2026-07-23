import { TELEGRAM_BOT_GROWTH_POST } from "../telegramBotGrowthUpdate";
import { definePhotoUpdate } from "./photoDeck";
import { photoContent } from "./photoContent";
import { TELEGRAM_BOT_GROWTH_PHOTO_SHARE_COPIES } from "./shareCopies/telegramBotGrowthShareCopies";

const copies = TELEGRAM_BOT_GROWTH_PHOTO_SHARE_COPIES;

/** Photo-format content for the Syra Telegram bot growth ship log. */
export const TELEGRAM_BOT_GROWTH_PHOTO = definePhotoUpdate(TELEGRAM_BOT_GROWTH_POST.meta, [
  {
    role: "cover",
    layout: "photo-cover-type-hero",
    shareCopy: copies.cover,
    content: photoContent({
      eyebrow: "Ship log",
      badge: "Free credits · Daily · Referral",
      title: "Syra on Telegram",
      subtitle:
        "Ask for live news and signals in chat. Free daily credits, morning briefing, invite friends on your stack.",
    }),
  },
  {
    role: "thesis",
    layout: "photo-statement-gold-frame",
    shareCopy: copies.thesis,
    content: photoContent({
      kicker: "The problem",
      headline: "Crypto intel should live where you already chat.",
      body: "Tabs kill momentum. Syra puts a walleted agent in Telegram: short asks, live data, and a morning pulse.",
    }),
  },
  {
    role: "quote",
    layout: "photo-announcement",
    shareCopy: copies.quote,
    content: photoContent({
      quote: "Start. Ask. Brief. Share.",
      narrative:
        "Three free live-data calls per day. Syra Daily in the morning. Referral when you want friends on your stack.",
    }),
  },
  {
    role: "flow",
    layout: "photo-flow-pipeline",
    shareCopy: copies.flow,
    content: photoContent({
      kicker: "How to use it",
      headline: "Four taps from start to habit.",
      steps: [
        { step: "01", title: "Open", description: "/start on the Syra bot." },
        { step: "02", title: "Ask", description: '"BTC news" or "SOL signal".' },
        { step: "03", title: "Brief", description: "Keep Syra Daily on." },
        { step: "04", title: "Share", description: "/referral for friends." },
      ],
    }),
  },
  {
    role: "timeline",
    layout: "photo-timeline",
    shareCopy: copies.timeline,
    content: photoContent({
      kicker: "Shipped",
      headline: "Built for daily use.",
      steps: [
        { step: "01", title: "Credits", description: "3 free live-data calls / UTC day." },
        { step: "02", title: "Digest", description: "Syra Daily + /mute." },
        { step: "03", title: "Referral", description: "Sponsor link with daily cap." },
        { step: "04", title: "Parity", description: "Same tools as the web agent." },
      ],
    }),
  },
  {
    role: "pillars",
    layout: "photo-cards-stack",
    shareCopy: copies.pillars,
    content: photoContent({
      headline: "Three reasons to open Syra daily.",
      cards: [
        {
          title: "Free credits",
          subtitle: "3 / day",
          detail: "Feel live data before you deposit.",
          accent: "gold",
        },
        {
          title: "Syra Daily",
          subtitle: "Morning",
          detail: "One briefing with shortcuts.",
          accent: "gold",
        },
        {
          title: "Referral",
          subtitle: "Invite",
          detail: "Friends use your USDC. Daily cap.",
        },
      ],
    }),
  },
  {
    role: "checklist",
    layout: "photo-hero-checklist",
    shareCopy: copies.checklist,
    content: photoContent({
      headline: "What you can do today.",
      highlights: [
        "/start creates your agent wallet",
        "3 free live-data calls every day",
        "Syra Daily morning briefing",
        "/referral create yourname",
        "/wallet when you want more depth",
      ],
    }),
  },
  {
    role: "metrics",
    layout: "photo-stat-orbit",
    shareCopy: copies.metrics,
    content: photoContent({
      headline: "Less switching. More signal.",
      stats: [
        { value: "3", label: "Free calls / day" },
        { value: "1", label: "Daily briefing" },
        { value: "TG", label: "Native chat" },
      ],
      narrative: "General Q&A stays free. Live tools use credits first, then USDC.",
    }),
  },
  {
    role: "featured",
    layout: "photo-stat-counter-row",
    shareCopy: copies.featured,
    content: photoContent({
      headline: 'Try "BTC news" first.',
      stats: [{ value: "FREE", label: "First live asks" }],
      narrative: "Free credits cover your first live-data asks. Deposit when you want more.",
    }),
  },
  {
    role: "comparison",
    layout: "photo-comparison",
    shareCopy: copies.comparison,
    content: photoContent({
      headline: "Ten tabs vs one chat.",
      compareLeft: {
        title: "Before",
        body: "Jump across sites for news, signals, and charts.",
      },
      compareRight: {
        title: "Now",
        body: "One Telegram chat. Free credits, then your Syra wallet.",
      },
    }),
  },
  {
    role: "launch",
    layout: "photo-cover-spotlight",
    shareCopy: copies.launch,
    content: photoContent({
      eyebrow: "Now live",
      badge: "Telegram · Daily habit",
      title: "Syra Telegram Bot",
      subtitle: "Free credits. Morning briefing. Referral invites. Open /start and ask.",
    }),
  },
  {
    role: "deepDive",
    layout: "photo-items-grid",
    shareCopy: copies.deepDive,
    content: photoContent({
      kicker: "Commands",
      headline: "Worth knowing.",
      items: [
        "/start · /wallet · /portfolio",
        "/digest on|off · /mute",
        "/referral create yourname",
        "Ask in plain language anytime",
        "Docs: /docs/telegram-bot",
      ],
    }),
  },
  {
    role: "split",
    layout: "photo-hero-compact",
    shareCopy: copies.split,
    content: photoContent({
      badge: "Credits → wallet",
      headline: "Free win, then funded depth.",
      body: "Use daily credits first. Deposit USDC when you want unlimited live tools. Referral sponsors friends with a daily cap.",
      highlights: [
        "Credits: 3 live calls / day",
        "Wallet: USDC + a little SOL",
        "Referral: sponsor with a cap",
        "Mute: /digest off anytime",
      ],
    }),
  },
  {
    role: "terminal",
    layout: "photo-terminal",
    shareCopy: copies.terminal,
    content: photoContent({
      headline: "In Telegram.",
      terminalLines: [
        "/start",
        "→ agent wallet ready",
        "BTC news",
        "→ free live-data credit used",
        "/digest on",
        "→ morning briefing armed",
      ],
    }),
  },
  {
    role: "cta",
    layout: "photo-closing-banner",
    shareCopy: copies.cta,
    content: photoContent({
      headline: "Open Syra on Telegram.",
      subtitle: '/start, then ask "BTC news". Turn on Syra Daily for the morning pulse.',
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
    }),
  },
]);
