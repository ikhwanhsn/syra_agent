import { useState, useCallback, useEffect, useRef } from 'react';
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

// localStorage key for history
const HISTORY_STORAGE_KEY = 'x402_api_playground_history';

// Helper functions for localStorage serialization/deserialization
function loadHistoryFromStorage(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      request: {
        ...item.request,
        timestamp: new Date(item.request.timestamp),
      },
    }));
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
}

function saveHistoryToStorage(history: HistoryItem[]): void {
  try {
    // Limit history to last 100 items to prevent localStorage bloat
    const limitedHistory = history.slice(0, 100);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
}

// Auto-detect query parameters from URL
function parseUrlParams(url: string): RequestParam[] {
  try {
    const urlObj = new URL(url);
    const params: RequestParam[] = [];
    
    urlObj.searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        enabled: true,
      });
    });
    
    return params;
  } catch {
    // If URL parsing fails, try manual parsing
    try {
      const queryString = url.split('?')[1];
      if (!queryString) return [];
      
      const params: RequestParam[] = [];
      const pairs = queryString.split('&');
      
      pairs.forEach(pair => {
        const [key, value = ''] = pair.split('=').map(decodeURIComponent);
        if (key) {
          params.push({
            key,
            value,
            enabled: true,
          });
        }
      });
      
      return params;
    } catch {
      return [];
    }
  }
}

// Auto-detect common headers based on URL patterns
function detectHeadersFromUrl(url: string): RequestHeader[] {
  const headers: RequestHeader[] = [];
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Detect API key patterns in URL
    const apiKeyPatterns = [
      /[?&](api[_-]?key|apikey|key|token|access[_-]?token|auth[_-]?token)=([^&]+)/i,
      /[?&](bearer|token|auth)=([^&]+)/i,
    ];
    
    for (const pattern of apiKeyPatterns) {
      const match = url.match(pattern);
      if (match) {
        const [, keyName, value] = match;
        // Don't add if it's already in query params (we'll handle it there)
        // But we can add Authorization header if it looks like a token
        if (value && value.length > 20 && !keyName.toLowerCase().includes('key')) {
          headers.push({
            key: 'Authorization',
            value: value.startsWith('Bearer ') ? value : `Bearer ${value}`,
            enabled: true,
          });
        }
      }
    }
    
    // Detect common API endpoints and suggest headers
    if (hostname.includes('api.') || hostname.includes('api-')) {
      // Common API headers
      if (!headers.find(h => h.key.toLowerCase() === 'accept')) {
        headers.push({
          key: 'Accept',
          value: 'application/json',
          enabled: true,
        });
      }
    }
    
    // Detect GitHub API
    if (hostname.includes('api.github.com')) {
      headers.push({
        key: 'Accept',
        value: 'application/vnd.github.v3+json',
        enabled: true,
      });
    }
    
    // Detect Stripe API
    if (hostname.includes('api.stripe.com')) {
      headers.push({
        key: 'Accept',
        value: 'application/json',
        enabled: true,
      });
    }
    
  } catch {
    // URL parsing failed, skip header detection
  }
  
  return headers;
}

