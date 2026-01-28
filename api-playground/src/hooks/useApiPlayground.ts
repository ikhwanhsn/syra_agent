import { useState, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletContext } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
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
import {
  parseX402Response,
  getBestPaymentOption,
  extractPaymentDetails,
  executePayment,
  X402Response,
  X402PaymentOption,
} from '@/lib/x402Client';

// Default API base URL - can be configured via environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.syraa.fun';

// Proxy URL for avoiding CORS issues in development
const PROXY_BASE_URL = '/api/proxy/';

// Check if we should use proxy (in development or when explicitly enabled)
const USE_PROXY = import.meta.env.DEV || import.meta.env.VITE_USE_PROXY === 'true';

// Helper function to get the proxied URL
const getProxiedUrl = (url: string): string => {
  if (!USE_PROXY) return url;
  // Don't proxy relative URLs or already proxied URLs
  if (url.startsWith('/') || url.startsWith(PROXY_BASE_URL)) return url;
  return `${PROXY_BASE_URL}${encodeURIComponent(url)}`;
};

// Demo endpoints for trying the API
const DEMO_ENDPOINTS = {
  GET: `${API_BASE_URL}/trending-headline`,
  POST: `${API_BASE_URL}/signal`,
};

const DEMO_BODY = JSON.stringify({
  token: "SOL",
  interval: "1h"
}, null, 2);

// x402 only supports GET and POST methods
const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST'];

