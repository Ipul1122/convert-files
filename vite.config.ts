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
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30MB limit to allow pdf.worker.mjs and ONNX wasm offline caching
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,mjs,webp,tflite}'],
        navigateFallback: process.env.GITHUB_PAGES ? '/convert-files/index.html' : 'index.html',
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@mediapipe')) {
            return 'mediapipe-core';
          }
          if (id.includes('pdfjs-dist') || id.includes('pdf-lib')) {
            return 'pdf-core';
          }
          if (id.includes('docx') || id.includes('xlsx') || id.includes('mammoth') || id.includes('pptxgenjs')) {
            return 'office-core';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib', 'dexie', 'jszip', 'lucide-react']
  }
});
