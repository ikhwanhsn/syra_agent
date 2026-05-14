import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function publicSiteOrigin(mode: string): string {
  const env = loadEnv(mode, process.cwd(), "");
  const fromFile = env.VITE_PUBLIC_SITE_ORIGIN?.trim();
  const fallback = "https://uponlyfund.com";
  return (fromFile || fallback).replace(/\/$/, "");
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const siteOrigin = publicSiteOrigin(mode);

  return {
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "inject-public-site-origin",
      transformIndexHtml(html) {
        return html.replaceAll("https://uponly.fund", siteOrigin);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the heaviest vendor sets into their own chunks so the dashboard
         * shell stays tiny and individual chunks are cached independently. The
         * largest crypto-dashboard offenders are recharts (~120 KB gz) and
         * framer-motion (~55 KB gz); both deserve dedicated chunks because they
         * are only used on a subset of routes.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }
          if (id.includes("@tanstack")) return "tanstack";
          return undefined;
        },
      },
    },
    /** Slightly higher chunk-size warning so we only flag truly oversized chunks. */
    chunkSizeWarningLimit: 700,
  },
};
});
