import { useCallback, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Fingerprint,
  Layers,
  Link2,
  Shield,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LINK_DOCS } from "../../config/global";
import {
  SYRA_8004_COLLECTION_URL,
  SYRA_8004_CREATOR_ADDRESS,
  SYRA_API_PUBLIC_ORIGIN,
  SYRA_IDENTITY_NETWORK,
  SYRA_SAP_AGENT_PDA,
  SYRA_SAP_EXPLORER_AGENT_URL,
  SYRA_TOKEN_MINT,
  X402SCAN_SYRA_AGENT_URL,
  X402SCAN_SYRA_SERVER_URL,
  syraSolscanAccountUrl,
  syraSolscanTokenUrl,
  truncateBase58,
} from "@/data/agentIdentity";

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code
          className="block max-w-full truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground sm:text-sm"
          title={value}
        >
          {truncateBase58(value, 10, 10)}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

type RegistryBadge = "verified" | "integrated" | "ecosystem";

function badgeStyles(b: RegistryBadge): string {
  switch (b) {
    case "verified":
      return "border-success/30 bg-success/10 text-success";
    case "integrated":
      return "border-neon-blue/25 bg-neon-blue/10 text-neon-blue";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

function RegistryCard({
  title,
  subtitle,
  badge,
  badgeLabel,
  description,
  children,
  links,
}: {
  title: string;
  subtitle: string;
  badge: RegistryBadge;
  badgeLabel: string;
  description: string;
  children?: ReactNode;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {subtitle}
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles(badge)}`}
        >
          {badge === "verified" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {badgeLabel}
        </span>
      </div>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children ? <div className="mt-6 space-y-6">{children}</div> : null}
      <ul className="mt-6 flex flex-wrap gap-3">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              {l.label}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
            </a>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

export default function Identity() {
  const creator = SYRA_8004_CREATOR_ADDRESS;
  const tokenMint = SYRA_TOKEN_MINT;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <main className="relative z-10 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0 opacity-40 grid-pattern" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-12 max-w-4xl"
          >
            <p className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium uppercase tracking-wider">
              About Syra
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
                <Fingerprint className="h-6 w-6 text-foreground" />
              </div>
              <span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono text-xs text-muted-foreground">
                {SYRA_IDENTITY_NETWORK}
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              On-chain <span className="neon-text">identity</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground text-balance">
              Syra is built as a verifiable trading-intelligence agent: discoverable APIs, x402-native
              payments, and Solana-first registries. Independent explorers and indexers can validate
              capabilities without trusting a single dashboard.
            </p>
          </motion.header>

          {/* Summary strip — layout inspired by public agent identity pages */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { label: "Identity surfaces", value: "6", hint: "Token, registries & discovery layers" },
              { label: "Network", value: SYRA_IDENTITY_NETWORK, hint: "Primary anchor chain" },
              { label: "8004 collection", value: "Syra Agents", hint: "mainnet-beta / id 31" },
              {
                label: "8004 creator / SAP agent",
                value: truncateBase58(creator, 6, 6),
                hint: "On-chain registry anchor",
                mono: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-card rounded-2xl p-5 transition-colors hover:border-primary/20"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold tracking-tight ${item.mono ? "font-mono text-lg sm:text-xl" : ""}`}
                >
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
              </div>
            ))}
          </motion.div>

          <div className="mt-10 space-y-10">
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                $SYRA token
              </h2>
              <CopyValue label="SPL mint (base58)" value={tokenMint} />
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={syraSolscanTokenUrl(tokenMint)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  View token on Solscan
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={`https://jup.ag/tokens/${tokenMint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  title="Official Jupiter token page"
                >
                  Jupiter
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                8004 & SAP anchor
              </h2>
              <CopyValue label="8004 creator — Synapse SAP agent pubkey (base58)" value={creator} />
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={syraSolscanAccountUrl(creator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  View on Solscan
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={SYRA_8004_COLLECTION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  8004market — Syra Agents collection
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href="https://8004.qnt.sh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  8004 protocol docs
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <h2 className="mb-8 mt-20 text-2xl font-bold tracking-tight sm:text-3xl">
            Identity registries
          </h2>

          <div className="space-y-8">
            <RegistryCard
              title="8004 Agent Registry"
              subtitle="Solana"
              badge="verified"
              badgeLabel="Verified anchor"
              description="Syra is listed on the Trustless Agent Registry for Solana (8004). The Syra Agents collection on 8004market ties registered agents to metadata (skills, domains, MCP, x402) pinned off-chain — the same pattern described in the 8004 skill spec."
              links={[
                { label: "8004market — collection", href: SYRA_8004_COLLECTION_URL },
                { label: "Solscan — creator / agent pubkey", href: syraSolscanAccountUrl(creator) },
                { label: "8004.qnt.sh", href: "https://8004.qnt.sh" },
              ]}
            >
              <CopyValue label="8004 creator pubkey (base58)" value={creator} />
            </RegistryCard>

            <RegistryCard
              title="Synapse Agent Protocol"
              subtitle="SAP — OOBE Protocol Labs"
              badge="integrated"
              badgeLabel="Integrated in Syra API"
              description="Syra ships SAP SDK usage and registration tooling in the monorepo (register + publish tool descriptors). SAP stores agent capabilities, x402 endpoints, and discovery metadata on Solana so other agents and dApps can verify pricing and skills on-chain."
              links={[
                { label: "Synapse Explorer — Syra agent", href: SYRA_SAP_EXPLORER_AGENT_URL },
                { label: "SAP register docs", href: "https://explorer.oobeprotocol.ai/docs/examples/register-agent" },
                { label: "Syra API", href: SYRA_API_PUBLIC_ORIGIN },
              ]}
            >
              <CopyValue label="SAP agent PDA (base58)" value={SYRA_SAP_AGENT_PDA} />
            </RegistryCard>

            <RegistryCard
              title="x402 & OpenAPI discovery"
              subtitle="HTTP — programmable payments"
              badge="verified"
              badgeLabel="Production"
              description="Syra’s API exposes machine-readable discovery (OpenAPI, x402 resource lists, MPP OpenAPI). Agents and clients resolve routes, schemas, and payment requirements without a proprietary portal — aligning with permissionless, pay-per-call access."
              links={[
                { label: "OpenAPI catalog", href: `${SYRA_API_PUBLIC_ORIGIN}/openapi.json` },
                { label: "Human docs", href: LINK_DOCS },
                { label: "x402scan — Syra agent", href: X402SCAN_SYRA_AGENT_URL },
                { label: "x402scan — Syra server", href: X402SCAN_SYRA_SERVER_URL },
              ]}
            />

            <RegistryCard
              title="8004 marketplaces & monitors"
              subtitle="Discovery & liveness"
              badge="ecosystem"
              badgeLabel="Third-party indexers"
              description="Frontends and monitors (for example 8004market directories and liveness scoring) ingest on-chain registration plus live HTTP checks. Operating reachable, documented endpoints improves discoverability and review scores over time."
              links={[
                { label: "Syra Agents on 8004market", href: SYRA_8004_COLLECTION_URL },
                { label: "8004 skill spec", href: "https://8004.qnt.sh/skill.md" },
                { label: "API playground", href: "https://playground.syraa.fun" },
              ]}
            />

            <RegistryCard
              title="EVM ERC-8004"
              subtitle="Cross-network discovery"
              badge="ecosystem"
              badgeLabel="Alias routes on Syra API"
              description="Syra’s API documents ERC-8004 discovery aliases for Ethereum-based agent registries. Solana remains the primary home for Syra’s anchor asset; EVM routes help agents that operate across chains find compatible tooling."
              links={[{ label: "Documentation", href: LINK_DOCS }]}
            />
          </div>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-24 rounded-2xl border border-border bg-card/30 p-8 sm:p-10"
          >
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What is on-chain identity?
            </h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              On-chain identity ties an agent to public ledgers and open metadata — existence and
              advertised capabilities become independently auditable instead of website-only claims.
            </p>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Link2,
                  title: "Portable",
                  body: "The same base58 asset and URLs work across dashboards, wallets, and autonomous clients that read Solana and HTTP discovery.",
                },
                {
                  icon: Shield,
                  title: "Verifiable",
                  body: "Anyone can cross-check the registry record, metadata URI, and live endpoints (MCP, OpenAPI, x402) without Syra as a gatekeeper.",
                },
                {
                  icon: Layers,
                  title: "Composable",
                  body: "Other agents and protocols can reference Syra’s registration to build workflows: payments, tool calls, and reputation all plug into shared standards.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/80">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
