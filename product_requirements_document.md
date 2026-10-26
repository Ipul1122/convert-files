# PRD.md — Product Requirements Document

## 1. Problem Statement
Commercial tools like iLovePDF, Smallpdf, or CloudConvert require users to upload sensitive documents (IDs, financial statements, HR contracts, personal photos) to external cloud servers, consuming internet data and creating severe privacy risks. Users need a desktop-grade, installable tool that converts and manipulates PDF and modern image files (including `.webp`) **100% offline** and stores history directly inside their own device.

## 2. Core Objectives
1. **Zero Data Consumption:** All conversions (PDF $\leftrightarrow$ JPG/PNG/WebP, Image $\leftrightarrow$ WebP, Merge, Split) execute locally via browser WebAssembly/Canvas and bundled workers.
2. **Internal Device Database:** Automatically save converted files, metadata, and user presets inside the user's local storage (`IndexedDB`) for instant re-downloading without re-processing.
3. **Installable Desktop/Offline Experience:** Works seamlessly in Airplane Mode via PWA Service Workers or Tauri Desktop runtime.

## 3. Functional Scope (MVP Features)

### F1: Image to PDF (JPG / JPEG / PNG / WebP $\rightarrow$ PDF)
- **Input:** Multiple local image files (`.jpg`, `.jpeg`, `.png`, `.webp`) via drag-and-drop, file picker, or clipboard paste.
- **WebP Compatibility Layer:** Automatically transcode `.webp` inputs in-memory via an offscreen HTML5 `<canvas>` into lossless PNG/JPEG `ArrayBuffer` before embedding into `pdf-lib`.
- **Controls:** Reorder images, page size selection (Fit to Image, A4, Letter), orientation (Portrait/Landscape), margin toggle (None, Small, Big).
- **Output:** Single merged `.pdf` Blob generated via `pdf-lib`.

### F2: PDF to Image (PDF $\rightarrow$ JPG / PNG / WebP)
- **Input:** Single or multiple `.pdf` files.
- **Controls:** Output format (`image/jpeg`, `image/png`, or `image/webp`), quality slider for JPG/WebP ($0.1$ to $1.0$), render scale/DPI quality ($1\times$ Standard, $2\times$ High-Res, $3\times$ Print), page selection.
- **Output:** Individual `.jpg` / `.png` / `.webp` download (if 1 page) or bundled `.zip` archive via `jszip` (if multiple pages).

### F3: PDF Merge & Split
- **Merge:** Combine multiple `.pdf` files into one document in custom order.
- **Split / Extract:** Extract specific page ranges (e.g., `1-3, 5`) into a new `.pdf` file.

### F4: Local Vault (Internal History Database)
- **Auto-Save Toggle:** Option to automatically store processed outputs into local `IndexedDB`.
- **Vault Manager:** View history list (File name, conversion type, original vs. final size, compression savings percentage, timestamp), instant local download, single-item delete, and "Purge All Local Data" button with storage usage indicator (MB used).

### F5: Offline WebP & Image Converter (JPG / PNG $\leftrightarrow$ WebP)
- **Input:** Batch local images (`.jpg`, `.jpeg`, `.png`, `.webp`).
- **Directions Supported:**
  - `JPG / PNG → WebP`: High-efficiency compression for web/app assets (including generating `.webp` app icons).
  - `WebP → JPG / PNG`: Convert downloaded `.webp` files into universal `.jpg` or `.png` formats for legacy software compatibility.
- **Controls:** Target format (`image/webp`, `image/jpeg`, `image/png`), compression quality slider ($10\%$ to $100\%$), optional dimension resize (width/height lock).
- **Output:** Direct single file download or batch `.zip` bundle.

## 4. Non-Functional Requirements
- **Offline Reliability:** Must pass 100% functionality tests with network adapter disabled (`navigator.onLine === false`).
- **Memory Management:** Revoke temporary `ObjectURL`s (`URL.revokeObjectURL`) immediately after preview/download to prevent RAM leaks on low-end laptops.
- **Performance:** Process a 10-page PDF-to-JPG/WebP conversion in under 3 seconds on standard dual-core laptops.