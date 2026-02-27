// app/api/premium/route.ts
import { NextRequest, NextResponse } from "next/server";
import { express as faremeter } from "@faremeter/middleware";
import { solana } from "@faremeter/info";

const facilitatorURL = "https://facilitator.corbits.dev.solana-devnet";

function getPaywalledMiddleware() {
  const payToAddress = process.env.CORBITS_PAYTO_ADDRESS || process.env.ADDRESS_PAYAI;
  if (!payToAddress) {
    throw new Error("CORBITS_PAYTO_ADDRESS or ADDRESS_PAYAI env is required for /api/corbits/premium");
  }
  return faremeter.createMiddleware({
    facilitatorURL,
    accepts: [
      {
        ...solana.x402Exact({
          network: "devnet",
          asset: "USDC",
          amount: 1000, // $0.01
          payTo: payToAddress,
        }),
        resource: "/api/corbits/premium",
        description: "Premium API access",
      },
    ],
  });
}

export async function GET(req: NextRequest) {
  try {
    const middleware = await getPaywalledMiddleware();

    // Create mock Express-like objects for the middleware
    const resData: any = {};
    const res = {
      json: (data: any) => (resData.body = data),
      status: (code: number) => {
        resData.status = code;
        return res;
      },
      setHeader: () => {},
    };

    // Run the paywall middleware
    let done = false;
    await new Promise<void>((resolve) => {
      middleware(req as any, res as any, () => {
        done = true;
        resolve();
      });
    });

    // If middleware didn’t block the request, return premium data
    if (done) {
      return NextResponse.json({ data: "premium content" });
    }

    // If middleware blocked it (payment required)
    return NextResponse.json(resData.body || { error: "Payment required" }, {
      status: resData.status || 402,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
      }
    );
  }
}
