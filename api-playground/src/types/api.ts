export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error' | 'payment_required';

export interface RequestHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestParam {
  key: string;
  value: string;
  enabled: boolean;
  /** Optional API description, used as placeholder for the value input */
  description?: string;
}

export interface ApiRequest {
  id: string;
  method: HttpMethod;
  url: string;
  headers: RequestHeader[];
  body: string;
  params: RequestParam[];
  timestamp: Date;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export interface HistoryItem {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  status: RequestStatus;
  timestamp: Date;
}

export interface PaymentDetails {
  amount: string;
  token: string;
  recipient: string;
  memo?: string;
  network: string;
}

export interface WalletState {
  connected: boolean;
  address?: string;
  balance?: string;
  network?: string;
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  hash?: string;
  error?: string;
}
