import * as pdfjsLib from 'pdfjs-dist';
// Vite URL import for local bundled worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, PageSizes } from 'pdf-lib';
import JSZip from 'jszip';
import type { PageSize, PageOrientation, PageMargin, RenderScale } from '../types';
import { parsePageRange } from '../utils/formatters';

// Configure pdfjs worker locally with zero external network request
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ProgressCallback {
  (currentPage: number, totalPages: number, message: string): void;
}

/**
 * Normalize image for pdf-lib embedding (with WebP transcoding per RULES.md)
 */
export async function normalizeImageForPdfLib(file: File): Promise<{ buffer: ArrayBuffer; format: 'png' | 'jpg' }> {
  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    return { buffer: await file.arrayBuffer(), format: 'png' };
  }
  if (file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.jpe?g$/i.test(file.name)) {
    return { buffer: await file.arrayBuffer(), format: 'jpg' };
  }
  // Offline WebP -> PNG transcoding via local Canvas
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('WebP canvas transcode failed'))), 'image/png');
  });
  canvas.width = 0;
  canvas.height = 0;
  return { buffer: await pngBlob.arrayBuffer(), format: 'png' };
}

/**
 * Convert standard image formats (JPEG, PNG, WebP) to PDF
 */
export async function imagesToPdf(
  files: File[],
  options: {
    pageSize: PageSize;
    orientation: PageOrientation;
    margin: PageMargin;
  },
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  const pdfDoc = await PDFDocument.create();
  const total = files.length;

  // Margin in points (72 points = 1 inch)
  let marginPt = 0;
  if (options.margin === 'small') marginPt = 20;
  if (options.margin === 'big') marginPt = 40;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    onProgress?.(i + 1, total, `Memproses gambar ${i + 1} dari ${total}: ${file.name}`);

    const normalized = await normalizeImageForPdfLib(file);
    let embeddedImage;

    if (normalized.format === 'jpg') {
      try {
        embeddedImage = await pdfDoc.embedJpg(normalized.buffer);
      } catch {
        embeddedImage = await rasterizeAndEmbed(pdfDoc, file);
      }
    } else {
      try {
        embeddedImage = await pdfDoc.embedPng(normalized.buffer);
      } catch {
        embeddedImage = await rasterizeAndEmbed(pdfDoc, file);
      }
    }

    let imgWidth = embeddedImage.width;
    let imgHeight = embeddedImage.height;

    // Normalize excessively large pixel dimensions for PDF points (e.g. 4000px camera photos)
    const MAX_POINT_DIM = 1200;
    if (imgWidth > MAX_POINT_DIM || imgHeight > MAX_POINT_DIM) {
      const dimScale = Math.min(MAX_POINT_DIM / imgWidth, MAX_POINT_DIM / imgHeight);
      imgWidth = Math.round(imgWidth * dimScale);
      imgHeight = Math.round(imgHeight * dimScale);
    }

    // Determine target page dimensions
    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'fit') {
      pageWidth = imgWidth + marginPt * 2;
      pageHeight = imgHeight + marginPt * 2;
    } else {
      const baseDimensions = options.pageSize === 'letter' ? PageSizes.Letter : PageSizes.A4;
      if (options.orientation === 'landscape') {
        pageWidth = Math.max(baseDimensions[0], baseDimensions[1]);
        pageHeight = Math.min(baseDimensions[0], baseDimensions[1]);
      } else {
        pageWidth = Math.min(baseDimensions[0], baseDimensions[1]);
        pageHeight = Math.max(baseDimensions[0], baseDimensions[1]);
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate fitted dimensions within margins
    const availableWidth = pageWidth - marginPt * 2;
    const availableHeight = pageHeight - marginPt * 2;

    const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    // Center image on the page
    const x = marginPt + (availableWidth - drawWidth) / 2;
    const y = marginPt + (availableHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  onProgress?.(total, total, 'Menyusun dokumen PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, pageCount: total };
}

/**
 * Fallback rasterizer for WebP or non-standard image formats using browser canvas
 */
async function rasterizeAndEmbed(pdfDoc: PDFDocument, file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas rasterization failed'))), 'image/png');
  });

  canvas.width = 0;
  canvas.height = 0;

  const buffer = await pngBlob.arrayBuffer();
  return await pdfDoc.embedPng(buffer);
}

/**
 * Convert PDF pages to JPG, PNG, or WebP images sequentially
 */
export async function pdfToImages(
  file: File,
  options: {
    format: 'image/jpeg' | 'image/png' | 'image/webp';
    renderScale: RenderScale;
    jpgQuality: number;
    pageRange: string;
  },
  onProgress?: ProgressCallback
): Promise<{
  blob: Blob;
  isZip: boolean;
  pageCount: number;
  imageBlobs: { name: string; blob: Blob }[];
}> {
  const arrayBuffer = await file.arrayBuffer();

  let loadingTask;
  try {
    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
    });
  } catch (err: unknown) {
    throw new Error(`Failed to load PDF document: ${err instanceof Error ? err.message : String(err)}`);
  }

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const targetPages = parsePageRange(options.pageRange, totalPages);
  if (targetPages.length === 0) {
    throw new Error('Tidak ada halaman valid pada rentang halaman yang ditentukan.');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('Tidak dapat menginisialisasi kanvas render');

  const baseFilename = file.name.replace(/\.[^/.]+$/, '');
  let extension = 'png';
  if (options.format === 'image/jpeg') extension = 'jpg';
  else if (options.format === 'image/webp') extension = 'webp';

  const mimeType = options.format;
  const quality = options.format === 'image/png' ? undefined : options.jpgQuality;

  const imageBlobs: { name: string; blob: Blob }[] = [];

  // Sequential rendering loop to avoid memory exhaustion
  for (let i = 0; i < targetPages.length; i++) {
    const pageNum = targetPages[i];
    onProgress?.(i + 1, targetPages.length, `Merender halaman ${pageNum} (${i + 1}/${targetPages.length})...`);

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: options.renderScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background for JPEGs (which lack transparency)
    if (options.format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const renderContext = {
      canvasContext: ctx,
      viewport,
      canvas,
    };

    await page.render(renderContext).promise;

    // Convert canvas to Blob
    const pageBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error(`Failed to export page ${pageNum}`))),
        mimeType,
        quality
      );
    });

    const paddedIndex = String(pageNum).padStart(3, '0');
    const imageName = `${baseFilename}_p${paddedIndex}.${extension}`;
    imageBlobs.push({ name: imageName, blob: pageBlob });

    // Yield control to UI event loop
    await new Promise(r => setTimeout(r, 0));
  }

  // Cleanup canvas
  canvas.width = 0;
  canvas.height = 0;

  // If only 1 page requested, return direct image
  if (imageBlobs.length === 1) {
    return {
      blob: imageBlobs[0].blob,
      isZip: false,
      pageCount: 1,
      imageBlobs,
    };
  }

  // Multiple pages: package into JSZip archive
  onProgress?.(targetPages.length, targetPages.length, 'Mengompresi gambar ke dalam arsip ZIP...');
  const zip = new JSZip();
  for (const item of imageBlobs) {
    zip.file(item.name, item.blob);
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    metadata => {
      onProgress?.(
        Math.round((metadata.percent / 100) * targetPages.length),
        targetPages.length,
        `Building ZIP: ${Math.round(metadata.percent)}%`
      );
    }
  );

  return {
    blob: zipBlob,
    isZip: true,
    pageCount: targetPages.length,
    imageBlobs,
  };
}

