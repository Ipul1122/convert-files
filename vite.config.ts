import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/convert-files/' : './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.webp', 'icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'LocalVault Converter',
        short_name: 'LocalVault',
        description: '100% Client-Side, Zero-Cloud Offline File & PDF Converter',
        theme_color: '#09090B',
        background_color: '#09090B',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit to allow pdf.worker.mjs offline caching
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,mjs,webp}'],
        navigateFallback: process.env.GITHUB_PAGES ? '/convert-files/index.html' : 'index.html',
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
