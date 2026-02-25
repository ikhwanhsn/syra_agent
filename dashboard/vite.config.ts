import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    port: 5174,
    host: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: "globalThis" },
    },
    include: [
      "@solana/wallet-adapter-base",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-wallets",
      "@solana/web3.js",
    ],
  },
});
