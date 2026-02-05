import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const tocItems = [
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "step-1", title: "Step 1: Start the Bot", level: 2 },
  { id: "step-2", title: "Step 2: Explore Tokens", level: 2 },
  { id: "step-3", title: "Step 3: Request a Signal", level: 2 },
  { id: "commands", title: "Commands Summary", level: 2 },
];

const listOutput = `📜 Available Token Signals
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- BNB (BNB)
- XRP (XRP)
- Cardano (ADA)
- Dogecoin (DOGE)
... View all supported token`;

export default function TelegramBot() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Telegram Bot</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">⚙️ Getting Started</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Welcome to the Syra AI Agent Trading Assistant setup guide. Connect to the bot, understand how it works, and run your first signal in just a few minutes.
        </p>
      </div>

      <section id="what-you-need" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What You'll Need</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>A Telegram account (mobile or desktop)</li>
          <li>Access to the <a href="https://t.me/syra_trading_bot" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Syra AI Agent Trading Assistant Bot</a></li>
          <li>An internet connection</li>
          <li>(Optional) Familiarity with trading basics (RSI, MACD, price action)</li>
        </ul>
      </section>

      <section id="step-1" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 1: Start the Bot</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Open Telegram.</li>
          <li>Open <a href="https://t.me/syra_trading_bot" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Syra AI Agent Trading Assistant Bot</a>.</li>
          <li>Click <strong className="text-foreground">Start</strong> or type <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/start</code>.</li>
          <li>You'll receive a welcome message and list of available commands.</li>
        </ol>
        <p className="text-sm text-muted-foreground">Tip: Type <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/help</code> anytime to redisplay commands.</p>
      </section>

      <section id="step-2" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 2: Explore Available Tokens</h2>
        <p className="text-muted-foreground mb-4">Type <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/list</code> to see currently supported cryptocurrencies.</p>
        <CodeBlock plain code={listOutput} language="text" showLineNumbers={false} />
      </section>

      <section id="step-3" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 3: Request a Trading Signal</h2>
        <p className="text-muted-foreground mb-4">Use the <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/signal</code> command followed by the token name.</p>
        <CodeBlock plain code={"/signal bitcoin"} language="text" showLineNumbers={false} />
        <p className="text-muted-foreground mt-4 mb-4">The bot returns a complete analysis including:</p>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
          <li>Current price and 24h change</li>
          <li>RSI, MACD, and Moving Averages</li>
          <li>Support and resistance levels</li>
          <li>Action plan (entry, targets, stop loss)</li>
          <li>Risk/reward ratio and confidence level</li>
        </ul>
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          Syra doesn't just give signals — it explains why each trade setup is suggested.
        </div>
      </section>

      <section id="commands" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Commands Summary</h2>
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto overflow-x-auto-touch">
          <table className="w-full text-sm min-w-[280px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2 sm:p-3 font-medium">Command</th>
                <th className="text-left p-2 sm:p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap"><code className="text-primary">/start</code></td><td className="p-2 sm:p-3">View available commands</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap"><code className="text-primary">/signal bitcoin</code></td><td className="p-2 sm:p-3">Get latest BTC trading analysis</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap"><code className="text-primary">/list</code></td><td className="p-2 sm:p-3">Show supported tokens</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap"><code className="text-primary">/news BTC</code></td><td className="p-2 sm:p-3">Get latest BTC-related news</td></tr>
              <tr className="border-b border-border/50"><td className="p-2 sm:p-3 whitespace-nowrap"><code className="text-primary">/top_mention today</code></td><td className="p-2 sm:p-3">Most-discussed tokens today</td></tr>
              <tr><td className="p-2 sm:p-3"><code className="text-primary">/docs</code>, <code className="text-primary">/feedback</code>, <code className="text-primary">/soon</code></td><td className="p-2 sm:p-3">Documentation, feedback, upcoming features</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <Button variant="primary" size="lg" className="w-full sm:w-auto justify-center" asChild>
          <a href="https://t.me/syra_trading_bot" target="_blank" rel="noopener noreferrer">
            Open Telegram Bot
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" className="w-full sm:w-auto justify-center" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
