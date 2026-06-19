import { useMemo } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { UnsupportedApiModal } from "@/components/UnsupportedApiModal";
import { V1UnsupportedModal } from "@/components/V1UnsupportedModal";
import { usePlaygroundSession } from "@/contexts/PlaygroundSessionContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { resolvePlaygroundPaymentLane } from "@/lib/paymentLane";
import { createEmptyPaymentOptionsByChain } from "@/lib/x402Client";
import type { PaymentDetails } from "@/types/api";

const DEFAULT_PAYMENT_DETAILS: PaymentDetails = {
  amount: "0",
  token: "USDC",
  recipient: "Unknown",
  network: "Solana",
};

export function PlaygroundModals() {
  const { openConnectModal } = useConnectModal();
  const {
    url,
    response,
    status,
    paymentDetails,
    wallet,
    transactionStatus,
    pay,
    retryAfterPayment,
    connectWallet,
    paymentOptionsByChain,
    selectedPaymentChain,
    selectPaymentChain,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isUnsupportedApiModalOpen,
    setIsUnsupportedApiModalOpen,
    isV1UnsupportedModalOpen,
    setIsV1UnsupportedModalOpen,
  } = usePlaygroundSession();

  const paymentLane = useMemo(() => {
    try {
      if (typeof resolvePlaygroundPaymentLane === "function") {
        return resolvePlaygroundPaymentLane(url, response);
      }
    } catch {
      // ignore
    }
    return "x402" as const;
  }, [url, response]);

  const paymentOptionsByChainForLane = useMemo(() => {
    if (paymentLane !== "mpp") return paymentOptionsByChain;
    const filtered = createEmptyPaymentOptionsByChain();
    filtered.solana = paymentOptionsByChain.solana;
    filtered.binance = paymentOptionsByChain.binance;
    return filtered;
  }, [paymentLane, paymentOptionsByChain]);

  const effectivePaymentDetails =
    paymentDetails || (status === "payment_required" ? DEFAULT_PAYMENT_DETAILS : undefined);

  return (
    <>
      {effectivePaymentDetails ? (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          paymentDetails={effectivePaymentDetails}
          wallet={wallet}
          transactionStatus={transactionStatus}
          onOpenConnectModal={(chain) => {
            if (chain && chain !== 'solana') {
              void connectWallet(chain);
            } else {
              openConnectModal();
            }
          }}
          onPay={pay}
          onRetry={retryAfterPayment}
          paymentOptionsByChain={paymentOptionsByChainForLane}
          selectedPaymentChain={selectedPaymentChain}
          onSelectPaymentChain={selectPaymentChain}
        />
      ) : null}
      <UnsupportedApiModal
        isOpen={isUnsupportedApiModalOpen}
        onClose={() => setIsUnsupportedApiModalOpen(false)}
      />
      <V1UnsupportedModal
        isOpen={isV1UnsupportedModalOpen}
        onClose={() => setIsV1UnsupportedModalOpen(false)}
      />
    </>
  );
}
