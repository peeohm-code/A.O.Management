import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";


const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  // Bundle analyzer - run with ANALYZE=true pnpm build
  process.env.ANALYZE === 'true' && visualizer({
    filename: './dist/stats.html',
    open: false,
    gzipSize: true,
    brotliSize: true,
  }),
  VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
    manifest: {
      name: "Construction Management & QC Platform",
      short_name: "ConstructionQC",
      description: "ระบบบริหารจัดการโครงการก่อสร้างและควบคุมคุณภาพงาน (QC) แบบออนไลน์และออฟไลน์",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^\/api\/trpc\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id): string | undefined => {
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            // tRPC and React Query
            if (id.includes('@trpc') || id.includes('@tanstack/react-query')) {
              return 'trpc-vendor';
            }
            // Charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'chart-vendor';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icon-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Gantt chart (split separately due to size)
            if (id.includes('frappe-gantt') || id.includes('gantt')) {
              return 'gantt-vendor';
            }
            // Other large libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            // Socket.io
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
            }
            // Everything else
            return 'vendor';
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  server: {
    host: true,
    hmr: false,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    watch: {
      usePolling: false,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/build/**",
        "**/.cache/**",
        "**/coverage/**",
        "**/server/**",
        "**/drizzle/**",
        "**/todo.md",
        "**/ideas.md",
        "**/*.log",
      ],
    },
  },
});
