/**
 * Unpaid smoke targets for every Syra x402 route (expect HTTP 402 + payment challenge).
 * Keep in sync with api/index.js mounts and partner routers.
 *
 * @typedef {{ id: string; method: string; path: string; query?: string; body?: unknown }} X402SmokeProbe
 */

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** @param {string} pathSuffix */
function nansenId(pathSuffix) {
  return `nansen_${pathSuffix.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root"}`;
}

/** Paths registered on /nansen (GET and POST both exist; one GET smoke per path is enough). */
const NANSEN_PATH_SUFFIXES = [
  "/profiler/address/current-balance",
  "/profiler/address/historical-balances",
  "/profiler/perp-positions",
  "/profiler/address/transactions",
  "/profiler/perp-trades",
  "/profiler/address/related-wallets",
  "/profiler/address/pnl-summary",
  "/profiler/address/pnl",
  "/token-screener",
  "/perp-screener",
  "/tgm/transfers",
  "/tgm/jup-dca",
  "/tgm/flow-intelligence",
  "/tgm/who-bought-sold",
  "/tgm/dex-trades",
  "/tgm/flows",
  "/tgm/perp-positions",
  "/tgm/perp-trades",
  "/profiler/address/counterparties",
  "/tgm/holders",
  "/tgm/pnl-leaderboard",
  "/tgm/perp-pnl-leaderboard",
  "/perp-leaderboard",
  "/smart-money/netflow",
  "/smart-money/holdings",
  "/smart-money/dex-trades",
  "/smart-money/historical-holdings",
  "/smart-money/dcas",
];

/** @returns {X402SmokeProbe[]} */
function nansenProbes() {
  return NANSEN_PATH_SUFFIXES.map((suffix) => ({
    id: nansenId(suffix),
    method: "GET",
    path: `/nansen${suffix}`,
  }));
}

/** @returns {X402SmokeProbe[]} */
function heylolProbes() {
  const base = (path, method = "GET", body) => ({
    id: `heylol_${method}_${path.replace(/[^a-z0-9]+/gi, "_")}`,
    method,
    path: `/heylol${path}`,
    ...(body !== undefined ? { body } : {}),
  });
  return [
    base("/profile/me"),
    base("/profile/me", "PATCH", {}),
    base("/profile/check-username/syra"),
    base("/profile/syra"),
    base("/posts", "POST", {}),
    base("/posts"),
    base("/posts/0/replies"),
    base("/posts/0/like", "POST", {}),
    base("/posts/0/like", "DELETE"),
    base("/feed"),
    base("/feed/following"),
    base("/feed/user/syra"),
    base("/search"),
    base("/suggestions"),
    base("/follow/syra", "POST", {}),
    base("/follow/syra", "DELETE"),
    base("/notifications"),
    base("/payments/history"),
    base("/dm/send", "POST", {}),
    base("/dm/conversations"),
    base("/dm/conversations/0/messages"),
    base("/services"),
    base("/services/discover"),
    base("/services/0/execute", "POST", {}),
    base("/call", "POST", { action: "getMe", params: [] }),
  ];
}

/**
 * Full list of x402 smoke probes (one unpaid request each).
 * @returns {readonly X402SmokeProbe[]}
 */
