import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'LocalVault Converter',
        short_name: 'LocalVault',
        description: '100% Client-Side, Zero-Cloud Offline File & PDF Converter',
        theme_color: '#09090B',
        background_color: '#09090B',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit to allow pdf.worker.mjs offline caching
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,mjs,webp}'],
        navigateFallback: '/index.html',
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 3000,
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib', 'dexie', 'jszip', 'lucide-react']
  }
});