export function useApiPlayground() {
  const { connection } = useConnection();
  const walletContext = useWalletContext();
  
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
  const [x402Response, setX402Response] = useState<X402Response | undefined>();
  const [paymentOption, setPaymentOption] = useState<X402PaymentOption | undefined>();

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  // Transaction state
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ status: 'idle' });

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Map wallet context to WalletState interface
  const wallet: WalletState = {
    connected: walletContext.connected,
    address: walletContext.shortAddress || undefined,
    balance: walletContext.usdcBalance !== null 
      ? `${walletContext.usdcBalance.toFixed(2)} USDC` 
      : undefined,
    network: walletContext.network,
  };

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      await walletContext.connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [walletContext]);

  // Send request
  const sendRequest = useCallback(async (paymentHeader?: string) => {
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

    // Add payment header if provided (for retry after payment)
    if (paymentHeader) {
      requestHeaders['X-Payment'] = paymentHeader;
    }

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
    setX402Response(undefined);
    setPaymentOption(undefined);

    try {
      // Make the actual API request
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };

      // Add body for POST requests
      if (method === 'POST' && body.trim()) {
        fetchOptions.body = body;
      }

      // Use proxy for external URLs to avoid CORS issues
      const proxiedUrl = getProxiedUrl(finalUrl);
      const fetchResponse = await fetch(proxiedUrl, fetchOptions);
      
      // Get response body
      const responseText = await fetchResponse.text();
      let responseBody = responseText;
      
      // Try to parse as JSON for formatting
      try {
        const jsonData = JSON.parse(responseText);
        responseBody = JSON.stringify(jsonData, null, 2);
      } catch {
        // Keep as plain text if not JSON
      }

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      fetchResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const apiResponse: ApiResponse = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Date.now() - startTime,
        size: new TextEncoder().encode(responseText).length,
      };

      setResponse(apiResponse);

      // Check if 402 Payment Required
      if (fetchResponse.status === 402) {
        console.log('='.repeat(60));
        console.log('[402] Payment Required response received');
        console.log('[402] Raw response text:', responseText);
        console.log('='.repeat(60));
        
        let parsed = null;
        let details = null;
        let jsonData: any = null;
        
        // Try to parse response as JSON
        try {
          jsonData = JSON.parse(responseText);
          console.log('[402] Parsed JSON:', JSON.stringify(jsonData, null, 2));
          console.log('[402] x402Version:', jsonData.x402Version);
          console.log('[402] accepts:', jsonData.accepts);
          if (jsonData.accepts && jsonData.accepts[0]) {
            console.log('[402] First accept option:');
            console.log('  - scheme:', jsonData.accepts[0].scheme);
            console.log('  - network:', jsonData.accepts[0].network);
            console.log('  - amount:', jsonData.accepts[0].amount);
            console.log('  - payTo:', jsonData.accepts[0].payTo);
            console.log('  - asset:', jsonData.accepts[0].asset);
          }
        } catch (e) {
          console.log('[402] Response is not valid JSON:', e);
        }
        
        // Try to parse as x402 protocol
        if (jsonData) {
          try {
            parsed = parseX402Response(jsonData, responseHeaders);
            console.log('[402] parseX402Response result:', parsed);
            
            if (parsed) {
              setX402Response(parsed);
              const option = getBestPaymentOption(parsed);
              console.log('[402] getBestPaymentOption result:', option);
              setPaymentOption(option || undefined);
              
              details = extractPaymentDetails(parsed);
              console.log('[402] extractPaymentDetails result:', details);
            } else {
              console.log('[402] parseX402Response returned null!');
            }
          } catch (e) {
            console.error('[402] Error in x402 parsing:', e);
          }
        }
        
        // Always set status to payment_required for 402
        setStatus('payment_required');
        setHistory(prev => prev.map(h => 
          h.id === requestId ? { ...h, response: apiResponse, status: 'payment_required' } : h
        ));
        
        // Try to build payment details from various sources if not already extracted
        if (!details && jsonData) {
          console.log('[402] Attempting to build generic payment details...');
          
          // Check if we have accepts array directly
          if (jsonData.accepts && Array.isArray(jsonData.accepts) && jsonData.accepts.length > 0) {
            const accept = jsonData.accepts[0];
            console.log('[402] Building from accepts[0]:', accept);
            
            // Format amount (convert from micro-units if needed)
            let formattedAmount = accept.amount || '0';
            if (formattedAmount && parseInt(formattedAmount) > 10000) {
              // Likely micro-units, convert to human readable
              const microUnits = BigInt(formattedAmount);
              const divisor = BigInt(1000000);
              const intPart = microUnits / divisor;
              const decPart = microUnits % divisor;
              formattedAmount = decPart === BigInt(0) 
                ? intPart.toString() 
                : `${intPart}.${decPart.toString().padStart(6, '0').replace(/0+$/, '')}`;
            }
            
            details = {
              amount: formattedAmount,
              token: accept.asset === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : (accept.asset || 'USDC'),
              recipient: accept.payTo || '',
              network: accept.network?.includes('devnet') ? 'Solana Devnet' : 'Solana Mainnet',
              memo: accept.extra?.memo,
            };
            console.log('[402] Built payment details from accepts:', details);
          } else {
            // Fallback to generic field names
            const genericDetails: PaymentDetails = {
              amount: String(jsonData.amount || jsonData.price || jsonData.cost || '0'),
              token: jsonData.token || jsonData.asset || jsonData.currency || 'USDC',
              recipient: jsonData.payTo || jsonData.address || jsonData.recipient || jsonData.wallet || '',
              network: jsonData.network || jsonData.chain || 'Solana',
              memo: jsonData.memo || jsonData.description || jsonData.message,
            };
            console.log('[402] Built generic payment details:', genericDetails);
            
            if (genericDetails.recipient || genericDetails.amount !== '0') {
              details = genericDetails;
            }
          }
        }
        
        // Set payment details (or null if none found)
        if (details) {
          console.log('[402] Setting payment details:', details);
          setPaymentDetails(details);
          toast({
            title: "Payment Required",
            description: `This API requires ${details.amount} ${details.token} to access.`,
          });
        } else {
          console.log('[402] No payment details could be extracted!');
          toast({
            title: "Payment Required (402)",
            description: "This API requires payment. Check the response body for payment details.",
          });
        }
        
        // ALWAYS open the payment modal for 402 responses
        setIsPaymentModalOpen(true);
        console.log('[402] Payment modal opened');
        console.log('='.repeat(60));
        
      } else if (fetchResponse.ok) {
        setStatus('success');
        setHistory(prev => prev.map(h => 
          h.id === requestId ? { ...h, response: apiResponse, status: 'success' } : h
        ));
      } else {
        setStatus('error');
        setHistory(prev => prev.map(h => 
          h.id === requestId ? { ...h, response: apiResponse, status: 'error' } : h
        ));
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError');
      
      const errorResponse: ApiResponse = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: JSON.stringify({ 
          error: 'Request failed', 
          message: errorMessage,
          hint: isNetworkError 
            ? 'This may be a CORS issue, network connectivity problem, or the server may be unreachable. Make sure the API URL is correct and the server is running.'
            : undefined
        }, null, 2),
        time: Date.now() - startTime,
        size: 0,
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
    setUrl(DEMO_ENDPOINTS.POST);
    setMethod('POST');
    setBody(DEMO_BODY);
    setHeaders([
      { key: 'Content-Type', value: 'application/json', enabled: true },
    ]);
    setParams([]);
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

  // Execute payment and auto-retry
  const pay = useCallback(async () => {
    if (!walletContext.connected || !walletContext.publicKey || !paymentOption) {
      console.error('Wallet not connected or no payment option');
      return;
    }

    setTransactionStatus({ status: 'pending' });

    try {
      const result = await executePayment(
        {
          connection,
          publicKey: walletContext.publicKey,
          signTransaction: walletContext.signTransaction,
        },
        paymentOption
      );

      if (result.success && result.signature && result.paymentHeader) {
        setTransactionStatus({
          status: 'confirmed',
          hash: result.signature,
        });

        // Store payment header for retry
        localStorage.setItem('x402_payment_header', result.paymentHeader);
        
        // Auto-retry the request after a short delay to show success state
        setTimeout(async () => {
          setIsPaymentModalOpen(false);
          setTransactionStatus({ status: 'idle' });
          
          // Retry the request with payment header
          await sendRequest(result.paymentHeader);
          
          // Clear stored payment header
          localStorage.removeItem('x402_payment_header');
          
          // Show success toast
          toast({
            title: "Payment Successful",
            description: "API data has been fetched successfully!",
          });
        }, 1500); // Show success for 1.5 seconds before retrying
      } else {
        setTransactionStatus({
          status: 'failed',
          error: result.error || 'Payment failed',
        });
        
        toast({
          title: "Payment Failed",
          description: result.error || 'Transaction was not completed.',
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setTransactionStatus({
        status: 'failed',
        error: error.message || 'Payment execution failed',
      });
      
      toast({
        title: "Payment Error",
        description: error.message || 'An unexpected error occurred.',
        variant: "destructive",
      });
    }
  }, [walletContext, paymentOption, connection, sendRequest]);

  // Retry after payment
  const retryAfterPayment = useCallback(async () => {
    setIsPaymentModalOpen(false);
    
    const paymentHeader = localStorage.getItem('x402_payment_header');
    if (paymentHeader) {
      // Reset transaction status
      setTransactionStatus({ status: 'idle' });
      
      // Retry the request with payment header
      await sendRequest(paymentHeader);
      
      // Clear stored payment header
      localStorage.removeItem('x402_payment_header');
    }
  }, [sendRequest]);

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
    sendRequest: () => sendRequest(),
    tryDemo,

    // UI state
    isSidebarOpen,
    setIsSidebarOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  };
}
