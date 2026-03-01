/// <reference types="vite/client" />

// Polyfill for Buffer in browser (provided by vite-plugin-node-polyfills)
declare global {
  const Buffer: typeof import("buffer").Buffer;
}
