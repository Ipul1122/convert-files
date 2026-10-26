/**
 * Format bytes into human readable format (e.g. 2.45 MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${value} ${sizes[i]}`;
}

/**
 * Format date for history view (e.g. 2026-10-25 21:30)
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Format tool type label for UI (Indonesian)
 */
export function formatToolLabel(toolType: string): string {
  switch (toolType) {
    case 'img-to-pdf':
      return 'GAMBAR → PDF';
    case 'pdf-to-jpg':
      return 'PDF → JPG';
    case 'pdf-to-png':
      return 'PDF → PNG';
    case 'pdf-to-webp':
      return 'PDF → WEBP';
    case 'img-to-webp':
      return 'GAMBAR → WEBP';
    case 'webp-to-img':
      return 'WEBP → GAMBAR';
    case 'merge-pdf':
      return 'GABUNG PDF';
    case 'split-pdf':
      return 'PISAH PDF';
    case 'word-to-pdf':
      return 'WORD → PDF';
    case 'word-to-html':
      return 'WORD → HTML';
    case 'word-to-txt':
      return 'WORD → TXT';
    case 'excel-to-pdf':
      return 'EXCEL → PDF';
    case 'excel-to-csv':
      return 'EXCEL → CSV';
    case 'csv-to-excel':
      return 'CSV → EXCEL';
    case 'pptx-to-pdf':
      return 'PPTX → PDF';
    case 'office-media':
      return 'EKSTRAK MEDIA';
    case 'vault':
      return 'RIWAYAT';
    default:
      return toolType.toUpperCase();
  }
}

/**
 * Parse page range string (e.g. "1-3, 5, 8-10") into array of 1-based page numbers
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const trimmed = rangeStr.trim().toLowerCase();
  if (!trimmed || trimmed === 'all') {
    return Array.from({ length: maxPages }, (_, i) => i + 1);
  }

  const pagesSet = new Set<number>();
  // Split by commas, semicolons, or whitespace
  const parts = trimmed.split(/[,;\s]+/);

  for (const part of parts) {
    const segment = part.trim();
    if (!segment) continue;

    if (segment.includes('-')) {
      const [startStr, endStr] = segment.split('-').map(s => s.trim());
      const rawStart = parseInt(startStr, 10);
      const rawEnd = parseInt(endStr, 10);

      if (!isNaN(rawStart) && !isNaN(rawEnd)) {
        const start = Math.min(rawStart, rawEnd);
        const end = Math.max(rawStart, rawEnd);
        const boundedStart = Math.max(1, start);
        const boundedEnd = Math.min(end, maxPages);

        for (let p = boundedStart; p <= boundedEnd; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const p = parseInt(segment, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pagesSet.add(p);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Trigger browser file download from Blob and auto-revoke ObjectURL
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke ObjectURL after small timeout per strict memory rules
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Generate a clean output filename based on input files and tool
 */
export function generateDefaultFilename(inputFiles: { name: string }[], toolType: string): string {
  if (inputFiles.length === 0) return 'berkas_terkonversi';
  const first = inputFiles[0].name.replace(/\.[^/.]+$/, '');
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  switch (toolType) {
    case 'img-to-pdf':
      return inputFiles.length === 1 ? `${first}.pdf` : `berkas_gambar_${timestamp}.pdf`;
    case 'pdf-to-jpg':
      return `${first}_gambar.zip`;
    case 'pdf-to-png':
      return `${first}_gambar.zip`;
    case 'pdf-to-webp':
      return `${first}_webp.zip`;
    case 'img-to-webp':
      return inputFiles.length === 1 ? `${first}.webp` : `kumpulan_webp_${timestamp}.zip`;
    case 'webp-to-img':
      return inputFiles.length === 1 ? `${first}.png` : `kumpulan_gambar_${timestamp}.zip`;
    case 'merge-pdf':
      return `gabungan_dokumen_${timestamp}.pdf`;
    case 'split-pdf':
      return `${first}_ekstrak.pdf`;
    case 'word-to-pdf':
      return `${first}.pdf`;
    case 'word-to-html':
      return `${first}.html`;
    case 'word-to-txt':
      return `${first}.txt`;
    case 'excel-to-pdf':
      return `${first}.pdf`;
    case 'excel-to-csv':
      return `${first}.csv`;
    case 'csv-to-excel':
      return `${first}.xlsx`;
    case 'pptx-to-pdf':
      return `${first}.pdf`;
    case 'office-media':
      return `${first}_media.zip`;
    default:
      return `${first}_konversi`;
  }
}

