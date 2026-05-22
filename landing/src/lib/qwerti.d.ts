/** Qwerti embed widget SDK (loaded via buy.js loader). */

export type QwertiEvent =
  | "ready"
  | "open"
  | "close"
  | "tokenDetails:loaded"
  | "tokenDetails:error"
  | "popup:opened"
  | "destroy";

export type QwertiEventHandler = (payload?: unknown) => void;

export interface QwertiSdk {
  openWidget: () => void;
  closeWidget: () => void;
  refreshWidget: () => void;
  updateWidget?: (cfg: { token?: string; chain?: string }) => void;
  destroy: () => void;
  on: (event: QwertiEvent, handler: QwertiEventHandler) => void;
  off: (event: QwertiEvent, handler: QwertiEventHandler) => void;
  getState?: () => { ready?: boolean; isOpen?: boolean };
  version?: string;
}

declare global {
  interface Window {
    Qwerti?: QwertiSdk;
  }
}

export {};
