import React from "react";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Wallet,
  Server,
  Shield,
  Coins,
} from "lucide-react";

export default function X402FlowDiagram() {
  return (
    // Main container: Reduced padding on mobile (p-4) and added a smaller bottom margin (mb-12).
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 bg-black text-white rounded-2xl mb-12">
      {/* Header: Reduced font sizes and bottom margin on mobile */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3 text-white">
          X402 Payment Protocol Flow
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">
          Trading Signal Creation with Solana Payment
        </p>
      </div>

      {/* Step 1: Payment Quote Request */}
      {/* Step Block: Reduced padding (p-4) and item gap (gap-3) on mobile */}
      <div className="mb-6 sm:mb-8 bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Number Circle: Made smaller on mobile (w-10 h-10) */}
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
            1
          </div>
          <div className="flex-1 min-w-0">
            {/* Step Title: Reduced font size on mobile */}
            <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5 flex-shrink-0" />
              <span className="truncate sm:truncate-none">
                Client Requests Payment Quote
              </span>
            </h3>
            <div className="bg-black rounded-lg p-3 sm:p-4 mb-3">
              <code className="text-sm text-green-400 break-words">
                GET /api/signal/create
              </code>
            </div>
            <p className="text-gray-400 mb-3 text-sm sm:text-base">
              User clicks "Submit" → Client sends GET request without payment
            </p>
            {/* Code Block: overflow-x-auto is already good for responsiveness */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-300">
                Server Response (402 Payment Required):
              </p>
              <pre className="text-xs mt-2 text-gray-400 overflow-x-auto">
                {`{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "solana-devnet",
    "maxAmountRequired": "100",
    "asset": "USDC_MINT_ADDRESS",
    "payTo": "TOKEN_ACCOUNT",
    "extra": {
      "recipientWallet": "SERVER_WALLET"
    }
  }]
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow: Reduced vertical margin on mobile */}
      <div className="flex justify-center my-6 sm:my-8">
        <ArrowRight className="w-8 h-8 text-blue-500" />
      </div>

      {/* Step 2: Build Transaction */}
      <div className="mb-6 sm:mb-8 bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
            2
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Coins className="w-5 h-5 flex-shrink-0" />
              <span>Client Builds USDC Transfer</span>
            </h3>
            <div className="space-y-3">
              <div className="bg-black rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-300 mb-1">
                  ✓ Get token accounts
                </p>
                <p className="text-xs text-gray-500">
                  Derive sender & recipient token accounts
                </p>
              </div>
              <div className="bg-black rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-300 mb-1">
                  ✓ Check balances
                </p>
                <p className="text-xs text-gray-500">
                  Verify user has sufficient USDC (0.0001 USDC)
                </p>
              </div>
              <div className="bg-black rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-300 mb-1">
                  ✓ Create transfer instruction
                </p>
                <p className="text-xs text-gray-500">
                  SPL Token transfer from user → server
                </p>
              </div>
              <div className="bg-black rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-300 mb-1">
                  ✓ Simulate transaction
                </p>
                <p className="text-xs text-gray-500">
                  Test locally before asking user to sign
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-6 sm:my-8">
        <ArrowRight className="w-8 h-8 text-blue-500" />
      </div>

      {/* Step 3: User Signs */}
      <div className="mb-6 sm:mb-8 bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
            3
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>User Signs Transaction</span>
            </h3>
            <div className="bg-black rounded-lg p-3 sm:p-4">
              <p className="text-gray-400 mb-2 text-sm sm:text-base">
                Wallet popup appears → User approves USDC transfer
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded p-2">
                <p className="text-sm text-gray-300">
                  ✓ Transaction signed by user's wallet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-6 sm:my-8">
        <ArrowRight className="w-8 h-8 text-blue-500" />
      </div>

      {/* Step 4: Send with Payment Proof */}
      <div className="mb-6 sm:mb-8 bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
            4
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 flex-shrink-0" />
              <span>Client Sends Payment Proof</span>
            </h3>
            <div className="bg-black rounded-lg p-3 sm:p-4 mb-3">
              <code className="text-sm text-orange-400 break-words">
                POST /api/signal/create
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Headers: X-Payment (base64 encoded)
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-300 mb-2">
                X-Payment Header Content:
              </p>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {`{
  "x402Version": 1,
  "scheme": "exact",
  "network": "solana-devnet",
  "payer": "USER_WALLET_ADDRESS",
  "payload": {
    "serializedTransaction": "BASE64_TX"
  }
}`}
              </pre>
            </div>
            <div className="mt-3 bg-black rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-300 mb-1">
                Request Body:
              </p>
              <p className="text-xs text-gray-500">
                Signal data (ticker, entry, stop loss, take profit)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-6 sm:my-8">
        <ArrowRight className="w-8 h-8 text-blue-500" />
      </div>

      {/* Step 5: Server Verification */}
      <div className="mb-6 sm:mb-8 bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
            5
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>Server Verifies Payment</span>
            </h3>
            <div className="space-y-3">
              {[
                {
                  num: 1,
                  title: "Deserialize transaction",
                  desc: "Parse signed transaction from base64",
                },
                {
                  num: 2,
                  title: "Verify signature exists",
                  desc: "Check transaction is signed by user",
                },
                {
                  num: 3,
                  title: "Validate USDC transfer",
                  desc: "Verify destination = server & amount ≥ 100",
                },
                {
                  num: 4,
                  title: "Simulate transaction",
                  desc: "Test if transaction will succeed on-chain",
                },
                {
                  num: 5,
                  title: "Submit to blockchain",
                  desc: "Send raw transaction to Solana",
                },
                {
                  num: 6,
                  title: "Wait for confirmation",
                  desc: "Confirm transaction on-chain",
                },
                {
                  num: 7,
                  title: "Verify actual balance change",
                  desc: "Check server received correct USDC amount",
                },
              ].map((item) => (
                <div className="bg-black rounded-lg p-3" key={item.num}>
                  <p className="text-sm font-semibold text-gray-300 mb-1">
                    {item.num}. {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-6 sm:my-8">
        <ArrowRight className="w-8 h-8 text-blue-500" />
      </div>

      {/* Step 6: Success Response */}
      <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl">
            6
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Server Creates Signal & Returns Success</span>
            </h3>
            <div className="bg-black rounded-lg p-3 sm:p-4 mb-3">
              <p className="text-gray-400 mb-2 text-sm sm:text-base">
                ✓ Payment verified → Signal saved to MongoDB
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-300 mb-2">
                Success Response (200):
              </p>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {`{
  "success": true,
  "message": "Signal created successfully!",
  "signal": {
    "wallet": "USER_WALLET",
    "signal": "Buy",
    "ticker": "BTC",
    "entryPrice": 50000,
    "status": "Pending",
    "paymentSignature": "TX_SIGNATURE",
    "paidAmount": 0.0001
  },
  "paymentDetails": {
    "signature": "TX_SIGNATURE",
    "explorerUrl": "https://explorer.solana.com/tx/..."
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits Section: This was already well-structured and responsive! */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />
          <h4 className="font-semibold mb-1">Secure</h4>
          <p className="text-sm text-gray-400">
            Server verifies payment on-chain before creating signal
          </p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <Shield className="w-8 h-8 text-blue-500 mb-2" />
          <h4 className="font-semibold mb-1">Transparent</h4>
          <p className="text-sm text-gray-400">
            All payments are verifiable on Solana blockchain
          </p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <Coins className="w-8 h-8 text-blue-500 mb-2" />
          <h4 className="font-semibold mb-1">Atomic</h4>
          <p className="text-sm text-gray-400">
            Payment and signal creation happen together
          </p>
        </div>
      </div>

      {/* Footer: Adjusted text size for very small screens */}
      <div className="mt-12 text-center text-gray-500 text-xs sm:text-sm">
        <p>
          X402 Protocol: HTTP 402 Payment Required standard for Web3 payments
        </p>
        <p className="mt-2">
          Network: Solana Devnet • Token: USDC • Price: 0.0001 USDC per signal
        </p>
      </div>
    </div>
  );
}