// Extract base URL without query parameters
function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    // Fallback: remove query string manually
    return url.split('?')[0];
  }
}

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

  // History state - load from localStorage on mount
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistoryFromStorage());
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>();

  // Save history to localStorage whenever it changes
  useEffect(() => {
    saveHistoryToStorage(history);
  }, [history]);

  // Track last processed URL to avoid reprocessing
  const lastProcessedUrlRef = useRef<string>('');
  const autoDetectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  
  // Track cloned request ID to update it when user makes changes
  const clonedRequestIdRef = useRef<string | null>(null);
  
  // Track new request ID to update it when user makes changes
  const newRequestIdRef = useRef<string | null>(null);

  // Extract params from 402 response extensions
  const extractParamsFrom402Response = useCallback((x402Resp: X402Response): RequestParam[] => {
    const params: RequestParam[] = [];
    
    try {
      const schema = x402Resp.extensions?.bazaar?.schema;
      const exampleInput = x402Resp.extensions?.bazaar?.info?.input;
      
      if (schema?.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          // Use example value from info.input if available, otherwise empty string
          const exampleValue = exampleInput?.[key];
          const defaultValue = exampleValue !== undefined 
            ? String(exampleValue) 
            : '';
          
          params.push({
            key,
            value: defaultValue,
            enabled: schema.required?.includes(key) || false, // Enable required params by default
          });
        });
      }
    } catch (error) {
      console.debug('Failed to extract params from 402 response:', error);
    }
    
    return params;
  }, []);

  // Track URL base to detect when it changes significantly
  const previousBaseUrlRef = useRef<string>('');

  // Auto-detect params and headers from 402 response
  useEffect(() => {
    // Clear any existing timeout
    if (autoDetectTimeoutRef.current) {
      clearTimeout(autoDetectTimeoutRef.current);
      setIsAutoDetecting(false);
    }

    if (!url.trim()) {
      setIsAutoDetecting(false);
      return;
    }

    // Get base URL to detect significant changes
    const currentBaseUrl = getBaseUrl(url);
    
    // If base URL changed significantly, clear previous params/headers
    if (previousBaseUrlRef.current && currentBaseUrl !== previousBaseUrlRef.current) {
      console.log('[Auto-detect] URL changed, clearing previous params/headers');
      // Clear params except those from URL query string
      setParams(currentParams => {
        // Keep params that came from URL query string (they have values)
        return currentParams.filter(p => {
          // If param has a value and was likely from URL, keep it
          // Otherwise clear it
          return false; // Clear all, URL params will be re-extracted if present
        });
      });
      
      // Reset headers to default (keep Content-Type)
      setHeaders(currentHeaders => {
        const contentTypeHeader = currentHeaders.find(h => 
          h.key.toLowerCase() === 'content-type'
        );
        return contentTypeHeader 
          ? [contentTypeHeader]
          : [{ key: 'Content-Type', value: 'application/json', enabled: true }];
      });
    }
    
    previousBaseUrlRef.current = currentBaseUrl;

    // Handle URL query params immediately (before 402 detection)
    try {
      const urlHasQueryParams = url.includes('?') && url.split('?')[1].includes('=');
      
      if (urlHasQueryParams) {
        const detectedParams = parseUrlParams(url);
        
        if (detectedParams.length > 0) {
          setParams(currentParams => {
            // Replace params with URL params
            const newBaseUrl = getBaseUrl(url);
            if (newBaseUrl !== url) {
              lastProcessedUrlRef.current = newBaseUrl;
              setTimeout(() => setUrl(newBaseUrl), 0);
            }
            return detectedParams;
          });
        }
      }
    } catch (error) {
      console.debug('URL param extraction failed:', error);
    }

    // Set loading state
    setIsAutoDetecting(true);

    // Wait 1 second after user stops typing, then make request to detect 402 response
    autoDetectTimeoutRef.current = setTimeout(async () => {
      const currentUrl = url.trim();
      if (!currentUrl) {
        setIsAutoDetecting(false);
        return;
      }

      // Get base URL (without query params)
      const baseUrl = getBaseUrl(currentUrl);
      
      // Check if this base URL has already been processed
      if (baseUrl === lastProcessedUrlRef.current) {
        setIsAutoDetecting(false);
        return;
      }

      // Mark as processed to avoid duplicate requests
      lastProcessedUrlRef.current = baseUrl;

      try {
        // Make a request to detect 402 response
        const fetchOptions: RequestInit = {
          method: method, // Use current method
          headers: {
            'Content-Type': 'application/json',
          },
        };

        // Use proxy if needed
        const proxiedUrl = getProxiedUrl(baseUrl);
        
        // Set timeout for the request (5 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const fetchResponse = await fetch(proxiedUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Handle different response statuses
        if (fetchResponse.status === 402) {
          // 402 Payment Required - extract params and headers
          const responseText = await fetchResponse.text();
          
          try {
            const jsonData = JSON.parse(responseText);
            const parsed = parseX402Response(jsonData);
            
            if (parsed) {
              console.log('[Auto-detect] Found 402 response, extracting params and headers');
              
              // Extract params from schema
              const detectedParams = extractParamsFrom402Response(parsed);
              
              if (detectedParams.length > 0) {
                setParams(currentParams => {
                  // Replace params if empty, otherwise merge new ones
                  if (currentParams.length === 0) {
                    return detectedParams;
                  }
                  // Merge new params that don't exist yet
                  const existingKeys = new Set(currentParams.map(p => p.key.toLowerCase()));
                  const newParams = detectedParams.filter(p => !existingKeys.has(p.key.toLowerCase()));
                  if (newParams.length > 0) {
                    return [...currentParams, ...newParams];
                  }
                  return currentParams;
                });
              }

              // Auto-detect headers based on 402 response
              setHeaders(currentHeaders => {
                const hasOnlyDefaultHeaders = currentHeaders.length === 1 && 
                  currentHeaders[0].key === 'Content-Type' && 
                  currentHeaders[0].value === 'application/json';
                
                if (hasOnlyDefaultHeaders) {
                  const detectedHeaders: RequestHeader[] = [];
                  
                  // Add Accept header if resource has mimeType
                  if (parsed.resource?.mimeType) {
                    detectedHeaders.push({
                      key: 'Accept',
                      value: parsed.resource.mimeType,
                      enabled: true,
                    });
                  }
                  
                  // Also detect headers from URL patterns
                  const urlHeaders = detectHeadersFromUrl(currentUrl);
                  detectedHeaders.push(...urlHeaders);
                  
                  // Merge detected headers (avoid duplicates)
                  if (detectedHeaders.length > 0) {
                    const existingKeys = new Set(currentHeaders.map(h => h.key.toLowerCase()));
                    const newHeaders = detectedHeaders.filter(h => !existingKeys.has(h.key.toLowerCase()));
                    
                    if (newHeaders.length > 0) {
                      return [...currentHeaders, ...newHeaders];
                    }
                  }
                }
                
                return currentHeaders;
              });
            }
          } catch (parseError) {
            console.debug('[Auto-detect] Failed to parse 402 response:', parseError);
          }
        } else if (fetchResponse.ok) {
          // API is available but doesn't require payment (200-299)
          console.log('[Auto-detect] API is available but does not require payment');
          // Don't modify params/headers for non-402 APIs
        } else if (fetchResponse.status >= 400 && fetchResponse.status < 500) {
          // Client error (400-499) - API exists but request is invalid
          console.log(`[Auto-detect] API returned ${fetchResponse.status} - API exists but request may be invalid`);
        } else if (fetchResponse.status >= 500) {
          // Server error (500+) - API exists but has issues
          console.log(`[Auto-detect] API returned ${fetchResponse.status} - Server error`);
        }
      } catch (error: any) {
        // Handle different error types
        if (error.name === 'AbortError') {
          console.debug('[Auto-detect] Request timeout - API may be slow or unavailable');
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          console.debug('[Auto-detect] Network error - API may be unavailable or CORS blocked');
        } else {
          console.debug('[Auto-detect] Request failed:', error.message || error);
        }
        // Silently fail - don't interrupt user input
      } finally {
        setIsAutoDetecting(false);
      }
    }, 1000); // 1 second delay

    // Cleanup timeout on unmount or URL change
    return () => {
      if (autoDetectTimeoutRef.current) {
        clearTimeout(autoDetectTimeoutRef.current);
      }
      setIsAutoDetecting(false);
    };
  }, [url, method, extractParamsFrom402Response]); // Run when URL or method changes

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

    // Use tracked request ID (cloned or new) if available, otherwise generate new one
    const requestId = clonedRequestIdRef.current || newRequestIdRef.current || generateId();
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

    // If this is a tracked request (cloned or new), update it instead of creating new
    const trackedId = clonedRequestIdRef.current || newRequestIdRef.current;
    if (trackedId && trackedId === requestId) {
      // Clear tracking after sending
      clonedRequestIdRef.current = null;
      newRequestIdRef.current = null;
      
      setHistory(prev => prev.map(h => {
        if (h.id === requestId) {
          return {
            ...h,
            request,
            status: 'loading',
            response: undefined,
          };
        }
        return h;
      }));
    } else {
      // Clear tracking if it was set but we're using a different ID
      clonedRequestIdRef.current = null;
      newRequestIdRef.current = null;
      
      // Add to history as loading
      const historyItem: HistoryItem = {
        id: requestId,
        request,
        status: 'loading',
        timestamp: new Date(),
      };
      setHistory(prev => [historyItem, ...prev]);
    }
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
    // Clear cloned and new request tracking when selecting an existing item
    clonedRequestIdRef.current = null;
    newRequestIdRef.current = null;
    
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

  // Create new request (reset form)
  const createNewRequest = useCallback(() => {
    // Clear cloned request tracking
    clonedRequestIdRef.current = null;
    
    // Generate new request ID for tracking
    const newId = generateId();
    newRequestIdRef.current = newId;
    
    setSelectedHistoryId(undefined);
    setMethod('POST');
    setUrl('');
    const defaultHeaders = [{ key: 'Content-Type', value: 'application/json', enabled: true }];
    setHeaders(defaultHeaders);
    const defaultBody = '{\n  \n}';
    setBody(defaultBody);
    setParams([]);
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);
    setIsSidebarOpen(false);
    
    // Create a new history item for the new request
    const newRequest: ApiRequest = {
      id: newId,
      method: 'POST',
      url: '',
      headers: defaultHeaders,
      body: defaultBody,
      params: [],
      timestamp: new Date(),
    };
    
    const newHistoryItem: HistoryItem = {
      id: newId,
      request: newRequest,
      status: 'idle',
      timestamp: new Date(),
    };
    
    // Add to history and save to localStorage
    setHistory(prev => [newHistoryItem, ...prev]);
  }, []);

  // Clone history item
  const cloneHistoryItem = useCallback((item: HistoryItem) => {
    // Clear new request tracking
    newRequestIdRef.current = null;
    
    const clonedId = generateId();
    clonedRequestIdRef.current = clonedId;
    
    setSelectedHistoryId(undefined);
    setMethod(item.request.method);
    setUrl(item.request.url);
    // Deep clone headers and params to avoid reference issues
    const clonedHeaders = item.request.headers.map(h => ({ ...h }));
    const clonedParams = item.request.params.map(p => ({ ...p }));
    setHeaders(clonedHeaders);
    setBody(item.request.body);
    setParams(clonedParams);
    // Don't clone response - start fresh
    setResponse(undefined);
    setStatus('idle');
    setPaymentDetails(undefined);
    setX402Response(undefined);
    setPaymentOption(undefined);
    setIsSidebarOpen(false);
    
    // Create a new history item for the cloned request
    const clonedRequest: ApiRequest = {
      id: clonedId,
      method: item.request.method,
      url: item.request.url,
      headers: clonedHeaders,
      body: item.request.body,
      params: clonedParams,
      timestamp: new Date(),
    };
    
    const clonedHistoryItem: HistoryItem = {
      id: clonedId,
      request: clonedRequest,
      status: 'idle',
      timestamp: new Date(),
    };
    
    // Add to history and save to localStorage
    setHistory(prev => [clonedHistoryItem, ...prev]);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedHistoryId(undefined);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  // Remove individual history item
  const removeHistoryItem = useCallback((itemId: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      // If the removed item was selected, clear selection
      if (selectedHistoryId === itemId) {
        setSelectedHistoryId(undefined);
      }
      return updated;
    });
  }, [selectedHistoryId]);

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

        // Show warning toast if confirmation timed out (but transaction was submitted)
        if (result.warning) {
          toast({
            title: "Transaction Submitted",
            description: result.warning,
            variant: "default",
          });
        }

        // Store payment header for retry
        localStorage.setItem('x402_payment_header', result.paymentHeader);
        
        // Auto-retry the request after a short delay to show success state
        setTimeout(async () => {
          setIsPaymentModalOpen(false);
          setTransactionStatus({ status: 'idle' });
          
          // Retry the request with payment header
          // The server will verify the transaction even if confirmation timed out
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
    removeHistoryItem,
    createNewRequest,
    cloneHistoryItem,

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
    
    // Auto-detection state
    isAutoDetecting,
  };
}