/**
 * Merge multiple PDF files in custom order
 */
export async function mergePdfs(
  files: File[],
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  if (files.length < 2) {
    throw new Error('Minimal 2 berkas PDF diperlukan untuk digabungkan.');
  }

  const mergedDoc = await PDFDocument.create();
  let totalPagesCopied = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, `Menggabungkan dokumen ${i + 1} dari ${files.length}: ${file.name}`);

    const buffer = await file.arrayBuffer();
    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    } catch (err: unknown) {
      throw new Error(`Tidak dapat membaca "${file.name}". Berkas mungkin diproteksi sandi atau rusak: ${err instanceof Error ? err.message : String(err)}`);
    }

    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

    for (const page of copiedPages) {
      mergedDoc.addPage(page);
      totalPagesCopied++;
    }
  }

  onProgress?.(files.length, files.length, 'Menyelesaikan dokumen gabungan PDF...');
  const pdfBytes = await mergedDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, pageCount: totalPagesCopied };
}

/**
 * Extract specific page ranges from a PDF into a new PDF
 */
export async function splitPdf(
  file: File,
  pageRangeStr: string,
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  onProgress?.(1, 2, `Membaca dokumen sumber: ${file.name}...`);
  const buffer = await file.arrayBuffer();

  let srcDoc: PDFDocument;
  try {
    srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  } catch (err: unknown) {
    throw new Error(`Gagal memuat PDF. Berkas mungkin diproteksi sandi atau rusak: ${err instanceof Error ? err.message : String(err)}`);
  }

  const totalPages = srcDoc.getPageCount();
  const targetPages = parsePageRange(pageRangeStr, totalPages);

  if (targetPages.length === 0) {
    throw new Error(`Tidak ada halaman terpilih yang valid dari 1 hingga ${totalPages}.`);
  }

  onProgress?.(2, 2, `Mengekstrak ${targetPages.length} halaman terpilih...`);
  const newDoc = await PDFDocument.create();

  // Convert 1-based page numbers to 0-based indices
  const zeroBasedIndices = targetPages.map(p => p - 1);
  const copiedPages = await newDoc.copyPages(srcDoc, zeroBasedIndices);

  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  const pdfBytes = await newDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  return { blob, pageCount: targetPages.length };
}

