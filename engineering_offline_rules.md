# RULES.md — Strict Engineering & Offline Rules

## 1. Zero-Network / 100% Offline Rules (CRITICAL)

1. **No External Worker URLs:**
   - **FORBIDDEN:** `pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs...'`
   - **REQUIRED:** Always bundle the worker locally via Vite URL import:
     ```typescript
     import * as pdfjsLib from 'pdfjs-dist';
     import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
     pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
     ```

2. **No Remote Fonts or Icons:**
   - Never inject `<link href="https://fonts.googleapis.com...">` in `index.html`. Use local system fonts or locally bundled `.woff2` files.
   - Use local `/icon.webp` inside `public/` for PWA manifest and header branding.

3. **No Telemetry or External Calls:**
   - Zero `fetch()` or `XMLHttpRequest` calls to external domains.

---

## 2. Offline `.webp` Processing & Transcoding Rules (CRITICAL)

1. **Handling `.webp` Input in `pdf-lib` (`Image -> PDF`):**
   - `pdf-lib` natively supports only `embedJpg()` and `embedPng()`. Calling `embedPng()` or `embedJpg()` directly on raw `.webp` bytes WILL throw a runtime error.
   - **MANDATORY WORKAROUND:** When `file.type === 'image/webp'` (or filename ends with `.webp`), you MUST decode the `.webp` file locally using `createImageBitmap(file)` (or an `HTMLImageElement`), draw it onto an offscreen HTML5 `<canvas>` at $1:1$ native resolution, export it via `canvas.toBlob(blob, 'image/png')` (or `'image/jpeg'`), convert that Blob to `ArrayBuffer`, and pass it to `pdfDoc.embedPng()` / `pdfDoc.embedJpg()`.

   ```typescript
   export async function normalizeImageForPdfLib(file: File): Promise<{ buffer: ArrayBuffer; format: 'png' | 'jpg' }> {
     if (file.type === 'image/png') {
       return { buffer: await file.arrayBuffer(), format: 'png' };
     }
     if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
       return { buffer: await file.arrayBuffer(), format: 'jpg' };
     }
     // Offline WebP -> PNG transcoding via local Canvas
     const bitmap = await createImageBitmap(file);
     const canvas = document.createElement('canvas');
     canvas.width = bitmap.width;
     canvas.height = bitmap.height;
     const ctx = canvas.getContext('2d')!;
     ctx.drawImage(bitmap, 0, 0);
     bitmap.close();

     const pngBlob = await new Promise<Blob>((resolve, reject) => {
       canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('WebP canvas transcode failed'))), 'image/png');
     });
     return { buffer: await pngBlob.arrayBuffer(), format: 'png' };
   }
   ```

2. **Generating `.webp` Output (`PDF -> WebP` & `JPG/PNG -> WebP`):**
   - Render the PDF page or source image onto an HTML5 `<canvas>` and invoke:
     ```typescript
     canvas.toBlob((blob) => { ... }, 'image/webp', quality); // quality: 0.1 to 1.0
     ```
   - Ensure output filenames use the `.webp` extension and `mimeType: 'image/webp'` when saving to Dexie.js (`LocalVaultDB`).

---

## 3. Memory & File Handling Rules

1. **Strict ObjectURL & ImageBitmap Cleanup:**
   - Every time `URL.createObjectURL(blob)` is used for thumbnail previews or file downloads, it MUST be revoked via `URL.revokeObjectURL(url)` inside a React `useEffect` cleanup function or `setTimeout` after download initiation.
   - Always call `bitmap.close()` immediately after drawing an `ImageBitmap` to `<canvas>` during `.webp` transcoding.

2. **Sequential Canvas Rendering for Large PDFs:**
   - When converting PDF to JPG/PNG/WebP, render pages sequentially (`for...of` with `await`) rather than `Promise.all()` across 100+ pages simultaneously to prevent crashing the browser tab on 8GB RAM machines.

3. **Web Worker / Async Yielding:**
   - Update conversion progress state (`currentPage / totalPages`) after each page so the UI remains responsive and never freezes.

---

## 4. Code Quality & TypeScript Standards

1. **No `any` Types:** All File buffers, Dexie records, MIME types, and PDF page viewports must be strictly typed.
2. **Pure Service Layer:**
   - Keep all PDF/Image/WebP manipulation logic inside `src/services/pdfEngine.ts` and `src/services/imageEngine.ts`, and database queries inside `src/db/vaultDb.ts`. React components (`src/components/*`) must only handle UI state and invoke service functions.
3. **Error Handling:**
   - Catch encrypted/password-protected PDFs or corrupted `.webp` headers gracefully and show a clear inline message in the UI instead of an unhandled promise rejection.

---

## 5. UI Enforcement Checklist

Before completing any component, verify:
- [ ] Are there any `bg-gradient-*` classes? If yes, **remove them immediately**.
- [ ] Are there more than 2 font families used? If yes, **restrict to `font-sans` and `font-mono`**.
- [ ] Are file sizes, extensions (`.PDF`, `.WEBP`, `.JPG`), and page numbers using `font-mono`?
- [ ] Does `.webp` input and `.webp` output work 100% when Wi-Fi is turned off?