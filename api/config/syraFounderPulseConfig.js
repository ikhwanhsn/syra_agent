export const SYRA_FOUNDER_DEFAULT_HANDLE = (
  process.env.SYRA_FOUNDER_X_HANDLE || ""
).trim().replace(/^@/, "");

export const SYRA_FOUNDER_PULSE_TWEET_SAMPLE = 40;
export const SYRA_FOUNDER_PULSE_ENGAGEMENT_WEIGHTS = Object.freeze({
  like: 1.0,
  retweet: 2.5,
  reply: 1.5,
  quote: 2.0,
  view: 0.001,
});
