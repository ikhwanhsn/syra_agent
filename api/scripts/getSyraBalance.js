import { checkFromBrowserCookie } from "./checkFromBrowserCookie";
import { getTokenBalance } from "./getTokenBalance";

export async function getSyraBalance(walletAddress) {
  const walletAddress = await checkFromBrowserCookie(req);

  if (!walletAddress) return res.json({ error: "No wallet found" });

  const balance = await getTokenBalance(
    walletAddress,
    "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
  );
  return balance;
}
