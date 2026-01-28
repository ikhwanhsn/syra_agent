import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// CORS Proxy Plugin - proxies requests to external APIs to avoid CORS issues
function corsProxyPlugin(): Plugin {
  return {
    name: 'cors-proxy',
    configureServer(server) {
      // Handle all /api/proxy requests
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        // Handle CORS preflight requests first
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.statusCode = 204;
          res.end();
          return;
        }

        const targetUrl = req.url?.slice(1); // Remove leading slash
        
        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing target URL' }));
          return;
        }

        try {
          const decodedUrl = decodeURIComponent(targetUrl);
          console.log('[Proxy] Forwarding request to:', decodedUrl);
          console.log('[Proxy] Method:', req.method);
          
          // Collect request body
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              // Build headers, excluding host and other problematic headers
              const headers: Record<string, string> = {};
              const excludeHeaders = ['host', 'connection', 'content-length', 'accept-encoding'];
              
              for (const [key, value] of Object.entries(req.headers)) {
                if (!excludeHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
                  headers[key] = value;
                }
              }

              const fetchOptions: RequestInit = {
                method: req.method || 'GET',
                headers,
              };

              if (body && req.method !== 'GET' && req.method !== 'HEAD') {
                fetchOptions.body = body;
                console.log('[Proxy] Request body:', body);
              }

              const response = await fetch(decodedUrl, fetchOptions);
              
              console.log('[Proxy] Response status:', response.status);
              
              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', '*');
              
              // Forward response headers
              response.headers.forEach((value, key) => {
                // Skip problematic headers
                if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
                  res.setHeader(key, value);
                }
              });

              res.statusCode = response.status;
              
              const responseText = await response.text();
              console.log('[Proxy] Response body:', responseText.substring(0, 500));
              res.end(responseText);
            } catch (fetchError: any) {
              console.error('[Proxy] Fetch error:', fetchError);
              res.statusCode = 500;
              res.end(JSON.stringify({ 
                error: 'Proxy fetch failed', 
                message: fetchError.message 
              }));
            }
          });
        } catch (error: any) {
          console.error('[Proxy] Error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ 
            error: 'Proxy error', 
            message: error.message 
          }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    corsProxyPlugin(),
    react(), 
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Polyfill for Solana wallet adapter
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      // Define global for browser
      define: {
        global: 'globalThis',
      },
    },
    include: [
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-wallets',
      '@solana/web3.js',
    ],
  },
}));
