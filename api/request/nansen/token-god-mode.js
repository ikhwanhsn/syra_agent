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

export const tokenGodModeRequests = [
  // 1. FLOW INTELLIGENCE
  {
    url: `${BASE_URL}/api/v1/tgm/flow-intelligence`,
    payload: {
      chain: "solana",
      timeframe: "1d",
      filters: {
        whale_wallet_count: {
          min: 1,
        },
      },
    },
  },

  // 2. HOLDERS
  {
    url: `${BASE_URL}/api/v1/tgm/holders`,
    payload: {
      chain: "solana",
      aggregate_by_entity: false,
      label_type: "all_holders",
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        include_smart_money_labels: ["30D Smart Trader", "Fund"],
        ownership_percentage: {
          min: 0.01,
        },
        token_amount: {
          min: 1000,
        },
        value_usd: {
          min: 10000,
        },
      },
      order_by: [
        {
          field: "value_usd",
          direction: "DESC",
        },
      ],
    },
  },

  // 3. FLOWS
  {
    url: `${BASE_URL}/api/v1/tgm/flows`,
    payload: {
      chain: "solana",
      date: getDateRange(30),
      label: "smart_money",
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        price_usd: {
          max: 1000,
          min: 0.01,
        },
        value_usd: {
          min: 10000,
        },
      },
      order_by: [
        {
          field: "date",
          direction: "DESC",
        },
      ],
    },
  },

  // 4. WHO BOUGHT/SOLD
  {
    url: `${BASE_URL}/api/v1/tgm/who-bought-sold`,
    payload: {
      chain: "solana",
      buy_or_sell: "BUY",
      date: getDateRange(30),
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        include_smart_money_labels: ["Whale", "Smart Trader"],
        trade_volume_usd: {
          min: 1,
        },
      },
      order_by: [
        {
          field: "bought_volume_usd",
          direction: "DESC",
        },
      ],
    },
  },

  // 5. DEX TRADES
  {
    url: `${BASE_URL}/api/v1/tgm/dex-trades`,
    payload: {
      chain: "solana",
      only_smart_money: false,
      date: getDateRange(30),
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        action: "BUY",
        estimated_value_usd: {
          min: 1000,
        },
        include_smart_money_labels: ["Whale", "Smart Trader"],
        token_amount: {
          min: 100,
        },
      },
      order_by: [
        {
          field: "block_timestamp",
          direction: "DESC",
        },
      ],
    },
  },

  // 6. TRANSFERS
  {
    url: `${BASE_URL}/api/v1/tgm/transfers`,
    payload: {
      chain: "solana",
      date: getDateRange(30),
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        include_cex: true,
        include_dex: true,
        non_exchange_transfers: true,
        only_smart_money: true,
      },
      order_by: [
        {
          field: "block_timestamp",
          direction: "DESC",
        },
      ],
    },
  },

  // 7. JUPITER DCAs
  {
    url: `${BASE_URL}/api/v1/tgm/jup-dca`,
    payload: {
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        deposit_amount: {
          min: 100,
        },
        deposit_usd_value: {
          min: 1000,
        },
        status: "Closed",
      },
    },
  },

  // 8. PNL LEADERBOARD
  {
    url: `${BASE_URL}/api/v1/tgm/pnl-leaderboard`,
    payload: {
      chain: "solana",
      date: getDateRange(30),
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        holding_usd: {
          min: 1000,
        },
        pnl_usd_realised: {
          min: 1000,
        },
      },
      order_by: [
        {
          field: "pnl_usd_realised",
          direction: "DESC",
        },
      ],
    },
  },
];
