const BASE_URL = "https://api.dexscreener.com";

export const dexscreenerRequests = [
  // 1. TOKEN PROFILES - Basic Token Information
  {
    url: `${BASE_URL}/token-profiles/latest/v1`,
  },

  // 2. COMMUNITY TAKEOVERS - Token Sales and Gains
  {
    url: `${BASE_URL}/community-takeovers/latest/v1`,
  },

  // 3. ADS - Token Promotions and Ads
  {
    url: `${BASE_URL}/ads/latest/v1`,
  },

  // 4. TOKEN BOOSTS - Token Promotions and Ads
  {
    url: `${BASE_URL}/token-boosts/latest/v1`,
  },

  // 5. TOKEN BOOSTS TOP - Top Token Promotions and Ads
  {
    url: `${BASE_URL}/token-boosts/top/v1`,
  },
];
