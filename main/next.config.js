/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@coral-xyz/anchor",
    "@streamflow/stream",
    "@privy-io/react-auth",
    "@x402/core",
    "@x402/evm",
  ],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": require("path").resolve(
        __dirname,
        "src/stubs/farcaster-mini-app-solana.ts"
      ),
    };
    return config;
  },
  async redirects() {
    return [
      { source: "/marketplace", destination: "/overview", permanent: false },
      { source: "/marketplace/:path*", destination: "/overview", permanent: false },
      { source: "/dashboard", destination: "/overview", permanent: false },
      { source: "/dashboard/:path*", destination: "/:path*", permanent: false },
      { source: "/leaderboard", destination: "/overview", permanent: false },
      { source: "/experiment/trading-agent", destination: "/trading-experiment", permanent: false },
      {
        source: "/experiment/trading-agent/agent/:agentId",
        destination: "/trading-experiment/agent/:agentId",
        permanent: false,
      },
      { source: "/lp-experiment/history", destination: "/lp-experiment", permanent: false },
      { source: "/lp-experiment/history/:id", destination: "/lp-experiment", permanent: false },
      { source: "/alpha/x/:username", destination: "/alpha", permanent: false },
      { source: "/token-check", destination: "/assets", permanent: false },
      { source: "/dossier", destination: "/assets", permanent: false },
      { source: "/internal-hackathons", destination: "/internal-team-agents", permanent: false },
      { source: "/staking/dashboard/internal", destination: "/staking/dashboard", permanent: false },
      { source: "/mpp", destination: "/playground", permanent: false },
      { source: "/playground/mpp", destination: "/playground", permanent: false },
    ];
  },
};

module.exports = nextConfig;
