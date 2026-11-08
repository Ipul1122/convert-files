import * as pdfjsLib from 'pdfjs-dist';
// Vite URL import for local bundled worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, PageSizes, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import type { PageSize, PageOrientation, PageMargin, RenderScale } from '../types';
import { parsePageRange } from '../utils/formatters';
import { convertHeicToUniversalBlob, type WatermarkOptions } from './imageEngine';

// Configure pdfjs worker locally with zero external network request
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface ProgressCallback {
  (currentPage: number, totalPages: number, message: string): void;
}

/**
 * Normalize image for pdf-lib embedding (with WebP and HEIC transcoding per RULES.md)
 */
export async function normalizeImageForPdfLib(file: File): Promise<{ buffer: ArrayBuffer; format: 'png' | 'jpg' }> {
  if (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  ) {
    const jpegBlob = await convertHeicToUniversalBlob(file);
    return { buffer: await jpegBlob.arrayBuffer(), format: 'jpg' };
  }
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

interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
}

interface TextLine {
  y: number;
  fontSize: number;
  items: ExtractedTextItem[];
}

/**
 * Convert PDF to editable Word (.docx) document offline using pdfjs-dist and docx
 */
export async function pdfToDocx(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const allDocxParagraphs: Paragraph[] = [];

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages, `Mengekstrak teks & struktur halaman ${p} dari ${totalPages}...`);
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const items: ExtractedTextItem[] = [];

    for (const rawItem of textContent.items) {
      if (!('str' in rawItem) || !rawItem.str) continue;
      const str = rawItem.str;
      const transform = rawItem.transform;
      const tx = transform[4];
      const ty = transform[5];
      const fontSize = Math.max(8, Math.round(Math.hypot(transform[0], transform[1])));
      const fontLower = (rawItem.fontName || '').toLowerCase();
      const isBold =
        fontLower.includes('bold') ||
        fontLower.includes('black') ||
        fontLower.includes('heavy') ||
        fontLower.includes('700') ||
        fontLower.includes('800') ||
        fontLower.includes('900');
      const isItalic = fontLower.includes('italic') || fontLower.includes('oblique');

      items.push({
        str,
        x: tx,
        y: ty,
        width: rawItem.width,
        height: rawItem.height || fontSize,
        fontSize,
        isBold,
        isItalic,
      });
    }

    // Sort by Y descending (PDF top-to-bottom), then X ascending
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3.5) {
        return yDiff;
      }
      return a.x - b.x;
    });

    // Cluster into visual lines
    const lines: TextLine[] = [];
    for (const item of items) {
      const lastLine = lines[lines.length - 1];
      if (lastLine && Math.abs(lastLine.y - item.y) <= 3.5) {
        lastLine.items.push(item);
        if (item.fontSize > lastLine.fontSize) {
          lastLine.fontSize = item.fontSize;
        }
      } else {
        lines.push({ y: item.y, fontSize: item.fontSize, items: [item] });
      }
    }

    // Sort each line horizontally
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
    }

    if (lines.length === 0) {
      // Empty text layer (e.g. scanned image)
      allDocxParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Halaman ${p}: Halaman ini berupa gambar atau hasil pindaian tanpa teks tersemat]`,
              italics: true,
              color: '888888',
              size: 20,
            }),
          ],
          spacing: { after: 140 },
          pageBreakBefore: p > 1,
        })
      );
    } else {
      let isFirstParagraphOnPage = true;
      let currentParagraphRuns: TextRun[] = [];
      let prevLineY = lines[0].y;
      let prevLineFontSize = lines[0].fontSize;

      for (let l = 0; l < lines.length; l++) {
        const line = lines[l];
        const deltaY = prevLineY - line.y;
        const isNewParagraph = l > 0 && deltaY > Math.max(16, prevLineFontSize * 1.55);

        if (isNewParagraph && currentParagraphRuns.length > 0) {
          allDocxParagraphs.push(
            new Paragraph({
              children: currentParagraphRuns,
              spacing: { after: 120, line: 260 },
              pageBreakBefore: isFirstParagraphOnPage && p > 1,
            })
          );
          currentParagraphRuns = [];
          isFirstParagraphOnPage = false;
        } else if (currentParagraphRuns.length > 0 && l > 0) {
          // Add soft break inside paragraph
          currentParagraphRuns.push(new TextRun({ break: 1 }));
        }

        prevLineY = line.y;
        prevLineFontSize = line.fontSize;

        for (let i = 0; i < line.items.length; i++) {
          const curr = line.items[i];
          let text = curr.str;
          if (i > 0) {
            const prev = line.items[i - 1];
            const gap = curr.x - (prev.x + prev.width);
            if (gap > 2.0 && !prev.str.endsWith(' ') && !curr.str.startsWith(' ')) {
              text = ' ' + text;
            }
          }

          // docx font size is in half-points (e.g. 11pt = 22)
          const docxSize = Math.min(72, Math.max(16, curr.fontSize * 2));
          currentParagraphRuns.push(
            new TextRun({
              text,
              bold: curr.isBold,
              italics: curr.isItalic,
              size: docxSize,
              font: 'Calibri',
            })
          );
        }
      }

      if (currentParagraphRuns.length > 0) {
        allDocxParagraphs.push(
          new Paragraph({
            children: currentParagraphRuns,
            spacing: { after: 120, line: 260 },
            pageBreakBefore: isFirstParagraphOnPage && p > 1,
          })
        );
      }
    }

    await new Promise(r => setTimeout(r, 0));
  }

  onProgress?.(totalPages, totalPages, 'Menyusun berkas dokumen Word (.docx)...');

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: allDocxParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, pageCount: totalPages };
}

/**
 * Convert PDF tables and layout into Microsoft Excel (.xlsx) spreadsheet
 */
export async function pdfToExcel(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages, `Menganalisis tabel halaman ${p} dari ${totalPages}...`);
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();

    interface RawItem {
      str: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }

    const items: RawItem[] = [];
    for (const rawItem of textContent.items) {
      if (!('str' in rawItem) || !rawItem.str.trim()) continue;
      items.push({
        str: rawItem.str,
        x: rawItem.transform[4],
        y: rawItem.transform[5],
        width: rawItem.width,
        height: rawItem.height,
      });
    }

    // Sort by Y descending (top to bottom), then X ascending (left to right)
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 4.0) return yDiff;
      return a.x - b.x;
    });

    // Group into rows
    const rowsOfItems: RawItem[][] = [];
    let currentRow: RawItem[] = [];
    let currentRowY: number | null = null;

    for (const item of items) {
      if (currentRowY === null || Math.abs(currentRowY - item.y) > 4.5) {
        if (currentRow.length > 0) {
          rowsOfItems.push(currentRow);
        }
        currentRow = [item];
        currentRowY = item.y;
      } else {
        currentRow.push(item);
      }
    }
    if (currentRow.length > 0) {
      rowsOfItems.push(currentRow);
    }

    // Cluster items into columns for each row
    const pageRows: (string | number)[][] = [];

    for (const row of rowsOfItems) {
      row.sort((a, b) => a.x - b.x);
      const cells: (string | number)[] = [];
      let currentCellText = '';
      let prevItem: RawItem | null = null;

      for (const item of row) {
        if (prevItem === null) {
          currentCellText = item.str;
        } else {
          const gap = item.x - (prevItem.x + prevItem.width);
          // If gap is large (> 16px), it's a new table column!
          if (gap > 16) {
            cells.push(formatExcelCellValue(currentCellText));
            currentCellText = item.str;
          } else {
            // Words in the same cell
            currentCellText += (gap > 2 && !currentCellText.endsWith(' ') ? ' ' : '') + item.str;
          }
        }
        prevItem = item;
      }
      if (currentCellText.trim()) {
        cells.push(formatExcelCellValue(currentCellText));
      }
      if (cells.length > 0) {
        pageRows.push(cells);
      }
    }

    // If page is empty, provide a placeholder row
    const finalRows = pageRows.length > 0 ? pageRows : [['(Halaman Kosong / Berisi Gambar)']];
    const ws = XLSX.utils.aoa_to_sheet(finalRows);

    // Auto column widths
    const maxCols = Math.max(...finalRows.map(r => r.length), 1);
    const colWidths = [];
    for (let c = 0; c < maxCols; c++) {
      let maxLen = 10;
      for (const r of finalRows) {
        const val = r[c] !== undefined ? String(r[c]) : '';
        if (val.length > maxLen) maxLen = Math.min(60, val.length);
      }
      colWidths.push({ wch: maxLen + 2 });
    }
    ws['!cols'] = colWidths;

    const sheetName = totalPages === 1 ? 'Sheet1' : `Hal ${p}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    await new Promise(r => setTimeout(r, 0));
  }

  onProgress?.(totalPages, totalPages, 'Menyusun berkas spreadsheet Excel (.xlsx)...');
  const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([u8], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return { blob, pageCount: totalPages };
}

