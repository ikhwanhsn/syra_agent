const BASE_URL = "https://nansen.api.corbits.dev";

export const smartMoneyRequests = [
  // 1. NETFLOWS - Track Smart Money Accumulation/Distribution
  {
    url: `${BASE_URL}/api/v1/smart-money/netflow`,
    payload: {
      chains: ["solana"],
      filters: {
        // Include multiple Smart Money labels for better coverage
        include_smart_money_labels: ["Fund", "Smart Trader"],
        // Exclude short-term traders for better quality signals
        exclude_smart_money_labels: ["30D Smart Trader"],
        include_native_tokens: false,
        include_stablecoins: false,
      },
      pagination: {
        page: 1,
        per_page: 25, // Increased for more opportunities
      },
      order_by: [
        {
          field: "net_flow_24h_usd",
          direction: "DESC", // Focus on 7-day accumulation
        },
      ],
    },
  },

  // 2. HOLDINGS - Current Smart Money Positions
  {
    url: `${BASE_URL}/api/v1/smart-money/holdings`,
    payload: {
      chains: ["solana"],
      filters: {
        include_smart_money_labels: ["Fund", "Smart Trader"],
        exclude_smart_money_labels: ["30D Smart Trader"],
        include_native_tokens: false,
        include_stablecoins: false,
        // Focus on recent balance increases (buying activity)
        balance_24h_percent_change: {
          min: 0.01, // At least 5% increase
          max: 1.0, // Up to 100% increase
        },
        // Optimize value range for tradable positions
        value_usd: {
          min: 500, // Meaningful positions
          max: 500000, // Room for growth
        },
      },
      pagination: {
        page: 1,
        per_page: 25,
      },
      order_by: [
        {
          field: "value_usd",
          direction: "DESC", // Most recent accumulation
        },
        {
          field: "holders_count",
          direction: "DESC", // Multiple smart money conviction
        },
      ],
    },
  },

  // 3. HISTORICAL HOLDINGS - Trend Analysis
  {
    url: `${BASE_URL}/api/v1/smart-money/historical-holdings`,
    payload: {
      date_range: {
        from: "2025-11-08", // Last 30 days
        to: "2025-12-08",
      },
      chains: ["solana"],
      filters: {
        include_smart_money_labels: [
          "Fund",
          "Smart Trader",
          "90D Smart Trader",
          "180D Smart Trader",
        ],
        exclude_smart_money_labels: ["30D Smart Trader"],
        include_native_tokens: false,
        include_stablecoins: false,
        // Look for consistent accumulation patterns
        balance_24h_percent_change: {
          min: 0.03, // Positive accumulation
          max: 0.5, // Sustainable growth
        },
        token_age_days: {
          min: 7,
          max: 120,
        },
        value_usd: {
          min: 10000,
          max: 1000000,
        },
      },
      pagination: {
        page: 1,
        per_page: 15,
      },
      order_by: [
        {
          field: "date",
          direction: "DESC", // Most recent first
        },
      ],
    },
  },

  // 4. DEX TRADES - Real-time Smart Money Activity
  {
    url: `${BASE_URL}/api/v1/smart-money/dex-trades`,
    payload: {
      chains: ["solana"],
      filters: {
        include_smart_money_labels: [
          "Fund",
          "Smart Trader",
          "90D Smart Trader",
          "180D Smart Trader",
        ],
        exclude_smart_money_labels: ["30D Smart Trader"],
        // Focus on meaningful buy transactions
        token_bought_age_days: {
          min: 3, // Skip brand new
          max: 60, // Focus on emerging
        },
        // Filter for significant trades
        trade_value_usd: {
          min: 2000, // Meaningful size
          max: 100000, // Institutional-scale
        },
      },
      pagination: {
        page: 1,
        per_page: 25, // More trades for pattern recognition
      },
      order_by: [
        {
          field: "block_timestamp",
          direction: "DESC", // Most recent trades
        },
      ],
    },
  },

  // 5. JUPITER DCAs - Smart Money Dollar-Cost Averaging on Solana
  {
    url: `${BASE_URL}/api/v1/smart-money/dcas`,
    payload: {
      filters: {
        include_smart_money_labels: [
          "Fund",
          "Smart Trader",
          "90D Smart Trader",
          "180D Smart Trader",
        ],
        exclude_smart_money_labels: ["30D Smart Trader"],
        // Optional: filter by DCA parameters if available
        // Check docs for additional DCA-specific filters
      },
      pagination: {
        page: 1,
        per_page: 15,
      },
      order_by: [
        {
          field: "dca_created_at",
          direction: "DESC", // Most recent DCAs
        },
      ],
    },
  },
];

// USAGE TIPS FOR ALPHA TRADING:
//
// 1. COMBINE SIGNALS: Look for tokens appearing in multiple endpoints
//    - High netflow + Recent holdings increase + Fresh DEX buys = Strong signal
//
// 2. TIMING INDICATORS:
//    - Netflow: 7d trend better than 24h for avoiding noise
//    - Holdings: 24h change shows immediate accumulation
//    - DEX Trades: Real-time entry points
//    - DCAs: Long-term conviction signals
//
// 3. QUALITY FILTERS:
//    - Exclude "30D Smart Trader" to avoid short-term noise
//    - Include 90D/180D traders for proven track records
//    - Min holders/traders ensure conviction, not single-wallet pumps
//
// 4. MARKET CAP SWEET SPOT:
//    - $500K-$50M for balance of liquidity and growth potential
//    - Too small (<$500K): High risk, low liquidity
//    - Too large (>$50M): Limited upside potential
//
// 5. TOKEN AGE:
//    - 3-90 days: Established enough to have data, young enough for alpha
//    - Skip <3 days: Often too volatile, rug risk
//    - Skip >120 days: Likely already discovered
//
// 6. RESPONSE ANALYSIS:
//    - Cross-reference token addresses across endpoints
//    - Calculate accumulation velocity (change over time)
//    - Monitor holder count increases (growing conviction)
//    - Track value_usd increases (position sizing up)
