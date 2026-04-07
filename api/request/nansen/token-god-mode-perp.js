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

const dateRange = getDateRange(30);

export const tokenGodModePerpRequests = [
  // 1. PERP SCREENER - Smart Money Perpetual Futures Analysis
  {
    url: `${BASE_URL}/api/v1/perp-screener`,
    payload: {
      date: {
        from: dateRange.from,
        to: dateRange.to,
      },
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        token_symbol: "SOL",
        volume: {
          min: 10000,
        },
      },
      order_by: [
        {
          direction: "DESC",
          field: "buy_sell_pressure",
        },
      ],
    },
  },

  // 2. PERP PNL LEADERBOARD - Smart Money Perpetual Futures Performance Analysis
  {
    url: `${BASE_URL}/api/v1/tgm/perp-pnl-leaderboard`,
    payload: {
      token_symbol: "SOL",
      date: {
        from: dateRange.from,
        to: dateRange.to,
      },
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        pnl_usd_realised: {
          min: 1000,
        },
        position_value_usd: {
          min: 1000,
        },
      },
      order_by: [
        {
          field: "pnl_usd_realised",
          direction: "ASC",
        },
      ],
    },
  },

  // 3. PERP LONG POSITIONS - Smart Money Perpetual Futures Long Positions Analysis
  {
    url: `${BASE_URL}/api/v1/tgm/perp-positions`,
    payload: {
      token_symbol: "SOL",
      label_type: "all_traders",
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        include_smart_money_labels: ["Smart HL Perps Trader", "Fund"],
        position_value_usd: {
          min: 10000,
        },
        side: ["Long"],
        upnl_usd: {
          min: 0,
        },
      },
      order_by: [
        {
          field: "address",
          direction: "ASC",
        },
      ],
    },
  },

  // 4. PERP SHORT POSITIONS - Smart Money Perpetual Futures Short Positions Analysis
  {
    url: `${BASE_URL}/api/v1/tgm/perp-positions`,
    payload: {
      token_symbol: "SOL",
      label_type: "all_traders",
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        include_smart_money_labels: ["Smart HL Perps Trader", "Fund"],
        position_value_usd: {
          min: 10000,
        },
        side: ["Short"],
        upnl_usd: {
          min: 0,
        },
      },
      order_by: [
        {
          field: "address",
          direction: "ASC",
        },
      ],
    },
  },

  // 5. PERP LONG TRADES - Smart Money Perpetual Futures Long Transaction Analysis
  {
    url: `${BASE_URL}/api/v1/tgm/perp-trades`,
    payload: {
      token_symbol: "SOL",
      date: {
        from: dateRange.from,
        to: dateRange.to,
      },
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        order_type: ["MARKET"],
        side: ["Long"],
      },
      order_by: [
        {
          field: "block_timestamp",
          direction: "ASC",
        },
      ],
    },
  },
  // 6. PERP SHORT TRADES - Smart Money Perpetual Futures Short Transaction Analysis
  {
    url: `${BASE_URL}/api/v1/tgm/perp-trades`,
    payload: {
      token_symbol: "SOL",
      date: {
        from: dateRange.from,
        to: dateRange.to,
      },
      pagination: {
        page: 1,
        per_page: 10,
      },
      filters: {
        order_type: ["MARKET"],
        side: ["Short"],
      },
      order_by: [
        {
          field: "block_timestamp",
          direction: "ASC",
        },
      ],
    },
  },
];
