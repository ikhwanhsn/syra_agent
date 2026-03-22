/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev-only: optional secret to call POST /experiment/trading-agent/run-cycle; do not expose in public builds */
  readonly VITE_TRADING_EXPERIMENT_CRON_SECRET?: string;
}

// Polyfill for Buffer in browser (provided by vite-plugin-node-polyfills)
declare global {
  const Buffer: typeof import("buffer").Buffer;
}
