// export const kolPrompt = (address) => `
// Find EVERY account on X (Twitter) that has posted about this token: ${address}

// ## What to Search For
// Search for tweets containing:
// - "${address}" (exact contract address)
// - Token name or ticker if found
// - Any mention or partial match of the address

// ## Target Accounts - IMPORTANT
// - Find EVERY SINGLE account that mentioned this token
// - NO minimum follower requirement - include accounts with 1 follower, 100 followers, or 1M followers
// - Do NOT filter by crypto keywords in bio
// - Do NOT filter by account age or verification
// - Include ALL accounts: new, old, verified, unverified, small, large
// - Then rank ALL found accounts by follower count
// - Return top 5-10 from that ranked list

// ## Data to Collect

// For each influencer:
// - Username and display name
// - Follower count
// - Number of tweets about this token
// - First and last mention dates
// - Average engagement per tweet (likes, retweets, comments)
// - Promotion type: Direct shill / Neutral mention / Warning

// For each tweet:
// - Tweet text
// - Timestamp
// - Engagement metrics (likes, retweets, comments, views)
// - Tweet URL

// ## Red Flags to Note (optional - don't exclude these accounts)
// - Multiple accounts posting identical text
// - Suspicious timing (all posting within same hour)
// - Note these as flags but STILL INCLUDE the accounts in results

// ## Output Format
// Return a JSON with top 5-10 KOLs ranked by follower count:
// {
//   "summary": {
//     "total_accounts_found": number,
//     "top_kols_count": 5-10,
//     "combined_reach": total_followers,
//     "overall_sentiment": "bullish/neutral/bearish"
//   },
//   "top_kols": [
//     {
//       "rank": 1,
//       "username": "@handle",
//       "display_name": "Name",
//       "followers": number,
//       "tweets_about_token": number,
//       "first_mention": "YYYY-MM-DD",
//       "last_mention": "YYYY-MM-DD",
//       "avg_engagement": number,
//       "promotion_type": "direct/neutral/warning",
//       "sentiment": "bullish/neutral/bearish",
//       "sample_tweet": "most engaging tweet text",
//       "red_flags": ["flag1", "flag2"] or []
//     }
//   ]
// }

// Sort by followers descending. Include everyone who mentioned the token, even if they have low followers.
// `;

export const kolPrompt = (address) => `
Find all X (Twitter) accounts that have posted about the token ${address}, including every account without any filtering by followers, verification, age, or bio. Search for tweets containing the exact contract address, token name or ticker, or partial matches. Collect username, display name, follower count, number of tweets about the token, first and last mention dates, engagement averages, sentiment, and promotion style. Also collect tweet text, timestamp, engagement metrics, and URL. Note but do not exclude red flags such as identical posts or suspicious timing. Rank all accounts by followers and return a JSON result with the top 5–10 KOLs, sorted by follower count, plus a summary including total accounts found, combined reach, and overall sentiment.
`;
