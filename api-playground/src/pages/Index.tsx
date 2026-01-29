import { TopBar } from '@/components/TopBar';
import { HistoryPanel } from '@/components/HistoryPanel';
import { RequestBuilder } from '@/components/RequestBuilder';
import { ResponseViewer } from '@/components/ResponseViewer';
import { PaymentModal } from '@/components/PaymentModal';
import { useApiPlayground } from '@/hooks/useApiPlayground';
import { PaymentDetails } from '@/types/api';

// Default payment details when we can't parse x402 response
const DEFAULT_PAYMENT_DETAILS: PaymentDetails = {
  amount: '0',
  token: 'USDC',
  recipient: 'Unknown',
  network: 'Solana',
};

const Index = () => {
  const {
    method,
    setMethod,
    url,
    setUrl,
    headers,
    setHeaders,
    body,
    setBody,
    params,
    setParams,
    response,
    status,
    paymentDetails,
    history,
    selectedHistoryId,
    selectHistoryItem,
    clearHistory,
    wallet,
    transactionStatus,
    connectWallet,
    pay,
    retryAfterPayment,
    sendRequest,
    tryDemo,
    isSidebarOpen,
    setIsSidebarOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  } = useApiPlayground();

  // Use actual payment details or default for 402 responses
  const effectivePaymentDetails = paymentDetails || (status === 'payment_required' ? DEFAULT_PAYMENT_DETAILS : undefined);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <TopBar
        wallet={wallet}
        onConnectWallet={connectWallet}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* History Panel */}
        <HistoryPanel
          history={history}
          selectedId={selectedHistoryId}
          onSelect={selectHistoryItem}
          onClear={clearHistory}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Panels */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Request Builder */}
          <div className="flex-1 min-w-0 p-4 lg:p-5 overflow-hidden border-b lg:border-b-0 lg:border-r border-border/50">
            <div className="glass-panel h-full p-5 overflow-hidden flex flex-col rounded-xl">
              <RequestBuilder
                method={method}
                url={url}
                headers={headers}
                body={body}
                params={params}
                isLoading={status === 'loading'}
                wallet={wallet}
                onMethodChange={setMethod}
                onUrlChange={setUrl}
                onHeadersChange={setHeaders}
                onBodyChange={setBody}
                onParamsChange={setParams}
                onSend={sendRequest}
                onTryDemo={tryDemo}
              />
            </div>
          </div>

          {/* Response Viewer */}
          <div className="flex-1 min-w-0 p-4 lg:p-5 overflow-hidden">
            <div className="glass-panel h-full p-5 overflow-hidden flex flex-col rounded-xl">
              <ResponseViewer
                response={response}
                status={status}
                paymentDetails={effectivePaymentDetails}
                onPayAndRetry={() => setIsPaymentModalOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - Show for any 402 response */}
      {effectivePaymentDetails && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          paymentDetails={effectivePaymentDetails}
          wallet={wallet}
          transactionStatus={transactionStatus}
          onConnectWallet={connectWallet}
          onPay={pay}
          onRetry={retryAfterPayment}
        />
      )}
    </div>
  );
};

export default Index;
