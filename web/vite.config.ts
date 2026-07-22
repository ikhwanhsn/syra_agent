import { defineConfig, Plugin, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { componentTagger } from "lovable-tagger";

function corsProxyPlugin(): Plugin {
  return {
    name: "cors-proxy",
    configureServer(server) {
      server.middlewares.use("/api/proxy", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "*");
          res.statusCode = 204;
          res.end();
          return;
        }

        const targetUrl = req.url?.slice(1);
        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing target URL" }));
          return;
        }

        const decodedUrl = decodeURIComponent(targetUrl);
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const headers: Record<string, string> = {};
            const excludeHeaders = ["host", "connection", "content-length", "accept-encoding"];
            for (const [key, value] of Object.entries(req.headers)) {
              if (excludeHeaders.includes(key.toLowerCase())) continue;
              const str = Array.isArray(value) ? value[0] : value;
              if (str && typeof str === "string") headers[key] = str;
            }

            const fetchOptions: RequestInit = { method: req.method || "GET", headers };
            if (body && req.method !== "GET" && req.method !== "HEAD") fetchOptions.body = body;

            const response = await fetch(decodedUrl, fetchOptions);
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "*");
            response.headers.forEach((value, key) => {
              if (!["content-encoding", "transfer-encoding", "content-length"].includes(key.toLowerCase())) {
                res.setHeader(key, value);
              }
            });
            res.statusCode = response.status;
            res.end(await response.text());
          } catch (fetchError: unknown) {
            const message = fetchError instanceof Error ? fetchError.message : "Proxy fetch failed";
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Proxy fetch failed", message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production" && !env.VITE_PRIVY_APP_ID?.trim()) {
    console.warn(
      "[Syra] VITE_PRIVY_APP_ID is missing — wallet connect will be disabled in production builds.",
    );
  }
  const useLocalApiGateway = env.VITE_USE_LOCAL_API === "true";
  const syraApiProxyTarget = useLocalApiGateway
    ? "http://localhost:3000"
    : "https://api.syraa.fun";
  /** Production gateway injects API key only for trusted Syra frontend origins. */
  /** Matches production deploy (syraa.fun); API injects auth for this trusted origin. */
  const syraTrustedDevOrigin = "https://syraa.fun";

  return {
  server: {
    host: "::",
    // 8080 avoids clashing with the Syra API gateway (default PORT 3000).
    port: 8080,
    strictPort: true,
    hmr: { overlay: false },
    proxy: {
      // Syra API — same-origin in dev (no CORS). Do not capture /api/proxy (playground relay).
      "^/api/(?!proxy(?:/|$))": {
        target: syraApiProxyTarget,
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
        configure: (proxy) => {
          if (useLocalApiGateway) return;
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Origin", syraTrustedDevOrigin);
            proxyReq.setHeader("Referer", `${syraTrustedDevOrigin}/`);
          });
        },
      },
      "/qwerti": {
        target: "https://widget.qwerti.ai",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/qwerti/, ""),
      },
    },
  },
  plugins: [nodePolyfills(), corsProxyPlugin(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@farcaster/mini-app-solana": path.resolve(__dirname, "./src/stubs/farcaster-mini-app-solana.ts"),
      "viem/_esm/chains/definitions/tempo.js": path.resolve(__dirname, "./src/stubs/viem-tempo-chain.ts"),
      "viem/chains/definitions/tempo": path.resolve(__dirname, "./src/stubs/viem-tempo-chain.ts"),
    },
  },
  define: { "process.env": {}, global: "globalThis" },
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    esbuildOptions: { define: { global: "globalThis" } },
    include: ["@solana/web3.js"],
    exclude: ["random-avatar-generator", "@resvg/resvg-wasm", "remotion", "@remotion/player", "@remotion/web-renderer"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          remotion: ["remotion", "@remotion/player", "@remotion/web-renderer"],
          "vendor-charts": ["recharts", "lightweight-charts"],
        },
      },
    },
  },
  };
});