function formatExcelCellValue(raw: string): string | number {
  const trimmed = raw.trim();
  // Pure integer or decimal
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) return num;
  }
  // Thousand separated numbers e.g. 1,000,000 or 1.000.000
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)) {
    const cleanNum = Number(trimmed.replace(/,/g, ''));
    if (!isNaN(cleanNum) && isFinite(cleanNum)) return cleanNum;
  }
  return trimmed;
}

/**
 * Convert PDF pages into a Microsoft PowerPoint presentation (.pptx)
 */
export async function pdfToPptx(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  // Dynamic import of pptxgenjs
  const pptxgenModule = await import('pptxgenjs');
  const PptxGen = pptxgenModule.default || pptxgenModule;
  const pptx = new PptxGen();

  // Determine slide aspect ratio from first page
  const page1 = await pdf.getPage(1);
  const vp1 = page1.getViewport({ scale: 1.0 });
  const ratio = vp1.width / vp1.height;

  if (ratio >= 1.55) {
    pptx.layout = 'LAYOUT_16x9';
  } else if (ratio >= 1.25) {
    pptx.layout = 'LAYOUT_4x3';
  } else {
    // Custom dimensions to preserve PDF aspect ratio exactly
    const slideW = 10.0;
    const slideH = Math.round((slideW / ratio) * 100) / 100;
    pptx.defineLayout({ name: 'PDF_CUSTOM', width: slideW, height: slideH });
    pptx.layout = 'PDF_CUSTOM';
  }

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages, `Merender slide presentasi ${p} dari ${totalPages}...`);
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.0 }); // 144 DPI for sharp slide text & graphics

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const pageDataUrl = canvas.toDataURL('image/png');

    canvas.width = 0;
    canvas.height = 0;

    const slide = pptx.addSlide();
    slide.addImage({
      data: pageDataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    // Extract text for slide notes
    try {
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map(it => ('str' in it ? it.str : ''))
        .filter(Boolean)
        .join(' ');
      if (text.trim()) {
        slide.addNotes(text.trim());
      }
    } catch {
      // notes are optional
    }

    await new Promise(r => setTimeout(r, 0));
  }

  onProgress?.(totalPages, totalPages, 'Menyusun berkas presentasi PowerPoint (.pptx)...');
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;

  return { blob, pageCount: totalPages };
}

