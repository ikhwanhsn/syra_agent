// export const kolPrompt = (address) => `
// # Comprehensive X (Twitter) Scraping Prompt for KOL/Influencer Discovery

// ## Objective
// Find and analyze Key Opinion Leaders (KOLs) and influencers who are promoting or discussing the token with contract address: ${address}.

// ## Search Query Parameters

// ### Primary Search Terms
// - Exact token contract address: ${address}
// - Token ticker symbol (if known)
// - Token name (if known)
// - Common abbreviations or nicknames

// ### Search Operators

// "${address}"
// OR
// (token_name AND pump.fun)
// OR
// (CA: 8a3sEw2k...)

// ## Target Account Criteria

// ### Follower Count Thresholds
// - **Mega Influencers**: 500K+ followers
// - **Macro Influencers**: 100K-500K followers
// - **Mid-tier Influencers**: 10K-100K followers
// - **Micro Influencers**: 1K-10K followers (high engagement)

// ### Engagement Metrics to Collect
// 1. **Total Followers**
// 2. **Average Likes per Tweet**
// 3. **Average Retweets**
// 4. **Average Replies**
// 5. **Engagement Rate** = (Likes + Retweets + Replies) / Followers × 100
// 6. **Tweet Frequency** (posts per day/week)

// ### Account Verification
// - Verified accounts (blue checkmark)
// - Account age (older = more credible)
// - Bio keywords: "crypto," "DeFi," "trader," "investor," "analyst"

// ## Content Analysis Parameters

// ### Types of Promotion to Identify
// 1. **Direct Promotion**
//    - Explicit endorsement
//    - "I bought X tokens"
//    - Price predictions
//    - Call-to-action (CTA) posts

// 2. **Soft Promotion**
//    - Token mentions in broader discussions
//    - Chart analysis
//    - Educational content about the token

// 3. **Paid Promotion Indicators**
//    - #ad, #sponsored tags
//    - Disclosure language
//    - Repeated promotional patterns

// ### Sentiment Analysis
// - Bullish indicators: 🚀, 💎, 🔥, "moon," "gem," "bullish"
// - Neutral: factual reporting, data sharing
// - Bearish: warnings, skepticism, red flags

// ## Data Points to Extract

// ### Per Influencer
// json
// {
//   "username": "@handle",
//   "display_name": "Name",
//   "followers": 150000,
//   "verified": true,
//   "account_created": "YYYY-MM-DD",
//   "bio": "bio text",
//   "tweet_count": 5,
//   "first_mention_date": "YYYY-MM-DD",
//   "last_mention_date": "YYYY-MM-DD",
//   "avg_engagement_rate": 3.5,
//   "total_impressions_estimate": 500000,
//   "promotion_type": "direct/soft/paid",
//   "sentiment": "bullish/neutral/bearish"
// }

// ### Per Tweet
// json
// {
//   "tweet_id": "123456789",
//   "username": "@handle",
//   "timestamp": "YYYY-MM-DD HH:MM:SS",
//   "text": "full tweet text",
//   "likes": 1200,
//   "retweets": 340,
//   "replies": 85,
//   "views": 45000,
//   "url": "tweet_url",
//   "media_attached": true,
//   "hashtags": ["#crypto", "#gem"],
//   "mentions": ["@user1", "@user2"]
// }

// ## Time-Based Analysis

// ### Tracking Parameters
// - **Initial Discovery**: When was token first mentioned?
// - **Peak Activity**: When did mentions spike?
// - **Sustained Promotion**: Who continues posting over time?
// - **Coordination Check**: Multiple accounts posting simultaneously?

// ### Time Ranges
// - Last 24 hours
// - Last 7 days
// - Last 30 days
// - All time

// ## Red Flag Detection

// ### Suspicious Patterns
// - New accounts with high follower counts
// - Sudden engagement spikes
// - Copy-paste tweets across multiple accounts
// - Bot-like posting patterns
// - Pump and dump language
// - Unrealistic price promises

// ## Output Format

// ### Summary Report Structure
// 1. **Executive Summary**
//    - Total KOLs identified
//    - Combined reach
//    - Overall sentiment

// 2. **Top 10 Influencers** (by reach)
//    - Detailed profiles
//    - Engagement metrics
//    - Sample tweets

// 3. **Engagement Timeline**
//    - Chronological promotion activity
//    - Peak periods identified

// 4. **Risk Assessment**
//    - Coordinated promotion indicators
//    - Authenticity scores
//    - Red flags identified

// 5. **Recommendations**
//    - Most credible influencers
//    - Potential paid promoters
//    - Accounts to monitor

// ## API/Scraping Considerations

// ### Rate Limits
// - Respect X API rate limits
// - Implement delays between requests
// - Use authenticated API calls when possible

// ### Legal/Ethical
// - Comply with X Terms of Service
// - Public data only
// - No private information
// - Attribution required

// ### Technical Requirements
// - Handle pagination
// - Parse timestamps correctly
// - Store raw data for verification
// - Error handling for deleted tweets/accounts

// ## Additional Filters

// ### Include
// - English language (or specify languages)
// - Accounts active in crypto space
// - Recent activity (posted in last 30 days)

// ### Exclude
// - Suspended accounts
// - Private accounts
// - Obvious bot accounts
// - Spam accounts

// ## Monitoring Strategy

// ### Ongoing Tracking
// - Set up alerts for new mentions
// - Daily snapshot of key metrics
// - Weekly trend analysis
// - Monthly influencer ranking update
// `;

export const kolPrompt = (address) => `
Find all Key Opinion Leaders (KOLs) and influencers on X (Twitter) who have posted about this token: ${address}

## What to Search For
Search for tweets containing:
- "${address}" (exact contract address)
- Token name or ticker if found
- Variations like "CA: ${address.slice(0, 10)}..."

## Target Accounts
Find ALL accounts that mentioned the token, then:
- Rank by follower count (highest to lowest)
- Return top 5-10 accounts regardless of follower size
- Filter only: Active crypto accounts (bio contains: crypto, DeFi, trader, analyst, web3)
- Exclude: Obvious bots, suspended accounts, private accounts

## Data to Collect

For each influencer:
- Username and display name
- Follower count
- Number of tweets about this token
- First and last mention dates
- Average engagement per tweet (likes, retweets, comments)
- Promotion type: Direct shill / Neutral mention / Warning

For each tweet:
- Tweet text
- Timestamp
- Engagement metrics (likes, retweets, comments, views)
- Tweet URL

## Red Flags to Note
- Multiple accounts posting identical text
- New accounts with huge followers
- Pump and dump language ("100x guaranteed", "don't miss out")
- Suspicious timing (all posting within same hour)

## Output Format
Return a JSON with top 5-10 KOLs ranked by follower count:
{
  "summary": {
    "total_accounts_found": number,
    "top_kols_count": 5-10,
    "combined_reach": total_followers,
    "overall_sentiment": "bullish/neutral/bearish"
  },
  "top_kols": [
    {
      "rank": 1,
      "username": "@handle",
      "display_name": "Name",
      "followers": number,
      "tweets_about_token": number,
      "first_mention": "YYYY-MM-DD",
      "last_mention": "YYYY-MM-DD",
      "avg_engagement": number,
      "promotion_type": "direct/neutral/warning",
      "sentiment": "bullish/neutral/bearish",
      "sample_tweet": "most engaging tweet text",
      "red_flags": ["flag1", "flag2"] or []
    }
  ]
}

Sort by followers descending. Include everyone who mentioned the token, even if they have low followers.
`;