/**
 * Compute execution validity and primary CTA label for given tool and files (Indonesian)
 */
export function getExecutionCtaState(
  toolType: string,
  filesCount: number,
  isProcessing: boolean,
  sourcePdfPageCount = 0,
  pageRange = 'all',
  targetImageFormat = 'image/png'
): { canExecute: boolean; ctaLabel: string } {
  if (isProcessing) {
    return { canExecute: false, ctaLabel: 'MEMPROSES OFFLINE...' };
  }

  // Office Tools
  if (toolType === 'word-to-pdf') {
    return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI WORD KE PDF' };
  }
  if (toolType === 'word-to-html') {
    return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI WORD KE HTML' };
  }
  if (toolType === 'word-to-txt') {
    return { canExecute: filesCount > 0, ctaLabel: 'EKSTRAK TEKS WORD' };
  }
  if (toolType === 'excel-to-pdf') {
    return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI EXCEL KE PDF' };
  }
  if (toolType === 'excel-to-csv') {
    return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI EXCEL KE CSV' };
  }
  if (toolType === 'csv-to-excel') {
    return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI CSV KE EXCEL' };
  }
  if (toolType === 'pptx-to-pdf') {
    return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI PPTX KE PDF' };
  }
  if (toolType === 'office-media') {
    return { canExecute: filesCount > 0, ctaLabel: 'EKSTRAK MEDIA DOKUMEN' };
  }

  const isImageToPdf = toolType === 'img-to-pdf';
  const isPdfToImg = toolType === 'pdf-to-jpg' || toolType === 'pdf-to-png' || toolType === 'pdf-to-webp';
  const isImgToWebp = toolType === 'img-to-webp';
  const isWebpToImg = toolType === 'webp-to-img';
  const isMerge = toolType === 'merge-pdf';
  const isSplit = toolType === 'split-pdf';

  const parsedSplitPages = (isSplit || isPdfToImg) && sourcePdfPageCount > 0
    ? parsePageRange(pageRange, sourcePdfPageCount)
    : [];

  if (isImageToPdf) {
    return {
      canExecute: filesCount > 0,
      ctaLabel: filesCount <= 1 ? 'KONVERSI KE PDF' : `GABUNG ${filesCount} GAMBAR KE PDF`,
    };
  }

  if (isPdfToImg) {
    const hasValidPages = sourcePdfPageCount > 0 ? parsedSplitPages.length > 0 : true;
    const can = filesCount > 0 && hasValidPages;
    let label = 'EKSPOR KE JPG';
    if (toolType === 'pdf-to-png') label = 'EKSPOR KE PNG';
    else if (toolType === 'pdf-to-webp') label = 'EKSPOR KE WEBP';
    return { canExecute: can, ctaLabel: label };
  }

  if (isImgToWebp) {
    return {
      canExecute: filesCount > 0,
      ctaLabel: filesCount <= 1 ? 'KONVERSI KE WEBP' : `KONVERSI ${filesCount} GAMBAR KE WEBP`,
    };
  }

  if (isWebpToImg) {
    const targetExt = targetImageFormat === 'image/jpeg' ? 'JPG' : 'PNG';
    return {
      canExecute: filesCount > 0,
      ctaLabel: filesCount <= 1 ? `KONVERSI WEBP KE ${targetExt}` : `KONVERSI ${filesCount} WEBP KE ${targetExt}`,
    };
  }

  if (isMerge) {
    return {
      canExecute: filesCount >= 2,
      ctaLabel: `GABUNGKAN ${filesCount} DOKUMEN`,
    };
  }

  if (isSplit) {
    const hasValidPages = sourcePdfPageCount > 0 ? parsedSplitPages.length > 0 : pageRange.trim().length > 0;
    return {
      canExecute: filesCount > 0 && hasValidPages,
      ctaLabel: parsedSplitPages.length > 0
        ? `EKSTRAK ${parsedSplitPages.length} HALAMAN`
        : 'EKSTRAK HALAMAN TERPILIH',
    };
  }

  return { canExecute: filesCount > 0, ctaLabel: 'KONVERSI SEKARANG' };
}
