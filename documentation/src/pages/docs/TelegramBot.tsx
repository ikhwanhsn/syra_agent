/**
 * Telegram Bot docs — Syra AI agent on Telegram (wallet + live intel + referral).
 */
import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SYRA_TELEGRAM_BOT_URL, SYRA_TELEGRAM_COMMUNITY_URL } from "@/content/syraUrls";

const tocItems = [
  { id: "what-you-need", title: "What You'll Need", level: 2 },
  { id: "step-1", title: "Step 1: Start the Bot", level: 2 },
  { id: "step-2", title: "Step 2: Ask for Live Intel", level: 2 },
  { id: "step-3", title: "Step 3: Wallet & Referral", level: 2 },
  { id: "commands", title: "Commands Summary", level: 2 },
];

export default function TelegramBot() {
  return (
    <DocsLayout toc={tocItems}>
      <div className="mb-8">
        <div className="text-sm text-primary font-medium mb-2">Telegram Bot</div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Getting Started</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Syra on Telegram is a walleted crypto intel agent: ask natural-language questions, get live news and
          signals, and share a referral link that sponsors friends&apos; paid tool calls.
        </p>
      </div>

      <section id="what-you-need" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">What You&apos;ll Need</h2>
        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
          <li>A Telegram account</li>
          <li>
            The{" "}
            <a
              href={SYRA_TELEGRAM_BOT_URL}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Syra Telegram bot
            </a>
          </li>
          <li>Optional: a little USDC + SOL on Solana after your free daily live-data credits</li>
        </ul>
      </section>

      <section id="step-1" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 1: Start the Bot</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
          <li>Open Telegram.</li>
          <li>
            Open{" "}
            <a
              href={SYRA_TELEGRAM_BOT_URL}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {SYRA_TELEGRAM_BOT_URL.replace("https://", "")}
            </a>
            .
          </li>
          <li>
            Tap <strong className="text-foreground">Start</strong> or send{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/start</code>.
          </li>
          <li>Syra provisions an agent wallet and shows starter prompts.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Tip: send <code className="px-1.5 py-0.5 rounded bg-muted text-primary">/help</code> anytime for
          commands. Community chat:{" "}
          <a
            href={SYRA_TELEGRAM_COMMUNITY_URL}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            t.me/syra_ai
          </a>
          .
        </p>
      </section>

      <section id="step-2" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 2: Ask for Live Intel</h2>
        <p className="text-muted-foreground mb-4">
          Type naturally. Short live-data asks work best. New users get a few free live-data tool calls per day
          (UTC); after that, tools settle in USDC from your Syra wallet.
        </p>
        <CodeBlock plain code={"BTC news\nSOL signal\nETH sentiment"} language="text" showLineNumbers={false} />
        <p className="text-muted-foreground mt-4">
          General crypto Q&amp;A (no live tools) works anytime without depositing.
        </p>
      </section>

      <section id="step-3" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Step 3: Wallet, Digest &amp; Referral</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li>
            <code className="text-primary">/wallet</code> — deposit SOL/USDC, withdraw, check balances
          </li>
          <li>
            <code className="text-primary">/digest on</code> — morning Syra Daily briefing (one message / day)
          </li>
          <li>
            <code className="text-primary">/referral</code> — create a share link; friends&apos; paid tools bill
            your wallet (daily sponsor cap)
          </li>
        </ul>
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          Same pay-per-call tools as the Syra web agent and MCP. Telegram is a consumer surface, not a separate
          trading-bot product.
        </div>
      </section>

      <section id="commands" className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold mb-4">Commands Summary</h2>
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[280px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2 sm:p-3 font-medium">Command</th>
                <th className="text-left p-2 sm:p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/start</code>
                </td>
                <td className="p-2 sm:p-3">Welcome + create wallet</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/wallet</code>
                </td>
                <td className="p-2 sm:p-3">Balances, deposit, withdraw</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/portfolio</code>
                </td>
                <td className="p-2 sm:p-3">Token holdings</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/referral</code>
                </td>
                <td className="p-2 sm:p-3">Share link + sponsor spend stats</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/digest</code>
                </td>
                <td className="p-2 sm:p-3">Syra Daily on/off</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/mute</code>
                </td>
                <td className="p-2 sm:p-3">Pause digests</td>
              </tr>
              <tr>
                <td className="p-2 sm:p-3 whitespace-nowrap">
                  <code className="text-primary">/help</code>
                </td>
                <td className="p-2 sm:p-3">Command list</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <Button variant="primary" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <a href={SYRA_TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
            Open Telegram Bot
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </a>
        </Button>
        <Button variant="outline" size="lg" className="w-full sm:min-w-[12rem] sm:w-auto justify-center" asChild>
          <Link to="/docs/welcome">Back to Welcome</Link>
        </Button>
      </div>
    </DocsLayout>
  );
}
