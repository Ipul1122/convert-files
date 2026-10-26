import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FilePlus,
  Copy,
  Folder,
  Wifi,
  FileText,
  FileSpreadsheet,
  Presentation,
  Archive,
  Scissors,
  FolderSync,
  Layers,
  FileImage,
  ArrowRightLeft,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import type { ToolType } from '../types';
import { GoogleDriveButton } from './GoogleDriveButton';

interface DropzoneProps {
  toolType: ToolType;
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
  onSelectTool?: (tool: ToolType) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  toolType,
  onFilesSelected,
  isCompact = false,
  onSelectTool,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSmart = toolType === 'smart';
  const isImageTool = toolType === 'img-to-pdf' || toolType === 'img-to-webp';
  const isWebpOnlyTool = toolType === 'webp-to-img';

  let acceptedTypes = 'application/pdf,.pdf';
  let formatText = 'dokumen PDF';

  if (isSmart) {
    acceptedTypes =
      'application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.xls,.csv,.pptx';
    formatText = 'PDF, Gambar, Word, Excel, PPT';
  } else if (isImageTool) {
    acceptedTypes = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
    formatText = 'JPG, PNG, WebP';
  } else if (isWebpOnlyTool) {
    acceptedTypes = 'image/webp,.webp';
    formatText = 'berkas .WEBP';
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      filterAndEmitFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      filterAndEmitFiles(files);
      e.target.value = '';
    }
  };

  const filterAndEmitFiles = (files: File[]) => {
    const valid = files.filter(file => {
      if (isSmart) {
        return (
          file.type === 'application/pdf' ||
          file.type.startsWith('image/') ||
          /\.(pdf|jpe?g|png|webp|docx|xlsx|xls|csv|pptx)$/i.test(file.name)
        );
      } else if (isImageTool) {
        return (
          file.type.startsWith('image/') ||
          /\.(jpe?g|png|webp)$/i.test(file.name)
        );
      } else if (isWebpOnlyTool) {
        return (
          file.type === 'image/webp' ||
          /\.webp$/i.test(file.name)
        );
      } else {
        return (
          file.type === 'application/pdf' ||
          /\.pdf$/i.test(file.name)
        );
      }
    });

    if (valid.length > 0) {
      onFilesSelected(valid);
    }
  };

  if (isCompact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-accent-solid bg-surface-elevated'
            : 'border-border-subtle hover:border-border-focus bg-surface-panel'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={toolType !== 'split-pdf' && toolType !== 'pdf-to-jpg' && toolType !== 'pdf-to-png' && toolType !== 'pdf-to-webp'}
          accept={acceptedTypes}
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2 min-w-0">
          <FilePlus size={15} className="text-text-secondary shrink-0" strokeWidth={1.5} />
          <span className="text-xs font-mono text-text-secondary truncate">
            Klik atau tarik berkas ke sini ({formatText})
          </span>
        </div>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <GoogleDriveButton onFilesSelected={filterAndEmitFiles} variant="minimal" />
        </div>
      </div>
    );
  }

  const capabilities = [
    {
      category: 'Dokumen Microsoft Office',
      items: [
        {
          id: 'word-to-pdf' as ToolType,
          title: 'Word ke PDF',
          ext: '.DOCX → .PDF',
          desc: 'Ubah dokumen Microsoft Word (.docx) menjadi berkas PDF rapi siap cetak.',
          icon: <FileText size={18} className="text-blue-400" />,
        },
        {
          id: 'excel-to-pdf' as ToolType,
          title: 'Excel ke PDF',
          ext: '.XLSX, .XLS → .PDF',
          desc: 'Render tabel spreadsheet Excel menjadi lembar dokumen PDF bergaris rapi.',
          icon: <FileSpreadsheet size={18} className="text-emerald-400" />,
        },
        {
          id: 'pptx-to-pdf' as ToolType,
          title: 'PowerPoint ke PDF',
          ext: '.PPTX → .PDF',
          desc: 'Ekstrak slide presentasi PowerPoint menjadi lembar halaman PDF.',
          icon: <Presentation size={18} className="text-orange-400" />,
        },
        {
          id: 'office-media' as ToolType,
          title: 'Ekstrak Media Dokumen',
          ext: 'Word/PPTX → .ZIP',
          desc: 'Ambil semua aset gambar & foto dari dalam dokumen Word atau PPTX dalam bentuk ZIP.',
          icon: <Archive size={18} className="text-purple-400" />,
        },
      ],
    },
    {
      category: 'Alat Dokumen PDF',
      items: [
        {
          id: 'split-pdf' as ToolType,
          title: 'Pecah & Pratinjau PDF',
          ext: 'Visual Split',
          desc: 'Lihat pratinjau thumbnail setiap halaman, centang halaman yang dipilih, & ekstrak.',
          icon: <Scissors size={18} className="text-accent-solid" />,
        },
        {
          id: 'merge-pdf' as ToolType,
          title: 'Gabungkan PDF',
          ext: 'Multi-PDF → 1 PDF',
          desc: 'Satukan beberapa file PDF terpisah menjadi satu dokumen urut tanpa batasan.',
          icon: <FolderSync size={18} className="text-amber-400" />,
        },
        {
          id: 'img-to-pdf' as ToolType,
          title: 'Gambar ke PDF',
          ext: 'JPG, PNG, WebP → .PDF',
          desc: 'Susun kumpulan foto atau hasil scan menjadi dokumen PDF A4/Letter/Fit.',
          icon: <FileImage size={18} className="text-cyan-400" />,
        },
        {
          id: 'pdf-to-jpg' as ToolType,
          title: 'PDF ke Gambar',
          ext: '.PDF → JPG / PNG / WebP',
          desc: 'Ekstrak setiap halaman PDF menjadi gambar beresolusi tinggi (hingga 300 DPI).',
          icon: <Layers size={18} className="text-indigo-400" />,
        },
      ],
    },
    {
      category: 'Format & Optimasi Gambar',
      items: [
        {
          id: 'img-to-webp' as ToolType,
          title: 'Kompresi Gambar ke WebP',
          ext: 'JPG / PNG → .WEBP',
          desc: 'Perkecil ukuran berkas gambar secara drastis untuk website tanpa kehilangan kualitas.',
          icon: <Sparkles size={18} className="text-rose-400" />,
        },
        {
          id: 'webp-to-img' as ToolType,
          title: 'WebP ke JPG / PNG',
          ext: '.WEBP → .JPG / .PNG',
          desc: 'Kembalikan format WebP ke format gambar standar agar kompatibel di semua aplikasi.',
          icon: <ArrowRightLeft size={18} className="text-yellow-400" />,
        },
      ],
    },
  ];

  if (isSmart) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-2.5 sm:p-4 flex flex-col gap-6 select-none scroll-smooth">
        {/* Upload Hero Card - Takes full viewport height on initial load */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`min-h-[calc(100vh-5.5rem)] md:min-h-[calc(100vh-2.2rem)] border-2 border-dashed rounded-md p-6 sm:p-10 flex flex-col items-center justify-between cursor-pointer transition-colors relative shrink-0 ${
            isDragOver
              ? 'border-accent-solid bg-surface-elevated'
              : 'border-border-subtle hover:border-border-focus bg-surface-panel/40 hover:bg-surface-panel/60'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptedTypes}
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Top subtle badge for vertical balance */}
          <div className="w-full flex items-center justify-end">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-text-muted border border-border-subtle">
              100% OFFLINE READY
            </span>
          </div>

          {/* Centered Main Drag & Drop Hero Box */}
          <div className="flex flex-col items-center max-w-lg text-center gap-4 my-auto">
            <div className="w-16 h-16 rounded-md bg-surface-panel border border-border-subtle flex items-center justify-center text-text-primary shadow-xs">
              <UploadCloud size={32} strokeWidth={1.5} className="text-accent-solid" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                Pilih atau Tarik Berkas ke Sini
              </span>
              <span className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md">
                Konversi berkas PDF, Gambar, Excel, Word, atau PowerPoint secara cepat dan privat.
              </span>
            </div>

            {/* Format chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-accent-solid font-semibold">
                .PDF
              </span>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-blue-400 font-semibold">
                .DOCX (WORD)
              </span>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-emerald-400 font-semibold">
                .XLSX (EXCEL)
              </span>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-orange-400 font-semibold">
                .PPTX (PPT)
              </span>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-text-secondary">
                .JPG / .PNG / .WEBP
              </span>
              <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-surface-panel border border-border-subtle text-text-muted flex items-center gap-1">
                <Copy size={11} strokeWidth={1.5} />
                CTRL+V TEMPEL
              </span>
            </div>

            {/* Action Buttons: Local File Explorer + Google Drive */}
            <div
              className="flex flex-wrap items-center justify-center gap-3 mt-2"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle hover:border-accent-solid/50 text-text-primary text-xs font-mono font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="Pilih berkas dari komputer (Bisa Offline)"
              >
                <Folder size={16} className="text-accent-solid" strokeWidth={1.8} />
                <span>Pilih File</span>
              </button>
              <GoogleDriveButton onFilesSelected={filterAndEmitFiles} variant="compact" />
            </div>

            {/* Info Box: Google Drive requires active data/internet */}
            <div className="mt-2 px-3 py-1.5 rounded-md bg-surface-panel border border-border-subtle flex items-center gap-2 text-[11px] font-mono text-text-secondary">
              <Wifi size={13} className="text-accent-solid shrink-0" strokeWidth={2} />
              <span>Khusus Google Drive: Pastikan koneksi internet / data aktif</span>
            </div>
          </div>

          {/* Bottom Scroll Indicator (Prompts user to scroll down for features) */}
          <div
            className="pt-2 pb-1 flex flex-col items-center gap-1 text-[11px] font-mono text-text-muted hover:text-accent-solid transition-colors cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('features-catalog')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="group-hover:underline">Gulir ke bawah untuk melihat apa saja yang bisa dilakukan</span>
            <ChevronDown size={16} className="text-accent-solid animate-bounce" />
          </div>
        </div>

        {/* Feature & Capability Directory Showcase */}
        <div id="features-catalog" className="flex flex-col gap-4 pb-8 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-solid" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
                Apa Saja yang Bisa Dilakukan di Aplikasi Ini?
              </h2>
            </div>
            <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
              Klik kartu fitur untuk langsung membuka alatnya
            </span>
          </div>

          <div className="flex flex-col gap-5">
            {capabilities.map((cat, catIdx) => (
              <div key={catIdx} className="flex flex-col gap-2.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-muted">
                  {cat.category}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectTool?.(item.id)}
                      className="group p-3.5 rounded bg-surface-panel border border-border-subtle hover:border-accent-solid/60 hover:bg-surface-elevated transition-all flex flex-col justify-between gap-2.5 text-left cursor-pointer shadow-xs active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded bg-surface-bg border border-border-subtle flex items-center justify-center shrink-0 group-hover:border-accent-solid/40 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-primary group-hover:text-accent-solid transition-colors">
                              {item.title}
                            </span>
                            <span className="font-mono text-[10px] text-accent-solid font-semibold">
                              {item.ext}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="text-text-muted group-hover:text-accent-solid transition-colors shrink-0" />
                      </div>

                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {item.desc}
                      </p>

                      <div className="pt-1 flex items-center justify-end text-[10px] font-mono border-t border-border-subtle/50 text-text-muted">
                        <span className="text-accent-solid font-medium group-hover:underline">Buka Alat →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for single dedicated tool (toolType !== 'smart')
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex-1 m-2 sm:m-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors select-none ${
        isDragOver
          ? 'border-accent-solid bg-surface-elevated'
          : 'border-border-subtle hover:border-border-focus bg-surface-bg'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={
          toolType !== 'split-pdf' &&
          toolType !== 'pdf-to-jpg' &&
          toolType !== 'pdf-to-png' &&
          toolType !== 'pdf-to-webp' &&
          toolType !== 'word-to-pdf' &&
          toolType !== 'excel-to-pdf' &&
          toolType !== 'pptx-to-pdf' &&
          toolType !== 'office-media'
        }
        accept={acceptedTypes}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center max-w-md text-center p-6 gap-3.5">
        <div className="w-14 h-14 rounded-md bg-surface-panel border border-border-subtle flex items-center justify-center text-text-primary shadow-xs">
          <UploadCloud size={28} strokeWidth={1.5} className="text-accent-solid" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-base font-bold text-text-primary tracking-tight">
            Pilih atau Tarik {formatText} ke Sini
          </span>
          <span className="text-xs text-text-secondary leading-relaxed max-w-sm">
            Tarik berkas langsung atau klik tombol di bawah untuk memilih berkas.
          </span>
        </div>

        {/* Action Buttons: Local File Explorer + Google Drive */}
        <div
          className="flex flex-wrap items-center justify-center gap-2.5 mt-2"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-surface-panel hover:bg-surface-elevated border border-border-subtle hover:border-accent-solid/50 text-text-primary text-xs font-mono font-medium transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Pilih berkas dari komputer (Bisa Offline)"
          >
            <Folder size={15} className="text-accent-solid" strokeWidth={1.8} />
            <span>Pilih File</span>
          </button>
          <GoogleDriveButton onFilesSelected={filterAndEmitFiles} variant="compact" />
        </div>

        {/* Info Box: Google Drive requires active data/internet */}
        <div className="mt-2.5 px-3 py-1.5 rounded-md bg-surface-panel/90 border border-border-subtle flex items-center gap-2 text-[11px] font-mono text-text-secondary">
          <Wifi size={13} className="text-accent-solid shrink-0" strokeWidth={2} />
          <span>Khusus Google Drive: Pastikan koneksi internet / data aktif</span>
        </div>
      </div>
    </div>
  );
};
