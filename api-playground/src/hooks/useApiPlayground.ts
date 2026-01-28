import { useState, useCallback } from 'react';
import { 
  HttpMethod, 
  ApiRequest, 
  ApiResponse, 
  HistoryItem, 
  RequestHeader, 
  RequestParam,
  RequestStatus,
  WalletState,
  PaymentDetails,
  TransactionStatus
} from '@/types/api';

const DEMO_URL = 'https://api.x402.dev/demo/protected';
const DEMO_BODY = JSON.stringify({
  message: "Hello, x402!",
  timestamp: new Date().toISOString()
}, null, 2);

export function useApiPlayground() {
  // Request state
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<RequestHeader[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('{\n  \n}');
  const [params, setParams] = useState<RequestParam[]>([]);

  // Response state
  const [response, setResponse] = useState<ApiResponse | undefined>();
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | undefined>();

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({ connected: false });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ status: 'idle' });

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Send request
  const sendRequest = useCallback(async () => {
    if (!url.trim()) return;

    const requestId = generateId();
    const startTime = Date.now();

    // Build URL with params
    let finalUrl = url;
    const enabledParams = params.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const searchParams = new URLSearchParams();
      enabledParams.forEach(p => searchParams.append(p.key, p.value));
      finalUrl += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }

    // Build headers
    const requestHeaders: Record<string, string> = {};
    headers.filter(h => h.enabled && h.key).forEach(h => {
      requestHeaders[h.key] = h.value;
    });

    const request: ApiRequest = {
      id: requestId,
      method,
      url: finalUrl,
      headers,
      body,
      params,
      timestamp: new Date(),
    };

    // Add to history as loading
    const historyItem: HistoryItem = {
      id: requestId,
      request,
      status: 'loading',
      timestamp: new Date(),
    };
    setHistory(prev => [historyItem, ...prev]);
    setStatus('loading');
    setResponse(undefined);
    setPaymentDetails(undefined);

    try {
      // Simulate API call (in real implementation, this would be a fetch call)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Simulate different responses based on URL
      const isDemo = url.includes('demo') || url.includes('x402');
      const simulate402 = isDemo || Math.random() > 0.7;

      let mockResponse: ApiResponse;

      if (simulate402) {
        mockResponse = {
          status: 402,
          statusText: 'Payment Required',
          headers: {
            'content-type': 'application/json',
            'x-payment-required': 'true',
            'x-payment-amount': '0.001',
            'x-payment-token': 'SOL',
            'x-payment-recipient': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          },
          body: JSON.stringify({
            error: 'Payment Required',
            message: 'This endpoint requires a payment to access',
            payment: {
              amount: '0.001',
              token: 'SOL',
              recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
              network: 'Solana Mainnet',
              memo: 'x402-api-access',
            }
          }, null, 2),
          time: Date.now() - startTime,
          size: 342,
        };

        setPaymentDetails({
          amount: '0.001',
          token: 'SOL',
          recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          network: 'Solana Mainnet',
          memo: 'x402-api-access',
        });
        setStatus('payment_required');
      } else {
        mockResponse = {
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/json',
            'x-request-id': generateId(),
          },
          body: JSON.stringify({
            success: true,
            data: {
              message: 'Request processed successfully',
              timestamp: new Date().toISOString(),
            }
          }, null, 2),
          time: Date.now() - startTime,
          size: 156,
        };
        setStatus('success');
      }

      setResponse(mockResponse);
      setHistory(prev => prev.map(h => 
        h.id === requestId 
          ? { ...h, response: mockResponse, status: simulate402 ? 'payment_required' : 'success' }
          : h
      ));

    } catch (error) {
      const errorResponse: ApiResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: JSON.stringify({ error: 'Request failed' }, null, 2),
        time: Date.now() - startTime,
        size: 28,
      };
      setResponse(errorResponse);
      setStatus('error');
      setHistory(prev => prev.map(h => 
        h.id === requestId ? { ...h, response: errorResponse, status: 'error' } : h
      ));
    }
  }, [method, url, headers, body, params]);

  // Try demo
  const tryDemo = useCallback(() => {
    setUrl(DEMO_URL);
    setMethod('POST');
    setBody(DEMO_BODY);
    setHeaders([
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'X-API-Version', value: '2024-01', enabled: true },
    ]);
  }, []);

  // Select history item
  const selectHistoryItem = useCallback((item: HistoryItem) => {
    setSelectedHistoryId(item.id);
    setMethod(item.request.method);
    setUrl(item.request.url);
    setHeaders(item.request.headers);
    setBody(item.request.body);
    setParams(item.request.params);
    setResponse(item.response);
    setStatus(item.status);
    setIsSidebarOpen(false);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedHistoryId(undefined);
  }, []);

  // Connect wallet (simulated)
  const connectWallet = useCallback(() => {
    // Simulate wallet connection
    setTimeout(() => {
      setWallet({
        connected: true,
        address: '7xKX...AsU',
        balance: '2.45 SOL',
        network: 'Solana Mainnet',
      });
    }, 500);
  }, []);

  // Pay (simulated)
  const pay = useCallback(() => {
    setTransactionStatus({ status: 'pending' });
    
    // Simulate transaction
    setTimeout(() => {
      setTransactionStatus({
        status: 'confirmed',
        hash: '5UxM...k9Ej',
      });
    }, 2000);
  }, []);

  // Retry after payment
  const retryAfterPayment = useCallback(() => {
    setIsPaymentModalOpen(false);
    setTransactionStatus({ status: 'idle' });
    
    // Simulate successful response after payment
    setTimeout(() => {
      const successResponse: ApiResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-payment-verified': 'true',
        },
        body: JSON.stringify({
          success: true,
          message: 'Payment verified! Access granted.',
          data: {
            premium: true,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          }
        }, null, 2),
        time: 234,
        size: 178,
      };
      setResponse(successResponse);
      setStatus('success');
      setPaymentDetails(undefined);
    }, 500);
  }, []);

  return {
    // Request state
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

    // Response state
    response,
    status,
    paymentDetails,

    // History
    history,
    selectedHistoryId,
    selectHistoryItem,
    clearHistory,

    // Wallet
    wallet,
    transactionStatus,
    connectWallet,
    pay,
    retryAfterPayment,

    // Actions
    sendRequest,
    tryDemo,

    // UI state
    isSidebarOpen,
    setIsSidebarOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  };
}
