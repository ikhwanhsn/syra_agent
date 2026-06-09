/**
 * Up Only Fund — 80/20 allocation thesis.
 */

export type ThesisSleeve = {
  id: string;
  weightPct: number;
  label: string;
  title: string;
  description: string;
  criteria: readonly string[];
};

export const FUND_THESIS = {
  headline: "80/20 conviction allocation",
  summary:
    "Two sleeves, one mandate: the majority of capital backs projects with real utility and traction; a smaller sleeve captures asymmetric upside in clean onchain memecoins with verified structure.",
  sleeves: [
    {
      id: "high-conviction",
      weightPct: 80,
      label: "High conviction",
      title: "Utility tokens with real traction",
      description:
        "Tech projects with working products, durable onchain demand, and structural edges on Solana. We size for conviction—not hype cycles.",
      criteria: [
        "Working product or live protocol with measurable usage",
        "Real utility and onchain demand drivers",
        "Credible team with execution track record",
        "Structural edge on Solana (liquidity, distribution, integrations)",
      ],
    },
    {
      id: "asymmetric",
      weightPct: 20,
      label: "Asymmetric",
      title: "Clean onchain memecoins",
      description:
        "Memecoin plays with clear onchain structure—no rug mechanics, verified liquidity, fair launch, and genuine momentum. Small sizing, high selectivity.",
      criteria: [
        "Clear onchain structure—no hidden rug mechanics",
        "Verified liquidity and transparent token distribution",
        "Fair launch or community-driven origin",
        "Genuine momentum with onchain verification",
      ],
    },
  ] as const satisfies readonly ThesisSleeve[],
} as const;
