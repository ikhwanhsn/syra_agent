import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { DocPageHeader } from "@/components/docs/DocPageHeader";
import { DocSection } from "@/components/docs/DocSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { SYRA_AGENT_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "trading-signals", title: "Trading Signals", level: 2 },
  { id: "news-sentiment", title: "News & Sentiment", level: 2 },
  { id: "market-data", title: "Market Data (StableCrypto)", level: 2 },
  { id: "social-data", title: "Social Data (StableSocial)", level: 2 },
  { id: "enrichment-data", title: "Enrichment (StableEnrich)", level: 2 },
  { id: "research-discovery", title: "Research & Discovery", level: 2 },
  { id: "partner-memecoin", title: "Partner & Memecoin Tools", level: 2 },
  { id: "conversational", title: "Conversational Interface", level: 2 },
  { id: "full-list", title: "Full List of Tools", level: 2 },
];

export default function AgentFeatures() {
  return (
    <DocsLayout toc={tocItems}>
      <DocPageHeader
        eyebrow="Syra Agent"
        title="Agent Features"
        description="A concise overview of what the Syra Agent can do: signals, news, sentiment, research, discovery, and more—all through natural-language chat."
      />

      <DocSection id="overview" title="Overview" prose>
        <p>
          The Syra Agent exposes dozens of capabilities through a single chat interface. You don&apos;t choose tools from
          a menu—you describe what you want (e.g. &quot;Signal for Bitcoin&quot;, &quot;Latest ETH news&quot;,
          &quot;Market sentiment&quot;), and the agent selects the right backend tool, calls it, and returns a clear
          answer. Features are grouped below by category, including x402 integrations{" "}
          <strong>StableCrypto</strong>, <strong>StableSocial</strong>, and <strong>StableEnrich</strong>; for the
          complete list with prices and example prompts, see the{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="trading-signals" title="Trading Signals" prose>
        <p>
          Request a full technical analysis for supported tokens (e.g. Bitcoin, Ethereum, Solana). By default the
          backend uses <strong>Binance spot OHLC</strong> plus the technical engine; you can ask for another exchange
          when supported (see the{" "}
          <Link to="/docs/api/signal" className="text-primary hover:underline">
            Signal API
          </Link>{" "}
          and agent tool hints). Each signal typically includes current price, 24h change, RSI, MACD, moving averages,
          support and resistance levels, a suggested action plan (entry, targets, stop loss), and risk/reward with
          confidence. See{" "}
          <Link to="/docs/agent/supported-tokens" className="text-primary hover:underline">
            Supported Tokens
          </Link>{" "}
          for the list of assets you can request signals for.
        </p>
        <p>
          <strong>Example:</strong> <em>&quot;Signal for Bitcoin&quot;</em>, <em>&quot;Get me analysis for SOL&quot;</em>
        </p>
      </DocSection>

      <DocSection id="news-sentiment" title="News & Sentiment" prose>
        <p>
          <strong>Crypto news</strong> — Get the latest headlines and updates. You can ask for general crypto news or
          narrow by ticker (e.g. BTC, ETH, SOL). <strong>Sentiment analysis</strong> — Ask for market or token-level
          sentiment to gauge narrative and mood. Additional features include <strong>trending headlines</strong> and the{" "}
          <strong>sundown digest</strong> (daily summary), so you can stay on top of what&apos;s moving the market
          without leaving the chat.
        </p>
        <p>
          <strong>Examples:</strong> <em>&quot;Latest crypto news&quot;</em>, <em>&quot;News about ETH&quot;</em>,{" "}
          <em>&quot;What&apos;s the market sentiment?&quot;</em>, <em>&quot;Sundown digest&quot;</em>
        </p>
      </DocSection>

      <DocSection id="market-data" title="Market Data (StableCrypto)" prose>
        <p>
          For <strong>live spot prices</strong>, <strong>global market cap</strong>,{" "}
          <strong>CoinGecko trending</strong>, and <strong>DefiLlama TVL/yields</strong>, the agent calls{" "}
          <a href="https://stablecrypto.dev" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            StableCrypto
          </a>{" "}
          (~$0.01 per request, paid from your agent wallet). This is separate from the Syra <strong>signal</strong> tool,
          which returns a full technical analysis (RSI, MACD, levels, action plan). For Solana tokens by mint, use
          Birdeye tools instead.
        </p>
        <p>
          <strong>Examples:</strong> <em>&quot;What is the Bitcoin price?&quot;</em>,{" "}
          <em>&quot;Global crypto market cap&quot;</em>, <em>&quot;CoinGecko trending coins&quot;</em>,{" "}
          <em>&quot;DefiLlama TVL for aave&quot;</em>, <em>&quot;Top DeFi protocols&quot;</em>
        </p>
        <p>
          See the dedicated{" "}
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            Market data guide
          </Link>{" "}
          for all tool IDs, parameters, pay.sh gateway usage, and API integration.
        </p>
      </DocSection>

      <DocSection id="social-data" title="Social Data (StableSocial)" prose>
        <p>
          Fetch <strong>TikTok</strong>, <strong>Instagram</strong>, <strong>Facebook</strong>, and{" "}
          <strong>Reddit</strong> profiles, posts, and search results via{" "}
          <a href="https://stablesocial.dev" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            StableSocial
          </a>{" "}
          (~$0.06 per request). You must provide a handle, keyword, or subreddit; jobs are async (typically 5–60
          seconds).
        </p>
        <p>
          <strong>Examples:</strong> <em>&quot;TikTok profile for nike&quot;</em>,{" "}
          <em>&quot;Instagram posts from @nike&quot;</em>, <em>&quot;Top posts on r/solana&quot;</em>,{" "}
          <em>&quot;Search Reddit for solana hackathon&quot;</em> — see{" "}
          <Link to="/docs/agent/social-data" className="text-primary hover:underline">
            Social data guide
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="enrichment-data" title="Enrichment (StableEnrich)" prose>
        <p>
          People and company search (Apollo), semantic web search and scrape (Exa, Firecrawl), Google Maps, Reddit
          threads, Google News (Serper), email verification (Hunter), and identity enrichment (Minerva) via{" "}
          <a href="https://stableenrich.dev" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            StableEnrich
          </a>
          . Pricing varies by endpoint ($0.0024–$0.12 per call, upstream + 20%).
        </p>
        <p>
          <strong>Examples:</strong> <em>&quot;Scrape this URL with Firecrawl&quot;</em>,{" "}
          <em>&quot;Apollo search for engineers at Stripe&quot;</em>, <em>&quot;Verify email …&quot;</em> — see{" "}
          <Link to="/docs/agent/enrichment-data" className="text-primary hover:underline">
            Enrichment guide
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="research-discovery" title="Research & Discovery" prose>
        <p>
          <strong>Deep research</strong> — Request structured research reports on topics you care about; the agent runs a
          research pipeline and returns summarized, actionable insights. <strong>EXA search & crawl</strong> — Web search
          and site crawling for RAG-style research. <strong>Browser Use</strong> — Natural-language browser tasks for
          data extraction.
        </p>
        <p>
          <strong>Examples:</strong> <em>&quot;Run deep research on [topic]&quot;</em>,{" "}
          <em>&quot;EXA search for Solana DeFi trends&quot;</em>, <em>&quot;Crawl docs.example.com&quot;</em>
        </p>
      </DocSection>

      <DocSection id="partner-memecoin" title="Partner & Memecoin Tools" prose>
        <p>
          The agent can call partner-powered tools when you ask. These include <strong>Nansen</strong> (smart money,
          token god mode, and per-endpoint tools), <strong>Zerion</strong> (wallet portfolio, positions, PnL, gas
          prices), <strong>GMGN</strong> (token info, security, trending, trenches, wallet stats),{" "}
          <strong>DexScreener</strong>, <strong>Jupiter</strong> (trending tokens, swap order, quote),{" "}
          <strong>Squid Router</strong> (cross-chain route and status), <strong>Rugcheck</strong>, and{" "}
          <strong>Binance correlation</strong>. For tokenized equity and IPO intel, use <strong>SPCX</strong> and{" "}
          <strong>xStocks equity</strong> tools. For memecoins, dedicated pump.fun scouts and analyzers are
          available—trending, movers, alpha/beta scout segments, and full mint due-diligence. Generative AI (chat,
          image, video) is available via OpenRouter x402 APIs — see the{" "}
          <Link to="/docs/api/chat-completions" className="text-primary hover:underline">
            Chat Completions
          </Link>{" "}
          docs.
        </p>
        <p>
          <strong>Examples:</strong> <em>&quot;Smart money data&quot;</em>, <em>&quot;Trending on Jupiter&quot;</em>,{" "}
          <em>&quot;Get a cross-chain route from Base to Arbitrum&quot;</em>,{" "}
          <em>&quot;Memecoins with fastest holder growth&quot;</em>, <em>&quot;Token report&quot;</em>
        </p>
      </DocSection>

      <DocSection id="conversational" title="Conversational Interface" prose>
        <p>
          All features are accessed through natural language. You don&apos;t need to memorize commands or tool
          names—describe your goal and the agent interprets intent, selects the appropriate tool (if any), and formats
          the response. You can mix follow-up questions, ask for clarification, or chain requests (e.g. &quot;Now get me
          news about that token&quot;) in the same conversation. The interface is the same whether you&apos;re asking
          for a signal, news, or a memecoin screen.
        </p>
      </DocSection>

      <DocSection id="full-list" title="Full List of Tools" prose>
        <p>
          For a complete, up-to-date list of every tool the agent can use—including names, short descriptions, per-call
          prices in USD, and example prompts—see the{" "}
          <Link to="/docs/agent/agent-catalog" className="text-primary hover:underline">
            Agent Catalog
          </Link>
          . It covers core tools (signals, news, sentiment, SPCX/equity intel, arbitrage, 8004), market data (
          <Link to="/docs/agent/market-data" className="text-primary hover:underline">
            StableCrypto
          </Link>{" "}
          + pay.sh), social data (
          <Link to="/docs/agent/social-data" className="text-primary hover:underline">
            StableSocial
          </Link>
          ), enrichment (
          <Link to="/docs/agent/enrichment-data" className="text-primary hover:underline">
            StableEnrich
          </Link>
          ), partner tools (Nansen, Zerion, GMGN, Jupiter, Squid Router, Binance, Giza, Bankr, Neynar, SIWA, and more),
          and memecoin scouts. API references:{" "}
          <Link to="/docs/api/agent-tools-market-data" className="text-primary hover:underline">
            market data
          </Link>
          ,{" "}
          <Link to="/docs/api/agent-tools-social-data" className="text-primary hover:underline">
            social data
          </Link>
          ,{" "}
          <Link to="/docs/api/agent-tools-enrichment-data" className="text-primary hover:underline">
            enrichment data
          </Link>
          .
        </p>
      </DocSection>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 not-prose">
        <Button variant="primary" size="lg" asChild>
          <a href={SYRA_AGENT_URL} target="_blank" rel="noopener noreferrer">
            Open Syra Agent
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/docs/agent/supported-tokens">Next: Supported Tokens</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/docs/agent/getting-started">← Getting Started</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
