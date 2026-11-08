import React from 'react';
import { Sliders, X, FileText, FileSpreadsheet, Presentation, Archive, Sparkles, ShieldCheck } from 'lucide-react';
import type {
  ToolType,
  PageSize,
  PageOrientation,
  PageMargin,
  RenderScale,
  ConversionOptions,
  ConversionProgressState,
  SourceFile,
} from '../types';
import { parsePageRange } from '../utils/formatters';
import { SupportedFormatsBadge } from './SupportedFormatsBadge';

interface RightInspectorProps {
  toolType: ToolType;
  options: ConversionOptions;
  onOptionsChange: (newOptions: Partial<ConversionOptions>) => void;
  files: SourceFile[];
  isProcessing: boolean;
  progress: ConversionProgressState;
  onExecute: () => void;
  autoSaveToVault: boolean;
  onAutoSaveToggle: (val: boolean) => void;
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  toolType,
  options,
  onOptionsChange,
  files,
  isProcessing,
  progress,
  onExecute,
  autoSaveToVault,
  onAutoSaveToggle,
  isMobileDrawer = false,
  onClose,
}) => {
  const isImageToPdf = toolType === 'img-to-pdf';
  const isPdfToImg = toolType === 'pdf-to-jpg' || toolType === 'pdf-to-png' || toolType === 'pdf-to-webp';
  const isImgToWebp = toolType === 'img-to-webp';
  const isWebpToImg = toolType === 'webp-to-img';
  const isMerge = toolType === 'merge-pdf';
  const isSplit = toolType === 'split-pdf';
  const isPdfToDocx = toolType === 'pdf-to-docx';
  const isPdfToXlsx = toolType === 'pdf-to-xlsx';
  const isPdfToPptx = toolType === 'pdf-to-pptx';
  const isPdfToTxt = toolType === 'pdf-to-txt';
  const isCompressPdf = toolType === 'compress-pdf';
  const isHeicToImg = toolType === 'heic-to-img';
  const isPasfoto = toolType === 'pasfoto';
  const isWatermark = toolType === 'watermark';
  const isVault = toolType === 'vault';

  // Office Tools
  const isWordToPdf = toolType === 'word-to-pdf';
  const isWordToHtml = toolType === 'word-to-html';
  const isWordToTxt = toolType === 'word-to-txt';
  const isExcelToPdf = toolType === 'excel-to-pdf';
  const isExcelToCsv = toolType === 'excel-to-csv';
  const isCsvToExcel = toolType === 'csv-to-excel';
  const isPptxToPdf = toolType === 'pptx-to-pdf';
  const isOfficeMedia = toolType === 'office-media';
  const isOfficeTool =
    isWordToPdf ||
    isWordToHtml ||
    isWordToTxt ||
    isExcelToPdf ||
    isExcelToCsv ||
    isCsvToExcel ||
    isPptxToPdf ||
    isOfficeMedia;

  // Get total pages for PDF tools
  const sourcePdfPageCount = files.length > 0 ? files[0].pageCount || 0 : 0;
  const parsedSplitPages = (isSplit || isPdfToImg) && sourcePdfPageCount > 0
    ? parsePageRange(options.pageRange, sourcePdfPageCount)
    : [];

  // Compute validation state for primary CTA
  let canExecute = false;
  let ctaLabel = 'KONVERSI SEKARANG';

  if (isImageToPdf) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = files.length === 1 ? 'KONVERSI KE PDF' : `GABUNG ${files.length} GAMBAR KE PDF`;
  } else if (isPdfToImg) {
    const hasValidPages = sourcePdfPageCount > 0 ? parsedSplitPages.length > 0 : true;
    canExecute = files.length > 0 && !isProcessing && hasValidPages;
    if (toolType === 'pdf-to-jpg') ctaLabel = 'EKSPOR KE JPG';
    else if (toolType === 'pdf-to-png') ctaLabel = 'EKSPOR KE PNG';
    else ctaLabel = 'EKSPOR KE WEBP';
  } else if (isPdfToDocx) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI PDF KE WORD';
  } else if (isPdfToXlsx) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI PDF KE EXCEL';
  } else if (isPdfToPptx) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI PDF KE POWERPOINT';
  } else if (isPdfToTxt) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'EKSTRAK TEKS PDF';
  } else if (isCompressPdf) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KOMPRES DOKUMEN PDF';
  } else if (isHeicToImg) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = files.length <= 1 ? 'KONVERSI FOTO HEIC' : `KONVERSI ${files.length} FOTO HEIC`;
  } else if (isPasfoto) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'PROSES PASFOTO AI';
  } else if (isWatermark) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'PASANG WATERMARK PENGAMAN';
  } else if (isImgToWebp) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = files.length === 1 ? 'KONVERSI KE WEBP' : `KONVERSI ${files.length} GAMBAR KE WEBP`;
  } else if (isWebpToImg) {
    canExecute = files.length > 0 && !isProcessing;
    const targetExt = options.targetImageFormat === 'image/jpeg' ? 'JPG' : 'PNG';
    ctaLabel = files.length === 1 ? `KONVERSI WEBP KE ${targetExt}` : `KONVERSI ${files.length} WEBP KE ${targetExt}`;
  } else if (isMerge) {
    canExecute = files.length >= 2 && !isProcessing;
    ctaLabel = `GABUNGKAN ${files.length} DOKUMEN`;
  } else if (isSplit) {
    const hasValidPages = sourcePdfPageCount > 0 ? parsedSplitPages.length > 0 : options.pageRange.trim().length > 0;
    canExecute = files.length > 0 && !isProcessing && hasValidPages;
    ctaLabel = parsedSplitPages.length > 0
      ? `EKSTRAK ${parsedSplitPages.length} HALAMAN`
      : 'EKSTRAK HALAMAN TERPILIH';
  } else if (isWordToPdf) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI WORD KE PDF';
  } else if (isWordToHtml) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI WORD KE HTML';
  } else if (isWordToTxt) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'EKSTRAK TEKS WORD';
  } else if (isExcelToPdf) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI EXCEL KE PDF';
  } else if (isExcelToCsv) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI EXCEL KE CSV';
  } else if (isCsvToExcel) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI CSV KE EXCEL';
  } else if (isPptxToPdf) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'KONVERSI PPTX KE PDF';
  } else if (isOfficeMedia) {
    canExecute = files.length > 0 && !isProcessing;
    ctaLabel = 'EKSTRAK MEDIA DOKUMEN';
  }

  return (
    <aside
      className={`${
        isMobileDrawer
          ? 'w-full h-full flex flex-col justify-between select-none bg-surface-panel overflow-hidden'
          : 'hidden md:flex w-[280px] lg:w-[300px] h-full bg-surface-panel border-l border-border-subtle flex-col justify-between shrink-0 select-none'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col">
        <div className="h-11 px-4 border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-accent-solid" strokeWidth={1.5} />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Parameter Konversi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-accent-solid font-bold px-1.5 py-0.5 rounded bg-surface-bg border border-border-subtle">
              LOKAL & OFFLINE
            </span>
            {isMobileDrawer && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
                aria-label="Tutup parameter"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Configuration Controls */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(85vh-160px)] md:max-h-[calc(100vh-220px)]">
          {/* Tool & Supported Formats Overview */}
          <SupportedFormatsBadge toolType={toolType} variant="inspector" />

          {/* Options for Image to PDF */}
          {isImageToPdf && (
            <>
              {/* Page Size */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Ukuran Halaman
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(['fit', 'a4', 'letter'] as PageSize[]).map(size => {
                    const labelMap: Record<PageSize, string> = {
                      fit: 'Sesuai',
                      a4: 'A4',
                      letter: 'Letter',
                    };
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => onOptionsChange({ pageSize: size })}
                        className={`py-1 rounded text-center transition-colors cursor-pointer ${
                          options.pageSize === size
                            ? 'bg-accent-solid text-white font-semibold'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {labelMap[size]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Page Orientation */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Orientasi Halaman
                </label>
                <div className="grid grid-cols-2 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(['portrait', 'landscape'] as PageOrientation[]).map(ori => {
                    const isDisabled = options.pageSize === 'fit';
                    return (
                      <button
                        key={ori}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onOptionsChange({ orientation: ori })}
                        className={`py-1 rounded text-center transition-colors ${
                          options.orientation === ori && !isDisabled
                            ? 'bg-accent-solid text-white font-semibold cursor-pointer'
                            : isDisabled
                            ? 'text-text-muted opacity-40 cursor-not-allowed'
                            : 'text-text-secondary hover:text-text-primary cursor-pointer'
                        }`}
                      >
                        {ori === 'portrait' ? 'Tegak' : 'Mendatar'}
                      </button>
                    );
                  })}
                </div>
                {options.pageSize === 'fit' && (
                  <span className="text-[10px] font-mono text-text-muted">
                    Otomatis mengikuti rasio gambar asli
                  </span>
                )}
              </div>

              {/* Margins */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Margin Halaman
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(['none', 'small', 'big'] as PageMargin[]).map(m => {
                    const labelMap: Record<PageMargin, string> = {
                      none: 'Nol',
                      small: 'Kecil',
                      big: 'Lebar',
                    };
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onOptionsChange({ margin: m })}
                        className={`py-1 rounded text-center transition-colors cursor-pointer ${
                          options.margin === m
                            ? 'bg-accent-solid text-white font-semibold'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {labelMap[m]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Options for PDF to JPG / PNG / WebP */}
          {isPdfToImg && (
            <>
              {/* Output DPI / Scale */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Resolusi Render (Skala DPI)
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {[
                    { scale: 1.0, label: '1× 72 DPI' },
                    { scale: 2.0, label: '2× 144 DPI' },
                    { scale: 3.0, label: '3× 300 DPI' },
                  ].map(item => (
                    <button
                      key={item.scale}
                      type="button"
                      onClick={() => onOptionsChange({ renderScale: item.scale as RenderScale })}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
                        options.renderScale === item.scale
                          ? 'bg-accent-solid text-white font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {item.scale}×
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-text-muted">
                  {options.renderScale === 1.0 && 'Tampilan layar standar'}
                  {options.renderScale === 2.0 && 'Layar resolusi tinggi / Retina'}
                  {options.renderScale === 3.0 && 'Kualitas cetak ultra tajam'}
                </span>
              </div>

              {/* WebP Quality Slider (for PDF -> WebP) */}
              {toolType === 'pdf-to-webp' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Kualitas Kompresi WebP
                    </label>
                    <span className="font-mono text-xs text-text-primary font-bold">
                      {Math.round(options.webpQuality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={options.webpQuality}
                    onChange={e => onOptionsChange({ webpQuality: parseFloat(e.target.value) })}
                    className="w-full accent-accent-solid cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                    <span>Ukuran Terkecil</span>
                    <span>Kualitas Tertinggi</span>
                  </div>
                </div>
              )}

              {/* JPG Quality Slider */}
              {toolType === 'pdf-to-jpg' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Kualitas JPG
                    </label>
                    <span className="font-mono text-xs text-text-primary font-bold">
                      {Math.round(options.jpgQuality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={options.jpgQuality}
                    onChange={e => onOptionsChange({ jpgQuality: parseFloat(e.target.value) })}
                    className="w-full accent-accent-solid cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                    <span>Ukuran Hemat</span>
                    <span>Kualitas Terbaik</span>
                  </div>
                </div>
              )}

              {/* Page Range Selection */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">
                    Halaman yang Diekspor
                  </label>
                  {sourcePdfPageCount > 0 && (
                    <span className="font-mono text-xs text-text-muted">
                      {sourcePdfPageCount} HAL TOTAL
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="contoh: all atau 1-3, 5"
                  value={options.pageRange}
                  onChange={e => onOptionsChange({ pageRange: e.target.value })}
                  className="px-2.5 py-1.5 rounded bg-surface-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-border-focus font-mono"
                />
                <span className="text-[10px] font-mono text-text-muted">
                  Ketik "all" atau halaman tertentu (contoh: 1-5, 8)
                </span>
              </div>
            </>
          )}

          {/* Options for IMG -> WEBP */}
          {isImgToWebp && (
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-primary">
                  Encoder WebP Modern
                </span>
                <span className="text-xs text-text-secondary leading-relaxed">
                  Konversi gambar JPG dan PNG ke format WebP ringan untuk kecepatan web maksimal.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">
                    Kualitas WebP
                  </label>
                  <span className="font-mono text-xs text-text-primary font-bold">
                    {Math.round(options.webpQuality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={options.webpQuality}
                  onChange={e => onOptionsChange({ webpQuality: parseFloat(e.target.value) })}
                  className="w-full accent-accent-solid cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
                  <span>Kompresi Maksimal</span>
                  <span>Kualitas Penuh</span>
                </div>
              </div>
            </div>
          )}

          {/* Options for WEBP -> IMG */}
          {isWebpToImg && (
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-primary">
                  Decoder WebP
                </span>
                <span className="text-xs text-text-secondary leading-relaxed">
                  Kembalikan berkas .webp ke format PNG atau JPG untuk kompatibilitas perangkat lunak lain.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Format Tujuan
                </label>
                <div className="grid grid-cols-2 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(['image/png', 'image/jpeg'] as Array<'image/png' | 'image/jpeg'>).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onOptionsChange({ targetImageFormat: fmt })}
                      className={`py-1.5 rounded text-center uppercase transition-colors cursor-pointer ${
                        options.targetImageFormat === fmt
                          ? 'bg-accent-solid text-white font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {fmt === 'image/png' ? 'PNG (Lossless)' : 'JPG'}
                    </button>
                  ))}
                </div>
              </div>

              {options.targetImageFormat === 'image/jpeg' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Kualitas JPG
                    </label>
                    <span className="font-mono text-xs text-text-primary font-bold">
                      {Math.round(options.jpgQuality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={options.jpgQuality}
                    onChange={e => onOptionsChange({ jpgQuality: parseFloat(e.target.value) })}
                    className="w-full accent-accent-solid cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Options for Merge PDF */}
          {isMerge && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-primary">
                  Urutan Penggabungan
                </span>
                <span className="text-xs text-text-secondary leading-relaxed">
                  Dokumen digabungkan berurutan dari atas ke bawah. Gunakan tombol panah pada daftar berkas untuk mengatur urutan.
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-secondary">Ringkasan Berkas</span>
                <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1 font-mono text-xs text-text-muted">
                  <div className="flex justify-between">
                    <span>TOTAL BERKAS:</span>
                    <span className="text-text-primary font-bold">{files.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESTIMASI HALAMAN:</span>
                    <span className="text-text-primary">
                      {files.reduce((acc, f) => acc + (f.pageCount || 0), 0) || 'MENGHITUNG...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Options for Split PDF */}
          {isSplit && (
            <div className="flex flex-col gap-3">
              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-primary">
                  Pemilihan Halaman Interaktif
                </span>
                <span className="text-xs text-text-secondary leading-relaxed">
                  Centang langsung halaman pada pratinjau grid di layar utama, atau ketik rentang di bawah.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">
                    Rentang Halaman
                  </label>
                  {sourcePdfPageCount > 0 && (
                    <span className="font-mono text-xs text-accent-solid font-bold">
                      {sourcePdfPageCount} HAL TERSEDIA
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="contoh: 1-3, 5, 8-10"
                  value={options.pageRange}
                  onChange={e => onOptionsChange({ pageRange: e.target.value })}
                  className="px-2.5 py-1.5 rounded bg-surface-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-border-focus font-mono"
                />
                <span className="text-[10px] font-mono text-text-muted">
                  Contoh: 1-4 mengekstrak halaman 1 hingga 4.
                </span>
              </div>

              {sourcePdfPageCount > 0 && (
                <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex items-center justify-between font-mono text-xs">
                  <span className="text-text-muted">HALAMAN TUJUAN:</span>
                  {parsedSplitPages.length === 0 ? (
                    <span className="text-status-err font-semibold">
                      0 HALAMAN (DILUAR RENTANG)
                    </span>
                  ) : (
                    <span className="text-text-primary font-bold">
                      {parsedSplitPages.length} HALAMAN
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Options for PDF to Word (.docx) */}
          {isPdfToDocx && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center gap-2 text-accent-solid font-semibold text-xs">
                  <FileText size={16} />
                  <span>PDF ke Dokumen Word (.docx)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Mengekstrak teks, posisi baris, dan paragraf dari dokumen PDF ke dalam berkas Microsoft Word (.docx) standar yang dapat diedit langsung.
                </p>
              </div>

              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">FORMAT OUTPUT:</span>
                  <span className="text-text-primary font-bold">.DOCX (Word)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">KOMPATIBILITAS:</span>
                  <span className="text-text-primary">MS Word, Docs, LibreOffice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">KEAMANAN:</span>
                  <span className="text-emerald-400 font-bold">100% OFFLINE DI RAM</span>
                </div>
              </div>
            </div>
          )}

          {/* Options for PDF to Excel (.xlsx) */}
          {isPdfToXlsx && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <FileSpreadsheet size={16} />
                  <span>PDF ke Spreadsheet Excel (.xlsx)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Mendeteksi baris dan kolom tabel secara otomatis, memisahkan angka dan teks, lalu menyusunnya menjadi berkas Microsoft Excel (.xlsx) siap rumus.
                </p>
              </div>

              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">FORMAT OUTPUT:</span>
                  <span className="text-text-primary font-bold">.XLSX (Excel)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">STRUKTUR:</span>
                  <span className="text-text-primary">1 Sheet per Halaman</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">FORMULA:</span>
                  <span className="text-emerald-400 font-bold">ANGKA TERDETEKSI</span>
                </div>
              </div>
            </div>
          )}

          {/* Options for PDF to PowerPoint (.pptx) */}
          {isPdfToPptx && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs">
                  <Presentation size={16} />
                  <span>PDF ke PowerPoint (.pptx)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Mengubah tiap halaman PDF menjadi slide presentasi PowerPoint beresolusi tajam (144 DPI) dengan rasio layar yang disesuaikan secara otomatis.
                </p>
              </div>

              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">FORMAT OUTPUT:</span>
                  <span className="text-text-primary font-bold">.PPTX (Slide)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">RASIO LAYAR:</span>
                  <span className="text-text-primary">Otomatis (16:9 / 4:3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">SPEAKER NOTES:</span>
                  <span className="text-accent-solid font-bold">TEKS TERTANAM</span>
                </div>
              </div>
            </div>
          )}

          {/* Options for PDF to TXT */}
          {isPdfToTxt && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center gap-2 text-accent-solid font-semibold text-xs">
                  <FileText size={16} />
                  <span>Ekstraksi Teks PDF (.txt)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Mengambil seluruh teks murni berurutan dari halaman PDF ke berkas teks UTF-8 murni. Sangat ideal untuk pengolahan teks, arsip data, atau prompt AI.
                </p>
              </div>
            </div>
          )}

          {/* Options for PDF Compressor */}
          {isCompressPdf && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  Pengaturan Kompresi PDF
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Kecilkan ukuran dokumen PDF agar lolos batas unggahan portal instansi atau hemat kuota.
                </p>
              </div>

              {/* Compression Mode Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Tingkat Kompresi
                </label>
                <div className="grid grid-cols-2 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-[11px] font-mono">
                  {(
                    [
                      { id: 'medium', label: 'Seimbang' },
                      { id: 'low', label: 'Kualitas Tinggi' },
                      { id: 'high', label: 'Maksimal' },
                      { id: 'target', label: 'Target KB' },
                    ] as const
                  ).map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => onOptionsChange({ compressionLevel: lvl.id })}
                      className={`py-1.5 px-1 rounded text-center transition-colors cursor-pointer ${
                        options.compressionLevel === lvl.id
                          ? 'bg-accent-solid text-white font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target KB Presets & Input */}
              {options.compressionLevel === 'target' && (
                <div className="flex flex-col gap-2 p-2.5 rounded bg-surface-bg border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Batas Ukuran Maksimal
                    </label>
                    <span className="font-mono text-xs text-accent-solid font-bold">
                      {options.targetMaxKB} KB
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                    {[195, 290, 480, 950].map(kb => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => onOptionsChange({ targetMaxKB: kb })}
                        className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                          options.targetMaxKB === kb
                            ? 'bg-accent-solid text-white border-accent-solid font-bold'
                            : 'bg-surface-panel border-border-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {kb === 195 ? '195KB' : `${kb}KB`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      step="10"
                      value={options.targetMaxKB}
                      onChange={e =>
                        onOptionsChange({
                          targetMaxKB: Math.max(30, parseInt(e.target.value, 10) || 195),
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-surface-panel border border-border-subtle text-xs text-text-primary font-mono focus:outline-none focus:border-border-focus"
                    />
                    <span className="text-xs font-mono text-text-muted">KB</span>
                  </div>
                  <span className="text-[10px] text-text-muted leading-tight">
                    *Kunci 195 KB aman untuk syarat unggah CPNS / BKN (&lt; 200 KB).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Options for HEIC to IMG */}
          {isHeicToImg && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  Decoder Apple HEIC
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Konversi foto format HEIC dari iPhone atau iPad menjadi format standar yang dapat dibuka di semua perangkat secara instan.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Format Tujuan
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(
                    [
                      { fmt: 'image/jpeg', label: 'JPG' },
                      { fmt: 'image/png', label: 'PNG' },
                      { fmt: 'image/webp', label: 'WEBP' },
                    ] as const
                  ).map(item => (
                    <button
                      key={item.fmt}
                      type="button"
                      onClick={() => onOptionsChange({ targetImageFormat: item.fmt })}
                      className={`py-1.5 rounded text-center uppercase transition-colors cursor-pointer ${
                        options.targetImageFormat === item.fmt
                          ? 'bg-accent-solid text-white font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {options.targetImageFormat !== 'image/png' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-secondary">
                      Kualitas Gambar
                    </label>
                    <span className="font-mono text-xs text-text-primary font-bold">
                      {Math.round(options.jpgQuality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={options.jpgQuality}
                    onChange={e => onOptionsChange({ jpgQuality: parseFloat(e.target.value) })}
                    className="w-full accent-accent-solid cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Options for Pasfoto Studio */}
          {isPasfoto && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-accent-solid font-semibold text-xs">
                  <Sparkles size={16} />
                  <span>Studio Pasfoto AI (Offline)</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Ganti latar belakang otomatis via AI ONNX/WebAssembly tanpa server dan potong ke rasio pasfoto resmi.
                </p>
              </div>

              {/* Warna Latar Belakang */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Warna Latar Belakang
                </label>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                  {[
                    { id: 'merah', label: 'Merah (Ganjil)', color: '#D32F2F', desc: 'Tahun Ganjil' },
                    { id: 'biru', label: 'Biru (Genap)', color: '#1976D2', desc: 'Tahun Genap' },
                    { id: 'putih', label: 'Putih Resmi', color: '#FFFFFF', desc: 'Visa / Kedutaan' },
                    { id: 'transparan', label: 'Transparan', color: 'transparent', desc: 'PNG' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOptionsChange({ pasfotoBgColor: item.id })}
                      className={`p-2 rounded border flex items-center gap-2 text-left transition-colors cursor-pointer ${
                        options.pasfotoBgColor === item.id
                          ? 'bg-surface-elevated border-accent-solid text-text-primary font-bold'
                          : 'bg-surface-bg border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-border-subtle shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ukuran Pasfoto / Crop */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Ukuran & Rasio Foto
                </label>
                <div className="grid grid-cols-4 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(
                    [
                      { id: '3x4', label: '3x4' },
                      { id: '4x6', label: '4x6' },
                      { id: '2x3', label: '2x3' },
                      { id: 'asli', label: 'Asli' },
                    ] as const
                  ).map(sz => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => onOptionsChange({ pasfotoCrop: sz.id })}
                      className={`py-1.5 rounded text-center transition-colors cursor-pointer ${
                        options.pasfotoCrop === sz.id
                          ? 'bg-accent-solid text-white font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-text-muted font-mono">
                  *3x4: Standar CPNS / Ijazah. 4x6: SKCK / Paspor.
                </span>
              </div>

              {/* Kunci Target KB Pasfoto */}
              <div className="flex flex-col gap-2 p-2.5 rounded bg-surface-bg border border-border-subtle">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">
                    Kunci Ukuran Maksimal
                  </label>
                  <span className="font-mono text-xs text-accent-solid font-bold">
                    {options.targetMaxKB} KB
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                  {[100, 195, 300].map(kb => (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => onOptionsChange({ targetMaxKB: kb })}
                      className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                        options.targetMaxKB === kb
                          ? 'bg-accent-solid text-white border-accent-solid font-bold'
                          : 'bg-surface-panel border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {kb === 195 ? '195 KB (CPNS)' : `${kb} KB`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="30"
                  max="1000"
                  step="5"
                  value={options.targetMaxKB}
                  onChange={e =>
                    onOptionsChange({
                      targetMaxKB: Math.max(30, parseInt(e.target.value, 10) || 195),
                    })
                  }
                  className="w-full px-2 py-1 rounded bg-surface-panel border border-border-subtle text-xs text-text-primary font-mono focus:outline-none focus:border-border-focus"
                />
              </div>
            </div>
          )}

          {/* Options for Watermark KTP & Dokumen */}
          {isWatermark && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-accent-solid font-semibold text-xs">
                  <ShieldCheck size={16} />
                  <span>Watermark Pengaman KTP / Dokumen</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Beri cap teks pengaman diagonal atau berulang pada scan KTP / dokumen penting agar tidak disalahgunakan untuk pinjaman online atau penipuan.
                </p>
              </div>

              {/* Input Teks Watermark */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Teks Watermark
                </label>
                <input
                  type="text"
                  value={options.watermarkText}
                  onChange={e => onOptionsChange({ watermarkText: e.target.value })}
                  placeholder="contoh: HANYA UNTUK VERIFIKASI CASN 2026"
                  className="px-2.5 py-1.5 rounded bg-surface-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-border-focus font-mono"
                />
              </div>

              {/* Tombol Preset Cepat */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-text-muted">Preset Pengaman:</span>
                <div className="flex flex-col gap-1 text-[11px]">
                  {[
                    'HANYA UNTUK VERIFIKASI CASN 2026',
                    'SYARAT LAMARAN KERJA',
                    'HANYA UNTUK PEMBUKAAN REKENING',
                    'VERIFIKASI PENDAFTARAN',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onOptionsChange({ watermarkText: preset })}
                      className="text-left px-2 py-1 rounded bg-surface-bg border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-solid text-[10px] font-mono truncate cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pola Distribusi Watermark */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Pola Penyebaran Cap
                </label>
                <div className="grid grid-cols-2 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => onOptionsChange({ watermarkStyle: 'tiled' })}
                    className={`py-1.5 rounded text-center transition-colors cursor-pointer ${
                      options.watermarkStyle === 'tiled'
                        ? 'bg-accent-solid text-white font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Berulang (Paling Aman)
                  </button>
                  <button
                    type="button"
                    onClick={() => onOptionsChange({ watermarkStyle: 'single' })}
                    className={`py-1.5 rounded text-center transition-colors cursor-pointer ${
                      options.watermarkStyle === 'single'
                        ? 'bg-accent-solid text-white font-semibold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Satu di Tengah
                  </button>
                </div>
              </div>

              {/* Warna Cap */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">
                  Warna Cap
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-bg p-1 rounded border border-border-subtle text-xs font-mono">
                  {(
                    [
                      { id: 'white', label: 'Putih' },
                      { id: 'black', label: 'Hitam' },
                      { id: 'red', label: 'Merah' },
                    ] as const
                  ).map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => onOptionsChange({ watermarkColor: col.id })}
                      className={`py-1.5 rounded text-center transition-colors cursor-pointer ${
                        options.watermarkColor === col.id
                          ? 'bg-accent-solid text-white font-semibold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider Opasitas */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">
                    Transparansi Cap
                  </label>
                  <span className="font-mono text-xs text-text-primary font-bold">
                    {Math.round(options.watermarkOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.70"
                  step="0.05"
                  value={options.watermarkOpacity}
                  onChange={e => onOptionsChange({ watermarkOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-accent-solid cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-text-muted">
                  <span>Samar (KTP Terbaca)</span>
                  <span>Tegas</span>
                </div>
              </div>
            </div>
          )}

          {/* Options & Info for Office Documents */}
          {isOfficeTool && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center gap-2 text-accent-solid font-semibold text-xs">
                  {isWordToPdf || isWordToHtml || isWordToTxt ? (
                    <FileText size={16} />
                  ) : isExcelToPdf || isExcelToCsv || isCsvToExcel ? (
                    <FileSpreadsheet size={16} />
                  ) : isPptxToPdf ? (
                    <Presentation size={16} />
                  ) : (
                    <Archive size={16} />
                  )}
                  <span>Konversi Dokumen Offline</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {isWordToPdf &&
                    'Mengekstrak teks, heading, dan paragraf dari Word (.docx) lalu merender dokumen PDF berformat rapi.'}
                  {isWordToHtml &&
                    'Mengubah file Word (.docx) menjadi HTML bersih dan semantik yang siap dipublikasikan di web.'}
                  {isWordToTxt &&
                    'Mengekstrak seluruh teks mentah dari file Word (.docx) ke file teks (.txt) tanpa pemformatan.'}
                  {isExcelToPdf &&
                    'Membaca lembar kerja spreadsheet (.xlsx, .xls, .csv) dan mencetaknya menjadi halaman PDF berorientasi mendatar.'}
                  {isExcelToCsv &&
                    'Mengekspor sheet pertama spreadsheet Excel (.xlsx) menjadi data tabular CSV standar.'}
                  {isCsvToExcel &&
                    'Mengonversi berkas data CSV menjadi file spreadsheet Excel (.xlsx) siap olah.'}
                  {isPptxToPdf &&
                    'Mengekstrak slide presentasi PowerPoint (.pptx) beserta teksnya menjadi dokumen PDF berurutan.'}
                  {isOfficeMedia &&
                    'Mengekstrak seluruh gambar, bagan, dan foto yang disisipkan di dalam dokumen Word/PPTX ke file ZIP.'}
                </p>
              </div>

              <div className="p-2.5 rounded bg-surface-bg border border-border-subtle flex items-center justify-between font-mono text-xs">
                <span className="text-text-muted">KEAMANAN DATA:</span>
                <span className="text-emerald-400 font-bold">100% OFFLINE</span>
              </div>
            </div>
          )}

          {/* Output Filename Input (for all active conversion tools) */}
          {!isVault && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle">
              <label className="text-xs font-medium text-text-secondary">
                Nama Berkas Hasil
              </label>
              <input
                type="text"
                value={options.outputTitle}
                onChange={e => onOptionsChange({ outputTitle: e.target.value })}
                placeholder="nama_berkas_hasil"
                className="px-2.5 py-1.5 rounded bg-surface-bg border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-border-focus font-mono"
              />
            </div>
          )}

          {/* Settings for Vault */}
          {isVault && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded bg-surface-bg border border-border-subtle flex flex-col gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  Kebijakan Database Riwayat
                </span>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Berkas hasil konversi disimpan langsung di IndexedDB internal browser Anda. 100% privat tanpa ada data yang dikirim ke server luar.
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-surface-bg border border-border-subtle">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-primary">Simpan Otomatis</span>
                  <span className="text-[10px] text-text-muted">Simpan hasil konversi ke Riwayat</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSaveToVault}
                  onChange={e => onAutoSaveToggle(e.target.checked)}
                  className="rounded border-border-subtle bg-surface-panel text-accent-solid focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Execution Section Pinned at Bottom */}
      <div className="p-4 border-t border-border-subtle bg-surface-bg flex flex-col gap-3">
        {/* Live Progress Bar when processing */}
        {isProcessing && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-accent-solid truncate max-w-[180px]">
                {progress.statusMessage || 'Memproses berkas...'}
              </span>
              <span className="text-text-primary">
                {progress.currentPage}/{progress.totalPages}
              </span>
            </div>

            <div className="w-full h-2 bg-surface-panel rounded-full overflow-hidden border border-border-subtle">
              <div
                className="h-full bg-accent-solid transition-all duration-150"
                style={{
                  width: `${
                    progress.totalPages > 0
                      ? Math.min(100, Math.round((progress.currentPage / progress.totalPages) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Auto-Save to Vault Checkbox indicator */}
        {!isVault && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSaveToVault}
              onChange={e => onAutoSaveToggle(e.target.checked)}
              className="rounded border-border-subtle bg-surface-panel text-accent-solid focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-mono text-text-secondary">
              Simpan salinan ke Riwayat Lokal
            </span>
          </label>
        )}

        {/* Primary Action Button (Strict solid #EA580C accent) */}
        {!isVault && (
          <button
            type="button"
            disabled={!canExecute}
            onClick={onExecute}
            className={`w-full py-2.5 px-4 rounded font-sans font-semibold text-xs text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
              canExecute
                ? 'bg-accent-solid hover:bg-accent-hover cursor-pointer'
                : 'bg-surface-elevated text-text-muted border border-border-subtle cursor-not-allowed opacity-60'
            }`}
          >
            {isProcessing ? (
              <span className="font-mono">MEMPROSES OFFLINE...</span>
            ) : (
              <span>{ctaLabel}</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

