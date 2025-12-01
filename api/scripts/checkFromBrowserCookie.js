import cookieParser from "cookie-parser";
import { getTokenBalance } from "./tokenService.js";

app.use(cookieParser());

export async function checkFromBrowserCookie(req) {
  const cookieData = req.cookies["x402scan-solana-wallet"];

  if (!cookieData) return null;

  const parsed = JSON.parse(cookieData);
  return parsed.address; // wallet automatically detected
}
