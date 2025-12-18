const BASE_URL = "https://api.rugcheck.xyz";

export const rugcheckRequests = [
  // 1. NEW TOKENS - Newly Listed Tokens
  {
    url: `${BASE_URL}/v1/stats/new_tokens`,
  },

  // 2. RECENT TOKENS - Recently Active Tokens
  {
    url: `${BASE_URL}/v1/stats/recent`,
  },

  // 3. TRENDING TOKENS - Trending Tokens
  {
    url: `${BASE_URL}/v1/stats/trending`,
  },

  // 4. VERIFIED TOKENS - Verified Tokens
  {
    url: `${BASE_URL}/v1/stats/verified`,
  },
];
