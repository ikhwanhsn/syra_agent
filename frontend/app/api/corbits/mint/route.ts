import { NextRequest, NextResponse } from "next/server";
import { common } from "@faremeter/middleware";
import {
  x402Exact,
  isKnownCluster,
  isKnownSPLToken,
  type KnownCluster,
  type KnownSPLToken,
} from "@faremeter/info/solana";

const PAYTO_ADDRESS = process.env.PAYTO_ADDRESS!;
const FACILITATOR_URL =
  process.env.FAREMETER_FACILITATOR_URL || "https://facilitator.corbits.dev";
const NETWORK = process.env.FAREMETER_NETWORK || "devnet";
const ASSET = process.env.ASSET || "USDC";
const AMOUNT = process.env.PAYMENT_AMOUNT || "1000";

if (!isKnownCluster(NETWORK)) {
  throw new Error(
    `Invalid FAREMETER_NETWORK: ${NETWORK}. Must be devnet, testnet, or mainnet-beta`
  );
}

if (!isKnownSPLToken(ASSET)) {
  throw new Error(`Invalid ASSET: ${ASSET}. Must be USDC`);
}

const network = NETWORK as KnownCluster;
const asset = ASSET as KnownSPLToken;

const { getPaymentRequiredResponse } =
  common.createPaymentRequiredResponseCache();

export async function POST(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const url = new URL(req.url);
  const resource = url.toString();

  let paymentResponse: { status: number; body: any } | undefined;

  const paymentRequirements = x402Exact({
    network,
    asset,
    amount: AMOUNT,
    payTo: PAYTO_ADDRESS,
  });

  const accepts = paymentRequirements.map((req) => ({
    ...req,
    resource,
    description: "Access to protected API endpoint",
    mimeType: "application/json",
  }));

  const middlewareResponse = await common.handleMiddlewareRequest({
    facilitatorURL: FACILITATOR_URL,
    accepts,
    resource,
    getPaymentRequiredResponse,
    getHeader: (key: string) => headers[key.toLowerCase()] || headers[key],
    sendJSONResponse: (status: number, body: any) => {
      paymentResponse = { status, body };
      return body;
    },
  });

  if (middlewareResponse || paymentResponse) {
    return NextResponse.json(paymentResponse!.body, {
      status: paymentResponse!.status,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Minted successfully!",
    timestamp: new Date().toISOString(),
    paid: true,
  });
}
