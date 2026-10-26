import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

export interface OfficeConversionResult {
  blob: Blob;
  mimeType: string;
  filename: string;
  isZip: boolean;
  pageCount: number;
}

/**
 * Word (.docx) to PDF conversion using client-side layout rendering
 */
export async function wordToPdf(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 4, 'Membaca dokumen Word...');
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.(2, 4, 'Mengekstrak teks & struktur dokumen...');
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  const rawText = textResult.value || 'Dokumen kosong';

  onProgress?.(3, 4, 'Menyusun halaman PDF...');
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = rawText.split(/\r?\n/);
  const pageWidth = PageSizes.A4[0]; // 595.28
  const pageHeight = PageSizes.A4[1]; // 841.89
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2 - 40) / lineHeight);

  // Word wrap helper
  const wrappedLines: string[] = [];
  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      wrappedLines.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = fontRegular.widthOfTextAtSize(testLine, 11);
      if (textWidth > contentWidth) {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
  }

  const totalPages = Math.max(1, Math.ceil(wrappedLines.length / maxLinesPerPage));

  for (let p = 0; p < totalPages; p++) {
    const page = pdfDoc.addPage(PageSizes.A4);
    const startIdx = p * maxLinesPerPage;
    const pageLines = wrappedLines.slice(startIdx, startIdx + maxLinesPerPage);

    // Header title on first page
    let y = pageHeight - margin;
    if (p === 0) {
      const title = file.name.replace(/\.[^/.]+$/, '');
      page.drawText(title, {
        x: margin,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.12),
      });
      y -= 26;
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.8,
        color: rgb(0.8, 0.8, 0.82),
      });
      y -= 18;
    }

    for (const line of pageLines) {
      if (line) {
        page.drawText(line, {
          x: margin,
          y,
          size: 10.5,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.18),
        });
      }
      y -= lineHeight;
    }

    // Page number footer
    page.drawText(`Halaman ${p + 1} dari ${totalPages}`, {
      x: pageWidth - margin - 80,
      y: margin / 2,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.55),
    });
  }

  onProgress?.(4, 4, 'Menyelesaikan berkas PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;

  return {
    blob,
    mimeType: 'application/pdf',
    filename,
    isZip: false,
    pageCount: totalPages,
  };
}

/**
 * Word (.docx) to HTML conversion
 */
