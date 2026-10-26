# CLAUDE.md — Master Architecture & Context Guide

## 1. Project Identity
- **Project Name:** LocalVault Converter (Offline-First File, Image & PDF Suite)
- **Core Value Proposition:** 100% Client-Side, Zero-Data/Zero-Cloud File Converter & PDF Manipulation Tool with Full `.webp` Support and Internal Device Storage (IndexedDB/SQLite).
- **Target Platforms:** Installable PWA (Progressive Web App) & Lightweight Desktop App (Tauri / Vite).
- **App Icon Asset:** `public/icon.webp` (High-contrast utilitarian icon in `.webp` format).

## 2. Master Document Index
AI Assistants and Developers MUST read and obey the following modular specification files before generating or modifying any code:
1. **`prd.md`** — Product Requirements, Core Features (including `.webp` pipelines), Offline Processing Scope, and User Flows.
2. **`erd.md`** — Local Database Schema (Dexie.js / IndexedDB), Blob Storage Strategy, and Data Lifecycle.
3. **`design.md`** — Strict "Anti-AI Slop" UI/UX Guidelines (No gradients, high-contrast utilitarian palette, strict typography).
4. **`rules.md`** — Hard Engineering Constraints, 100% Offline Worker Bundling Rules, WebP Canvas Transcoding Rules, and Code Standards.

## 3. Tech Stack (Strict)
- **Framework:** React 18+ with TypeScript (Vite bundler)
- **Styling:** Tailwind CSS (Strict adherence to `design.md` tokens, zero arbitrary gradients)
- **Icons:** `lucide-react` (1.5px stroke width, monochrome/semantic only)
- **Local Database:** `dexie` & `dexie-react-hooks` (IndexedDB wrapper for storing conversion history & file `Blob`s locally)
- **Core Offline Engines:**
  - `pdf-lib` (PDF creation, merge, split, image-to-PDF)
  - `pdfjs-dist` (PDF-to-JPG/PNG/WebP rendering via local HTML5 `<canvas>` + bundled local worker)
  - Native HTML5 `<canvas>` API (`canvas.toBlob(..., 'image/webp', quality)`) for zero-dependency `.webp` encoding/decoding.
  - `jszip` (Bundling multi-page image/WebP outputs offline)
- **Offline/Desktop Wrapper:** `vite-plugin-pwa` (Service Worker caching) / Tauri (optional `.exe` build)

## 4. Development Commands
```bash
# Install dependencies
npm install

# Install core offline engines & local DB
npm install dexie dexie-react-hooks pdf-lib pdfjs-dist jszip lucide-react

# Run local development server
npm run dev

# Build offline production bundle
npm run build
```

## 5. Golden Rule for AI Code Generation
**NEVER** introduce external API calls (`fetch`, `axios`), external CDNs (for fonts, icons, or `pdf.worker.js`), or generic SaaS visual bloat (purple/blue gradients, glowing blobs, glassmorphism). Every byte processed—including `.pdf`, `.jpg`, `.png`, and `.webp` conversions—must stay inside the user's local RAM and `IndexedDB`.