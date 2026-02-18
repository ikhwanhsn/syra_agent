const LINK_AGENT = "https://agent.syraa.fun";
const LINK_DOCS = "https://docs.syraa.fun";
const LINK_PLAYGROUND = "https://playground.syraa.fun";
// In dev, use /api so Vite proxies to localhost:3000 (run: cd api && npm run dev)
const API_BASE = import.meta.env.DEV ? "/api" : "https://api.syraa.fun";
const LINK_DEMO = "https://x.com/syra_agent/status/1994813375214489919?s=20";
// const LINK_TELEGRAM = "https://t.me/syra_ai"; // hidden: focus on website
const LINK_X = "https://x.com/syra_agent";
const EMAIL_SUPPORT = "ikhwanulhusna111@gmail.com";

/** Headers for Syra API (X-API-Key). Set VITE_API_KEY in .env to match the API's API_KEY. */
function getApiHeaders(): Record<string, string> {
  const key = import.meta.env.VITE_API_KEY as string | undefined;
  if (!key || typeof key !== "string") return {};
  return { "X-API-Key": key };
}

export {
  LINK_AGENT,
  LINK_DOCS,
  LINK_PLAYGROUND,
  API_BASE,
  LINK_DEMO,
  EMAIL_SUPPORT,
  getApiHeaders,
  // LINK_TELEGRAM,
  LINK_X,
};