export async function wordToHtml(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 2, 'Mengonversi berkas Word ke HTML...');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${file.name.replace(/\.[^/.]+$/, '')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #18181b; }
    h1, h2, h3 { color: #09090b; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #d4d4d8; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f5; }
  </style>
</head>
<body>
  ${result.value}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.html`;
  onProgress?.(2, 2, 'Selesai!');

  return {
    blob,
    mimeType: 'text/html',
    filename,
    isZip: false,
    pageCount: 1,
  };
}

/**
 * Word (.docx) to plain text conversion
 */
export async function wordToTxt(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 2, 'Mengekstrak teks Word...');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const blob = new Blob([result.value || ''], { type: 'text/plain;charset=utf-8' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.txt`;
  onProgress?.(2, 2, 'Selesai!');

  return {
    blob,
    mimeType: 'text/plain',
    filename,
    isZip: false,
    pageCount: 1,
  };
}

/**
 * Excel (.xlsx, .xls, .csv) to PDF conversion
 */
export async function excelToPdf(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 4, 'Membaca lembar kerja Excel...');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  onProgress?.(2, 4, 'Menyusun tabel lembar kerja...');
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = PageSizes.A4[1]; // Landscape for spreadsheets (841.89)
  const pageHeight = PageSizes.A4[0]; // (595.28)
  const margin = 40;
  const usableWidth = pageWidth - margin * 2;

  let totalPagesCreated = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (!data || data.length === 0) continue;

    // Determine max columns (cap at 12 for clean fit)
    const maxCols = Math.min(12, Math.max(...data.map(r => (r ? r.length : 0))));
    if (maxCols === 0) continue;

    const colWidth = usableWidth / maxCols;
    const rowHeight = 20;
    const maxRowsPerPage = Math.floor((pageHeight - margin * 2 - 50) / rowHeight);
    const sheetPages = Math.max(1, Math.ceil(data.length / maxRowsPerPage));

    for (let p = 0; p < sheetPages; p++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      totalPagesCreated++;
      const startRow = p * maxRowsPerPage;
      const pageRows = data.slice(startRow, startRow + maxRowsPerPage);

      // Sheet Title
      page.drawText(`${file.name.replace(/\.[^/.]+$/, '')} — Lembar: ${sheetName}`, {
        x: margin,
        y: pageHeight - margin + 12,
        size: 13,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.15),
      });

      let currentY = pageHeight - margin - 15;

      for (let rIdx = 0; rIdx < pageRows.length; rIdx++) {
        const row = pageRows[rIdx] || [];
        const isHeaderRow = p === 0 && rIdx === 0;

        // Draw row background for header
        if (isHeaderRow) {
          page.drawRectangle({
            x: margin,
            y: currentY - rowHeight + 4,
            width: usableWidth,
            height: rowHeight,
            color: rgb(0.92, 0.93, 0.95),
          });
        }

        // Draw horizontal grid line
        page.drawLine({
          start: { x: margin, y: currentY - rowHeight + 4 },
          end: { x: margin + usableWidth, y: currentY - rowHeight + 4 },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.88),
        });

        // Draw cells
        for (let c = 0; c < maxCols; c++) {
          const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
          const truncated = val.length > 25 ? `${val.substring(0, 22)}...` : val;

          page.drawText(truncated, {
            x: margin + c * colWidth + 4,
            y: currentY - 11,
            size: 9,
            font: isHeaderRow ? fontBold : fontRegular,
            color: isHeaderRow ? rgb(0.1, 0.1, 0.12) : rgb(0.2, 0.2, 0.25),
          });
        }

        currentY -= rowHeight;
      }

      // Page footer
      page.drawText(`${sheetName} • Halaman ${p + 1}/${sheetPages}`, {
        x: pageWidth - margin - 100,
        y: margin / 2,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.55),
      });
    }
  }

  if (totalPagesCreated === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText('Lembar kerja kosong.', { x: margin, y: pageHeight - margin, size: 12, font: fontRegular });
    totalPagesCreated = 1;
  }

  onProgress?.(4, 4, 'Menyimpan berkas PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;

  return {
    blob,
    mimeType: 'application/pdf',
    filename,
    isZip: false,
    pageCount: totalPagesCreated,
  };
}

/**
 * Excel (.xlsx) to CSV conversion
 */
