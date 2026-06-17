import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useLocalApi = env.VITE_USE_LOCAL_API !== "false";
  const syraApiProxyTarget = useLocalApi
    ? "http://localhost:3000"
    : "https://api.syraa.fun";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "^/api/(?!proxy(?:/|$))": {
          target: syraApiProxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
          configure: (proxy) => {
            if (useLocalApi) return;
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Origin", "https://syraa.fun");
              proxyReq.setHeader("Referer", "https://syraa.fun/");
            });
          },
        },
      },
    },
    plugins: [nodePolyfills(), react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: { global: "globalThis" },
    optimizeDeps: {
      esbuildOptions: { define: { global: "globalThis" } },
      include: [
        "@solana/wallet-adapter-base",
        "@solana/wallet-adapter-react",
        "@solana/wallet-adapter-wallets",
        "@solana/web3.js",
        "buffer",
      ],
    },
  };
});
