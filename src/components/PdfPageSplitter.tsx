import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Check,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import type { SourceFile } from '../types';
import {
  renderAllPdfPageThumbnails,
  renderSinglePdfPageHighRes,
} from '../services/pdfEngine';
import { parsePageRange } from '../utils/formatters';
import { GoogleDriveButton } from './GoogleDriveButton';

interface PdfPageSplitterProps {
  sourceFile: SourceFile;
  pageRange: string;
  onPageRangeChange: (newRangeStr: string) => void;
  onChangePdf?: () => void;
  onFilesSelected?: (files: File[]) => void;
}

export const PdfPageSplitter: React.FC<PdfPageSplitterProps> = ({
  sourceFile,
  pageRange,
  onPageRangeChange,
  onChangePdf,
  onFilesSelected,
}) => {
  const [thumbnails, setThumbnails] = useState<
    { pageNum: number; dataUrl: string; width: number; height: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });

  // Preview modal state
  const [previewPageNum, setPreviewPageNum] = useState<number | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isLoadingHighRes, setIsLoadingHighRes] = useState(false);

  const totalPages = sourceFile.pageCount || thumbnails.length || 1;

  // Selected pages parsed from pageRange prop
  const selectedPages = useMemo(() => {
    const list = parsePageRange(pageRange, totalPages);
    return new Set<number>(list);
  }, [pageRange, totalPages]);

  // Load all page thumbnails sequentially
  useEffect(() => {
    let isCancelled = false;
    async function loadThumbnails() {
      setIsLoading(true);
      try {
        const results = await renderAllPdfPageThumbnails(
          sourceFile.file,
          (curr, tot) => {
            if (!isCancelled) {
              setLoadProgress({ current: curr, total: tot });
            }
          }
        );
        if (!isCancelled) {
          setThumbnails(results);
          // If pageRange is 'all' or empty, default select all
          if (!pageRange.trim() || pageRange.trim().toLowerCase() === 'all') {
            const allPages = Array.from({ length: results.length }, (_, i) => i + 1);
            onPageRangeChange(allPages.join(', '));
          }
        }
      } catch (err) {
        console.error('Gagal merender thumbnail PDF:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadThumbnails();
    return () => {
      isCancelled = true;
    };
  }, [sourceFile]);

  // Convert Set to compressed string (e.g. 1-3, 5, 7-9)
  const syncRangeString = useCallback(
    (pageSet: Set<number>) => {
      const sorted = Array.from(pageSet).sort((a, b) => a - b);
      if (sorted.length === 0) {
        onPageRangeChange('');
        return;
      }
      if (sorted.length === totalPages) {
        onPageRangeChange('all');
        return;
      }

      // Group consecutive ranges
      const ranges: string[] = [];
      let start = sorted[0];
      let prev = start;

      for (let i = 1; i < sorted.length; i++) {
        const curr = sorted[i];
        if (curr === prev + 1) {
          prev = curr;
        } else {
          ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
          start = curr;
          prev = curr;
        }
      }
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      onPageRangeChange(ranges.join(', '));
    },
    [totalPages, onPageRangeChange]
  );

  // Toggle page selection
  const handleTogglePage = (pageNum: number) => {
    const nextSet = new Set(selectedPages);
    if (nextSet.has(pageNum)) {
      nextSet.delete(pageNum);
    } else {
      nextSet.add(pageNum);
    }
    syncRangeString(nextSet);
  };

  // Bulk actions
  const handleSelectAll = () => {
    const all = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
    syncRangeString(all);
  };

  const handleDeselectAll = () => {
    syncRangeString(new Set());
  };

  const handleSelectOdd = () => {
    const odd = new Set<number>();
    for (let i = 1; i <= totalPages; i += 2) odd.add(i);
    syncRangeString(odd);
  };

  const handleSelectEven = () => {
    const even = new Set<number>();
    for (let i = 2; i <= totalPages; i += 2) even.add(i);
    syncRangeString(even);
  };

  const handleInvert = () => {
    const inv = new Set<number>();
    for (let i = 1; i <= totalPages; i++) {
      if (!selectedPages.has(i)) inv.add(i);
    }
    syncRangeString(inv);
  };

  // Open high-res preview modal
  const handleOpenPreview = async (pageNum: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPreviewPageNum(pageNum);
    setIsLoadingHighRes(true);
    setPreviewDataUrl(null);
    try {
      const url = await renderSinglePdfPageHighRes(sourceFile.file, pageNum);
      setPreviewDataUrl(url);
    } catch {
      // Fallback to thumbnail
      const thumb = thumbnails.find(t => t.pageNum === pageNum);
      setPreviewDataUrl(thumb?.dataUrl || null);
    } finally {
      setIsLoadingHighRes(false);
    }
  };

  const handleNextPreview = () => {
    if (previewPageNum !== null && previewPageNum < totalPages) {
      handleOpenPreview(previewPageNum + 1);
    }
  };

  const handlePrevPreview = () => {
    if (previewPageNum !== null && previewPageNum > 1) {
      handleOpenPreview(previewPageNum - 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-bg select-none overflow-hidden">
      {/* Splitter Toolbar Header */}
      <div className="p-3 sm:p-4 bg-surface-panel border-b border-border-subtle flex flex-col gap-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold font-mono uppercase text-text-primary">
              Pemisahan Halaman PDF
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-accent-solid font-semibold border border-border-subtle">
              {selectedPages.size} DARI {totalPages} DIPILIH
            </span>
            <span className="font-mono text-[11px] text-text-muted truncate max-w-[180px] hidden md:inline" title={sourceFile.name}>
              ({sourceFile.name})
            </span>
            {onChangePdf && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onChangePdf}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  title="Ganti berkas PDF ini dari komputer lokal"
                >
                  Ganti PDF
                </button>
                {onFilesSelected && (
                  <GoogleDriveButton
                    onFilesSelected={files => {
                      const pdf = files.find(
                        f =>
                          f.type === 'application/pdf' ||
                          f.name.toLowerCase().endsWith('.pdf')
                      );
                      if (pdf) {
                        onFilesSelected([pdf]);
                      }
                    }}
                    variant="minimal"
                  />
                )}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-primary transition-colors cursor-pointer"
            >
              <CheckSquare size={13} className="text-accent-solid" />
              <span>Semua</span>
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <Square size={13} />
              <span>Kosongkan</span>
            </button>
            <button
              type="button"
              onClick={handleSelectOdd}
              className="px-2 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer hidden sm:inline"
            >
              Ganjil (1, 3, 5...)
            </button>
            <button
              type="button"
              onClick={handleSelectEven}
              className="px-2 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer hidden sm:inline"
            >
              Genap (2, 4, 6...)
            </button>
            <button
              type="button"
              onClick={handleInvert}
              className="flex items-center gap-1 px-2 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Balikkan pilihan halaman"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Balik</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] font-mono text-text-muted leading-relaxed">
          Klik halaman untuk mencentang/membatalkan. Hanya halaman bercentang oranye yang akan diekstrak menjadi PDF baru.
        </p>
      </div>

      {/* Pages Grid Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && thumbnails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-text-muted font-mono text-xs">
            <div className="w-6 h-6 border-2 border-accent-solid border-t-transparent rounded-full animate-spin" />
            <span>MEMUAT HALAMAN DOKUMEN ({loadProgress.current}/{loadProgress.total || sourceFile.pageCount || '?'})...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
            {thumbnails.map(thumb => {
              const isSelected = selectedPages.has(thumb.pageNum);

              return (
                <div
                  key={thumb.pageNum}
                  onClick={() => handleTogglePage(thumb.pageNum)}
                  className={`group relative flex flex-col rounded-md border p-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-elevated border-accent-solid ring-1 ring-accent-solid shadow-sm'
                      : 'bg-surface-panel border-border-subtle opacity-60 hover:opacity-100 hover:border-border-focus'
                  }`}
                >
                  {/* Card Top Header: Badge & Checkbox & Eye */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-accent-solid text-white'
                          : 'bg-surface-bg text-text-muted border border-border-subtle'
                      }`}
                    >
                      Hal {thumb.pageNum}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Enlarge Preview Button */}
                      <button
                        type="button"
                        onClick={e => handleOpenPreview(thumb.pageNum, e)}
                        className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-bg transition-colors"
                        title="Perbesar pratinjau halaman ini"
                      >
                        <Eye size={13} strokeWidth={1.8} />
                      </button>

                      {/* Checkbox Icon */}
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-accent-solid text-white'
                            : 'border border-border-subtle bg-surface-bg'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Image Container */}
                  <div className="w-full aspect-[1/1.41] bg-white rounded overflow-hidden flex items-center justify-center shadow-xs border border-border-subtle/40">
                    <img
                      src={thumb.dataUrl}
                      alt={`Halaman ${thumb.pageNum}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>

                  {/* Selection Status Label */}
                  <div className="mt-1.5 text-center">
                    <span
                      className={`font-mono text-[9px] ${
                        isSelected ? 'text-accent-solid font-semibold' : 'text-text-muted'
                      }`}
                    >
                      {isSelected ? '✓ AKAN DIAMBIL' : 'DILEWATI'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* High-Resolution Preview Modal */}
      {previewPageNum !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
          <div
            className="absolute inset-0"
            onClick={() => setPreviewPageNum(null)}
            aria-label="Tutup pratinjau"
          />

          <div className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-surface-panel border border-border-subtle rounded-md shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="h-12 px-4 border-b border-border-subtle flex items-center justify-between shrink-0 bg-surface-elevated">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-text-primary">
                  Pratinjau Halaman {previewPageNum} dari {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handleTogglePage(previewPageNum)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    selectedPages.has(previewPageNum)
                      ? 'bg-accent-solid text-white font-bold'
                      : 'bg-surface-panel text-text-secondary border border-border-subtle'
                  }`}
                >
                  <Check size={13} strokeWidth={selectedPages.has(previewPageNum) ? 3 : 1.5} />
                  <span>
                    {selectedPages.has(previewPageNum) ? 'Halaman Terpilih' : 'Pilih Halaman Ini'}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={previewPageNum <= 1}
                  onClick={handlePrevPreview}
                  className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                  title="Halaman sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  disabled={previewPageNum >= totalPages}
                  onClick={handleNextPreview}
                  className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer"
                  title="Halaman berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPageNum(null)}
                  className="p-1 ml-2 rounded text-text-muted hover:text-text-primary hover:bg-surface-panel cursor-pointer"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[350px]">
              {isLoadingHighRes && !previewDataUrl ? (
                <div className="flex flex-col items-center gap-2 text-text-muted font-mono text-xs">
                  <div className="w-6 h-6 border-2 border-accent-solid border-t-transparent rounded-full animate-spin" />
                  <span>MEMUAT PRATINJAU TINGGI...</span>
                </div>
              ) : previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt={`Halaman ${previewPageNum}`}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded shadow-lg bg-white"
                />
              ) : (
                <span className="text-xs font-mono text-text-muted">Gagal memuat pratinjau</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