export function getX402SmokeProbes() {
  /** @type {X402SmokeProbe[]} */
  const probes = [
    { id: "news_get", method: "GET", path: "/news", query: "ticker=general" },
    { id: "news_post", method: "POST", path: "/news", body: { ticker: "general" } },
    { id: "sentiment_get", method: "GET", path: "/sentiment", query: "ticker=general" },
    { id: "event_get", method: "GET", path: "/event", query: "ticker=general" },
    { id: "trending_headline_get", method: "GET", path: "/trending-headline", query: "ticker=general" },
    { id: "sundown_digest_get", method: "GET", path: "/sundown-digest" },
    { id: "sentiment_post", method: "POST", path: "/sentiment", body: { ticker: "general" } },
    { id: "event_post", method: "POST", path: "/event", body: { ticker: "general" } },
    { id: "trending_headline_post", method: "POST", path: "/trending-headline", body: { ticker: "general" } },
    { id: "sundown_digest_post", method: "POST", path: "/sundown-digest", body: {} },
    { id: "signal_get", method: "GET", path: "/signal", query: "token=bitcoin" },
    { id: "signal_post", method: "POST", path: "/signal", body: { token: "bitcoin" } },
    { id: "brain_get", method: "GET", path: "/brain", query: "question=test" },
    { id: "brain_post", method: "POST", path: "/brain", body: { question: "test" } },
    { id: "check_status_get", method: "GET", path: "/check-status" },
    { id: "check_status_post", method: "POST", path: "/check-status", body: {} },
    { id: "mpp_check_get", method: "GET", path: "/mpp/v1/check-status" },
    { id: "mpp_check_post", method: "POST", path: "/mpp/v1/check-status", body: {} },
    { id: "exa_search_get", method: "GET", path: "/exa-search", query: "query=test" },
    { id: "exa_search_post", method: "POST", path: "/exa-search", body: { query: "test" } },
    { id: "crawl_get", method: "GET", path: "/crawl", query: "url=https%3A%2F%2Fexample.com" },
    { id: "crawl_post", method: "POST", path: "/crawl", body: { url: "https://example.com" } },
    { id: "browser_use_get", method: "GET", path: "/browser-use", query: "task=test" },
    { id: "browser_use_post", method: "POST", path: "/browser-use", body: { task: "test" } },
    { id: "analytics_summary_get", method: "GET", path: "/analytics/summary" },
    { id: "analytics_summary_post", method: "POST", path: "/analytics/summary", body: {} },
    { id: "smart_money_get", method: "GET", path: "/smart-money" },
    { id: "smart_money_post", method: "POST", path: "/smart-money", body: {} },
    { id: "token_god_mode_get", method: "GET", path: "/token-god-mode", query: `tokenAddress=${USDC_MINT}` },
    { id: "token_god_mode_post", method: "POST", path: "/token-god-mode", body: { tokenAddress: USDC_MINT } },
    { id: "trending_jupiter_get", method: "GET", path: "/trending-jupiter" },
    { id: "trending_jupiter_post", method: "POST", path: "/trending-jupiter", body: {} },
    {
      id: "jupiter_swap_get",
      method: "GET",
      path: "/jupiter/swap/order",
      query: `inputMint=${USDC_MINT}&outputMint=${USDC_MINT}&amount=1&taker=11111111111111111111111111111111`,
    },
    {
      id: "jupiter_swap_post",
      method: "POST",
      path: "/jupiter/swap/order",
      body: {
        inputMint: USDC_MINT,
        outputMint: USDC_MINT,
        amount: "1",
        taker: "11111111111111111111111111111111",
      },
    },
    {
      id: "squid_route_post",
      method: "POST",
      path: "/squid/route",
      body: {
        fromAddress: "0x0000000000000000000000000000000000000001",
        fromChain: "8453",
        fromToken: USDC_MINT,
        fromAmount: "1000000",
        toChain: "8453",
        toToken: USDC_MINT,
        toAddress: "0x0000000000000000000000000000000000000002",
      },
    },
    {
      id: "squid_status_get",
      method: "GET",
      path: "/squid/status",
      query: "transactionId=0x0&requestId=test&fromChainId=8453&toChainId=8453",
    },
    { id: "bubblemaps_get", method: "GET", path: "/bubblemaps/maps", query: `address=${USDC_MINT}` },
    { id: "bubblemaps_post", method: "POST", path: "/bubblemaps/maps", body: { address: USDC_MINT } },
    { id: "solana_agent_get", method: "GET", path: "/solana-agent" },
    { id: "solana_agent_post", method: "POST", path: "/solana-agent", body: {} },
    { id: "binance_spot_ticker", method: "GET", path: "/binance/spot/ticker/24hr" },
    { id: "binance_spot_depth", method: "GET", path: "/binance/spot/depth", query: "symbol=BTCUSDT" },
    { id: "binance_spot_exchange_info", method: "GET", path: "/binance/spot/exchange-info" },
    { id: "binance_spot_account", method: "GET", path: "/binance/spot/account" },
    { id: "binance_spot_order_post", method: "POST", path: "/binance/spot/order", body: { symbol: "BTCUSDT" } },
    {
      id: "binance_spot_order_delete",
      method: "DELETE",
      path: "/binance/spot/order",
      query: "symbol=BTCUSDT",
    },
    { id: "binance_corr_root_get", method: "GET", path: "/binance" },
    { id: "binance_corr_matrix_get", method: "GET", path: "/binance/correlation-matrix" },
    { id: "binance_corr_matrix_post", method: "POST", path: "/binance/correlation-matrix", body: {} },
    { id: "binance_corr_get", method: "GET", path: "/binance/correlation", query: "symbol=BTCUSDT" },
    { id: "binance_corr_post", method: "POST", path: "/binance/correlation", body: { symbol: "BTCUSDT" } },
    { id: "bankr_balances", method: "GET", path: "/bankr/balances" },
    { id: "bankr_prompt", method: "POST", path: "/bankr/prompt", body: { prompt: "hi" } },
    { id: "bankr_job", method: "GET", path: "/bankr/job/test" },
    { id: "bankr_cancel", method: "POST", path: "/bankr/job/test/cancel", body: {} },
    { id: "giza_protocols", method: "GET", path: "/giza/protocols", query: `token=${USDC_MINT}` },
    { id: "giza_agent", method: "GET", path: "/giza/agent", query: "owner=0x0000000000000000000000000000000000000001" },
    { id: "giza_portfolio", method: "GET", path: "/giza/portfolio", query: "owner=0x0000000000000000000000000000000000000001" },
    { id: "giza_apr", method: "GET", path: "/giza/apr", query: "owner=0x0000000000000000000000000000000000000001" },
    { id: "giza_performance", method: "GET", path: "/giza/performance", query: "owner=0x0000000000000000000000000000000000000001" },
    { id: "giza_activate", method: "POST", path: "/giza/activate", body: {} },
    { id: "giza_withdraw", method: "POST", path: "/giza/withdraw", body: {} },
    { id: "giza_top_up", method: "POST", path: "/giza/top-up", body: {} },
    { id: "giza_update_protocols", method: "POST", path: "/giza/update-protocols", body: {} },
    { id: "giza_run", method: "POST", path: "/giza/run", body: {} },
    { id: "neynar_user", method: "GET", path: "/neynar/user", query: "username=vitalik.eth" },
    { id: "neynar_feed", method: "GET", path: "/neynar/feed" },
    { id: "neynar_cast", method: "GET", path: "/neynar/cast", query: "identifier=0x" },
    { id: "neynar_search", method: "GET", path: "/neynar/search", query: "q=test" },
    {
      id: "siwa_nonce",
      method: "POST",
      path: "/siwa/nonce",
      body: { address: "0x0000000000000000000000000000000000000001", agentId: 1 },
    },
    { id: "siwa_verify", method: "POST", path: "/siwa/verify", body: { message: "x", signature: "0x" } },
    { id: "8004scan_stats", method: "GET", path: "/8004scan/stats" },
    { id: "8004scan_chains", method: "GET", path: "/8004scan/chains" },
    { id: "8004scan_agents", method: "GET", path: "/8004scan/agents" },
    { id: "8004scan_agents_search", method: "GET", path: "/8004scan/agents/search", query: "q=agent" },
    { id: "8004scan_agent_by_id", method: "GET", path: "/8004scan/agents/8453/1" },
    { id: "8004scan_agent_query", method: "GET", path: "/8004scan/agent", query: "chainId=8453&tokenId=1" },
    {
      id: "8004scan_accounts_agents",
      method: "GET",
      path: "/8004scan/accounts/0x0000000000000000000000000000000000000001/agents",
    },
    {
      id: "8004scan_account_agents",
      method: "GET",
      path: "/8004scan/account-agents",
      query: "address=0x0000000000000000000000000000000000000001",
    },
    { id: "8004scan_feedbacks", method: "GET", path: "/8004scan/feedbacks" },
    {
      id: "quicknode_balance",
      method: "GET",
      path: "/quicknode/balance",
      query: "chain=solana&address=11111111111111111111111111111111",
    },
    {
      id: "quicknode_transaction",
      method: "GET",
      path: "/quicknode/transaction",
      query: "chain=solana&signature=1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
    },
    {
      id: "quicknode_rpc",
      method: "POST",
      path: "/quicknode/rpc",
      body: { chain: "solana", method: "getHealth", params: [] },
    },
    { id: "x_user_get", method: "GET", path: "/x/user", query: "username=syra" },
    { id: "x_user_post", method: "POST", path: "/x/user", body: { username: "syra" } },
    { id: "x_search_recent_get", method: "GET", path: "/x/search/recent", query: "query=crypto" },
    { id: "x_search_recent_post", method: "POST", path: "/x/search/recent", body: { query: "crypto" } },
    { id: "x_user_tweets_get", method: "GET", path: "/x/user/syra/tweets" },
    { id: "x_user_tweets_post", method: "POST", path: "/x/user/syra/tweets", body: {} },
    { id: "x_feed_get", method: "GET", path: "/x/feed", query: "username=syra" },
    { id: "x_feed_post", method: "POST", path: "/x/feed", body: { username: "syra" } },
    ...nansenProbes(),
    ...heylolProbes(),
  ];
  return probes;
}
