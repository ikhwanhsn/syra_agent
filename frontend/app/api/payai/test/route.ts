import { NextRequest, NextResponse } from "next/server";
import { X402PaymentHandler } from "x402-solana/server";

const x402 = new X402PaymentHandler({
  network: "solana-devnet",
  treasuryAddress: process.env.TREASURY_ADDRESS!,
  facilitatorUrl: "https://facilitator.payai.network",
});

export async function POST(req: NextRequest) {
  // 1. Extract payment header
  const paymentHeader = x402.extractPayment(req.headers);

  // 2. Create payment requirements using x402 RouteConfig format
  const paymentRequirements = await x402.createPaymentRequirements({
    price: {
      amount: "250", // $2.50 USDC (in micro-units, as string)
      asset: {
        address: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet mint address
        decimals: 6, // USDC has 6 decimals
      },
    },
    network: "solana-devnet",
    config: {
      description: "AI Chat Request",
      resource: `https://syraa.fun/api/signal/list`,
    },
  });

  if (!paymentHeader) {
    // Return 402 with payment requirements
    const response = x402.create402Response(paymentRequirements);
    return NextResponse.json(response.body, { status: response.status });
  }

  // 3. Verify payment
  const verified = await x402.verifyPayment(paymentHeader, paymentRequirements);
  if (!verified) {
    return NextResponse.json({ error: "Invalid payment" }, { status: 402 });
  }

  // 4. Process your business logic
  const result = {
    message: "Payment verified and processed successfully",
  };

  // 5. Settle payment
  await x402.settlePayment(paymentHeader, paymentRequirements);

  // 6. Return response
  return NextResponse.json(result);
}
