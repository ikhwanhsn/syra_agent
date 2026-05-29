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

/** Parsed on-chain summary after a confirmed submit (RPC `getParsedTransaction`). */
export interface PumpfunOnChainDetails {
  slot?: number;
  blockTimeIso?: string;
  feeLamports: number;
  feeSol: string;
  computeUnitsConsumed?: number;
  /** Fee payer (account index 0) SOL delta in lamports when meta balances exist */
  feePayerSolDeltaLamports?: number;
  feePayerSolDelta?: string;
  /** SPL token balance changes from transaction meta (post − pre). */
  tokenDeltas: Array<{
    mint: string;
    owner?: string;
    uiChange: string;
  }>;
}

/** Playground auto-submit of pump.fun agent `transaction` (base64) after a 200 response. */
export interface PumpfunChainExecution {
  attempted: boolean;
  status:
    | 'confirmed'
    | 'failed'
    | 'skipped_no_wallet'
    | 'skipped_no_tx_field'
    | 'skipped_parse';
  signature?: string;
  error?: string;
  /** Fields Syra already returned in the JSON body (mint, quote amounts, etc.). */
  pumpApiHints?: Record<string, string>;
  /** Enriched from Solana RPC after the tx confirms (slot, fees, token deltas). */
  onChainDetails?: PumpfunOnChainDetails;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
  /** When set, the playground signed & broadcast the returned Solana tx (pump.fun agent routes). */
  pumpfunChainExecution?: PumpfunChainExecution;
}

export interface HistoryItem {
  id: string;
  request: ApiRequest;
  response?: ApiResponse;
  status: RequestStatus;
  timestamp: Date;
  /** Content-based share slug from API; same request => same slug. Used for share link. */
  shareSlug?: string;
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