/**
 * Inspect a PDF file to get page count and check encryption
 */
export async function inspectPdf(file: File): Promise<{ pageCount: number; isEncrypted: boolean }> {
  const buffer = await file.arrayBuffer();
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
    });
    const pdf = await loadingTask.promise;
    return { pageCount: pdf.numPages, isEncrypted: false };
  } catch (err: unknown) {
    const msg = String(err).toLowerCase();
    if (msg.includes('password') || msg.includes('encrypted')) {
      return { pageCount: 0, isEncrypted: true };
    }
    throw err;
  }
}

/**
 * Generate a fast thumbnail preview for images or the first page of a PDF
 */
export async function generateFileThumbnail(file: File): Promise<string> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
      });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.3 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      canvas.width = 0;
      canvas.height = 0;
      return dataUrl;
    } catch {
      return '';
    }
  } else {
    // Image file
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 120;
      const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      canvas.width = 0;
      canvas.height = 0;
      return dataUrl;
    } catch {
      return '';
    }
  }
}

/**
 * Render all pages of a PDF sequentially into low-memory thumbnail data URLs
 */
export async function renderAllPdfPageThumbnails(
  file: File,
  onProgress?: (curr: number, total: number) => void
): Promise<{ pageNum: number; dataUrl: string; width: number; height: number }[]> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const results: { pageNum: number; dataUrl: string; width: number; height: number }[] = [];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return [];

  for (let p = 1; p <= total; p++) {
    onProgress?.(p, total);
    try {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 0.4 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      results.push({
        pageNum: p,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      });
    } catch {
      // Continue next page if one fails
    }
  }

  canvas.width = 0;
  canvas.height = 0;
  return results;
}

/**
 * Render a single high-resolution page for large preview modal
 */
export async function renderSinglePdfPageHighRes(
  file: File,
  pageNum: number
): Promise<string> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}
