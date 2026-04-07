const BASE_URL = process.env.NANSEN_API_BASE_URL || "https://api.nansen.ai";

function getDateRange(daysBack = 30) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - daysBack);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export const smartMoneyRequests = [
  // 1. NETFLOWS
  {
    url: `${BASE_URL}/api/v1/smart-money/netflow`,
    payload: {
      chains: ["solana"],
      filters: {
        include_smart_money_labels: ["Fund", "Smart Trader"],
        exclude_smart_money_labels: ["30D Smart Trader"],
        include_native_tokens: false,
        include_stablecoins: false,
      },
      pagination: {
        page: 1,
        per_page: 25,
      },
      order_by: [
        {
          field: "net_flow_24h_usd",
          direction: "DESC",
        },
      ],
    },
  },

  // 2. HOLDINGS
  {
    url: `${BASE_URL}/api/v1/smart-money/holdings`,
    payload: {
      chains: ["solana"],
      filters: {
        include_smart_money_labels: ["Fund", "Smart Trader"],
        exclude_smart_money_labels: ["30D Smart Trader"],
        include_native_tokens: false,
        include_stablecoins: false,
        balance_24h_percent_change: {
          min: 0.01,
          max: 1.0,
        },
        value_usd: {
          min: 500,
          max: 500000,
        },
      },
      pagination: {
        page: 1,
        per_page: 25,
      },
      order_by: [
        {
          field: "value_usd",
          direction: "DESC",
        },
      ],
    },
  },

  // 3. HISTORICAL HOLDINGS
  {
    url: `${BASE_URL}/api/v1/smart-money/historical-holdings`,
    payload: {
      date_range: getDateRange(30),
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
        balance_24h_percent_change: {
          min: 0.03,
          max: 0.5,
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
          direction: "DESC",
        },
      ],
    },
  },

  // 4. DEX TRADES
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
        token_bought_age_days: {
          min: 3,
          max: 60,
        },
        trade_value_usd: {
          min: 2000,
          max: 100000,
        },
      },
      pagination: {
        page: 1,
        per_page: 25,
      },
      order_by: [
        {
          field: "block_timestamp",
          direction: "DESC",
        },
      ],
    },
  },

  // 5. JUPITER DCAs
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
      },
      pagination: {
        page: 1,
        per_page: 15,
      },
      order_by: [
        {
          field: "dca_created_at",
          direction: "DESC",
        },
      ],
    },
  },
];

