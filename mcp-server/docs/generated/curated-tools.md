# Curated MCP tools (@syra-ai/mcp-server)

| Tool name | toolId | Pillar | Role |
|-----------|--------|--------|------|
| `syra_earn_8004_agents_search` | `8004-agents-search` | earn | 8004 search agents by owner, creator, collection (optional limit, offset) |
| `syra_earn_8004_leaderboard` | `8004-leaderboard` | earn | 8004 agent leaderboard by trust tier (optional minTier, limit) |
| `syra_earn_8004_stats` | `8004-stats` | earn | 8004 registry global stats: total agents, feedbacks, trust tiers |
| `syra_invest_bankr_balances` | `bankr-balances` | invest | Wallet balances across chains (optional query: chains=base,solana). Requires BANKR_API_KEY in API. |
| `syra_invest_bankr_prompt` | `bankr-prompt` | invest | Submit a natural language prompt to Bankr agent (body: prompt, optional threadId). Returns jobId; poll bankr-job tool with jobId for result. |
| `syra_invest_giza_agent` | `giza-agent` | invest | Get or create Giza smart account (deposit address) for an owner EOA. Params: owner (0x... address) |
| `syra_invest_giza_protocols` | `giza-protocols` | invest | List DeFi protocols available for a token on Giza (e.g. USDC on Base). Params: token (contract address 0x...) |
| `syra_invest_jupiter_swap_order` | `jupiter-swap-order` | invest | Jupiter Ultra swap order on Solana (Corbits): returns a base64 transaction to sign. Params: inputMint, outputMint, amount (smallest units), taker (defaults to agent wallet). |
| `syra_invest_rise_borrow_quote` | `rise-borrow-quote` | invest | Get RISE borrow capacity and optional required deposit |
| `syra_invest_rise_buy_token` | `rise-buy-token` | invest | Build RISE buy transaction (wallet, market, cashIn, minTokenOut) |
| `syra_invest_rise_deposit_and_borrow` | `rise-deposit-and-borrow` | invest | Build RISE deposit+borrow transaction (wallet, market, borrowAmount) |
| `syra_invest_rise_market` | `rise-market` | invest | Get RISE market details by token mint or rise market address |
| `syra_invest_rise_market_ohlc` | `rise-market-ohlc` | invest | Get RISE OHLC candles by timeframe (1m, 5m, 1h, 1d) |
| `syra_invest_rise_market_quote` | `rise-market-quote` | invest | Get RISE buy/sell quote (amount RAW, direction buy\|sell) |
| `syra_invest_rise_market_transactions` | `rise-market-transactions` | invest | Get RISE market transaction history (optional page, limit) |
| `syra_invest_rise_markets` | `rise-markets` | invest | List RISE markets (optional page, limit) |
| `syra_invest_rise_portfolio_positions` | `rise-portfolio-positions` | invest | Get RISE wallet positions (optional page, limit) |
| `syra_invest_rise_portfolio_summary` | `rise-portfolio-summary` | invest | Get RISE wallet portfolio summary |
| `syra_invest_rise_repay_and_withdraw` | `rise-repay-and-withdraw` | invest | Build RISE repay+withdraw transaction (wallet, market, withdrawAmount) |
| `syra_invest_rise_scout` | `rise-scout` | invest | Live RISE intelligence — view=intel\|markets\|targets with optional mint, limit, tier=ready\|watch |
| `syra_invest_rise_sell_token` | `rise-sell-token` | invest | Build RISE sell transaction (wallet, market, tokenIn, minCashOut) |
| `syra_invest_rise_stream_new` | `rise-stream-new` | invest | Returns integration note for RISE SSE stream endpoint /markets/stream/new |
| `syra_invest_squid_route` | `squid-route` | invest | Get cross-chain route/quote from Squid Router (100+ chains); returns route and transactionRequest for first leg — user signs on source chain |
| `syra_invest_squid_status` | `squid-status` | invest | Check status of a cross-chain transaction (transactionId, requestId, fromChainId, toChainId, quoteId) |
| `syra_spend_analytics_summary` | `analytics-summary` | spend | Bundled analytics: Jupiter trending, Nansen smart money, Binance correlation |
| `syra_spend_arbitrage` | `arbitrage` | spend | CMC top tradable assets plus live cross-CEX USDT spot snapshots; ranked best buy/sell routes (gross spread, not financial advice) |
| `syra_spend_browser_use` | `browser-use` | spend | Run a natural-language browser task (e.g. open a URL, extract data); returns text or structured output. Body: task (required), optional model (bu-mini / bu-max), maxCostUsd. |
| `syra_spend_coingecko_scout` | `coingecko-scout` | spend | Live CoinGecko scout — view=brief\|gainers\|predictions with optional topN, minMarketCap, includeNews, llm |
| `syra_spend_defillama_tvl` | `defillama-tvl` | spend | Protocol or chain TVL from DefiLlama — protocol slug (e.g. aave) OR chain name (e.g. Solana). |
| `syra_spend_dexscreener_pairs` | `dexscreener-pairs` | spend | Onchain DEX pairs from DexScreener — chainId + tokenAddress OR q search. Returns price, liquidity, volume, txns. |
| `syra_spend_equity_intelligence` | `equity-intelligence` | spend | Parametric xStocks intel — Nasdaq vs on-chain premium/discount for TSLAx, NVDAx, AAPLx, and catalog symbols |
| `syra_spend_event` | `event` | spend | Event data and updates |
| `syra_spend_geckoterminal_pools` | `geckoterminal-pools` | spend | Trending or new DEX pools from GeckoTerminal — network (default solana), kind=trending\|new, limit. |
| `syra_spend_health` | `health` | spend | Liveness and connectivity check (paid x402 health endpoint) |
| `syra_spend_nansen_smart_money_netflow` | `nansen-smart-money-netflow` | spend | Smart money net flow / accumulation (chains e.g. ["solana"]; optional filters, pagination) |
| `syra_spend_news` | `news` | spend | Get latest crypto news and market updates (optional ticker: BTC, ETH, or "general") |
| `syra_spend_neynar_user` | `neynar-user` | spend | Farcaster user by username or by FIDs (query: username or fids). Requires NEYNAR_API_KEY. |
| `syra_spend_pumpfun_scout` | `pumpfun-scout` | spend | Live pump.fun scout — segment=alpha\|beta\|predicted\|utility with optional period, limit, minPumpScore, llm |
| `syra_spend_pyth_price` | `pyth-price` | spend | Real-time Pyth oracle prices via Hermes — symbols (comma-separated, e.g. BTC/USD,SOL/USD). |
| `syra_spend_rugcheck_report` | `rugcheck-report` | spend | Solana token risk report from RugCheck — mint (required). Returns risk score, authorities, top holders. |
| `syra_spend_sentiment` | `sentiment` | spend | Get market sentiment analysis |
| `syra_spend_signal` | `signal` | spend | Spot OHLC + technical signal; Syra Agent chat uses CoinGecko by default (set source for CEX or n8n\|webhook) |
| `syra_spend_siwa_nonce` | `siwa-nonce` | spend | Get a SIWA nonce for agent sign-in (body: address, agentId, agentRegistry?). Requires RECEIPT_SECRET, SIWA_RPC_URL. |
| `syra_spend_spcx_intelligence` | `spcx-intelligence` | spend | Tokenized SpaceX equity intel — Nasdaq vs on-chain SPCX/SPCXx premium/discount spread, liquidity, agent bias |
| `syra_spend_sundown_digest` | `sundown-digest` | spend | Sundown digest / daily summary |
| `syra_spend_trending_headline` | `trending-headline` | spend | Trending headlines |
| `syra_spend_web_search` | `web-search` | spend | Free web search via DuckDuckGo/Bing scrape – dynamic query only |

Escape hatch (always registered): **`syra_call_tool`** with `{ toolId, params }` for any catalog tool.

*Auto-generated by `scripts/sync-mcp-tools.mjs` — 47 curated / 257 total. Do not edit by hand.*