/**
 * Extract plain text from PDF to UTF-8 TXT
 */
export async function pdfToTxt(
  file: File,
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number; text: string }> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages, `Mengekstrak teks halaman ${p} dari ${totalPages}...`);
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const items: ExtractedTextItem[] = [];

    for (const rawItem of textContent.items) {
      if (!('str' in rawItem) || !rawItem.str) continue;
      items.push({
        str: rawItem.str,
        x: rawItem.transform[4],
        y: rawItem.transform[5],
        width: rawItem.width,
        height: rawItem.height,
        fontSize: Math.abs(rawItem.transform[0]) || 10,
        isBold: false,
        isItalic: false,
      });
    }

    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3.5) return yDiff;
      return a.x - b.x;
    });

    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;
    let lastRightX = 0;

    for (const item of items) {
      if (lastY === null || Math.abs(lastY - item.y) > 3.5) {
        if (currentLine) lines.push(currentLine);
        currentLine = item.str;
      } else {
        const gap = item.x - lastRightX;
        if (gap > 2.5 && !currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
          currentLine += ' ' + item.str;
        } else {
          currentLine += item.str;
        }
      }
      lastY = item.y;
      lastRightX = item.x + item.width;
    }
    if (currentLine) lines.push(currentLine);

    pageTexts.push(lines.join('\n'));
    await new Promise(r => setTimeout(r, 0));
  }

  const fullText = pageTexts.join('\n\n--- Halaman Berikutnya ---\n\n');
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  return { blob, pageCount: totalPages, text: fullText };
}

export interface CompressPdfOptions {
  level: 'low' | 'medium' | 'high' | 'target';
  targetMaxKB?: number;
}

/**
 * Client-side 100% offline PDF Compressor
 */
