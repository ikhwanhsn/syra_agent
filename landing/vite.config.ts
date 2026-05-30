import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { QWERTI_LOADER_SRC_DIRECT, buildQwertiEmbedAttrs } from "./src/data/qwerti";

/** Injects the official Qwerti embed into <head> at build/dev HTML transform time. */
function qwertiWidgetPlugin(): Plugin {
  const attrs = buildQwertiEmbedAttrs();
  const attrString = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  const tag = `<script src="${QWERTI_LOADER_SRC_DIRECT}" async ${attrString}></script>`;
  return {
    name: "qwerti-widget",
    transformIndexHtml(html) {
      if (html.includes(`data-campaign="${attrs["data-campaign"]}"`)) return html;
      return html.replace(
        "<link rel=\"preconnect\" href=\"https://widget.qwerti.ai\"",
        `${tag}\n    <link rel="preconnect" href="https://widget.qwerti.ai"`,
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/qwerti": {
        target: "https://widget.qwerti.ai",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/qwerti/, ""),
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/qwerti": {
        target: "https://widget.qwerti.ai",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/qwerti/, ""),
      },
    },
  },
  plugins: [
    react(),
    qwertiWidgetPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