export async function excelToCsv(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 2, 'Mengekstrak data lembar kerja...');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // If multiple sheets, package in ZIP; if single sheet, return pure CSV
  if (workbook.SheetNames.length === 1) {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = `${file.name.replace(/\.[^/.]+$/, '')}.csv`;
    onProgress?.(2, 2, 'Selesai!');
    return { blob, mimeType: 'text/csv', filename, isZip: false, pageCount: 1 };
  }

  // Multiple sheets -> ZIP
  const zip = new JSZip();
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    const safeSheetName = sheetName.replace(/[/\\?%*:|"<>]/g, '_');
    zip.file(`${safeSheetName}.csv`, csvContent);
  }

  onProgress?.(2, 2, 'Mengompresi ke ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}_csv.zip`;

  return {
    blob: zipBlob,
    mimeType: 'application/zip',
    filename,
    isZip: true,
    pageCount: workbook.SheetNames.length,
  };
}

/**
 * CSV to Excel (.xlsx) conversion
 */
export async function csvToExcel(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 2, 'Mengonversi CSV ke Excel...');
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.xlsx`;
  onProgress?.(2, 2, 'Selesai!');

  return {
    blob,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename,
    isZip: false,
    pageCount: 1,
  };
}

/**
 * PowerPoint (.pptx) to PDF & Media extractor
 */
export async function pptxToPdf(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 4, 'Membaca presentasi PowerPoint...');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  onProgress?.(2, 4, 'Mengekstrak slide & gambar presentasi...');
  // Find all slide XML files
  const slidePaths = Object.keys(zip.files)
    .filter(path => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = PageSizes.A4[1]; // 841.89 (Landscape)
  const pageHeight = PageSizes.A4[0]; // 595.28
  const margin = 50;

  let slideIndex = 1;

  for (const slidePath of slidePaths) {
    const xmlContent = await zip.files[slidePath].async('string');

    // Extract text fragments from <a:t> elements
    const textMatches = Array.from(xmlContent.matchAll(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/g)).map(
      m => m[1]
    );

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Slide border / card
    page.drawRectangle({
      x: margin / 2,
      y: margin / 2,
      width: pageWidth - margin,
      height: pageHeight - margin,
      borderColor: rgb(0.85, 0.85, 0.88),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 0.99),
    });

    // Slide Header
    page.drawText(`Slide ${slideIndex}`, {
      x: margin,
      y: pageHeight - margin - 15,
      size: 16,
      font: fontBold,
      color: rgb(0.92, 0.35, 0.05), // International orange accent
    });

    let currentY = pageHeight - margin - 50;

    if (textMatches.length === 0) {
      page.drawText('(Slide berisi grafis / gambar tanpa teks langsung)', {
        x: margin,
        y: currentY,
        size: 11,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.55),
      });
    } else {
      for (const text of textMatches) {
        if (!text.trim()) continue;
        const clean = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const truncated = clean.length > 90 ? `${clean.substring(0, 87)}...` : clean;

        page.drawText(`• ${truncated}`, {
          x: margin + 10,
          y: currentY,
          size: 11,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.18),
        });

        currentY -= 22;
        if (currentY < margin + 30) break;
      }
    }

    // Presentation footer
    page.drawText(`${file.name.replace(/\.[^/.]+$/, '')} — Slide ${slideIndex} / ${slidePaths.length}`, {
      x: pageWidth - margin - 150,
      y: margin / 2 + 10,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.65),
    });

    slideIndex++;
  }

  if (slidePaths.length === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText('Tidak ada slide yang ditemukan dalam berkas PPTX ini.', {
      x: margin,
      y: pageHeight / 2,
      size: 12,
      font: fontRegular,
    });
  }

  onProgress?.(4, 4, 'Menyimpan berkas PDF presentasi...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;

  return {
    blob,
    mimeType: 'application/pdf',
    filename,
    isZip: false,
    pageCount: Math.max(1, slidePaths.length),
  };
}

/**
 * Extract all media images from Office document (Word .docx or PPT .pptx)
 */
export async function extractOfficeMedia(
  file: File,
  onProgress?: (curr: number, total: number, msg: string) => void
): Promise<OfficeConversionResult> {
  onProgress?.(1, 3, 'Membuka arsip dokumen...');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const mediaFiles = Object.keys(zip.files).filter(path =>
    /^(word|ppt)\/media\/.+\.(png|jpe?g|webp|gif|svg)$/i.test(path)
  );

  if (mediaFiles.length === 0) {
    throw new Error('Tidak ditemukan gambar yang disematkan dalam dokumen ini.');
  }

  onProgress?.(2, 3, `Mengekstrak ${mediaFiles.length} berkas media...`);
  const outputZip = new JSZip();

  for (let i = 0; i < mediaFiles.length; i++) {
    const path = mediaFiles[i];
    const fileName = path.split('/').pop() || `image_${i + 1}.png`;
    const data = await zip.files[path].async('uint8array');
    outputZip.file(fileName, data);
  }

  onProgress?.(3, 3, 'Mengompresi ke ZIP...');
  const zipBlob = await outputZip.generateAsync({ type: 'blob' });
  const filename = `${file.name.replace(/\.[^/.]+$/, '')}_media_images.zip`;

  return {
    blob: zipBlob,
    mimeType: 'application/zip',
    filename,
    isZip: true,
    pageCount: mediaFiles.length,
  };
}