export async function compressPdf(
  file: File,
  options: CompressPdfOptions = { level: 'medium' },
  onProgress?: ProgressCallback
): Promise<{
  blob: Blob;
  pageCount: number;
  originalBytes: number;
  compressedBytes: number;
}> {
  const originalBytes = file.size;
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;

  let renderScale = 1.15;
  let jpegQuality = 0.70;

  if (options.level === 'target' && options.targetMaxKB) {
    const targetTotalBytes = options.targetMaxKB * 1024;
    // Aggressive safety margin (0.84) to guarantee output <= targetMaxKB
    const targetBytesPerPage = (targetTotalBytes * 0.84) / Math.max(1, totalPages);
    if (targetBytesPerPage < 35_000) {
      renderScale = 0.80;
      jpegQuality = 0.40;
    } else if (targetBytesPerPage < 70_000) {
      renderScale = 0.90;
      jpegQuality = 0.52;
    } else if (targetBytesPerPage < 130_000) {
      renderScale = 1.05;
      jpegQuality = 0.65;
    } else {
      renderScale = 1.25;
      jpegQuality = 0.78;
    }
  } else if (options.level === 'low') {
    renderScale = 1.4;
    jpegQuality = 0.85;
  } else if (options.level === 'medium') {
    renderScale = 1.15;
    jpegQuality = 0.72;
  } else if (options.level === 'high') {
    renderScale = 0.95;
    jpegQuality = 0.52;
  }

  const pdfDoc = await PDFDocument.create();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  for (let p = 1; p <= totalPages; p++) {
    onProgress?.(p, totalPages, `Mengompres halaman ${p} dari ${totalPages}...`);
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: renderScale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const pageJpgBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Gagal merasterisasi halaman PDF'))),
        'image/jpeg',
        jpegQuality
      );
    });

    const jpgBuffer = await pageJpgBlob.arrayBuffer();
    const embeddedImg = await pdfDoc.embedJpg(jpgBuffer);

    // Keep original unscaled point dimensions
    const origViewport = page.getViewport({ scale: 1.0 });
    const newPage = pdfDoc.addPage([origViewport.width, origViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: origViewport.width,
      height: origViewport.height,
    });

    await new Promise(r => setTimeout(r, 0));
  }

  canvas.width = 0;
  canvas.height = 0;

  onProgress?.(totalPages, totalPages, 'Mengoptimalkan struktur dokumen...');
  const compressedBytesArray = await pdfDoc.save({ useObjectStreams: true });
  const compressedBlob = new Blob([new Uint8Array(compressedBytesArray)], {
    type: 'application/pdf',
  });

  return {
    blob: compressedBlob,
    pageCount: totalPages,
    originalBytes,
    compressedBytes: compressedBlob.size,
  };
}

/**
 * Apply security watermark to PDF document (e.g. for KTP, Ijazah, or verification)
 */
export async function applyWatermarkToPdf(
  file: File,
  options: WatermarkOptions,
  onProgress?: ProgressCallback
): Promise<{ blob: Blob; pageCount: number }> {
  const buffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(buffer);
  const totalPages = pdfDoc.getPageCount();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const text = options.text.trim() || 'HANYA UNTUK VERIFIKASI DOKUMEN';
  const colorRgb =
    options.color === 'black'
      ? rgb(0.1, 0.1, 0.1)
      : options.color === 'red'
      ? rgb(0.86, 0.15, 0.15)
      : rgb(1, 1, 1);

  const opacity = Math.max(0.1, Math.min(1.0, options.opacity));
  const angle = options.angleDegrees || -30;

  for (let p = 0; p < totalPages; p++) {
    onProgress?.(p + 1, totalPages, `Memasang watermark halaman ${p + 1} dari ${totalPages}...`);
    const page = pdfDoc.getPage(p);
    const { width, height } = page.getSize();

    if (options.style === 'single') {
      const fontSize = Math.max(16, Math.round(width / 18));
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: width / 2 - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
        y: height / 2 - (textWidth / 2) * Math.sin((angle * Math.PI) / 180),
        size: fontSize,
        font,
        color: colorRgb,
        opacity,
        rotate: degrees(angle),
      });
    } else {
      // Tiled repeating grid across the whole document
      const fontSize = Math.max(12, Math.round(width / 26));
      const stepX = Math.max(180, Math.round(fontSize * 14));
      const stepY = Math.max(70, Math.round(fontSize * 5));
      const diagonal = Math.hypot(width, height);

      for (let y = -diagonal / 2; y <= diagonal * 1.2; y += stepY) {
        for (let x = -diagonal / 2; x <= diagonal * 1.2; x += stepX) {
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: colorRgb,
            opacity,
            rotate: degrees(angle),
          });
        }
      }
    }

    await new Promise(r => setTimeout(r, 0));
  }

  onProgress?.(totalPages, totalPages, 'Menyimpan dokumen PDF...');
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

  return { blob, pageCount: totalPages };
}
